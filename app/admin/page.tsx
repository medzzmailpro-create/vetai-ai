'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type ClinicRow = { name: string }

type Profile = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  clinic_id: string | null
  has_paid: boolean
  role: string
  created_at: string
  clinics: ClinicRow[] | ClinicRow | null
}

type Filter = 'all' | 'active' | 'blocked'

export default function AdminPage() {
  const router = useRouter()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const loadProfiles = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, phone, clinic_id, has_paid, role, created_at, clinics(name)')
      .order('created_at', { ascending: false })

    if (error) {
      showToast('Erreur lors du chargement des profils.', 'error')
      setLoading(false)
      return
    }
    setProfiles((data ?? []) as Profile[])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadProfiles()

    const channel = supabase
      .channel('admin-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        loadProfiles()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [loadProfiles])

  const toggleAccess = async (profile: Profile) => {
    const newValue = !profile.has_paid

    // Optimistic update
    setProfiles(prev =>
      prev.map(p => p.id === profile.id ? { ...p, has_paid: newValue } : p)
    )

    const { error } = await supabase
      .from('profiles')
      .update({ has_paid: newValue })
      .eq('id', profile.id)

    if (error) {
      // Revert
      setProfiles(prev =>
        prev.map(p => p.id === profile.id ? { ...p, has_paid: !newValue } : p)
      )
      showToast('Erreur lors de la mise à jour.', 'error')
      return
    }

    const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email || 'cet utilisateur'
    showToast(
      newValue ? `Accès activé pour ${fullName} ✓` : `Accès désactivé pour ${fullName}`,
      'success'
    )
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  // Filtrage + recherche
  const filtered = profiles.filter(p => {
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      p.first_name?.toLowerCase().includes(q) ||
      p.last_name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q)
    const matchFilter =
      filter === 'all' ||
      (filter === 'active' && p.has_paid) ||
      (filter === 'blocked' && !p.has_paid)
    return matchSearch && matchFilter
  })

  const total = profiles.length
  const active = profiles.filter(p => p.has_paid).length
  const blocked = profiles.filter(p => !p.has_paid).length

  const inputStyle: React.CSSProperties = {
    padding: '9px 14px',
    border: '1.5px solid #D4D4D2',
    borderRadius: 8,
    fontFamily: 'DM Sans, sans-serif',
    fontSize: 14,
    color: '#2A2A28',
    background: '#F5F5F3',
    outline: 'none',
    width: 280,
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F3' }}>
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, color: '#9E9E9B' }}>Chargement…</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F3', fontFamily: 'DM Sans, sans-serif' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.type === 'success' ? '#0A7C6E' : '#C53030',
          color: 'white', padding: '12px 20px', borderRadius: 10,
          fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 600,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          transition: 'opacity 0.2s',
        }}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <header style={{
        background: 'white',
        borderBottom: '1.5px solid #EBEBEA',
        padding: '0 32px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Logo */}
          <div style={{
            fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800,
            color: '#0A7C6E', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            Vetai.AI
            <div style={{ width: 7, height: 7, background: '#F5A623', borderRadius: '50%' }} />
          </div>

          <div style={{ width: 1, height: 28, background: '#EBEBEA' }} />

          <div style={{
            fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, color: '#141412',
          }}>
            🛡️ Panel Support
          </div>

          <div style={{
            background: '#FFF8E7',
            border: '1px solid #F5A623',
            borderRadius: 100,
            padding: '4px 12px',
            fontFamily: 'Syne, sans-serif',
            fontSize: 11,
            fontWeight: 700,
            color: '#92590A',
            letterSpacing: '0.05em',
            textTransform: 'uppercase' as const,
          }}>
            Accès restreint — Support uniquement
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            background: 'none',
            border: '1.5px solid #D4D4D2',
            borderRadius: 8,
            fontFamily: 'Syne, sans-serif',
            fontSize: 13,
            fontWeight: 600,
            color: '#5C5C59',
            cursor: 'pointer',
          }}
        >
          Se déconnecter
        </button>
      </header>

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>

        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total utilisateurs', value: total, color: '#0A7C6E', icon: '👥' },
            { label: 'Accès actifs', value: active, color: '#38A169', icon: '✅' },
            { label: 'Accès bloqués', value: blocked, color: '#C53030', icon: '🔒' },
          ].map(k => (
            <div key={k.label} style={{
              background: 'white',
              border: '1.5px solid #EBEBEA',
              borderRadius: 14,
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}>
              <div style={{ fontSize: 28 }}>{k.icon}</div>
              <div>
                <div style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 32,
                  fontWeight: 800,
                  color: k.color,
                  lineHeight: 1,
                }}>
                  {k.value}
                </div>
                <div style={{ fontSize: 13, color: '#9E9E9B', marginTop: 4 }}>{k.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Table card */}
        <div style={{
          background: 'white',
          border: '1.5px solid #EBEBEA',
          borderRadius: 16,
          overflow: 'hidden',
        }}>

          {/* Toolbar */}
          <div style={{
            padding: '16px 24px',
            borderBottom: '1px solid #EBEBEA',
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}>
            <input
              placeholder="🔍  Rechercher par nom ou email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={inputStyle}
            />

            <div style={{ display: 'flex', gap: 6 }}>
              {(['all', 'active', 'blocked'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'Syne, sans-serif',
                    fontSize: 13,
                    fontWeight: 600,
                    background: filter === f ? '#0A7C6E' : '#F5F5F3',
                    color: filter === f ? 'white' : '#5C5C59',
                    transition: 'background 0.15s',
                  }}
                >
                  {f === 'all' ? 'Tous' : f === 'active' ? 'Accès actif' : 'Accès bloqué'}
                </button>
              ))}
            </div>

            <div style={{ marginLeft: 'auto', fontSize: 13, color: '#9E9E9B' }}>
              {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #EBEBEA' }}>
                  {['Utilisateur', 'Email', 'Clinique', 'Inscription', 'Accès', 'Rôle'].map(col => (
                    <th
                      key={col}
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontFamily: 'Syne, sans-serif',
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#9E9E9B',
                        letterSpacing: '0.07em',
                        textTransform: 'uppercase' as const,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: '56px 24px',
                        textAlign: 'center',
                        color: '#9E9E9B',
                        fontSize: 14,
                        fontFamily: 'DM Sans, sans-serif',
                      }}
                    >
                      Aucun utilisateur trouvé
                    </td>
                  </tr>
                ) : (
                  filtered.map(profile => {
                    const initials =
                      [profile.first_name?.[0], profile.last_name?.[0]]
                        .filter(Boolean)
                        .join('')
                        .toUpperCase() || '?'

                    const fullName =
                      [profile.first_name, profile.last_name].filter(Boolean).join(' ') || '—'

                    const clinicRow = Array.isArray(profile.clinics) ? profile.clinics[0] : profile.clinics
                    const clinicName = clinicRow?.name || '—'

                    const date = new Date(profile.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })

                    return (
                      <tr
                        key={profile.id}
                        style={{ borderBottom: '1px solid #F5F5F3' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#FAFAF8')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                      >
                        {/* Avatar + nom */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: '50%',
                              background: 'linear-gradient(135deg, #0A7C6E, #0D9E8D)',
                              color: 'white',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700,
                              flexShrink: 0,
                            }}>
                              {initials}
                            </div>
                            <span style={{
                              fontFamily: 'Syne, sans-serif',
                              fontSize: 14,
                              fontWeight: 600,
                              color: '#141412',
                              whiteSpace: 'nowrap',
                            }}>
                              {fullName}
                            </span>
                          </div>
                        </td>

                        {/* Email */}
                        <td style={{ padding: '14px 16px', fontSize: 13, color: '#5C5C59' }}>
                          {profile.email || '—'}
                        </td>

                        {/* Clinique */}
                        <td style={{ padding: '14px 16px', fontSize: 13, color: '#5C5C59' }}>
                          {clinicName}
                        </td>

                        {/* Date */}
                        <td style={{
                          padding: '14px 16px',
                          fontSize: 13,
                          color: '#9E9E9B',
                          whiteSpace: 'nowrap',
                        }}>
                          {date}
                        </td>

                        {/* Toggle has_paid */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button
                              onClick={() => toggleAccess(profile)}
                              title={profile.has_paid ? 'Désactiver l\'accès' : 'Activer l\'accès'}
                              style={{
                                width: 48,
                                height: 26,
                                borderRadius: 13,
                                border: 'none',
                                cursor: 'pointer',
                                background: profile.has_paid ? '#0A7C6E' : '#D4D4D2',
                                position: 'relative',
                                transition: 'background 0.2s',
                                flexShrink: 0,
                              }}
                            >
                              <div style={{
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                background: 'white',
                                position: 'absolute',
                                top: 3,
                                left: profile.has_paid ? 25 : 3,
                                transition: 'left 0.2s',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                              }} />
                            </button>
                            <span style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: profile.has_paid ? '#0A7C6E' : '#9E9E9B',
                              fontFamily: 'Syne, sans-serif',
                            }}>
                              {profile.has_paid ? 'ON' : 'OFF'}
                            </span>
                          </div>
                        </td>

                        {/* Rôle */}
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: 100,
                            fontFamily: 'Syne, sans-serif',
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            background: profile.role === 'support' ? '#FFF8E7' : '#F5F5F3',
                            color: profile.role === 'support' ? '#92590A' : '#5C5C59',
                            border: profile.role === 'support'
                              ? '1px solid #F5A623'
                              : '1px solid #EBEBEA',
                          }}>
                            {profile.role === 'support' ? 'Support' : 'Client'}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {filtered.length > 0 && (
            <div style={{
              padding: '12px 24px',
              borderTop: '1px solid #F5F5F3',
              fontSize: 12,
              color: '#C8C8C6',
              fontFamily: 'DM Sans, sans-serif',
            }}>
              Les rôles ne peuvent être modifiés que via Supabase Table Editor.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
