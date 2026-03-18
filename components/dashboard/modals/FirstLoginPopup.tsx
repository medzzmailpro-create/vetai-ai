'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { inputStyle } from '../utils/styles'

type Props = {
  userId: string
  userEmail: string
  onComplete: (firstName: string, lastName: string) => void
}

type Step = 'question' | 'oui' | 'non' | 'success'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const labelStyle: React.CSSProperties = {
  fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 600,
  display: 'block', marginBottom: 6, color: '#3E3E3C',
}

// ── Extracted outside to avoid re-mount on parent re-render ──────────────────
function TabBtn({ id, active, label, done, onClick }: {
  id: string; active: boolean; label: string; done: boolean; onClick: () => void
}) {
  return (
    <button
      key={id}
      onClick={onClick}
      style={{
        padding: '10px 16px', background: 'none', border: 'none',
        borderBottom: active ? '2px solid #0A7C6E' : '2px solid transparent',
        fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600,
        color: active ? '#0A7C6E' : '#9E9E9B', cursor: 'pointer',
        marginBottom: -1, display: 'flex', alignItems: 'center', gap: 6,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
      {done && <span style={{ color: '#38A169', fontSize: 12 }}>✓</span>}
    </button>
  )
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <div style={{ fontSize: 12, color: '#E53E3E', marginTop: 4 }}>{msg}</div>
}

const Required = () => <span style={{ color: '#E53E3E' }}> *</span>

// ─────────────────────────────────────────────────────────────────────────────

export default function FirstLoginPopup({ userId, userEmail, onComplete }: Props) {
  const [step, setStep] = useState<Step>('question')

  // Shared personal info
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState(userEmail)
  const [phone, setPhone] = useState('')

  // OUI — join existing clinic
  const [ouiTab, setOuiTab] = useState<'perso' | 'clinique'>('perso')
  const [clinicId, setClinicId] = useState('')
  const [clinicIdError, setClinicIdError] = useState('')
  const [clinicValidated, setClinicValidated] = useState(false)
  const [clinicFoundName, setClinicFoundName] = useState('')
  const [validating, setValidating] = useState(false)

  // NON — create new clinic
  const [nonTab, setNonTab] = useState<'perso' | 'clinique'>('perso')
  const [newClinicName, setNewClinicName] = useState('')
  const [newClinicAddress, setNewClinicAddress] = useState('')
  const [newClinicPhone, setNewClinicPhone] = useState('')
  const [newClinicEmail, setNewClinicEmail] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Field-level error messages (string = message, '' = no error)
  const [fe, setFe] = useState<Record<string, string>>({})
  const clearFe = (key: string) => setFe(p => ({ ...p, [key]: '' }))

  // Helper: input style with red border when error
  const inp = (key: string): React.CSSProperties => ({
    ...inputStyle as React.CSSProperties,
    borderColor: fe[key] ? '#E53E3E' : '#D4D4D2',
    background: fe[key] ? '#FFF5F5' : '#F5F5F3',
  })

  // ── Validation ──────────────────────────────────────────────────────────────
  const validatePerso = (): boolean => {
    const e: Record<string, string> = {}
    if (!firstName.trim()) e.firstName = 'Le prénom est obligatoire'
    if (!lastName.trim()) e.lastName = 'Le nom est obligatoire'
    if (!email.trim()) e.email = "L'email est obligatoire"
    else if (!EMAIL_REGEX.test(email.trim())) e.email = 'Format email invalide'
    if (!phone.trim()) e.phone = 'Le téléphone est obligatoire'
    setFe(prev => ({ ...prev, ...e }))
    return Object.keys(e).length === 0
  }

  const validateClinicId = async () => {
    if (!clinicId.trim()) { setClinicIdError("L'identifiant clinique est obligatoire"); return }
    setValidating(true)
    setClinicIdError('')
    setClinicValidated(false)
    try {
      const { data, error: err } = await supabase
        .from('clinics').select('id, name').eq('id', clinicId.trim()).single()
      if (err || !data) {
        setClinicIdError("Aucune clinique trouvée. Vérifiez l'identifiant avec votre responsable.")
      } else {
        setClinicValidated(true)
        setClinicFoundName(data.name)
      }
    } catch {
      setClinicIdError('Erreur lors de la vérification.')
    } finally {
      setValidating(false)
    }
  }

  const saveProfile = async (extraFields: Record<string, unknown>) => {
    const { error: err } = await supabase.from('profiles').upsert({
      id: userId,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      onboarding_completed: true,
      ...extraFields,
    })
    if (err) throw err
  }

  const showSuccess = (fn: string, ln: string) => {
    setStep('success')
    setTimeout(() => onComplete(fn, ln), 2000)
  }

  const handleOuiSubmit = async () => {
    if (!validatePerso()) { setOuiTab('perso'); return }
    if (!clinicValidated) {
      setError("Veuillez valider l'identifiant de votre clinique dans l'onglet correspondant.")
      return
    }
    setSaving(true)
    setError('')
    try {
      await saveProfile({ clinic_id: clinicId.trim() })
      showSuccess(firstName.trim(), lastName.trim())
    } catch (err: unknown) {
      setError(
        (err as { message?: string })?.message ??
        "Erreur lors de l'enregistrement. Veuillez réessayer."
      )
    } finally {
      setSaving(false)
    }
  }

  const handleNonSubmit = async () => {
    const persoOk = validatePerso()
    const e: Record<string, string> = {}
    if (!newClinicName.trim()) e.clinicName = 'Le nom de la clinique est obligatoire'
    if (!newClinicAddress.trim()) e.clinicAddress = "L'adresse est obligatoire"
    if (!newClinicPhone.trim()) e.clinicPhone = 'Le téléphone est obligatoire'
    if (!newClinicEmail.trim()) e.clinicEmail = "L'email est obligatoire"
    else if (!EMAIL_REGEX.test(newClinicEmail.trim())) e.clinicEmail = 'Format email invalide'
    setFe(prev => ({ ...prev, ...e }))

    if (!persoOk || Object.keys(e).length > 0) {
      if (!persoOk) setNonTab('perso')
      else setNonTab('clinique')
      return
    }
    setSaving(true)
    setError('')
    try {
      const { data: clinic, error: clinicErr } = await supabase
        .from('clinics')
        .insert({
          name: newClinicName.trim(),
          address: newClinicAddress.trim(),
          phone: newClinicPhone.trim(),
          email: newClinicEmail.trim(),
          owner_user_id: userId,
        })
        .select('id').single()
      if (clinicErr || !clinic) {
        console.error('Clinics insert error:', clinicErr)
        throw clinicErr || new Error('Erreur création clinique')
      }

      await supabase.from('clinic_config').upsert({
        user_id: userId,
        clinic_name: newClinicName.trim(),
        address: newClinicAddress.trim(),
        phone: newClinicPhone.trim(),
        email: newClinicEmail.trim(),
        setup_done: true,
        updated_at: new Date().toISOString(),
      })

      // Insert owner into clinic_members
      await supabase.from('clinic_members').upsert({
        user_id: userId,
        clinic_id: clinic.id,
        role: 'owner',
      }, { onConflict: 'user_id,clinic_id' }).select()

      // Insert 4 default AI agents for this clinic
      await supabase.from('ai_agents').insert([
        { clinic_id: clinic.id, type: 'phone',  is_active: true,  config: { voice: 'fr-FR', greeting: `Bonjour, ${newClinicName.trim()}` } },
        { clinic_id: clinic.id, type: 'sms',    is_active: true,  config: {} },
        { clinic_id: clinic.id, type: 'agenda', is_active: true,  config: {} },
        { clinic_id: clinic.id, type: 'chat',   is_active: false, config: {} },
      ])

      await saveProfile({ clinic_id: clinic.id })
      showSuccess(firstName.trim(), lastName.trim())
    } catch (err: unknown) {
      setError(
        (err as { message?: string })?.message ??
        "Erreur lors de l'enregistrement. Veuillez réessayer."
      )
    } finally {
      setSaving(false)
    }
  }

  // ── Reusable inline JSX for personal form ────────────────────────────────────
  // NOT a component — plain JSX to avoid focus loss bug
  const personalFormJsx = (
    <div>
      <p style={{ fontSize: 13, color: '#9E9E9B', lineHeight: 1.6, marginBottom: 18 }}>
        Ces informations sont liées à votre compte personnel.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Prénom<Required /></label>
          <input
            style={inp('firstName')}
            value={firstName}
            onChange={e => { setFirstName(e.target.value); clearFe('firstName') }}
            placeholder="Sophie"
          />
          <FieldError msg={fe.firstName} />
        </div>
        <div>
          <label style={labelStyle}>Nom<Required /></label>
          <input
            style={inp('lastName')}
            value={lastName}
            onChange={e => { setLastName(e.target.value); clearFe('lastName') }}
            placeholder="Martin"
          />
          <FieldError msg={fe.lastName} />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Email<Required /></label>
        <input
          style={inp('email')}
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); clearFe('email') }}
          placeholder="sophie@clinique.fr"
        />
        <FieldError msg={fe.email} />
      </div>
      <div>
        <label style={labelStyle}>Téléphone<Required /></label>
        <input
          style={inp('phone')}
          value={phone}
          onChange={e => { setPhone(e.target.value); clearFe('phone') }}
          placeholder="06 12 34 56 78"
        />
        <FieldError msg={fe.phone} />
      </div>
    </div>
  )

  // ── OVERLAY ──────────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px 16px',
    }}>
      <div style={{
        background: 'white', borderRadius: 20,
        width: '100%', maxWidth: 540, maxHeight: '92vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
        overflow: 'hidden',
      }}>

        {/* ── SUCCÈS ────────────────────────────────────────────────────────── */}
        {step === 'success' && (
          <div style={{ padding: '60px 40px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 20 }}>✅</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: '#141412', marginBottom: 12, lineHeight: 1.3 }}>
              Configuration terminée !
            </div>
            <p style={{ fontSize: 15, color: '#5C5C59', lineHeight: 1.7 }}>
              La Sentinelle veille sur votre clinique.
            </p>
            <div style={{ marginTop: 24, display: 'flex', gap: 6, alignItems: 'center' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0A7C6E' }} />
              <span style={{ fontSize: 13, color: '#9E9E9B' }}>Chargement du dashboard…</span>
            </div>
          </div>
        )}

        {/* ── QUESTION ──────────────────────────────────────────────────────── */}
        {step === 'question' && (
          <div style={{ padding: '40px 40px 36px' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: '#0A7C6E', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 28 }}>
              Vetai<div style={{ width: 7, height: 7, background: '#F5A623', borderRadius: '50%' }} />
            </div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: '#141412', marginBottom: 8, lineHeight: 1.25 }}>
              ⚡ Bienvenue sur Vetai !
            </div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: '#2A2A28', marginBottom: 14 }}>
              Votre clinique est-elle déjà configurée sur Vetai ?
            </div>
            <p style={{ fontSize: 13, color: '#9E9E9B', lineHeight: 1.7, marginBottom: 32, background: '#F5F5F3', borderRadius: 10, padding: '12px 16px' }}>
              Si un collègue ou votre responsable a déjà créé le profil de votre clinique,
              cliquez sur <strong style={{ color: '#2A2A28' }}>Oui</strong> et renseignez l&apos;identifiant
              de votre clinique pour accéder à toutes ses données.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => setStep('oui')}
                style={{ padding: '15px 24px', background: '#0A7C6E', color: 'white', border: 'none', borderRadius: 10, fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, cursor: 'pointer', textAlign: 'left' }}
              >
                ✅ Oui, elle est déjà configurée
              </button>
              <button
                onClick={() => setStep('non')}
                style={{ padding: '15px 24px', background: 'white', color: '#0A7C6E', border: '2px solid #0A7C6E', borderRadius: 10, fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, cursor: 'pointer', textAlign: 'left' }}
              >
                🏥 Non, je configure ma clinique
              </button>
            </div>
          </div>
        )}

        {/* ── OUI ───────────────────────────────────────────────────────────── */}
        {step === 'oui' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div style={{ padding: '24px 28px 0', flexShrink: 0 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: '#0A7C6E', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
                Vetai<div style={{ width: 7, height: 7, background: '#F5A623', borderRadius: '50%' }} />
              </div>
              <button
                onClick={() => { setStep('question'); setError('') }}
                style={{ background: 'none', border: 'none', fontSize: 13, color: '#9E9E9B', cursor: 'pointer', padding: 0, marginBottom: 16 }}
              >
                ← Retour
              </button>
              <div style={{ display: 'flex', borderBottom: '1px solid #EBEBEA' }}>
                <TabBtn id="perso" active={ouiTab === 'perso'} label="🪪 Informations personnelles"
                  done={ouiTab !== 'perso' && !!(firstName.trim() && lastName.trim() && EMAIL_REGEX.test(email.trim()) && phone.trim())}
                  onClick={() => setOuiTab('perso')} />
                <TabBtn id="clinique" active={ouiTab === 'clinique'} label="🔐 Rejoindre ma clinique"
                  done={clinicValidated}
                  onClick={() => setOuiTab('clinique')} />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
              {/* Personal form inlined — no sub-component to avoid focus loss */}
              {ouiTab === 'perso' && personalFormJsx}

              {ouiTab === 'clinique' && (
                <div>
                  <p style={{ fontSize: 13, color: '#9E9E9B', lineHeight: 1.6, marginBottom: 18 }}>
                    Renseignez l&apos;identifiant fourni par votre responsable pour accéder aux données de votre clinique.
                  </p>
                  <label style={labelStyle}>Identifiant de la clinique<Required /></label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                    <input
                      style={{ ...inp('clinicId'), flex: 1, borderColor: clinicIdError ? '#E53E3E' : (clinicValidated ? '#38A169' : '#D4D4D2') }}
                      value={clinicId}
                      onChange={e => { setClinicId(e.target.value); setClinicIdError(''); setClinicValidated(false) }}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      onKeyDown={e => e.key === 'Enter' && validateClinicId()}
                    />
                    <button
                      onClick={validateClinicId}
                      disabled={validating}
                      style={{ padding: '10px 16px', background: '#0A7C6E', color: 'white', border: 'none', borderRadius: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                    >
                      {validating ? '…' : 'Vérifier'}
                    </button>
                  </div>
                  {clinicIdError && (
                    <div style={{ fontSize: 12, color: '#E53E3E', marginBottom: 10 }}>⚠️ {clinicIdError}</div>
                  )}
                  {clinicValidated && (
                    <div style={{ background: '#E8F5F3', border: '1px solid rgba(10,124,110,0.2)', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                      <span style={{ fontSize: 20 }}>✅</span>
                      <div>
                        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: '#065E53' }}>Clinique trouvée !</div>
                        <div style={{ fontSize: 13, color: '#0A7C6E', fontWeight: 600, marginTop: 2 }}>{clinicFoundName}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ padding: '0 28px 24px', flexShrink: 0 }}>
              {error && (
                <div style={{ background: '#FFF5F5', border: '1px solid rgba(229,62,62,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#C53030', marginBottom: 12 }}>
                  ⚠️ {error}
                </div>
              )}
              <button
                onClick={handleOuiSubmit}
                disabled={saving}
                style={{ width: '100%', padding: '14px 20px', background: saving ? '#7BB8B2' : '#0A7C6E', color: 'white', border: 'none', borderRadius: 10, fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}
              >
                {saving ? 'Enregistrement…' : 'Rejoindre la clinique →'}
              </button>
            </div>
          </div>
        )}

        {/* ── NON ───────────────────────────────────────────────────────────── */}
        {step === 'non' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div style={{ padding: '24px 28px 0', flexShrink: 0 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: '#0A7C6E', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
                Vetai<div style={{ width: 7, height: 7, background: '#F5A623', borderRadius: '50%' }} />
              </div>
              <button
                onClick={() => { setStep('question'); setError('') }}
                style={{ background: 'none', border: 'none', fontSize: 13, color: '#9E9E9B', cursor: 'pointer', padding: 0, marginBottom: 16 }}
              >
                ← Retour
              </button>
              <div style={{ display: 'flex', borderBottom: '1px solid #EBEBEA' }}>
                <TabBtn id="perso" active={nonTab === 'perso'} label="🪪 Informations personnelles"
                  done={nonTab !== 'perso' && !!(firstName.trim() && lastName.trim() && EMAIL_REGEX.test(email.trim()) && phone.trim())}
                  onClick={() => setNonTab('perso')} />
                <TabBtn id="clinique" active={nonTab === 'clinique'} label="🏥 Configuration de votre clinique"
                  done={nonTab !== 'clinique' && !!(newClinicName.trim() && newClinicAddress.trim() && newClinicPhone.trim() && EMAIL_REGEX.test(newClinicEmail.trim()))}
                  onClick={() => setNonTab('clinique')} />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
              {/* Personal form inlined — no sub-component to avoid focus loss */}
              {nonTab === 'perso' && personalFormJsx}

              {nonTab === 'clinique' && (
                <div>
                  <p style={{ fontSize: 13, color: '#9E9E9B', lineHeight: 1.6, marginBottom: 18 }}>
                    Ces informations seront utilisées par vos agents IA pour répondre à vos clients.
                  </p>
                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Nom de la clinique<Required /></label>
                    <input
                      style={inp('clinicName')}
                      value={newClinicName}
                      onChange={e => { setNewClinicName(e.target.value); clearFe('clinicName') }}
                      placeholder="Clinique Vétérinaire du Parc"
                    />
                    <FieldError msg={fe.clinicName} />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Adresse<Required /></label>
                    <input
                      style={inp('clinicAddress')}
                      value={newClinicAddress}
                      onChange={e => { setNewClinicAddress(e.target.value); clearFe('clinicAddress') }}
                      placeholder="12 rue des Vétérinaires, 75000 Paris"
                    />
                    <FieldError msg={fe.clinicAddress} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Téléphone<Required /></label>
                      <input
                        style={inp('clinicPhone')}
                        value={newClinicPhone}
                        onChange={e => { setNewClinicPhone(e.target.value); clearFe('clinicPhone') }}
                        placeholder="01 23 45 67 89"
                      />
                      <FieldError msg={fe.clinicPhone} />
                    </div>
                    <div>
                      <label style={labelStyle}>Email<Required /></label>
                      <input
                        style={inp('clinicEmail')}
                        value={newClinicEmail}
                        onChange={e => { setNewClinicEmail(e.target.value); clearFe('clinicEmail') }}
                        placeholder="contact@clinique.fr"
                      />
                      <FieldError msg={fe.clinicEmail} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '0 28px 24px', flexShrink: 0 }}>
              {error && (
                <div style={{ background: '#FFF5F5', border: '1px solid rgba(229,62,62,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#C53030', marginBottom: 12 }}>
                  ⚠️ {error}
                </div>
              )}
              <button
                onClick={handleNonSubmit}
                disabled={saving}
                style={{ width: '100%', padding: '14px 20px', background: saving ? '#7BB8B2' : '#0A7C6E', color: 'white', border: 'none', borderRadius: 10, fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}
              >
                {saving ? 'Enregistrement…' : 'Créer ma clinique →'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
