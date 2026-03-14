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

      // Admin bypass — toujours autoriser
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
      if (adminEmail && user.email?.toLowerCase() === adminEmail.toLowerCase()) {
        setLoading(false)
        return
      }

      // Vérification paiement dans clinic_members
      try {
        const { data: memberData } = await supabase
          .from('clinic_members')
          .select('has_paid')
          .eq('user_id', user.id)
          .single()

        if (!memberData?.has_paid) {
          router.push('/payment-required')
          return
        }
      } catch {
        // Colonne absente (migration non appliquée) → autoriser l'accès
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
