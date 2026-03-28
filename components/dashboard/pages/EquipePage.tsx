'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { sectionCard } from '../utils/styles'
import type { UserRole } from '../types/types'

const ROLE_MAP: Record<string, UserRole> = {
  proprietaire: 'proprietaire', responsable: 'responsable',
  veterinaire: 'veterinaire', secretaire: 'secretaire',
  owner: 'proprietaire', admin: 'responsable',
  staff: 'veterinaire', veterinarian: 'veterinaire',
  secretary: 'secretaire', viewer: 'secretaire',
}

const ROLE_ORDER: Record<UserRole, number> = {
  proprietaire: 0, responsable: 1, veterinaire: 2, secretaire: 3,
}

const ROLE_STYLE: Record<UserRole, { bg: string; color: string; label: string }> = {
  proprietaire: { bg: '#FFF9E6', color: '#B7791F', label: 'Propriétaire' },
  responsable:  { bg: '#E8F5F3', color: '#0A7C6E', label: 'Responsable' },
  veterinaire:  { bg: '#EBF8FF', color: '#2B6CB0', label: 'Vétérinaire' },
  secretaire:   { bg: '#F7FAFC', color: '#4A5568', label: 'Secrétaire' },
}

type Member = {
  id: string        // clinic_members.id
  user_id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  role: UserRole
  created_at: string
}

type Props = {
  clinicId: string
  userId: string
  userRole: UserRole
}

// ─── Reusable modal wrapper ────────────────────────────────────────────────
function Modal({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.45)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: 'white', borderRadius: 16, padding: 28,
        maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        {children}
      </div>
    </div>
  )
}

const H2 = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: '#2A2A28', marginBottom: 10 }}>
    {children}
  </div>
)

const Body = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: 14, color: '#5C5C59', lineHeight: 1.6, marginBottom: 20 }}>
    {children}
  </div>
)

const BtnRow = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
    {children}
  </div>
)

function Btn({ label, onClick, red, disabled }: { label: string; onClick: () => void; red?: boolean; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '9px 18px', borderRadius: 8, border: red ? 'none' : '1px solid #D4D4D2',
        background: red ? '#E53E3E' : 'white', color: red ? 'white' : '#5C5C59',
        fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
      }}
    >
      {label}
    </button>
  )
}

export default function EquipePage({ clinicId, userId, userRole }: Props) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [changing, setChanging] = useState<string | null>(null)

  const isProprietaire = userRole === 'proprietaire'
  const isResponsable  = userRole === 'responsable'
  const canManage      = isProprietaire || isResponsable

  // ── Modals state ──────────────────────────────────────────────────────────
  type ModalType =
    | { type: 'removeSimple'; member: Member }
    | { type: 'leaveAlone' }
    | { type: 'leaveNoResp'; candidates: Member[] }
    | { type: 'leaveWithResp'; responsables: Member[] }
    | { type: 'transferCrown' }

  const [modal, setModal] = useState<ModalType | null>(null)

  // Transfer crown state
  const [transferTarget, setTransferTarget] = useState<string>('')
  const [transferPassword, setTransferPassword] = useState('')
  const [transferError, setTransferError] = useState('')
  const [transferLoading, setTransferLoading] = useState(false)

  // Leave modal state
  const [leaveSelected, setLeaveSelected] = useState<string>('')

  // ── Load members ─────────────────────────────────────────────────────────
  const loadMembers = useCallback(async () => {
    if (!clinicId) { setLoading(false); return }
    setLoading(true)
    try {
      // Get clinic_members
      const { data: cmRows } = await supabase
        .from('clinic_members')
        .select('id, user_id, clinic_id, role, created_at')
        .eq('clinic_id', clinicId)

      if (!cmRows || cmRows.length === 0) { setMembers([]); return }

      // Get profiles for those user_ids
      const userIds = cmRows.map((r: Record<string, unknown>) => r.user_id as string)
      const { data: profileRows } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', userIds)

      const profileMap = new Map((profileRows ?? []).map((p: Record<string, unknown>) => [p.id, p]))

      const merged: Member[] = cmRows.map((cm: Record<string, unknown>) => {
        const p = profileMap.get(cm.user_id as string) as Record<string, unknown> | undefined
        return {
          id: cm.id as string,
          user_id: cm.user_id as string,
          first_name: (p?.first_name as string | null) ?? null,
          last_name: (p?.last_name as string | null) ?? null,
          email: (p?.email as string | null) ?? null,
          role: ROLE_MAP[cm.role as string] ?? 'veterinaire',
          created_at: cm.created_at as string,
        }
      }).sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role])

      setMembers(merged)
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [clinicId])

  useEffect(() => { loadMembers() }, [loadMembers])

  // ── Supabase Realtime — sync role changes ────────────────────────────────
  useEffect(() => {
    if (!clinicId) return
    const channel = supabase
      .channel(`equipe_${clinicId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clinic_members', filter: `clinic_id=eq.${clinicId}` },
        () => { loadMembers() }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [clinicId, loadMembers])

  // ── Copy clinic ID ────────────────────────────────────────────────────────
  const copyId = () => {
    if (!clinicId) return
    navigator.clipboard.writeText(clinicId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Change role ───────────────────────────────────────────────────────────
  const changeRole = async (member: Member, newRole: UserRole) => {
    if (changing) return
    setChanging(member.id)
    const prev = member.role
    setMembers(ms => ms.map(m => m.id === member.id ? { ...m, role: newRole } : m))
    try {
      const { error } = await supabase
        .from('clinic_members')
        .update({ role: newRole })
        .eq('id', member.id)
      if (error) throw error
      setMembers(ms => [...ms].sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role]))
    } catch {
      setMembers(ms => ms.map(m => m.id === member.id ? { ...m, role: prev } : m))
    } finally {
      setChanging(null)
    }
  }

  // ── Remove member (non-proprietaire) ─────────────────────────────────────
  const removeMember = async (member: Member) => {
    try {
      await supabase.from('clinic_members').delete().eq('id', member.id)
      await supabase.from('profiles').update({ clinic_id: null }).eq('id', member.user_id)
      setMembers(prev => prev.filter(m => m.id !== member.id))
    } catch { /* silent */ }
    setModal(null)
  }

  // ── Self-leave logic (proprietaire) ───────────────────────────────────────
  const handleProprietaireLeave = () => {
    const others = members.filter(m => m.user_id !== userId)
    if (others.length === 0) {
      setModal({ type: 'leaveAlone' })
      return
    }
    const responsables = others.filter(m => m.role === 'responsable')
    if (responsables.length === 0) {
      setModal({ type: 'leaveNoResp', candidates: others })
      return
    }
    setModal({ type: 'leaveWithResp', responsables })
  }

  // ── Delete entire clinic ──────────────────────────────────────────────────
  const deleteClinic = async () => {
    setModal(null)
    try {
      await supabase.from('clinic_members').delete().eq('clinic_id', clinicId)
      await supabase.from('clinic_config').delete().eq('user_id', userId)
      await supabase.from('clinics').delete().eq('id', clinicId)
      await supabase.from('profiles').update({ clinic_id: null }).eq('id', userId)
      window.location.href = '/payment-required'
    } catch { /* silent */ }
  }

  // ── Leave and assign new proprietaire ────────────────────────────────────
  const leaveAndAssign = async (newOwnerId: string) => {
    if (!newOwnerId) return
    setModal(null)
    try {
      // Promote chosen member
      await supabase
        .from('clinic_members')
        .update({ role: 'proprietaire' })
        .eq('user_id', newOwnerId)
        .eq('clinic_id', clinicId)
      // Remove current proprietaire
      await supabase.from('clinic_members').delete().eq('user_id', userId).eq('clinic_id', clinicId)
      await supabase.from('profiles').update({ clinic_id: null }).eq('id', userId)
      window.location.href = '/payment-required'
    } catch { /* silent */ }
  }

  // ── Leave with auto-assignment (first responsable) ───────────────────────
  const leaveAutoAssign = async (responsables: Member[]) => {
    const first = [...responsables].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )[0]
    await leaveAndAssign(first.user_id)
  }

  // ── Transfer crown ────────────────────────────────────────────────────────
  const handleTransferCrown = async () => {
    if (!transferTarget || !transferPassword) {
      setTransferError('Sélectionnez un membre et entrez votre mot de passe.')
      return
    }
    setTransferLoading(true)
    setTransferError('')
    try {
      // Verify password
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) throw new Error('no-user')

      const { error: authErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: transferPassword,
      })
      if (authErr) {
        setTransferError('Mot de passe incorrect.')
        setTransferLoading(false)
        return
      }

      // Old owner → responsable
      await supabase
        .from('clinic_members')
        .update({ role: 'responsable' })
        .eq('user_id', userId)
        .eq('clinic_id', clinicId)

      // New owner → proprietaire
      await supabase
        .from('clinic_members')
        .update({ role: 'proprietaire' })
        .eq('user_id', transferTarget)
        .eq('clinic_id', clinicId)

      setModal(null)
      setTransferPassword('')
      setTransferTarget('')
      loadMembers()
    } catch {
      setTransferError('Une erreur est survenue. Réessayez.')
    } finally {
      setTransferLoading(false)
    }
  }

  // ── Compute actions per member ────────────────────────────────────────────
  const canRemove = (m: Member): boolean => {
    if (m.user_id === userId) return false // self → use leave button
    if (m.role === 'proprietaire') return false
    if (isProprietaire) return true // propriétaire can remove all non-proprietaire
    if (isResponsable) return m.role === 'veterinaire' || m.role === 'secretaire'
    return false
  }

  const canChangeRole = (m: Member): boolean => {
    if (m.user_id === userId) return false
    if (m.role === 'proprietaire') return false
    if (isProprietaire) return true
    if (isResponsable) return m.role === 'veterinaire' || m.role === 'secretaire'
    return false
  }

  const roleOptions: UserRole[] = isProprietaire
    ? ['responsable', 'veterinaire', 'secretaire']
    : ['veterinaire', 'secretaire']

  const isSelf = (m: Member) => m.user_id === userId

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Modals ─────────────────────────────────────────────────────── */}

      {modal?.type === 'removeSimple' && (
        <Modal>
          <H2>Retirer ce membre ?</H2>
          <Body>
            Voulez-vous vraiment retirer{' '}
            <strong>
              {[modal.member.first_name, modal.member.last_name].filter(Boolean).join(' ') || modal.member.email}
            </strong>{' '}
            de la clinique ? Son compte reste intact.
          </Body>
          <BtnRow>
            <Btn label="Annuler" onClick={() => setModal(null)} />
            <Btn label="Retirer" red onClick={() => removeMember(modal.member)} />
          </BtnRow>
        </Modal>
      )}

      {modal?.type === 'leaveAlone' && (
        <Modal>
          <H2>⚠️ Dernière chance</H2>
          <Body>
            Vous êtes le <strong>seul membre</strong> de cette clinique. Si vous partez,{' '}
            <strong>la clinique sera définitivement supprimée</strong> ainsi que toutes ses données. Cette action est irréversible.
          </Body>
          <BtnRow>
            <Btn label="Annuler" onClick={() => setModal(null)} />
            <Btn label="Confirmer et supprimer la clinique" red onClick={deleteClinic} />
          </BtnRow>
        </Modal>
      )}

      {modal?.type === 'leaveNoResp' && (
        <Modal>
          <H2>Désigner un nouveau propriétaire</H2>
          <Body>
            Avant de partir, vous devez désigner un nouveau propriétaire parmi les membres.
          </Body>
          <div style={{ marginBottom: 16 }}>
            {modal.candidates.map(c => {
              const name = [c.first_name, c.last_name].filter(Boolean).join(' ') || c.email || '—'
              return (
                <label key={c.user_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="newOwner"
                    value={c.user_id}
                    checked={leaveSelected === c.user_id}
                    onChange={() => setLeaveSelected(c.user_id)}
                  />
                  <span style={{ fontSize: 14, color: '#2A2A28' }}>{name}</span>
                  <span style={{ fontSize: 11, color: '#9E9E9B' }}>({ROLE_STYLE[c.role]?.label})</span>
                </label>
              )
            })}
          </div>
          <BtnRow>
            <Btn label="Annuler" onClick={() => { setModal(null); setLeaveSelected('') }} />
            <Btn
              label="Désigner et quitter"
              red
              disabled={!leaveSelected}
              onClick={() => leaveAndAssign(leaveSelected)}
            />
          </BtnRow>
        </Modal>
      )}

      {modal?.type === 'leaveWithResp' && (
        <Modal>
          <H2>Quitter la clinique</H2>
          <Body>
            Choisissez comment transférer la propriété avant de partir.
          </Body>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', cursor: 'pointer' }}>
              <input
                type="radio"
                name="leaveOpt"
                value="auto"
                checked={leaveSelected === 'auto'}
                onChange={() => setLeaveSelected('auto')}
              />
              <span style={{ fontSize: 14, color: '#2A2A28' }}>
                Partir sans désigner (le premier responsable inscrit devient propriétaire)
              </span>
            </label>
            {modal.responsables.map(r => {
              const name = [r.first_name, r.last_name].filter(Boolean).join(' ') || r.email || '—'
              return (
                <label key={r.user_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="leaveOpt"
                    value={r.user_id}
                    checked={leaveSelected === r.user_id}
                    onChange={() => setLeaveSelected(r.user_id)}
                  />
                  <span style={{ fontSize: 14, color: '#2A2A28' }}>Désigner {name}</span>
                </label>
              )
            })}
          </div>
          <BtnRow>
            <Btn label="Annuler" onClick={() => { setModal(null); setLeaveSelected('') }} />
            <Btn
              label="Confirmer et quitter"
              red
              disabled={!leaveSelected}
              onClick={() => {
                if (leaveSelected === 'auto') leaveAutoAssign(modal.responsables)
                else leaveAndAssign(leaveSelected)
              }}
            />
          </BtnRow>
        </Modal>
      )}

      {modal?.type === 'transferCrown' && (
        <Modal>
          <H2>👑 Transférer la propriété</H2>
          <Body>
            ⚠️ Cette action est <strong>irréversible</strong>. Vous deviendrez Responsable et le membre sélectionné deviendra Propriétaire.
          </Body>
          <div style={{ marginBottom: 12 }}>
            <select
              value={transferTarget}
              onChange={e => setTransferTarget(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #D4D4D2', fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#2A2A28', marginBottom: 10 }}
            >
              <option value="">Choisir un responsable…</option>
              {members.filter(m => m.role === 'responsable').map(m => {
                const name = [m.first_name, m.last_name].filter(Boolean).join(' ') || m.email || '—'
                return <option key={m.user_id} value={m.user_id}>{name}</option>
              })}
            </select>
            <input
              type="password"
              placeholder="Confirmer votre mot de passe"
              value={transferPassword}
              onChange={e => { setTransferPassword(e.target.value); setTransferError('') }}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #D4D4D2', fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#2A2A28', boxSizing: 'border-box' }}
            />
          </div>
          {transferError && (
            <div style={{ fontSize: 12, color: '#E53E3E', marginBottom: 12 }}>⚠️ {transferError}</div>
          )}
          <BtnRow>
            <Btn label="Annuler" onClick={() => { setModal(null); setTransferPassword(''); setTransferTarget(''); setTransferError('') }} />
            <Btn
              label={transferLoading ? 'Vérification…' : 'Transférer →'}
              red
              disabled={transferLoading}
              onClick={handleTransferCrown}
            />
          </BtnRow>
        </Modal>
      )}

      {/* ── Clinic ID (visible seulement propriétaire + responsable) ───── */}
      {canManage && (
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
      )}

      {/* ── Members list ────────────────────────────────────────────────── */}
      <div style={{ ...sectionCard, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: '#2A2A28' }}>
            Membres de la clinique
            {!loading && (
              <span style={{ fontSize: 12, color: '#9E9E9B', fontWeight: 400, marginLeft: 8 }}>
                {members.length} membre{members.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {/* Transfer crown button — propriétaire only, si au moins 1 responsable */}
          {isProprietaire && members.some(m => m.role === 'responsable') && (
            <button
              onClick={() => setModal({ type: 'transferCrown' })}
              style={{ padding: '7px 14px', borderRadius: 8, border: '1.5px solid #B7791F', background: '#FFF9E6', color: '#B7791F', fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              👑 Transférer la propriété
            </button>
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
              {canManage
                ? 'Partagez l\'identifiant de votre clinique pour inviter un collaborateur.'
                : 'Aucun membre pour le moment.'}
            </div>
          </div>
        )}

        {!loading && members.map(m => {
          const displayName = [m.first_name, m.last_name].filter(Boolean).join(' ') || m.email || '—'
          const initials = ((m.first_name?.[0] ?? '') + (m.last_name?.[0] ?? '')).toUpperCase() || '?'
          const roleStyle = ROLE_STYLE[m.role] ?? { bg: '#F1EFE8', color: '#5F5E5A', label: m.role }
          const self = isSelf(m)
          const isBeingChanged = changing === m.id

          return (
            <div
              key={m.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 0', borderBottom: '1px solid #F5F5F3',
                flexWrap: 'wrap', opacity: isBeingChanged ? 0.5 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                background: self ? '#065E53' : (m.role === 'proprietaire' ? '#B7791F' : '#0A7C6E'),
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700,
              }}>
                {initials}
              </div>

              {/* Name + email */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: '#2A2A28', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {displayName}{self ? ' (vous)' : ''}
                  {m.role === 'proprietaire' && <span title="Propriétaire">👑</span>}
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

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                {/* Role dropdown — gérable selon hiérarchie */}
                {canChangeRole(m) && (
                  <select
                    value={m.role}
                    disabled={isBeingChanged}
                    onChange={e => changeRole(m, e.target.value as UserRole)}
                    style={{
                      padding: '4px 8px', borderRadius: 6, border: '1px solid #D4D4D2',
                      background: 'white', color: '#3E3E3C', fontFamily: 'Syne, sans-serif',
                      fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      opacity: isBeingChanged ? 0.6 : 1,
                    }}
                  >
                    {roleOptions.map(r => (
                      <option key={r} value={r}>{ROLE_STYLE[r].label}</option>
                    ))}
                  </select>
                )}

                {/* Remove button */}
                {canRemove(m) && (
                  <button
                    onClick={() => setModal({ type: 'removeSimple', member: m })}
                    title="Retirer de la clinique"
                    style={{
                      padding: '4px 10px', borderRadius: 6,
                      border: '1px solid #E53E3E', background: 'white',
                      color: '#E53E3E', fontFamily: 'Syne, sans-serif',
                      fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    🗑 Retirer
                  </button>
                )}

                {/* Leave button (self + proprietaire) */}
                {self && isProprietaire && (
                  <button
                    onClick={handleProprietaireLeave}
                    title="Quitter la clinique"
                    style={{
                      padding: '4px 10px', borderRadius: 6,
                      border: '1px solid #E53E3E', background: 'white',
                      color: '#E53E3E', fontFamily: 'Syne, sans-serif',
                      fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    Quitter la clinique
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {!canManage && (
        <div style={{ fontSize: 12, color: '#9E9E9B', textAlign: 'center', padding: '8px 0' }}>
          Seuls le propriétaire et les responsables peuvent modifier les rôles et retirer des membres.
        </div>
      )}

      <style>{`@keyframes pulse { 0%{opacity:1} 100%{opacity:.5} }`}</style>
    </div>
  )
}
