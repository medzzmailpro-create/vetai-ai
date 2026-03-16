'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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
  clinics: { name: string } | null
}

type Clinic = {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  opening_hours: string | null
  clinic_type: string | null
  owner_user_id: string | null
  created_at: string
  owner?: Profile | null
  members?: Profile[]
}

type Filter = 'all' | 'active' | 'blocked'
type Tab = 'users' | 'clinics'

type KeyForm = {
  clinicName: string
  retellAgentId: string
  twilioPhone: string
  twilioAccountSid: string
  n8nWebhookUrl: string
  calendarId: string
}

type UserForm = {
  email: string
  password: string
  first_name: string
  last_name: string
  role: 'client' | 'support'
}

export default function AdminPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('users')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [expandedClinic, setExpandedClinic] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'user' | 'clinic'; id: string; label: string } | null>(null)
  const [showKeyForm, setShowKeyForm] = useState(false)
  const [keyForm, setKeyForm] = useState<KeyForm>({ clinicName: '', retellAgentId: '', twilioPhone: '', twilioAccountSid: '', n8nWebhookUrl: '', calendarId: '' })
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [keyLoading, setKeyLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showUserForm, setShowUserForm] = useState(false)
  const [userForm, setUserForm] = useState<UserForm>({ email: '', password: '', first_name: '', last_name: '', role: 'client' })
  const [userLoading, setUserLoading] = useState(false)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const loadProfiles = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, phone, clinic_id, has_paid, role, created_at')
      .order('created_at', { ascending: false })
    if (error) { showToast('Erreur chargement profils.', 'error'); setLoading(false); return }
    const clinicIds = Array.from(new Set((data ?? []).map((p: any) => p.clinic_id).filter(Boolean)))
    let clinicMap: Record<string, string> = {}
    if (clinicIds.length > 0) {
      const { data: cd } = await supabase.from('clinics').select('id, name').in('id', clinicIds)
      cd?.forEach((c: any) => { clinicMap[c.id] = c.name })
    }
    setProfiles((data ?? []).map((p: any) => ({ ...p, clinics: p.clinic_id ? { name: clinicMap[p.clinic_id] ?? '—' } : null })) as Profile[])
    setLoading(false)
  }, [])

  const loadClinics = useCallback(async () => {
    const { data, error } = await supabase
      .from('clinics')
      .select('id, name, email, phone, address, opening_hours, clinic_type, owner_user_id, created_at')
      .order('created_at', { ascending: false })
    if (error) { showToast('Erreur chargement cliniques.', 'error'); return }

    const ownerIds = Array.from(new Set((data ?? []).map((c: any) => c.owner_user_id).filter(Boolean)))
    let ownerMap: Record<string, Profile> = {}
    if (ownerIds.length > 0) {
      const { data: owners } = await supabase.from('profiles').select('id, first_name, last_name, email, phone').in('id', ownerIds)
      owners?.forEach((o: any) => { ownerMap[o.id] = o })
    }

    const { data: allMembers } = await supabase.from('profiles').select('id, first_name, last_name, email, phone, clinic_id, has_paid, role, created_at').not('clinic_id', 'is', null)

    const enriched = (data ?? []).map((c: any) => ({
      ...c,
      owner: c.owner_user_id ? ownerMap[c.owner_user_id] ?? null : null,
      members: (allMembers ?? []).filter((m: any) => m.clinic_id === c.id),
    }))
    setClinics(enriched as Clinic[])
  }, [])

  useEffect(() => {
    loadProfiles()
    loadClinics()
    const channel = supabase.channel('admin-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => { loadProfiles(); loadClinics() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadProfiles, loadClinics])

  const toggleAccess = async (profile: Profile) => {
    const newValue = !profile.has_paid
    setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, has_paid: newValue } : p))
    const { error } = await supabase.from('profiles').update({ has_paid: newValue }).eq('id', profile.id)
    if (error) { setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, has_paid: !newValue } : p)); showToast('Erreur mise à jour.', 'error'); return }
    const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email || 'cet utilisateur'
    showToast(newValue ? `Accès activé pour ${name} ✓` : `Accès désactivé pour ${name}`, 'success')
  }

  const deleteUser = async (id: string) => {
    const res = await fetch('/api/admin/delete-user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    if (!res.ok) { showToast('Erreur suppression.', 'error'); return }
    setProfiles(prev => prev.filter(p => p.id !== id))
    showToast('Compte supprimé ✓', 'success')
    setConfirmDelete(null)
    loadClinics()
  }

  const deleteClinic = async (id: string) => {
    // Réinitialise les membres (clinic_id = null, onboarding_completed = false)
    await supabase.from('profiles').update({ clinic_id: null, onboarding_completed: false, has_paid: false }).eq('clinic_id', id)
    await supabase.from('clinics').delete().eq('id', id)
    showToast('Clinique supprimée — utilisateurs redirigés vers l\'onboarding ✓', 'success')
    setConfirmDelete(null)
    loadClinics()
    loadProfiles()
  }

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/') }

  const generateKeyString = (clinicName: string) => {
    const slug = clinicName.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    return `VETAI-${slug}-${Math.floor(Math.random() * 90 + 10)}`
  }

  const handleCreateKey = async () => {
    if (!keyForm.clinicName.trim()) { showToast('Nom requis.', 'error'); return }
    setKeyLoading(true); setGeneratedKey(null)
    const key = generateKeyString(keyForm.clinicName)
    const { error } = await supabase.from('activation_keys').insert({ key, agent_type: 'phone', plan: 'full', retell_agent_id: keyForm.retellAgentId || null, twilio_phone: keyForm.twilioPhone || null, twilio_account_sid: keyForm.twilioAccountSid || null, n8n_webhook_url: keyForm.n8nWebhookUrl || null, calendar_id: keyForm.calendarId || null, is_used: false })
    setKeyLoading(false)
    if (error) { showToast(`Erreur : ${error.message}`, 'error'); return }
    setGeneratedKey(key)
    setKeyForm({ clinicName: '', retellAgentId: '', twilioPhone: '', twilioAccountSid: '', n8nWebhookUrl: '', calendarId: '' })
    showToast('Clé créée ✓', 'success')
  }

  const handleCreateUser = async () => {
    if (!userForm.email.trim() || !userForm.password.trim()) { showToast('Email et mot de passe requis.', 'error'); return }
    setUserLoading(true)
    const res = await fetch('/api/admin/create-user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userForm) })
    const json = await res.json()
    setUserLoading(false)
    if (!res.ok) { showToast(`Erreur : ${json.error}`, 'error'); return }
    showToast(`Compte créé pour ${userForm.email} ✓`, 'success')
    setUserForm({ email: '', password: '', first_name: '', last_name: '', role: 'client' })
    setShowUserForm(false)
    loadProfiles()
  }

  const filtered = profiles.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !q || p.first_name?.toLowerCase().includes(q) || p.last_name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q)
    const matchFilter = filter === 'all' || (filter === 'active' && p.has_paid) || (filter === 'blocked' && !p.has_paid)
    return matchSearch && matchFilter
  })

  const total = profiles.length
  const active = profiles.filter(p => p.has_paid).length
  const blocked = profiles.filter(p => !p.has_paid).length

  const inputStyle: React.CSSProperties = { padding: '9px 14px', border: '1.5px solid #D4D4D2', borderRadius: 8, fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#2A2A28', background: '#F5F5F3', outline: 'none', width: '100%', boxSizing: 'border-box' }
  const fieldStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 }
  const labelStyle: React.CSSProperties = { fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700, color: '#9E9E9B', letterSpacing: '0.07em', textTransform: 'uppercase' }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F3' }}>
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, color: '#9E9E9B' }}>Chargement…</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F3', fontFamily: 'DM Sans, sans-serif' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast.type === 'success' ? '#0A7C6E' : '#C53030', color: 'white', padding: '12px 20px', borderRadius: 10, fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
          {toast.message}
        </div>
      )}

      {/* Modal confirmation suppression */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 32, maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>⚠️</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 800, color: '#141412', marginBottom: 10 }}>
              {confirmDelete.type === 'clinic' ? 'Supprimer la clinique ?' : 'Supprimer ce compte ?'}
            </div>
            <p style={{ fontSize: 14, color: '#5C5C59', lineHeight: 1.6, marginBottom: 24 }}>
              {confirmDelete.type === 'clinic'
                ? `La clinique "${confirmDelete.label}" sera supprimée. Les utilisateurs garderont leur accès mais seront redirigés vers l'onboarding.`
                : `Le compte "${confirmDelete.label}" sera définitivement supprimé.`}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => confirmDelete.type === 'user' ? deleteUser(confirmDelete.id) : deleteClinic(confirmDelete.id)} style={{ flex: 1, padding: '12px', background: '#C53030', border: 'none', borderRadius: 9, color: 'white', fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Supprimer
              </button>
              <button onClick={() => setConfirmDelete(null)} style={{ padding: '12px 20px', background: 'none', border: '1.5px solid #D4D4D2', borderRadius: 9, fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 600, color: '#5C5C59', cursor: 'pointer' }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal création utilisateur */}
      {showUserForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 32, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, color: '#141412', marginBottom: 24 }}>👤 Créer un compte</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={fieldStyle}><label style={labelStyle}>Prénom</label><input style={inputStyle} placeholder="Jean" value={userForm.first_name} onChange={e => setUserForm(f => ({ ...f, first_name: e.target.value }))} /></div>
                <div style={fieldStyle}><label style={labelStyle}>Nom</label><input style={inputStyle} placeholder="Dupont" value={userForm.last_name} onChange={e => setUserForm(f => ({ ...f, last_name: e.target.value }))} /></div>
              </div>
              <div style={fieldStyle}><label style={labelStyle}>Email *</label><input style={inputStyle} placeholder="jean@clinique.fr" type="email" value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div style={fieldStyle}><label style={labelStyle}>Mot de passe *</label><input style={inputStyle} placeholder="Min. 8 caractères" type="password" value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} /></div>
              <div style={fieldStyle}><label style={labelStyle}>Rôle</label>
                <select style={inputStyle} value={userForm.role} onChange={e => setUserForm(f => ({ ...f, role: e.target.value as 'client' | 'support' }))}>
                  <option value="client">Client</option>
                  <option value="support">Support</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={handleCreateUser} disabled={userLoading} style={{ flex: 1, padding: '12px', background: userLoading ? '#D4D4D2' : '#0A7C6E', border: 'none', borderRadius: 9, color: 'white', fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, cursor: userLoading ? 'not-allowed' : 'pointer' }}>
                {userLoading ? 'Création…' : 'Créer le compte'}
              </button>
              <button onClick={() => setShowUserForm(false)} style={{ padding: '12px 20px', background: 'none', border: '1.5px solid #D4D4D2', borderRadius: 9, fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 600, color: '#5C5C59', cursor: 'pointer' }}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{ background: 'white', borderBottom: '1.5px solid #EBEBEA', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: '#0A7C6E', display: 'flex', alignItems: 'center', gap: 6 }}>
            Vetai.AI<div style={{ width: 7, height: 7, background: '#F5A623', borderRadius: '50%' }} />
          </div>
          <div style={{ width: 1, height: 28, background: '#EBEBEA' }} />
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, color: '#141412' }}>🛡️ Panel Support</div>
          <div style={{ background: '#FFF8E7', border: '1px solid #F5A623', borderRadius: 100, padding: '4px 12px', fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700, color: '#92590A', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Accès restreint — Support uniquement
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={() => setShowUserForm(true)} style={{ padding: '8px 16px', background: '#0A7C6E', border: 'none', borderRadius: 8, fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: 'white', cursor: 'pointer' }}>+ Créer un compte</button>
          <button onClick={handleLogout} style={{ padding: '8px 16px', background: 'none', border: '1.5px solid #D4D4D2', borderRadius: 8, fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, color: '#5C5C59', cursor: 'pointer' }}>Se déconnecter</button>
        </div>
      </header>

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>

        {/* KPI */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {[{ label: 'Total utilisateurs', value: total, color: '#0A7C6E', icon: '👥' }, { label: 'Accès actifs', value: active, color: '#38A169', icon: '✅' }, { label: 'Accès bloqués', value: blocked, color: '#C53030', icon: '🔒' }].map(k => (
            <div key={k.label} style={{ background: 'white', border: '1.5px solid #EBEBEA', borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 28 }}>{k.icon}</div>
              <div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</div>
                <div style={{ fontSize: 13, color: '#9E9E9B', marginTop: 4 }}>{k.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Clé d'activation */}
        <div style={{ background: 'white', border: '1.5px solid #EBEBEA', borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
          <div onClick={() => setShowKeyForm(!showKeyForm)} style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderBottom: showKeyForm ? '1px solid #EBEBEA' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>🔑</span>
              <div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 800, color: '#141412' }}>Créer une clé d'activation</div>
                <div style={{ fontSize: 12, color: '#9E9E9B', marginTop: 2 }}>Génère une clé pour une clinique — elle active tous les agents d'un coup</div>
              </div>
            </div>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#F5F5F3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#5C5C59', transform: showKeyForm ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</div>
          </div>
          {showKeyForm && (
            <div style={{ padding: '24px' }}>
              {generatedKey && (
                <div style={{ background: '#F0FDF8', border: '1.5px solid #0A7C6E', borderRadius: 12, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#0A7C6E', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>✅ Clé générée</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, color: '#141412' }}>{generatedKey}</div>
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(generatedKey); setCopied(true); setTimeout(() => setCopied(false), 2000) }} style={{ padding: '10px 20px', background: copied ? '#38A169' : '#0A7C6E', border: 'none', borderRadius: 8, color: 'white', fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{copied ? '✓ Copié !' : 'Copier'}</button>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Nom de la clinique *</label>
                  <input style={inputStyle} placeholder="Ex: Clinique Vétérinaire Nantes Centre" value={keyForm.clinicName} onChange={e => setKeyForm(f => ({ ...f, clinicName: e.target.value }))} />
                  {keyForm.clinicName && <div style={{ fontSize: 11, color: '#9E9E9B', marginTop: 2 }}>Clé : <strong>{generateKeyString(keyForm.clinicName)}</strong></div>}
                </div>
                <div style={fieldStyle}><label style={labelStyle}>Retell Agent ID</label><input style={inputStyle} placeholder="agent_abc123..." value={keyForm.retellAgentId} onChange={e => setKeyForm(f => ({ ...f, retellAgentId: e.target.value }))} /></div>
                <div style={fieldStyle}><label style={labelStyle}>Numéro Twilio</label><input style={inputStyle} placeholder="+33612345678" value={keyForm.twilioPhone} onChange={e => setKeyForm(f => ({ ...f, twilioPhone: e.target.value }))} /></div>
                <div style={fieldStyle}><label style={labelStyle}>Twilio Account SID</label><input style={inputStyle} placeholder="ACxxxxxxxxxx" value={keyForm.twilioAccountSid} onChange={e => setKeyForm(f => ({ ...f, twilioAccountSid: e.target.value }))} /></div>
                <div style={fieldStyle}><label style={labelStyle}>Google Calendar ID</label><input style={inputStyle} placeholder="xyz@group.calendar.google.com" value={keyForm.calendarId} onChange={e => setKeyForm(f => ({ ...f, calendarId: e.target.value }))} /></div>
                <div style={{ ...fieldStyle, gridColumn: '1 / -1' }}><label style={labelStyle}>Webhook n8n</label><input style={inputStyle} placeholder="https://n8n.vetai.fr/webhook/..." value={keyForm.n8nWebhookUrl} onChange={e => setKeyForm(f => ({ ...f, n8nWebhookUrl: e.target.value }))} /></div>
              </div>
              <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                <button onClick={handleCreateKey} disabled={keyLoading || !keyForm.clinicName.trim()} style={{ padding: '11px 28px', background: keyLoading || !keyForm.clinicName.trim() ? '#D4D4D2' : '#0A7C6E', border: 'none', borderRadius: 9, color: 'white', fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, cursor: keyLoading || !keyForm.clinicName.trim() ? 'not-allowed' : 'pointer' }}>{keyLoading ? 'Création…' : '🔑 Générer la clé'}</button>
                <button onClick={() => { setShowKeyForm(false); setGeneratedKey(null) }} style={{ padding: '11px 20px', background: 'none', border: '1.5px solid #D4D4D2', borderRadius: 9, fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 600, color: '#5C5C59', cursor: 'pointer' }}>Fermer</button>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {([['users', '👥 Utilisateurs'], ['clinics', '🏥 Cliniques']] as const).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, background: tab === t ? '#0A7C6E' : 'white', color: tab === t ? 'white' : '#5C5C59', border: tab === t ? 'none' : '1.5px solid #EBEBEA' }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── TAB UTILISATEURS ── */}
        {tab === 'users' && (
          <div style={{ background: 'white', border: '1.5px solid #EBEBEA', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #EBEBEA', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <input placeholder="🔍  Rechercher par nom ou email…" value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, width: 280 }} />
              <div style={{ display: 'flex', gap: 6 }}>
                {(['all', 'active', 'blocked'] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, background: filter === f ? '#0A7C6E' : '#F5F5F3', color: filter === f ? 'white' : '#5C5C59' }}>
                    {f === 'all' ? 'Tous' : f === 'active' ? 'Accès actif' : 'Accès bloqué'}
                  </button>
                ))}
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 13, color: '#9E9E9B' }}>{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #EBEBEA' }}>
                    {['Utilisateur', 'Email', 'Téléphone', 'Clinique', 'Inscription', 'Accès', 'Rôle', ''].map(col => (
                      <th key={col} style={{ padding: '12px 16px', textAlign: 'left', fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700, color: '#9E9E9B', letterSpacing: '0.07em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} style={{ padding: '56px 24px', textAlign: 'center', color: '#9E9E9B', fontSize: 14 }}>Aucun utilisateur trouvé</td></tr>
                  ) : filtered.map(profile => {
                    const initials = [profile.first_name?.[0], profile.last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?'
                    const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || '—'
                    const clinicName = profile.clinics?.name || '—'
                    const date = new Date(profile.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                    return (
                      <tr key={profile.id} style={{ borderBottom: '1px solid #F5F5F3' }} onMouseEnter={e => (e.currentTarget.style.background = '#FAFAF8')} onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #0A7C6E, #0D9E8D)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{initials}</div>
                            <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 600, color: '#141412', whiteSpace: 'nowrap' }}>{fullName}</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 13, color: '#5C5C59' }}>{profile.email || '—'}</td>
                        <td style={{ padding: '14px 16px', fontSize: 13, color: '#5C5C59' }}>{profile.phone || '—'}</td>
                        <td style={{ padding: '14px 16px', fontSize: 13, color: '#5C5C59' }}>{clinicName}</td>
                        <td style={{ padding: '14px 16px', fontSize: 13, color: '#9E9E9B', whiteSpace: 'nowrap' }}>{date}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button onClick={() => toggleAccess(profile)} style={{ width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', background: profile.has_paid ? '#0A7C6E' : '#D4D4D2', position: 'relative', flexShrink: 0 }}>
                              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: profile.has_paid ? 25 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                            </button>
                            <span style={{ fontSize: 12, fontWeight: 600, color: profile.has_paid ? '#0A7C6E' : '#9E9E9B', fontFamily: 'Syne, sans-serif' }}>{profile.has_paid ? 'ON' : 'OFF'}</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 100, fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', background: profile.role === 'support' ? '#FFF8E7' : '#F5F5F3', color: profile.role === 'support' ? '#92590A' : '#5C5C59', border: profile.role === 'support' ? '1px solid #F5A623' : '1px solid #EBEBEA' }}>
                            {profile.role === 'support' ? 'Support' : 'Client'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <button onClick={() => setConfirmDelete({ type: 'user', id: profile.id, label: [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email || profile.id })} style={{ padding: '6px 12px', background: '#FFF5F5', border: '1px solid #FEB2B2', borderRadius: 7, color: '#C53030', fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                            🗑 Supprimer
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB CLINIQUES ── */}
        {tab === 'clinics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {clinics.length === 0 ? (
              <div style={{ background: 'white', border: '1.5px solid #EBEBEA', borderRadius: 16, padding: '56px 24px', textAlign: 'center', color: '#9E9E9B', fontSize: 14 }}>Aucune clinique trouvée</div>
            ) : clinics.map(clinic => (
              <div key={clinic.id} style={{ background: 'white', border: '1.5px solid #EBEBEA', borderRadius: 16, overflow: 'hidden' }}>
                {/* Header clinique */}
                <div onClick={() => setExpandedClinic(expandedClinic === clinic.id ? null : clinic.id)} style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderBottom: expandedClinic === clinic.id ? '1px solid #EBEBEA' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #0A7C6E, #0D9E8D)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏥</div>
                    <div>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 800, color: '#141412' }}>{clinic.name}</div>
                      <div style={{ fontSize: 12, color: '#9E9E9B', marginTop: 2 }}>{clinic.members?.length ?? 0} membre{(clinic.members?.length ?? 0) !== 1 ? 's' : ''} · créée le {new Date(clinic.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button onClick={e => { e.stopPropagation(); setConfirmDelete({ type: 'clinic', id: clinic.id, label: clinic.name }) }} style={{ padding: '6px 12px', background: '#FFF5F5', border: '1px solid #FEB2B2', borderRadius: 7, color: '#C53030', fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      🗑 Supprimer
                    </button>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#F5F5F3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#5C5C59', transform: expandedClinic === clinic.id ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</div>
                  </div>
                </div>

                {/* Contenu déplié */}
                {expandedClinic === clinic.id && (
                  <div style={{ padding: '24px' }}>

                    {/* Infos clinique */}
                    <div style={{ background: '#F5F5F3', borderRadius: 12, padding: '20px', marginBottom: 24 }}>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700, color: '#9E9E9B', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 14 }}>Informations de la clinique</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                        {[
                          { label: 'Propriétaire', value: clinic.owner ? `${clinic.owner.first_name ?? ''} ${clinic.owner.last_name ?? ''}`.trim() || '—' : '—' },
                          { label: 'Email', value: clinic.email || '—' },
                          { label: 'Téléphone', value: clinic.phone || '—' },
                          { label: 'Adresse', value: clinic.address || '—' },
                          { label: 'Horaires', value: clinic.opening_hours || '—' },
                          { label: 'Type', value: clinic.clinic_type || '—' },
                        ].map(item => (
                          <div key={item.label}>
                            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700, color: '#9E9E9B', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</div>
                            <div style={{ fontSize: 14, color: '#141412', fontWeight: 500 }}>{item.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Membres */}
                    <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700, color: '#9E9E9B', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>Membres ({clinic.members?.length ?? 0})</div>
                    {!clinic.members?.length ? (
                      <div style={{ fontSize: 13, color: '#9E9E9B', padding: '20px 0' }}>Aucun membre</div>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #EBEBEA' }}>
                            {['Utilisateur', 'Email', 'Téléphone', 'Rôle', 'Accès', ''].map(col => (
                              <th key={col} style={{ padding: '10px 12px', textAlign: 'left', fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700, color: '#9E9E9B', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {clinic.members.map(member => {
                            const initials = [member.first_name?.[0], member.last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?'
                            const fullName = [member.first_name, member.last_name].filter(Boolean).join(' ') || '—'
                            return (
                              <tr key={member.id} style={{ borderBottom: '1px solid #F5F5F3' }}>
                                <td style={{ padding: '12px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #0A7C6E, #0D9E8D)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700 }}>{initials}</div>
                                    <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, color: '#141412' }}>{fullName}</span>
                                  </div>
                                </td>
                                <td style={{ padding: '12px', fontSize: 13, color: '#5C5C59' }}>{member.email || '—'}</td>
                                <td style={{ padding: '12px', fontSize: 13, color: '#5C5C59' }}>{member.phone || '—'}</td>
                                <td style={{ padding: '12px' }}>
                                  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 100, fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700, background: member.role === 'support' ? '#FFF8E7' : '#F5F5F3', color: member.role === 'support' ? '#92590A' : '#5C5C59', border: member.role === 'support' ? '1px solid #F5A623' : '1px solid #EBEBEA' }}>
                                    {member.role === 'support' ? 'Support' : 'Client'}
                                  </span>
                                </td>
                                <td style={{ padding: '12px' }}>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: member.has_paid ? '#0A7C6E' : '#9E9E9B', fontFamily: 'Syne, sans-serif' }}>{member.has_paid ? '✅ ON' : '❌ OFF'}</span>
                                </td>
                                <td style={{ padding: '12px' }}>
                                  <button onClick={() => setConfirmDelete({ type: 'user', id: member.id, label: fullName })} style={{ padding: '5px 10px', background: '#FFF5F5', border: '1px solid #FEB2B2', borderRadius: 7, color: '#C53030', fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                                    🗑 Supprimer
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}