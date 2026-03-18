'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { inputStyle, sectionCard } from '../utils/styles'
import { useApiKeysStatus } from '../hooks/useApiKeysStatus'

export type ClinicConfig = {
  clinic_name: string
  address: string
  phone: string
  email: string
  hours: string
  clinic_type: string
  transfert_enabled: boolean
  transfert_number: string
  duree_rdv: number
  buffer_rdv: number
  setup_done: boolean
}

type Props = {
  config: ClinicConfig
  onConfigChange: (config: ClinicConfig) => void
  userId: string
}

type ToastState = { message: string; type: 'success' | 'error' }

type FormSnapshot = {
  firstName: string; lastName: string; persoEmail: string; persoPhone: string
  clinicName: string; address: string; phone: string; email: string
  hours: string; clinicType: string; transfertEnabled: boolean
  transfertNumber: string; dureeRdv: number; bufferRdv: number
}

function AccordionSection({
  id, title, open, onToggle, children,
}: {
  id: string; title: string; open: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div style={{ ...sectionCard, overflow: 'hidden', padding: 0 }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 24px', background: 'none', border: 'none', cursor: 'pointer',
          borderBottom: open ? '1px solid #EBEBEA' : 'none',
        }}
      >
        <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: '#2A2A28' }}>{title}</span>
        <span style={{ fontSize: 13, color: '#9E9E9B', display: 'inline-block', transition: 'transform 0.25s', transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
      </button>
      {open && <div style={{ padding: 24 }}>{children}</div>}
    </div>
  )
}

const SECTIONS = ['perso', 'clinique', 'infos', 'agent', 'agenda', 'transcriptions']

function getInitialOpen() {
  try {
    const saved = localStorage.getItem('vetai_config_accordion')
    if (saved) return JSON.parse(saved) as Record<string, boolean>
  } catch { }
  return Object.fromEntries(SECTIONS.map(s => [s, true]))
}

export default function ConfigurationPage({ config, onConfigChange, userId }: Props) {
  const [open, setOpen] = useState<Record<string, boolean>>(getInitialOpen)
  const [isOwner, setIsOwner] = useState(false)
  const [ownerConfig, setOwnerConfig] = useState<ClinicConfig | null>(null)

  const toggleSection = (id: string) => {
    setOpen(prev => {
      const next = { ...prev, [id]: !prev[id] }
      try { localStorage.setItem('vetai_config_accordion', JSON.stringify(next)) } catch { }
      return next
    })
  }

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [persoEmail, setPersoEmail] = useState('')
  const [persoPhone, setPersoPhone] = useState('')

  const [profileClinicId, setProfileClinicId] = useState<string | null>(null)
  const [profileClinicName, setProfileClinicName] = useState('')
  const [joinClinicId, setJoinClinicId] = useState('')
  const [joinClinicError, setJoinClinicError] = useState('')
  const [joinClinicSuccess, setJoinClinicSuccess] = useState('')
  const [joiningClinic, setJoiningClinic] = useState(false)
  const [copiedId, setCopiedId] = useState(false)

  const [clinicName, setClinicName] = useState(config.clinic_name)
  const [address, setAddress] = useState(config.address)
  const [phone, setPhone] = useState(config.phone)
  const [email, setEmail] = useState(config.email)
  const [hours, setHours] = useState(config.hours)
  const [clinicType, setClinicType] = useState(config.clinic_type)
  const [transfertEnabled, setTransfertEnabled] = useState(config.transfert_enabled)
  const [transfertNumber, setTransfertNumber] = useState(config.transfert_number)
  const [dureeRdv, setDureeRdv] = useState(config.duree_rdv)
  const [bufferRdv, setBufferRdv] = useState(config.buffer_rdv)

  // Transcriptions toggle (saved in clinic_agents table)
  const [transcriptionsEnabled, setTranscriptionsEnabled] = useState(true)
  const [togglingTranscriptions, setTogglingTranscriptions] = useState(false)

  // Transfert toggle auto-save
  const [togglingTransfert, setTogglingTransfert] = useState(false)

  const [initialFormState, setInitialFormState] = useState<FormSnapshot | null>(null)

  const getFormState = useCallback((): FormSnapshot => ({
    firstName, lastName, persoEmail, persoPhone,
    clinicName, address, phone, email, hours,
    clinicType, transfertEnabled, transfertNumber, dureeRdv, bufferRdv,
  }), [firstName, lastName, persoEmail, persoPhone, clinicName, address, phone, email, hours, clinicType, transfertEnabled, transfertNumber, dureeRdv, bufferRdv])

  const isDirty = initialFormState !== null &&
    JSON.stringify(getFormState()) !== JSON.stringify(initialFormState)

  const [toast, setToast] = useState<ToastState | null>(null)
  const showToast = (message: string, type: ToastState['type'] = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!userId) return
    const load = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email, phone, clinic_id')
        .eq('id', userId)
        .single()

      let loadedClinicId: string | null = null
      let loadedCfg = {
        clinicName: config.clinic_name, address: config.address,
        phone: config.phone, email: config.email, hours: config.hours,
        clinicType: config.clinic_type, transfertEnabled: config.transfert_enabled,
        transfertNumber: config.transfert_number, dureeRdv: config.duree_rdv, bufferRdv: config.buffer_rdv,
      }

      const loadedFn = profile?.first_name ?? ''
      const loadedLn = profile?.last_name ?? ''
      const loadedEmail = profile?.email ?? ''
      const loadedPhone = profile?.phone ?? ''

      if (profile) {
        setFirstName(loadedFn)
        setLastName(loadedLn)
        setPersoEmail(loadedEmail)
        setPersoPhone(loadedPhone)
        loadedClinicId = profile.clinic_id ?? null
        setProfileClinicId(loadedClinicId)

        // Load transcriptions state from clinic_agents
        if (loadedClinicId) {
          const { data: transcAgent } = await supabase
            .from('clinic_agents')
            .select('is_enabled')
            .eq('clinic_id', loadedClinicId)
            .eq('agent_type', 'transcription')
            .single()
          if (transcAgent != null) {
            setTranscriptionsEnabled(transcAgent.is_enabled)
          }
        }

        if (profile.clinic_id) {
          const { data: clinic } = await supabase
            .from('clinics').select('name, owner_user_id').eq('id', profile.clinic_id).single()
          if (clinic) {
            setProfileClinicName(clinic.name)
            const userIsOwner = clinic.owner_user_id === userId
            setIsOwner(userIsOwner)

            // Si pas owner, charger la config du owner
            if (!userIsOwner && clinic.owner_user_id) {
              const { data: ownerCfgData } = await supabase
                .from('clinic_config')
                .select('*')
                .eq('user_id', clinic.owner_user_id)
                .single()
              if (ownerCfgData) {
                setOwnerConfig({
                  clinic_name: ownerCfgData.clinic_name ?? '',
                  address: ownerCfgData.address ?? '',
                  phone: ownerCfgData.phone ?? '',
                  email: ownerCfgData.email ?? '',
                  hours: ownerCfgData.hours ?? '',
                  clinic_type: ownerCfgData.clinic_type ?? '',
                  transfert_enabled: ownerCfgData.transfert_enabled ?? false,
                  transfert_number: ownerCfgData.transfert_number ?? '',
                  duree_rdv: ownerCfgData.duree_rdv ?? 20,
                  buffer_rdv: ownerCfgData.buffer_rdv ?? 5,
                  setup_done: ownerCfgData.setup_done ?? false,
                })
              }
            }
          }
        }
      }

      // Charger sa propre config seulement si owner
      const { data: cfg } = await supabase
        .from('clinic_config').select('*').eq('user_id', userId).single()

      if (cfg) {
        loadedCfg = {
          clinicName: cfg.clinic_name ?? '', address: cfg.address ?? '',
          phone: cfg.phone ?? '', email: cfg.email ?? '', hours: cfg.hours ?? '',
          clinicType: cfg.clinic_type ?? 'Vétérinaire généraliste',
          transfertEnabled: cfg.transfert_enabled ?? true,
          transfertNumber: cfg.transfert_number ?? '',
          dureeRdv: cfg.duree_rdv ?? 20, bufferRdv: cfg.buffer_rdv ?? 5,
        }
        setClinicName(loadedCfg.clinicName)
        setAddress(loadedCfg.address)
        setPhone(loadedCfg.phone)
        setEmail(loadedCfg.email)
        setHours(loadedCfg.hours)
        setClinicType(loadedCfg.clinicType)
        setTransfertEnabled(loadedCfg.transfertEnabled)
        setTransfertNumber(loadedCfg.transfertNumber)
        setDureeRdv(loadedCfg.dureeRdv)
        setBufferRdv(loadedCfg.bufferRdv)
      }

      setInitialFormState({
        firstName: loadedFn, lastName: loadedLn,
        persoEmail: loadedEmail, persoPhone: loadedPhone,
        clinicName: loadedCfg.clinicName, address: loadedCfg.address,
        phone: loadedCfg.phone, email: loadedCfg.email,
        hours: loadedCfg.hours, clinicType: loadedCfg.clinicType,
        transfertEnabled: loadedCfg.transfertEnabled,
        transfertNumber: loadedCfg.transfertNumber,
        dureeRdv: loadedCfg.dureeRdv, bufferRdv: loadedCfg.bufferRdv,
      })
      void loadedClinicId
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const syncUpward = useCallback(() => {
    onConfigChange({
      clinic_name: clinicName, address, phone, email, hours,
      clinic_type: clinicType, transfert_enabled: transfertEnabled,
      transfert_number: transfertNumber, duree_rdv: dureeRdv,
      buffer_rdv: bufferRdv, setup_done: config.setup_done,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicName, address, phone, email, hours, clinicType, transfertEnabled, transfertNumber, dureeRdv, bufferRdv])

  useEffect(() => { syncUpward() }, [syncUpward])

  // API keys status (same source as AgentsPage)
  const { hasApiKeys, loading: apiKeysLoading } = useApiKeysStatus(profileClinicId)

  const toggleTranscriptions = async () => {
    if (!profileClinicId || togglingTranscriptions) return
    const newVal = !transcriptionsEnabled
    setTogglingTranscriptions(true)
    setTranscriptionsEnabled(newVal)
    try {
      await supabase
        .from('clinic_agents')
        .upsert(
          { clinic_id: profileClinicId, agent_type: 'transcription', is_enabled: newVal, updated_at: new Date().toISOString() },
          { onConflict: 'clinic_id,agent_type' }
        )
    } catch {
      setTranscriptionsEnabled(!newVal) // revert on error
    } finally {
      setTogglingTranscriptions(false)
    }
  }

  const toggleTransfert = async () => {
    if (!isOwner || togglingTransfert) return
    const newVal = !transfertEnabled
    setTogglingTransfert(true)
    setTransfertEnabled(newVal)
    try {
      await supabase.from('clinic_config').update({
        transfert_enabled: newVal,
        updated_at: new Date().toISOString(),
      }).eq('user_id', userId)
    } catch {
      setTransfertEnabled(!newVal) // revert on error
    } finally {
      setTogglingTransfert(false)
    }
  }

  const handleJoinClinic = async () => {
    if (!joinClinicId.trim()) { setJoinClinicError('Veuillez entrer un identifiant.'); return }
    setJoiningClinic(true)
    setJoinClinicError('')
    setJoinClinicSuccess('')
    try {
      const { data, error: err } = await supabase
        .from('clinics').select('id, name').eq('id', joinClinicId.trim()).single()
      if (err || !data) {
        setJoinClinicError('Aucune clinique trouvée avec cet identifiant.')
      } else {
        await supabase.from('profiles').update({ clinic_id: data.id }).eq('id', userId)
        setProfileClinicId(data.id)
        setProfileClinicName(data.name)
        setJoinClinicId('')
        setJoinClinicSuccess(`✓ Clinique "${data.name}" rejointe avec succès.`)
      }
    } catch {
      setJoinClinicError('Erreur lors de la vérification.')
    } finally {
      setJoiningClinic(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    const errors: string[] = []
    try {
      const { error: profErr } = await supabase.from('profiles').upsert({
        id: userId, first_name: firstName.trim(), last_name: lastName.trim(),
        email: persoEmail.trim(), phone: persoPhone.trim(),
      })
      if (profErr) errors.push(profErr.message)

      if (profileClinicId && isOwner) {
        const { error: clinicsErr } = await supabase
          .from('clinics')
          .update({
            name: clinicName.trim(),
            address: address.trim(),
            phone: phone.trim(),
            email: email.trim(),
            opening_hours: hours.trim(),
            clinic_type: clinicType,
          })
          .eq('id', profileClinicId)
        if (clinicsErr) errors.push(clinicsErr.message)
      }

      if (isOwner) {
        const { error: cfgErr } = await supabase.from('clinic_config').upsert({
          user_id: userId, clinic_name: clinicName, address, phone, email, hours,
          clinic_type: clinicType, transfert_enabled: transfertEnabled,
          transfert_number: transfertNumber, duree_rdv: dureeRdv,
          buffer_rdv: bufferRdv, setup_done: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        if (cfgErr) errors.push(cfgErr.message)
      }

      if (errors.length) {
        showToast(`Erreur : ${errors.join(' — ')}`, 'error')
      } else {
        setInitialFormState(getFormState())
        showToast('✅ Configuration enregistrée avec succès', 'success')
      }
    } catch (err: unknown) {
      showToast(`Erreur inattendue : ${(err as { message?: string })?.message ?? 'Veuillez réessayer.'}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 600,
    display: 'block', marginBottom: 6, color: '#3E3E3C',
  }

  const readOnlyStyle: React.CSSProperties = {
    ...inputStyle, background: '#F5F5F3', color: '#9E9E9B', cursor: 'not-allowed',
  }

  const CLINIC_TYPES = ['Vétérinaire généraliste', "Clinique d'urgence", 'Clinique spécialisée', 'Autre']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.type === 'success' ? '#0A7C6E' : '#C53030',
          color: 'white', padding: '12px 20px', borderRadius: 10,
          fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 600,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)', maxWidth: 360,
        }}>
          {toast.message}
        </div>
      )}

      {/* 🔴 Bannière clés API manquantes */}
      {!apiKeysLoading && !hasApiKeys && (
        <div style={{
          background: '#FFF5F5', border: '1.5px solid #C53030', borderRadius: 12,
          padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 14,
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>⚠️</span>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: '#C53030', marginBottom: 6 }}>
              Aucune clé API configurée — Vos agents ne peuvent pas fonctionner.
            </div>
            <div style={{ fontSize: 13, color: '#742A2A', lineHeight: 1.6 }}>
              Rendez-vous dans la{' '}
              <a href="/dashboard/activate" style={{ color: '#C53030', fontWeight: 700, textDecoration: 'underline' }}>
                page Activation
              </a>
              {' '}pour configurer vos clés.
              <br />
              Si vous n&apos;avez pas encore de clés, contactez-nous :{' '}
              <a href="mailto:medzz.mailpro@gmail.com" style={{ color: '#C53030', fontWeight: 700, textDecoration: 'underline' }}>
                medzz.mailpro@gmail.com
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Badge rôle */}
      {profileClinicId && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: isOwner ? '#F0FDF8' : '#FFF8E7', border: `1px solid ${isOwner ? '#0A7C6E' : '#F5A623'}`, borderRadius: 10 }}>
          <span style={{ fontSize: 16 }}>{isOwner ? '👑' : '👤'}</span>
          <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: isOwner ? '#0A7C6E' : '#92590A' }}>
            {isOwner ? 'Vous êtes propriétaire de cette clinique' : 'Vous êtes membre de cette clinique — seul le propriétaire peut modifier la configuration'}
          </span>
        </div>
      )}

      {/* 🪪 Informations personnelles */}
      <AccordionSection id="perso" title="🪪 Informations personnelles" open={!!open.perso} onToggle={() => toggleSection('perso')}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Prénom</label>
            <input style={inputStyle} value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Sophie" />
          </div>
          <div>
            <label style={labelStyle}>Nom</label>
            <input style={inputStyle} value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Martin" />
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Email</label>
          <input style={inputStyle} type="email" value={persoEmail} onChange={e => setPersoEmail(e.target.value)} placeholder="sophie@clinique.fr" />
        </div>
        <div>
          <label style={labelStyle}>Téléphone</label>
          <input style={inputStyle} value={persoPhone} onChange={e => setPersoPhone(e.target.value)} placeholder="06 12 34 56 78" />
        </div>
      </AccordionSection>

      {/* 🔐 Ma clinique */}
      <AccordionSection id="clinique" title="🔐 Ma clinique" open={!!open.clinique} onToggle={() => toggleSection('clinique')}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700, color: '#9E9E9B', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
            Identifiant de votre clinique
          </div>
          {profileClinicId ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ flex: 1, background: '#F5F5F3', border: '1px solid #EBEBEA', borderRadius: 8, padding: '10px 14px', fontFamily: 'monospace', fontSize: 12, color: '#3E3E3C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {profileClinicId}
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(profileClinicId); setCopiedId(true); setTimeout(() => setCopiedId(false), 2000) }}
                  style={{ padding: '10px 12px', background: copiedId ? '#E8F5F3' : 'white', border: '1px solid #EBEBEA', borderRadius: 8, cursor: 'pointer', fontSize: 14, flexShrink: 0 }}
                >
                  {copiedId ? '✓' : '📋'}
                </button>
              </div>
              {profileClinicName && (
                <div style={{ fontSize: 13, color: '#0A7C6E', fontWeight: 600 }}>Clinique : {profileClinicName}</div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: '#9E9E9B', fontStyle: 'italic' }}>Aucune clinique associée</div>
          )}
        </div>
        <div style={{ borderTop: '1px solid #F5F5F3', paddingTop: 16 }}>
          <label style={labelStyle}>Rejoindre une autre clinique (ID)</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              style={{ ...inputStyle, flex: 1, borderColor: joinClinicError ? '#E53E3E' : '#D4D4D2' }}
              value={joinClinicId}
              onChange={e => { setJoinClinicId(e.target.value); setJoinClinicError(''); setJoinClinicSuccess('') }}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />
            <button
              onClick={handleJoinClinic}
              disabled={joiningClinic}
              style={{ padding: '10px 16px', background: '#0A7C6E', color: 'white', border: 'none', borderRadius: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {joiningClinic ? '…' : 'Rejoindre'}
            </button>
          </div>
          {joinClinicError && <div style={{ fontSize: 12, color: '#E53E3E', marginTop: 6 }}>⚠️ {joinClinicError}</div>}
          {joinClinicSuccess && <div style={{ fontSize: 12, color: '#0A7C6E', marginTop: 6, fontWeight: 600 }}>{joinClinicSuccess}</div>}
        </div>
      </AccordionSection>

      {/* 🏥 Configurations de la clinique */}
      <AccordionSection id="infos" title="🏥 Configurations de la clinique" open={!!open.infos} onToggle={() => toggleSection('infos')}>
        {!isOwner && ownerConfig ? (
          // Vue lecture seule pour les membres
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#FFF8E7', border: '1px solid #F5A623', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#92590A', fontFamily: 'Syne, sans-serif', fontWeight: 600 }}>
              👁 Lecture seule — seul le propriétaire peut modifier
            </div>
            {[
              { label: 'Type', value: ownerConfig.clinic_type },
              { label: 'Nom', value: ownerConfig.clinic_name },
              { label: 'Adresse', value: ownerConfig.address },
              { label: 'Téléphone', value: ownerConfig.phone },
              { label: 'Email', value: ownerConfig.email },
              { label: 'Horaires', value: ownerConfig.hours },
            ].map(item => (
              <div key={item.label}>
                <label style={labelStyle}>{item.label}</label>
                <div style={readOnlyStyle as React.CSSProperties}>{item.value || '—'}</div>
              </div>
            ))}
          </div>
        ) : (
          // Vue éditable pour owner
          <>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Type de clinique</label>
              <select value={clinicType} onChange={e => setClinicType(e.target.value)} style={inputStyle}>
                {CLINIC_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Nom de la clinique</label>
              <input style={inputStyle} value={clinicName} onChange={e => setClinicName(e.target.value)} placeholder="Clinique Vétérinaire du Parc" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Adresse</label>
              <input style={inputStyle} value={address} onChange={e => setAddress(e.target.value)} placeholder="12 rue des Vétérinaires, 75000 Paris" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Téléphone principal</label>
                <input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="01 23 45 67 89" />
              </div>
              <div>
                <label style={labelStyle}>Email principal</label>
                <input style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} placeholder="contact@clinique.fr" />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Horaires d&apos;ouverture</label>
              <input style={inputStyle} value={hours} onChange={e => setHours(e.target.value)} placeholder="Lun–Ven 8h30–19h, Sam 9h–13h" />
            </div>
          </>
        )}
      </AccordionSection>

      {/* 📞 Agent téléphonique */}
      <AccordionSection id="agent" title="📞 Agent téléphonique" open={!!open.agent} onToggle={() => toggleSection('agent')}>
        {!isOwner && ownerConfig ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#FFF8E7', border: '1px solid #F5A623', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#92590A', fontFamily: 'Syne, sans-serif', fontWeight: 600 }}>
              👁 Lecture seule — seul le propriétaire peut modifier
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, color: '#2A2A28' }}>Transfert vers un humain</div>
              <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 100, fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700, background: ownerConfig.transfert_enabled ? '#E8F5F3' : '#F5F5F3', color: ownerConfig.transfert_enabled ? '#0A7C6E' : '#9E9E9B', border: ownerConfig.transfert_enabled ? '1px solid #0A7C6E' : '1px solid #EBEBEA' }}>
                {ownerConfig.transfert_enabled ? '✅ Activé' : '❌ Désactivé'}
              </span>
            </div>
            {ownerConfig.transfert_enabled && (
              <div>
                <label style={labelStyle}>Numéro de transfert</label>
                <div style={readOnlyStyle as React.CSSProperties}>{ownerConfig.transfert_number || '—'}</div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F5F5F3', marginBottom: 14 }}>
              <div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, color: '#2A2A28' }}>Transfert vers un humain</div>
                <div style={{ fontSize: 11, color: '#9E9E9B', marginTop: 2 }}>En cas d&apos;urgence ou de situation sensible</div>
              </div>
              <div
                onClick={toggleTransfert}
                title={togglingTransfert ? 'Enregistrement…' : undefined}
                style={{ width: 42, height: 22, borderRadius: 11, background: transfertEnabled ? '#0A7C6E' : '#D4D4D2', position: 'relative', cursor: togglingTransfert ? 'wait' : 'pointer', flexShrink: 0, transition: 'background 0.2s', opacity: togglingTransfert ? 0.6 : 1 }}
              >
                <div style={{ position: 'absolute', top: 2, left: transfertEnabled ? undefined : 2, right: transfertEnabled ? 2 : undefined, width: 18, height: 18, background: 'white', borderRadius: '50%', transition: 'left 0.2s, right 0.2s' }} />
              </div>
            </div>
            {transfertEnabled && (
              <div>
                <label style={labelStyle}>Numéro de transfert</label>
                <input style={inputStyle} value={transfertNumber} onChange={e => setTransfertNumber(e.target.value)} placeholder="06 12 34 56 78" />
              </div>
            )}
          </>
        )}
      </AccordionSection>

      {/* 📅 Agent agenda */}
      <AccordionSection id="agenda" title="📅 Agent agenda" open={!!open.agenda} onToggle={() => toggleSection('agenda')}>
        {!isOwner && ownerConfig ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#FFF8E7', border: '1px solid #F5A623', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#92590A', fontFamily: 'Syne, sans-serif', fontWeight: 600 }}>
              👁 Lecture seule — seul le propriétaire peut modifier
            </div>
            <div>
              <label style={labelStyle}>Durée par défaut d'un RDV</label>
              <div style={readOnlyStyle as React.CSSProperties}>{ownerConfig.duree_rdv} min</div>
            </div>
            <div>
              <label style={labelStyle}>Buffer entre deux RDV</label>
              <div style={readOnlyStyle as React.CSSProperties}>{ownerConfig.buffer_rdv} min</div>
            </div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Durée par défaut d&apos;un RDV : <strong style={{ color: '#0A7C6E' }}>{dureeRdv} min</strong></label>
              <input type="range" min={10} max={60} step={5} value={dureeRdv} onChange={e => setDureeRdv(Number(e.target.value))} style={{ width: '100%', accentColor: '#0A7C6E' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9E9E9B', marginTop: 4 }}>
                <span>10 min</span><span>60 min</span>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Buffer entre deux RDV : <strong style={{ color: '#0A7C6E' }}>{bufferRdv} min</strong></label>
              <input type="range" min={0} max={30} step={5} value={bufferRdv} onChange={e => setBufferRdv(Number(e.target.value))} style={{ width: '100%', accentColor: '#0A7C6E' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9E9E9B', marginTop: 4 }}>
                <span>0 min</span><span>30 min</span>
              </div>
            </div>
          </>
        )}
      </AccordionSection>

      {/* 📝 Transcriptions */}
      <AccordionSection id="transcriptions" title="📝 Transcriptions" open={!!open.transcriptions} onToggle={() => toggleSection('transcriptions')}>
        {!isOwner && ownerConfig ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#FFF8E7', border: '1px solid #F5A623', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#92590A', fontFamily: 'Syne, sans-serif', fontWeight: 600 }}>
              👁 Lecture seule — seul le propriétaire peut modifier
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, color: '#2A2A28' }}>Enregistrement des transcriptions</div>
              <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 100, fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700, background: transcriptionsEnabled ? '#E8F5F3' : '#F5F5F3', color: transcriptionsEnabled ? '#0A7C6E' : '#9E9E9B', border: transcriptionsEnabled ? '1px solid #0A7C6E' : '1px solid #EBEBEA' }}>
                {transcriptionsEnabled ? '✅ Activé' : '❌ Désactivé'}
              </span>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, color: '#2A2A28' }}>Activer l&apos;enregistrement des transcriptions</div>
              <div style={{ fontSize: 11, color: '#9E9E9B', marginTop: 2 }}>Les appels seront transcrits et accessibles dans Communications</div>
            </div>
            <div
              onClick={toggleTranscriptions}
              title={togglingTranscriptions ? 'Enregistrement…' : undefined}
              style={{
                width: 42, height: 22, borderRadius: 11,
                background: transcriptionsEnabled ? '#0A7C6E' : '#D4D4D2',
                position: 'relative', cursor: togglingTranscriptions ? 'wait' : 'pointer',
                flexShrink: 0, transition: 'background 0.2s', opacity: togglingTranscriptions ? 0.6 : 1,
              }}
            >
              <div style={{
                position: 'absolute', top: 2,
                left: transcriptionsEnabled ? undefined : 2,
                right: transcriptionsEnabled ? 2 : undefined,
                width: 18, height: 18, background: 'white', borderRadius: '50%',
                transition: 'left 0.2s, right 0.2s',
              }} />
            </div>
          </div>
        )}
      </AccordionSection>

      {/* Bouton save — seulement pour owner */}
      {isOwner && (
        <div style={{ paddingTop: 8 }}>
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            style={{
              padding: '12px 32px', background: saving ? '#7BB8B2' : '#0A7C6E',
              color: 'white', border: 'none', borderRadius: 9,
              fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700,
              cursor: (saving || !isDirty) ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s, opacity 0.2s',
              opacity: (!isDirty && !saving) ? 0.5 : 1,
            }}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer la configuration'}
          </button>
          {!isDirty && !saving && (
            <div style={{ fontSize: 12, color: '#9E9E9B', marginTop: 6 }}>Aucune modification en attente.</div>
          )}
        </div>
      )}
    </div>
  )
}