import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  const priceId = process.env.STRIPE_PRICE_ID
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vetai.fr'

  if (!stripeSecretKey || !priceId) {
    return NextResponse.json(
      { error: 'Stripe non configuré. Ajoutez STRIPE_SECRET_KEY et STRIPE_PRICE_ID dans les variables d\'environnement.' },
      { status: 500 }
    )
  }

  let userId: string | undefined
  try {
    const body = await req.json()
    userId = body.userId
  } catch { /* ignore */ }

  let customerEmail: string | undefined
  if (userId) {
    const { data: profile } = await supabase.from('profiles').select('email').eq('id', userId).single()
    customerEmail = profile?.email ?? undefined
  }

  try {
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        mode: 'subscription',
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1',
        success_url: `${siteUrl}/dashboard?payment=success`,
        cancel_url: `${siteUrl}/payment-required`,
        ...(customerEmail ? { customer_email: customerEmail } : {}),
        ...(userId ? { 'metadata[user_id]': userId } : {}),
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      return NextResponse.json({ error: err.error?.message ?? 'Erreur Stripe' }, { status: 400 })
    }

    const session = await response.json()
    return NextResponse.json({ url: session.url })
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la création de la session de paiement.' }, { status: 500 })
  }
}
