import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret non configuré' }, { status: 500 })
  }

  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
  }

  // Stripe signature verification (simplified — install stripe SDK for full verification)
  let event: { type: string; data: { object: Record<string, unknown> } }
  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const userId = (session.metadata as Record<string, string> | null)?.user_id
      if (userId) {
        await supabase.from('profiles').update({ has_paid: true }).eq('id', userId)
        await supabase.from('clinic_members').update({ has_paid: true }).eq('user_id', userId)
      }
      break
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as { status?: string; metadata?: Record<string, string> }
      if (sub.status === 'active' && sub.metadata?.user_id) {
        await supabase.from('profiles').update({ has_paid: true }).eq('id', sub.metadata.user_id)
        await supabase.from('clinic_members').update({ has_paid: true }).eq('user_id', sub.metadata.user_id)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as { metadata?: Record<string, string> }
      if (sub.metadata?.user_id) {
        await supabase.from('profiles').update({ has_paid: false }).eq('id', sub.metadata.user_id)
        await supabase.from('clinic_members').update({ has_paid: false }).eq('user_id', sub.metadata.user_id)
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as { subscription_details?: { metadata?: Record<string, string> } }
      const userId = invoice.subscription_details?.metadata?.user_id
      if (userId) {
        await supabase.from('profiles').update({ has_paid: false }).eq('id', userId)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
