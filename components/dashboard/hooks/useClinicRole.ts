'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { UserRole } from '../types/types'

const ROLE_MAP: Record<string, UserRole> = {
  proprietaire: 'proprietaire',
  responsable:  'responsable',
  veterinaire:  'veterinaire',
  secretaire:   'secretaire',
  // compatibilité anciens rôles
  owner:        'proprietaire',
  admin:        'responsable',
  staff:        'veterinaire',
  veterinarian: 'veterinaire',
  secretary:    'secretaire',
  viewer:       'secretaire',
}

export function useClinicRole() {
  const [role, setRole] = useState<UserRole | null>(null)
  const [clinicId, setClinicId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }
        setUserId(user.id)

        const { data: member } = await supabase
          .from('clinic_members')
          .select('role, clinic_id')
          .eq('user_id', user.id)
          .single()

        if (member) {
          setRole(ROLE_MAP[member.role ?? ''] ?? 'veterinaire')
          setClinicId(member.clinic_id ?? null)
        }
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const isProprietaire = role === 'proprietaire'
  const isResponsable  = role === 'responsable'
  const canManage      = isProprietaire || isResponsable

  return { role, clinicId, userId, loading, isProprietaire, isResponsable, canManage }
}
