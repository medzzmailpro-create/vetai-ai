'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Dashboard from '@/components/dashboard/Dashboard'

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        router.push('/login')
        return
      }

      const user = data.session.user

      // Admin bypass
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
      if (adminEmail && user.email?.toLowerCase() === adminEmail.toLowerCase()) {
        setLoading(false)
        return
      }

      // ✅ On lit has_paid dans PROFILES (pas clinic_members)
      const { data: profile } = await supabase
        .from('profiles')
        .select('has_paid')
        .eq('id', user.id)
        .single()

      if (!profile?.has_paid) {
        // Vérifier si l'utilisateur appartient à une clinique avec abonnement actif
        try {
          const { data: member } = await supabase
            .from('clinic_members')
            .select('clinic_id, role')
            .eq('user_id', user.id)
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

              // Staff (non-propriétaire) : 'none'/null/inconnu → autoriser.
              // Seuls expired / cancelled / is_active=false bloquent.
              const isStaffMember =
                member.role !== 'proprietaire' && member.role !== 'owner'

              const isBlocked = isStaffMember
                ? (trialExpired ||
                   clinic.subscription_status === 'expired' ||
                   clinic.subscription_status === 'cancelled' ||
                   clinic.is_active === false)
                : (trialExpired ||
                   clinic.subscription_status === 'expired' ||
                   clinic.subscription_status === 'cancelled' ||
                   clinic.is_active === false ||
                   clinic.subscription_status === 'none')

              if (!isBlocked) {
                // Clinique valide → autoriser l'accès
                setLoading(false)
                return
              }
            }
          }
        } catch {
          // Colonnes pas encore migrées → fallback /payment-required
        }
        router.push('/payment-required')
        return
      }

      setLoading(false)
    }
    checkSession()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F3' }}>
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, color: '#9E9E9B' }}>Chargement…</div>
    </div>
  )

  return <Dashboard onLogout={handleLogout} />
}