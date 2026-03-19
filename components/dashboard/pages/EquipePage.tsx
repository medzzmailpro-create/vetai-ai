'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { sectionCard } from '../utils/styles'

type Props = {
  clinicId: string
  userId: string
  userRole: 'owner' | 'staff'
}

type Member = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  role: string | null
  clinic_id: string | null
  created_at: string
}

const ROLE_ORDER: Record<string, number> = {
  owner: 0,
  veterinarian: 1,
  secretary: 2,
}

const ROLE_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  owner:       { bg: '#FFF9E6', color: '#B7791F', label: 'Propriétaire' },
  veterinarian: { bg: '#EBF8FF', color: '#2B6CB0', label: 'Vétérinaire' },
  secretary:   { bg: '#F7FAFC', color: '#4A5568', label: 'Secrétaire' },
}

function getRoleOrder(role: string | null): number {
  if (!role) return 99
  return ROLE_ORDER[role] ?? 99
}

export default function EquipePage({ clinicId, userId, userRole }: Props) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [changing, setChanging] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState<Member | null>(null)

  const isOwner = userRole === 'owner'

  useEffect(() => {
    if (!clinicId) { setLoading(false); return }
    const load = async () => {
      setLoading(true)
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, role, clinic_id, created_at')
          .eq('clinic_id', clinicId)
        if (data) {
          const sorted = (data as Member[]).sort(
            (a, b) => getRoleOrder(a.role) - getRoleOrder(b.role)
          )
          setMembers(sorted)
        }
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

  const changeRole = async (member: Member, newRole: 'veterinarian' | 'secretary') => {
    if (changing) return
    setChanging(member.id)
    const prev = member.role
    setMembers(ms => ms.map(m => m.id === member.id ? { ...m, role: newRole } : m))
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', member.id)
      if (error) throw error
      // Re-sort after role change
      setMembers(ms =>
        [...ms].sort((a, b) => getRoleOrder(a.role) - getRoleOrder(b.role))
      )
    } catch {
      setMembers(ms => ms.map(m => m.id === member.id ? { ...m, role: prev } : m))
    } finally {
      setChanging(null)
    }
  }

  const confirmDelete = async () => {
    if (!deleteModal) return
    const memberId = deleteModal.id
    setDeleting(memberId)
    setDeleteModal(null)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ clinic_id: null, role: null })
        .eq('id', memberId)
      if (!error) setMembers(prev => prev.filter(m => m.id !== memberId))
    } catch { /* silent */ } finally {
      setDeleting(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Delete confirmation modal */}
      {deleteModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.45)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div style={{
            background: 'white', borderRadius: 16, padding: 28,
            maxWidth: 400, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: '#2A2A28', marginBottom: 10 }}>
              Retirer ce membre ?
            </div>
            <div style={{ fontSize: 14, color: '#5C5C59', lineHeight: 1.6, marginBottom: 24 }}>
              Retirer{' '}
              <strong>
                {[deleteModal.first_name, deleteModal.last_name].filter(Boolean).join(' ') || deleteModal.email}
              </strong>{' '}
              de la clinique ? Son compte reste intact, il pourra rejoindre une autre clinique.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteModal(null)}
                style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #D4D4D2', background: 'white', color: '#5C5C59', fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#E53E3E', color: 'white', fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Retirer
              </button>
            </div>
          </div>
        </div>
      )}

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
          {!loading && (
            <span style={{ fontSize: 12, color: '#9E9E9B', fontWeight: 400, marginLeft: 8 }}>
              {members.length} membre{members.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loading && (
          <>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 64, background: '#EBEBEA', borderRadius: 8, marginBottom: 8, animation: 'pulse 1s ease-in-out alternate infinite' }} />
            ))}
          </>
        )}

        {!loading && members.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: '#2A2A28', marginBottom: 6 }}>
              Aucun membre trouvé
            </div>
            <div style={{ fontSize: 13, color: '#9E9E9B', maxWidth: 360, margin: '0 auto', lineHeight: 1.6 }}>
              Partagez l&apos;identifiant de votre clinique pour inviter un collaborateur.
            </div>
          </div>
        )}

        {!loading && members.map(m => {
          const displayName = [m.first_name, m.last_name].filter(Boolean).join(' ') || m.email || '—'
          const initials = ((m.first_name?.[0] ?? '') + (m.last_name?.[0] ?? '')).toUpperCase() || '?'
          const roleStyle = m.role ? (ROLE_STYLE[m.role] ?? { bg: '#F1EFE8', color: '#5F5E5A', label: m.role }) : { bg: '#F1EFE8', color: '#9E9E9B', label: '—' }
          const isSelf = m.id === userId
          const canManage = isOwner && !isSelf && m.role !== 'owner'
          const isBeingDeleted = deleting === m.id

          return (
            <div
              key={m.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 0', borderBottom: '1px solid #F5F5F3',
                flexWrap: 'wrap', opacity: isBeingDeleted ? 0.4 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                background: isSelf ? '#065E53' : (m.role === 'owner' ? '#B7791F' : '#0A7C6E'),
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700,
              }}>
                {initials}
              </div>

              {/* Name + email */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: '#2A2A28' }}>
                  {displayName}{isSelf ? ' (vous)' : ''}
                </div>
                {m.email && (
                  <div style={{ fontSize: 11, color: '#9E9E9B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.email}
                  </div>
                )}
              </div>

              {/* Role badge */}
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px',
                borderRadius: 100, background: roleStyle.bg, color: roleStyle.color,
                whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                {roleStyle.label}
              </span>

              {/* Join date */}
              <div style={{ fontSize: 11, color: '#9E9E9B', flexShrink: 0, textAlign: 'right', minWidth: 80 }}>
                {new Date(m.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>

              {/* Actions (owner only, not self, not owner) */}
              {canManage && (
                <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                  {/* Role selector */}
                  <select
                    value={m.role ?? ''}
                    disabled={changing === m.id}
                    onChange={e => changeRole(m, e.target.value as 'veterinarian' | 'secretary')}
                    style={{
                      padding: '4px 8px', borderRadius: 6, border: '1px solid #D4D4D2',
                      background: 'white', color: '#3E3E3C', fontFamily: 'Syne, sans-serif',
                      fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      opacity: changing === m.id ? 0.6 : 1,
                    }}
                  >
                    <option value="veterinarian">Vétérinaire</option>
                    <option value="secretary">Secrétaire</option>
                  </select>

                  {/* Delete button */}
                  <button
                    onClick={() => setDeleteModal(m)}
                    disabled={deleting === m.id}
                    title="Retirer de la clinique"
                    style={{
                      padding: '4px 10px', borderRadius: 6,
                      border: '1px solid #E53E3E', background: 'white',
                      color: '#E53E3E', fontFamily: 'Syne, sans-serif',
                      fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      opacity: deleting === m.id ? 0.6 : 1,
                    }}
                  >
                    🗑 Retirer
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!isOwner && (
        <div style={{ fontSize: 12, color: '#9E9E9B', textAlign: 'center', padding: '8px 0' }}>
          Seul le propriétaire peut modifier les rôles et retirer des membres.
        </div>
      )}

      <style>{`@keyframes pulse { 0%{opacity:1} 100%{opacity:.5} }`}</style>
    </div>
  )
}
