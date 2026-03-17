import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vetai.fr'

  if (!stripeSecretKey) {
    return NextResponse.json({ error: 'Stripe non configuré.' }, { status: 500 })
  }

  let userId: string | undefined
  try {
    const body = await req.json()
    userId = body.userId
  } catch { /* ignore */ }

  let stripeCustomerId: string | undefined
  if (userId) {
    const { data } = await supabase.from('clinic_members').select('stripe_customer_id').eq('user_id', userId).single()
    stripeCustomerId = data?.stripe_customer_id ?? undefined
  }

  if (!stripeCustomerId) {
    const portalUrl = process.env.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL
    if (portalUrl && portalUrl !== '#') {
      return NextResponse.json({ url: portalUrl })
    }
    return NextResponse.json({ error: 'Aucun compte Stripe associé.' }, { status: 400 })
  }

  try {
    const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer: stripeCustomerId,
        return_url: `${siteUrl}/dashboard/facturation`,
      }),
    })

    const session = await response.json()
    if (!response.ok) {
      return NextResponse.json({ error: session.error?.message ?? 'Erreur Stripe' }, { status: 400 })
    }

    return NextResponse.json({ url: session.url })
  } catch {
    return NextResponse.json({ error: 'Erreur lors de l\'accès au portail.' }, { status: 500 })
  }
}
