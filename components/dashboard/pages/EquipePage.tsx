'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { sectionCard } from '../utils/styles'
import type { ClinicMember } from '../types/types'

type Props = {
  clinicId: string
}

const ROLE_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  owner:   { bg: '#E8F5F3', color: '#0A7C6E', label: 'Propriétaire' },
  staff:   { bg: '#F1EFE8', color: '#5F5E5A', label: 'Staff' },
  support: { bg: '#FFF8E7', color: '#92590A', label: 'Support' },
}

function formatLastSeen(lastSeen: string | null): string {
  if (!lastSeen) return 'Jamais connecté'
  const date = new Date(lastSeen)
  return `Vu le ${date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })} à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
}

export default function EquipePage({ clinicId }: Props) {
  const [members, setMembers] = useState<ClinicMember[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!clinicId) { setLoading(false); return }
    const load = async () => {
      setLoading(true)
      try {
        const { data } = await supabase
          .from('clinic_members_view')
          .select('*')
          .eq('clinic_id', clinicId)
          .order('created_at', { ascending: false })
        if (data) setMembers(data as ClinicMember[])
      } catch { /* silent */ } finally {
        setLoading(false)
      }
    }
    load()
  }, [clinicId])

  const copyId = () => {
    if (!clinicId) return
    navigator.clipboard.writeText(clinicId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Clinic ID card */}
      <div style={{ background: '#E8F5F3', border: '1.5px solid #0A7C6E', borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: '#0A7C6E', marginBottom: 8 }}>
          Identifiant de la clinique
        </div>
        <div style={{ fontSize: 12, color: '#0A7C6E', marginBottom: 12, lineHeight: 1.5 }}>
          Partagez cet identifiant pour inviter un collaborateur à rejoindre votre clinique.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, background: 'white', border: '1px solid #A8D8D3', borderRadius: 8, padding: '10px 14px', fontFamily: 'monospace', fontSize: 12, color: '#2A2A28', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {clinicId || '—'}
          </div>
          <button
            onClick={copyId}
            style={{ padding: '10px 16px', background: copied ? '#065E53' : '#0A7C6E', color: 'white', border: 'none', borderRadius: 8, fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s' }}
          >
            {copied ? '✓ Copié' : '📋 Copier'}
          </button>
        </div>
      </div>

      {/* Members list */}
      <div style={{ ...sectionCard, padding: 20 }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: '#2A2A28', marginBottom: 16 }}>
          Membres de la clinique
        </div>

        {loading && (
          <>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 64, background: '#EBEBEA', borderRadius: 8, marginBottom: 8, animation: 'pulse 0.5s ease-in-out alternate infinite' }} />
            ))}
          </>
        )}

        {!loading && members.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: '#2A2A28', marginBottom: 6 }}>
              Aucun autre membre
            </div>
            <div style={{ fontSize: 13, color: '#9E9E9B', maxWidth: 360, margin: '0 auto', lineHeight: 1.6 }}>
              Partagez l&apos;identifiant de votre clinique pour inviter un collaborateur.
            </div>
          </div>
        )}

        {!loading && members.map(m => {
          const displayName = (m.first_name || m.last_name)
            ? `${m.first_name ?? ''} ${m.last_name ?? ''}`.trim()
            : (m.email ?? '—')
          const initials = (m.first_name?.[0] ?? '') + (m.last_name?.[0] ?? '')
          const roleStyle = ROLE_STYLE[m.role] ?? { bg: '#F1EFE8', color: '#5F5E5A', label: m.role }

          return (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid #F5F5F3' }}>

              {/* Avatar */}
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#0A7C6E', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                {initials || '?'}
              </div>

              {/* Name + email */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: '#2A2A28' }}>{displayName}</div>
                <div style={{ fontSize: 11, color: '#9E9E9B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email ?? '—'}</div>
              </div>

              {/* Role badge */}
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: roleStyle.bg, color: roleStyle.color, whiteSpace: 'nowrap', flexShrink: 0 }}>
                {roleStyle.label}
              </span>

              {/* Access badge */}
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: m.has_paid ? '#E8F5F3' : '#FCEBEB', color: m.has_paid ? '#0A7C6E' : '#A32D2D', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {m.has_paid ? '✓ Actif' : '✗ Inactif'}
              </span>

              {/* Online status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, minWidth: 120 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.is_online ? '#38A169' : '#D4D4D2', boxShadow: m.is_online ? '0 0 0 2px #C6F6D5' : 'none' }} />
                <div style={{ fontSize: 11, color: '#5C5C59', lineHeight: 1.3 }}>
                  {m.is_online ? 'En ligne' : formatLastSeen(m.last_seen)}
                </div>
              </div>

              {/* Member since */}
              <div style={{ fontSize: 11, color: '#9E9E9B', flexShrink: 0, textAlign: 'right', minWidth: 80 }}>
                {new Date(m.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          )
        })}
      </div>

      <style>{`@keyframes pulse { 0%{opacity:1} 100%{opacity:.5} }`}</style>
    </div>
  )
}
