import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not defined')
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: Request) {
  const stripe = getStripe()
  const supabase = getSupabaseAdmin()
  const body = await req.text()
  const signature = (await headers()).get('stripe-signature')

  if (!signature) {
    return new Response('Missing stripe-signature', { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature error:', err)
    return new Response('Invalid signature', { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id
        const customerId =
          typeof session.customer === 'string' ? session.customer : null
        const subscriptionId =
          typeof session.subscription === 'string' ? session.subscription : null

        if (userId) {
          // Update clinic_members
          await supabase
            .from('clinic_members')
            .update({
              has_paid: true,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
            })
            .eq('user_id', userId)

          // Update profiles.has_paid — dashboard checks this
          await supabase
            .from('profiles')
            .update({ has_paid: true })
            .eq('id', userId)

          // Update clinics.subscription_status → 'active'
          const { data: member } = await supabase
            .from('clinic_members')
            .select('clinic_id')
            .eq('user_id', userId)
            .single()

          if (member?.clinic_id) {
            await supabase
              .from('clinics')
              .update({
                subscription_status: 'active',
                is_active: true,
                ...(customerId ? { stripe_customer_id: customerId } : {}),
                ...(subscriptionId ? { stripe_subscription_id: subscriptionId } : {}),
              })
              .eq('id', member.clinic_id)
          }
        }

        break
      }

      case 'invoice.paid': {
        // Renouvellement mensuel réussi → confirmer que la clinique reste active
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null }
        const subscriptionId =
          typeof invoice.subscription === 'string' ? invoice.subscription : null

        if (subscriptionId) {
          const { data: member } = await supabase
            .from('clinic_members')
            .select('user_id, clinic_id')
            .eq('stripe_subscription_id', subscriptionId)
            .single()

          if (member?.clinic_id) {
            await supabase
              .from('clinics')
              .update({ subscription_status: 'active', is_active: true })
              .eq('id', member.clinic_id)
          }

          if (member?.user_id) {
            await supabase
              .from('profiles')
              .update({ has_paid: true })
              .eq('id', member.user_id)
          }
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        // Find the owner's clinic_member row by stripe_subscription_id
        const { data: ownerMember } = await supabase
          .from('clinic_members')
          .select('user_id, clinic_id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (ownerMember) {
          const clinicId = ownerMember.clinic_id as string | null

          if (clinicId) {
            // Désactiver la clinique
            await supabase
              .from('clinics')
              .update({ subscription_status: 'cancelled', is_active: false })
              .eq('id', clinicId)

            // Disable ALL members of this clinic in clinic_members
            await supabase
              .from('clinic_members')
              .update({ has_paid: false })
              .eq('clinic_id', clinicId)

            // Get all user_ids of this clinic to update profiles
            const { data: allMembers } = await supabase
              .from('clinic_members')
              .select('user_id')
              .eq('clinic_id', clinicId)

            if (allMembers && allMembers.length > 0) {
              const memberUserIds = allMembers.map((m: { user_id: string }) => m.user_id)
              await supabase
                .from('profiles')
                .update({ has_paid: false })
                .in('id', memberUserIds)
            }
          } else {
            // No clinic_id on member row — just disable the owner
            await supabase
              .from('clinic_members')
              .update({ has_paid: false })
              .eq('stripe_subscription_id', subscription.id)

            await supabase
              .from('profiles')
              .update({ has_paid: false })
              .eq('id', ownerMember.user_id)
          }
        } else {
          // Fallback: match only by stripe_subscription_id
          await supabase
            .from('clinic_members')
            .update({ has_paid: false })
            .eq('stripe_subscription_id', subscription.id)
        }

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null }
        const subscriptionId =
          typeof invoice.subscription === 'string' ? invoice.subscription : null

        if (subscriptionId) {
          const { data: failedMember } = await supabase
            .from('clinic_members')
            .select('user_id, clinic_id')
            .eq('stripe_subscription_id', subscriptionId)
            .single()

          await supabase
            .from('clinic_members')
            .update({ has_paid: false })
            .eq('stripe_subscription_id', subscriptionId)

          if (failedMember?.clinic_id) {
            await supabase
              .from('clinics')
              .update({ subscription_status: 'expired', is_active: false })
              .eq('id', failedMember.clinic_id)
          }

          if (failedMember?.user_id) {
            await supabase
              .from('profiles')
              .update({ has_paid: false })
              .eq('id', failedMember.user_id)
          }
        }

        break
      }

      default:
        break
    }

    return new Response('ok', { status: 200 })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return new Response('Webhook failed', { status: 500 })
  }
}
