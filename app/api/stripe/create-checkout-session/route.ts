import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    const monthlyPriceId = process.env.STRIPE_PRICE_ID
    const setupPriceId = process.env.STRIPE_SETUP_PRICE_ID
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vetai.fr'

    if (!process.env.STRIPE_SECRET_KEY || !monthlyPriceId || !setupPriceId) {
      return NextResponse.json(
        {
          error:
            'Ajoute STRIPE_SECRET_KEY, STRIPE_PRICE_ID et STRIPE_SETUP_PRICE_ID dans les variables d\u2019environnement.',
        },
        { status: 500 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const userId = body.userId as string | undefined

    if (!userId) {
      return NextResponse.json(
        { error: 'userId requis pour créer la session Stripe.' },
        { status: 400 }
      )
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single()

    if (profileError) {
      return NextResponse.json(
        { error: 'Impossible de récupérer le profil utilisateur.' },
        { status: 400 }
      )
    }

    // Check if this user already has a Stripe customer (returning customer)
    const { data: memberData } = await supabase
      .from('clinic_members')
      .select('stripe_customer_id, has_paid')
      .eq('user_id', userId)
      .single()

    const existingCustomerId = memberData?.stripe_customer_id as string | null | undefined
    const alreadyPaid = memberData?.has_paid === true

    // If already paid and has an active customer, redirect to customer portal instead
    if (alreadyPaid && existingCustomerId) {
      return NextResponse.json(
        { error: 'Abonnement déjà actif. Utilisez le portail client pour gérer votre abonnement.' },
        { status: 400 }
      )
    }

    let session: Stripe.Checkout.Session

    if (existingCustomerId) {
      // Returning customer (was cancelled before, re-subscribing) — only monthly subscription
      session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: existingCustomerId,
        line_items: [
          {
            price: monthlyPriceId,
            quantity: 1,
          },
        ],
        success_url: `${siteUrl}/dashboard?payment=success`,
        cancel_url: `${siteUrl}/pricing?payment=cancelled`,
        metadata: {
          user_id: userId,
        },
      })
    } else {
      // First-time customer — installation fee + monthly subscription
      session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [
          {
            price: monthlyPriceId,
            quantity: 1,
          },
          {
            price: setupPriceId,
            quantity: 1,
          },
        ],
        success_url: `${siteUrl}/dashboard?payment=success`,
        cancel_url: `${siteUrl}/pricing?payment=cancelled`,
        customer_email: profile?.email ?? undefined,
        metadata: {
          user_id: userId,
        },
      })
    }

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la session de paiement.' },
      { status: 500 }
    )
  }
}
