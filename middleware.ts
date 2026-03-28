import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const { pathname } = request.nextUrl

  // ── /dashboard : session requise ───────────────────────────────────────────
  if (pathname.startsWith('/dashboard') && !session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ── /dashboard : vérifier statut trial / abonnement ───────────────────────
  if (pathname.startsWith('/dashboard') && session) {
    const userEmail = session.user.email
    // L'admin contourne la vérification de paiement
    if (userEmail !== ADMIN_EMAIL) {
      try {
        // 1. Vérifier has_paid dans profiles (système existant — accès direct)
        const { data: profile } = await supabase
          .from('profiles')
          .select('has_paid')
          .eq('id', session.user.id)
          .single()

        if (!profile?.has_paid) {
          // 2. Vérifier le statut trial/abonnement dans la table clinics
          const { data: member } = await supabase
            .from('clinic_members')
            .select('clinic_id')
            .eq('user_id', session.user.id)
            .single()

          if (member?.clinic_id) {
            const { data: clinic } = await supabase
              .from('clinics')
              .select('subscription_status, trial_end, is_active')
              .eq('id', member.clinic_id)
              .single()

            if (clinic) {
              const now = new Date()
              const trialExpired =
                clinic.subscription_status === 'trial' &&
                clinic.trial_end != null &&
                new Date(clinic.trial_end) < now

              const isBlocked =
                trialExpired ||
                clinic.subscription_status === 'expired' ||
                clinic.subscription_status === 'cancelled' ||
                clinic.is_active === false ||
                clinic.subscription_status === 'none'

              if (isBlocked) {
                return NextResponse.redirect(new URL('/payment-required', request.url))
              }
              // subscription_status = 'trial' (non expiré) ou 'active' → laisser passer
            }
          }
          // Pas de clinic ou colonnes manquantes → laisser dashboard/page.tsx gérer
        }
      } catch {
        // Erreur DB (ex: colonnes pas encore migrées) → laisser passer
      }
    }
  }

  // ── /admin : session + role support requis ─────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role !== 'support') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // ── / : utilisateur connecté → dashboard ───────────────────────────────────
  if (pathname === '/' && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/admin/:path*'],
}
