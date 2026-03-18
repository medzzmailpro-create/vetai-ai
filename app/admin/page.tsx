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

type ClinicConfig = {
  clinic_name: string | null
  address: string | null
  phone: string | null
  email: string | null
  hours: string | null
  clinic_type: string | null
  transfert_enabled: boolean
  transfert_number: string | null
  duree_rdv: number | null
  buffer_rdv: number | null
}

type Filter = 'all' | 'active' | 'blocked'
type Tab = 'users' | 'clinics'
type SortOption = 'name' | 'date_asc' | 'date_desc'

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

const CLINIC_TYPES = ['Vétérinaire généraliste', "Clinique d'urgence", 'Clinique spécialisée', 'Autre']

export default function AdminPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('users')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [expandedClinic, setExpandedClinic] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [userSort, setUserSort] = useState<SortOption>('date_desc')
  const [clinicSearch, setClinicSearch] = useState('')
  const [clinicSort, setClinicSort] = useState<SortOption>('date_desc')
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
  const [configPopup, setConfigPopup] = useState<{ clinicName: string; clinicId: string; config: ClinicConfig; configUserId: string } | null>(null)
  const [configLoading, setConfigLoading] = useState(false)
  const [editConfig, setEditConfig] = useState<ClinicConfig | null>(null)
  const [savingConfig, setSavingConfig] = useState(false)

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
    // Listen for changes to profiles, clinics, and clinic_config so admin view
    // stays in sync when a dashboard user saves their configuration.
    const channel = supabase.channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => { loadProfiles(); loadClinics() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clinics' }, () => { loadClinics() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clinic_config' }, () => { loadClinics() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadProfiles, loadClinics])

  const openConfigPopup = async (clinic: Clinic) => {
    setConfigLoading(true)
    const memberIds = clinic.members?.map(m => m.id) ?? []
    if (clinic.owner_user_id) memberIds.push(clinic.owner_user_id)
    const { data } = await supabase
      .from('clinic_config')
      .select('*')
      .in('user_id', memberIds)
      .limit(1)
      .single()
    setConfigLoading(false)
    if (!data) { showToast('Aucune configuration renseignée.', 'error'); return }
    const configData: ClinicConfig = {
      clinic_name: data.clinic_name,
      address: data.address,
      phone: data.phone,
      email: data.email,
      hours: data.hours,
      clinic_type: data.clinic_type,
      transfert_enabled: data.transfert_enabled,
      transfert_number: data.transfert_number,
      duree_rdv: data.duree_rdv,
      buffer_rdv: data.buffer_rdv,
    }
    setConfigPopup({ clinicName: clinic.name, clinicId: clinic.id, configUserId: data.user_id, config: configData })
    setEditConfig(configData)
  }

  const handleSaveConfig = async () => {
    if (!configPopup || !editConfig) return
    setSavingConfig(true)
    const errors: string[] = []

    // 1. Mise à jour clinic_config
    const { error: cfgErr } = await supabase.from('clinic_config').update({
      clinic_name: editConfig.clinic_name,
      address: editConfig.address,
      phone: editConfig.phone,
      email: editConfig.email,
      hours: editConfig.hours,
      clinic_type: editConfig.clinic_type,
      transfert_enabled: editConfig.transfert_enabled,
      transfert_number: editConfig.transfert_number,
      duree_rdv: editConfig.duree_rdv,
      buffer_rdv: editConfig.buffer_rdv,
      updated_at: new Date().toISOString(),
    }).eq('user_id', configPopup.configUserId)
    if (cfgErr) errors.push(cfgErr.message)

    // 2. Synchronise aussi la table clinics
    const clinicTypeMap: Record<string, string> = {
      'Vétérinaire généraliste': 'general',
      "Clinique d'urgence": 'emergency',
      'Clinique spécialisée': 'specialized',
      'Autre': 'other',
    }
    const clinicTypeEnum = clinicTypeMap[editConfig.clinic_type ?? ''] ?? 'general'
    const clinicPatch = {
      name: editConfig.clinic_name,
      address: editConfig.address,
      phone: editConfig.phone,
      email: editConfig.email,
      opening_hours: editConfig.hours,
      clinic_type: clinicTypeEnum,
    }
    console.log('[Admin] PATCH clinics →', { clinicId: configPopup.clinicId, payload: clinicPatch })
    const { data: clinicPatchResult, error: clinicErr } = await supabase.from('clinics').update(clinicPatch).eq('id', configPopup.clinicId).select()
    console.log('[Admin] PATCH clinics ←', { data: clinicPatchResult, error: clinicErr })
    if (clinicErr) errors.push(clinicErr.message)

    setSavingConfig(false)
    if (errors.length) { showToast('Erreur sauvegarde.', 'error'); return }
    setConfigPopup(prev => prev ? { ...prev, config: editConfig } : null)
    showToast('Configuration mise à jour ✓', 'success')
    loadClinics()
  }

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
    await supabase.from('profiles').update({ clinic_id: null, onboarding_completed: false, has_paid: false }).eq('clinic_id', id)
    await supabase.from('ai_agents').delete().eq('clinic_id', id)
    await supabase.from('clinics').delete().eq('id', id)
    showToast('Clinique supprimée ✓', 'success')
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

  const filtered = profiles
    .filter(p => {
      const q = search.toLowerCase()
      const matchSearch = !q || p.first_name?.toLowerCase().includes(q) || p.last_name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q)
      const matchFilter = filter === 'all' || (filter === 'active' && p.has_paid) || (filter === 'blocked' && !p.has_paid)
      return matchSearch && matchFilter
    })
    .sort((a, b) => {
      if (userSort === 'name') return ([a.first_name, a.last_name].filter(Boolean).join(' ')).localeCompare([b.first_name, b.last_name].filter(Boolean).join(' '))
      if (userSort === 'date_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const filteredClinics = clinics
    .filter(c => !clinicSearch || c.name?.toLowerCase().includes(clinicSearch.toLowerCase()))
    .sort((a, b) => {
      if (clinicSort === 'name') return (a.name ?? '').localeCompare(b.name ?? '')
      if (clinicSort === 'date_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
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

      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast.type === 'success' ? '#0A7C6E' : '#C53030', color: 'white', padding: '12px 20px', borderRadius: 10, fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
          {toast.message}
        </div>
      )}

      {/* ── POPUP CONFIG ── */}
      {configPopup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 32, maxWidth: 640, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, color: '#141412' }}>⚙️ Configuration — {configPopup.clinicName}</div>
              <button onClick={() => setConfigPopup(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9E9E9B' }}>✕</button>
            </div>

            {/* 🏥 Infos clinique - MODIFIABLE */}
            <div style={{ background: '#F5F5F3', borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700, color: '#9E9E9B', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 16 }}>🏥 Informations de la clinique</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={labelStyle}>Nom de la clinique</div>
                  <input style={{ ...inputStyle, marginTop: 6 }} value={editConfig?.clinic_name ?? ''} onChange={e => setEditConfig(c => c ? { ...c, clinic_name: e.target.value } : c)} placeholder="Clinique Vétérinaire du Parc" />
                </div>
                <div>
                  <div style={labelStyle}>Type</div>
                  <select style={{ ...inputStyle, marginTop: 6 }} value={editConfig?.clinic_type ?? ''} onChange={e => setEditConfig(c => c ? { ...c, clinic_type: e.target.value } : c)}>
                    {CLINIC_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <div style={labelStyle}>Téléphone</div>
                  <input style={{ ...inputStyle, marginTop: 6 }} value={editConfig?.phone ?? ''} onChange={e => setEditConfig(c => c ? { ...c, phone: e.target.value } : c)} placeholder="01 23 45 67 89" />
                </div>
                <div>
                  <div style={labelStyle}>Email</div>
                  <input style={{ ...inputStyle, marginTop: 6 }} value={editConfig?.email ?? ''} onChange={e => setEditConfig(c => c ? { ...c, email: e.target.value } : c)} placeholder="contact@clinique.fr" />
                </div>
                <div>
                  <div style={labelStyle}>Horaires</div>
                  <input style={{ ...inputStyle, marginTop: 6 }} value={editConfig?.hours ?? ''} onChange={e => setEditConfig(c => c ? { ...c, hours: e.target.value } : c)} placeholder="Lun–Ven 8h30–19h" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={labelStyle}>Adresse</div>
                  <input style={{ ...inputStyle, marginTop: 6 }} value={editConfig?.address ?? ''} onChange={e => setEditConfig(c => c ? { ...c, address: e.target.value } : c)} placeholder="12 rue des Vétérinaires, 75000 Paris" />
                </div>
              </div>
            </div>

            {/* 📞 Agent téléphonique - MODIFIABLE */}
            <div style={{ background: '#F5F5F3', borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700, color: '#9E9E9B', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 14 }}>📞 Agent téléphonique</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 14, color: '#141412', fontWeight: 500 }}>Transfert vers un humain</div>
                <div onClick={() => setEditConfig(e => e ? { ...e, transfert_enabled: !e.transfert_enabled } : e)} style={{ width: 42, height: 22, borderRadius: 11, background: editConfig?.transfert_enabled ? '#0A7C6E' : '#D4D4D2', position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s' }}>
                  <div style={{ position: 'absolute', top: 2, left: editConfig?.transfert_enabled ? 22 : 2, width: 18, height: 18, background: 'white', borderRadius: '50%', transition: 'left 0.2s' }} />
                </div>
              </div>
              {editConfig?.transfert_enabled && (
                <div>
                  <div style={labelStyle}>Numéro de transfert</div>
                  <input style={{ ...inputStyle, marginTop: 6 }} value={editConfig?.transfert_number ?? ''} onChange={e => setEditConfig(cfg => cfg ? { ...cfg, transfert_number: e.target.value } : cfg)} placeholder="06 12 34 56 78" />
                </div>
              )}
            </div>

            {/* 📅 Agent agenda - MODIFIABLE */}
            <div style={{ background: '#F5F5F3', borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700, color: '#9E9E9B', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 14 }}>📅 Agent agenda</div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ ...labelStyle, marginBottom: 6 }}>Durée par défaut d'un RDV : <strong style={{ color: '#0A7C6E' }}>{editConfig?.duree_rdv} min</strong></div>
                <input type="range" min={10} max={60} step={5} value={editConfig?.duree_rdv ?? 20} onChange={e => setEditConfig(cfg => cfg ? { ...cfg, duree_rdv: Number(e.target.value) } : cfg)} style={{ width: '100%', accentColor: '#0A7C6E' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9E9E9B', marginTop: 4 }}><span>10 min</span><span>60 min</span></div>
              </div>
              <div>
                <div style={{ ...labelStyle, marginBottom: 6 }}>Buffer entre deux RDV : <strong style={{ color: '#0A7C6E' }}>{editConfig?.buffer_rdv} min</strong></div>
                <input type="range" min={0} max={30} step={5} value={editConfig?.buffer_rdv ?? 5} onChange={e => setEditConfig(cfg => cfg ? { ...cfg, buffer_rdv: Number(e.target.value) } : cfg)} style={{ width: '100%', accentColor: '#0A7C6E' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9E9E9B', marginTop: 4 }}><span>0 min</span><span>30 min</span></div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={handleSaveConfig} disabled={savingConfig} style={{ flex: 1, padding: '12px', background: savingConfig ? '#D4D4D2' : '#0A7C6E', border: 'none', borderRadius: 9, color: 'white', fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, cursor: savingConfig ? 'not-allowed' : 'pointer' }}>
                {savingConfig ? 'Enregistrement…' : '💾 Enregistrer'}
              </button>
              <button onClick={() => setConfigPopup(null)} style={{ padding: '12px 20px', background: 'none', border: '1.5px solid #D4D4D2', borderRadius: 9, fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 600, color: '#5C5C59', cursor: 'pointer' }}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 32, maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>⚠️</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 800, color: '#141412', marginBottom: 10 }}>
              {confirmDelete.type === 'clinic' ? 'Supprimer la clinique ?' : 'Supprimer ce compte ?'}
            </div>
            <p style={{ fontSize: 14, color: '#5C5C59', lineHeight: 1.6, marginBottom: 24 }}>
              {confirmDelete.type === 'clinic'
                ? `La clinique "${confirmDelete.label}" sera supprimée. Les utilisateurs seront redirigés vers l'onboarding.`
                : `Le compte "${confirmDelete.label}" sera définitivement supprimé.`}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => confirmDelete.type === 'user' ? deleteUser(confirmDelete.id) : deleteClinic(confirmDelete.id)} style={{ flex: 1, padding: '12px', background: '#C53030', border: 'none', borderRadius: 9, color: 'white', fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Supprimer</button>
              <button onClick={() => setConfirmDelete(null)} style={{ padding: '12px 20px', background: 'none', border: '1.5px solid #D4D4D2', borderRadius: 9, fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 600, color: '#5C5C59', cursor: 'pointer' }}>Annuler</button>
            </div>
          </div>
        </div>
      )}

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

      <header style={{ background: 'white', borderBottom: '1.5px solid #EBEBEA', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: '#0A7C6E', display: 'flex', alignItems: 'center', gap: 6 }}>
            Vetai<div style={{ width: 7, height: 7, background: '#F5A623', borderRadius: '50%' }} />
          </div>
          <div style={{ width: 1, height: 28, background: '#EBEBEA' }} />
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, color: '#141412' }}>🛡️ Panel Support</div>
          <div style={{ background: '#FFF8E7', border: '1px solid #F5A623', borderRadius: 100, padding: '4px 12px', fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700, color: '#92590A', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Accès restreint — Support uniquement
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={() => setShowUserForm(true)} style={{ padding: '8px 16px', background: '#0A7C6E', border: 'none', borderRadius: 8, fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: 'white', cursor: 'pointer' }}>+ Créer un compte</button>
          <button onClick={() => router.push('/dashboard')} style={{ padding: '8px 16px', background: 'none', border: '1.5px solid #0A7C6E', borderRadius: 8, fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, color: '#0A7C6E', cursor: 'pointer' }}>← Dashboard</button>
          <button onClick={handleLogout} style={{ padding: '8px 16px', background: 'none', border: '1.5px solid #D4D4D2', borderRadius: 8, fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, color: '#5C5C59', cursor: 'pointer' }}>Se déconnecter</button>
        </div>
      </header>

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>

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

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {([['users', '👥 Utilisateurs'], ['clinics', '🏥 Cliniques']] as const).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '10px 20px', borderRadius: 10, border: tab === t ? 'none' : '1.5px solid #EBEBEA', cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, background: tab === t ? '#0A7C6E' : 'white', color: tab === t ? 'white' : '#5C5C59' }}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'users' && (
          <div style={{ background: 'white', border: '1.5px solid #EBEBEA', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #EBEBEA', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <input placeholder="🔍  Rechercher par nom ou email…" value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, width: 240 }} />
              <div style={{ display: 'flex', gap: 6 }}>
                {(['all', 'active', 'blocked'] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, background: filter === f ? '#0A7C6E' : '#F5F5F3', color: filter === f ? 'white' : '#5C5C59' }}>
                    {f === 'all' ? 'Tous' : f === 'active' ? 'Actif' : 'Bloqué'}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {([['date_desc', '🕐 Récent'], ['date_asc', '🕐 Ancien'], ['name', '🔤 Nom']] as const).map(([val, label]) => (
                  <button key={val} onClick={() => setUserSort(val)} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, background: userSort === val ? '#141412' : '#F5F5F3', color: userSort === val ? 'white' : '#5C5C59' }}>
                    {label}
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
                            🗑
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

        {tab === 'clinics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <input placeholder="🔍  Rechercher une clinique…" value={clinicSearch} onChange={e => setClinicSearch(e.target.value)} style={{ ...inputStyle, width: 260 }} />
              <div style={{ display: 'flex', gap: 6 }}>
                {([['date_desc', '🕐 Récent'], ['date_asc', '🕐 Ancien'], ['name', '🔤 Nom']] as const).map(([val, label]) => (
                  <button key={val} onClick={() => setClinicSort(val)} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, background: clinicSort === val ? '#141412' : '#F5F5F3', color: clinicSort === val ? 'white' : '#5C5C59' }}>
                    {label}
                  </button>
                ))}
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 13, color: '#9E9E9B' }}>{filteredClinics.length} clinique{filteredClinics.length !== 1 ? 's' : ''}</div>
            </div>

            {filteredClinics.length === 0 ? (
              <div style={{ background: 'white', border: '1.5px solid #EBEBEA', borderRadius: 16, padding: '56px 24px', textAlign: 'center', color: '#9E9E9B', fontSize: 14 }}>Aucune clinique trouvée</div>
            ) : filteredClinics.map(clinic => (
              <div key={clinic.id} style={{ background: 'white', border: '1.5px solid #EBEBEA', borderRadius: 16, overflow: 'hidden' }}>
                <div onClick={() => setExpandedClinic(expandedClinic === clinic.id ? null : clinic.id)} style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderBottom: expandedClinic === clinic.id ? '1px solid #EBEBEA' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #0A7C6E, #0D9E8D)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏥</div>
                    <div>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 800, color: '#141412' }}>{clinic.name}</div>
                      <div style={{ fontSize: 12, color: '#9E9E9B', marginTop: 2 }}>{clinic.members?.length ?? 0} membre{(clinic.members?.length ?? 0) !== 1 ? 's' : ''} · créée le {new Date(clinic.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button onClick={e => { e.stopPropagation(); openConfigPopup(clinic) }} disabled={configLoading} style={{ padding: '6px 12px', background: '#F0FDF8', border: '1px solid #0A7C6E', borderRadius: 7, color: '#0A7C6E', fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      ⚙️ Configuration
                    </button>
                    <button onClick={e => { e.stopPropagation(); setConfirmDelete({ type: 'clinic', id: clinic.id, label: clinic.name }) }} style={{ padding: '6px 12px', background: '#FFF5F5', border: '1px solid #FEB2B2', borderRadius: 7, color: '#C53030', fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>🗑 Supprimer</button>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#F5F5F3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#5C5C59', transform: expandedClinic === clinic.id ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</div>
                  </div>
                </div>

                {expandedClinic === clinic.id && (
                  <div style={{ padding: '24px' }}>
                    <div style={{ background: '#F5F5F3', borderRadius: 12, padding: '20px', marginBottom: 24 }}>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700, color: '#9E9E9B', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 14 }}>Informations de la clinique</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                        {[
                          { label: 'Identifiant clinique', value: clinic.id, mono: true },
                          { label: 'Propriétaire', value: clinic.owner ? `${clinic.owner.first_name ?? ''} ${clinic.owner.last_name ?? ''}`.trim() || '—' : '—' },
                          { label: 'Email', value: clinic.email || '—' },
                          { label: 'Téléphone', value: clinic.phone || '—' },
                          { label: 'Adresse', value: clinic.address || '—' },
                          { label: 'Horaires', value: clinic.opening_hours || '—' },
                          { label: 'Type', value: clinic.clinic_type || '—' },
                        ].map(item => (
                          <div key={item.label} style={item.label === 'Identifiant clinique' ? { gridColumn: '1 / -1' } : {}}>
                            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700, color: '#9E9E9B', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</div>
                            <div style={{ fontSize: (item as any).mono ? 12 : 14, color: '#141412', fontWeight: 500, fontFamily: (item as any).mono ? 'monospace' : 'inherit', background: (item as any).mono ? '#EBEBEA' : 'transparent', padding: (item as any).mono ? '6px 10px' : '0', borderRadius: (item as any).mono ? 6 : 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                              {item.value}
                              {(item as any).mono && (
                                <button onClick={() => { navigator.clipboard.writeText(item.value); showToast('ID copié ✓') }} style={{ padding: '3px 8px', background: '#0A7C6E', border: 'none', borderRadius: 5, color: 'white', fontSize: 11, fontFamily: 'Syne, sans-serif', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>Copier</button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

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
                                  <button onClick={() => setConfirmDelete({ type: 'user', id: member.id, label: fullName })} style={{ padding: '5px 10px', background: '#FFF5F5', border: '1px solid #FEB2B2', borderRadius: 7, color: '#C53030', fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>🗑</button>
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