'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const STRIPE_URL = process.env.NEXT_PUBLIC_STRIPE_URL ?? 'https://buy.stripe.com/aFacN4b9adchgqqfKNdnW00'

const inputStyle = {
  padding: '10px 14px',
  border: '1.5px solid #D4D4D2',
  borderRadius: 8,
  fontFamily: 'DM Sans, sans-serif',
  fontSize: 14,
  color: '#2A2A28',
  background: '#F5F5F3',
  outline: 'none',
  width: '100%',
}

export default function PaymentRequiredPage() {
  const router = useRouter()
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [clinicIdInput, setClinicIdInput] = useState('')
  const [joinLoading, setJoinLoading] = useState(false)
  const [joinError, setJoinError] = useState('')
  const [joinSuccess, setJoinSuccess] = useState('')
  const [isOwner, setIsOwner] = useState<boolean | null>(null)

  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: member } = await supabase
        .from('clinic_members')
        .select('role')
        .eq('user_id', user.id)
        .single()
      setIsOwner(!member || member.role === 'owner')
    }
    checkRole()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleJoinClinic = async () => {
    if (!clinicIdInput.trim()) {
      setJoinError('Veuillez entrer un identifiant de clinique.')
      return
    }
    setJoinLoading(true)
    setJoinError('')
    setJoinSuccess('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setJoinError('Session expirée, reconnectez-vous.'); setJoinLoading(false); return }

      const { data: clinic, error: clinicErr } = await supabase
        .from('clinics')
        .select('id, name, is_active, subscription_status')
        .eq('id', clinicIdInput.trim())
        .single()

      if (clinicErr || !clinic) {
        setJoinError('Aucune clinique trouvée avec cet identifiant. Vérifiez l\'ID.')
        setJoinLoading(false)
        return
      }

      if (clinic.is_active === false || clinic.subscription_status === 'expired' || clinic.subscription_status === 'cancelled') {
        setJoinError('Cette clinique n\'a pas d\'abonnement actif. Contactez le responsable.')
        setJoinLoading(false)
        return
      }

      await supabase.from('profiles').update({ clinic_id: clinic.id }).eq('id', user.id)

      const { error: memberErr } = await supabase.from('clinic_members').upsert({
        user_id: user.id,
        clinic_id: clinic.id,
        role: 'staff',
        has_paid: false,
      }, { onConflict: 'user_id' })

      if (memberErr) {
        setJoinError('Erreur lors de l\'association à la clinique.')
        setJoinLoading(false)
        return
      }

      setJoinSuccess(`✓ Vous avez rejoint "${clinic.name}" ! Redirection...`)
      setTimeout(() => router.push('/dashboard'), 1500)
    } catch {
      setJoinError('Une erreur est survenue. Réessayez.')
    } finally {
      setJoinLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F0FAF8 0%, #FAFAF8 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        background: 'white',
        border: '1.5px solid #EBEBEA',
        borderRadius: 20,
        padding: '48px 40px',
        maxWidth: 480,
        width: '100%',
        boxShadow: '0 12px 40px rgba(10,124,110,0.12), 0 4px 12px rgba(0,0,0,0.06)',
        textAlign: 'center',
      }}>
        {/* Logo */}
        <div style={{
          fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800,
          color: '#0A7C6E', display: 'flex', alignItems: 'center', gap: 6,
          justifyContent: 'center', marginBottom: 32,
        }}>
          Vetai<div style={{ width: 7, height: 7, background: '#F5A623', borderRadius: '50%' }} />
        </div>

        <div style={{ fontSize: 48, marginBottom: 20 }}>🔒</div>

        {!showJoinModal ? (
          <>
            <div style={{
              fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800,
              color: '#141412', marginBottom: 12, letterSpacing: '-0.01em',
            }}>
              {isOwner === false
                ? 'L\'abonnement de votre clinique a expiré'
                : 'Votre période d\'essai est terminée'}
            </div>

            <p style={{ fontSize: 15, color: '#5C5C59', lineHeight: 1.7, marginBottom: 32 }}>
              {isOwner === false
                ? 'Contactez le responsable de votre clinique pour réactiver l\'accès.'
                : 'Pour continuer à utiliser Vetai et ses agents IA, activez votre abonnement.'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {isOwner !== false && (
                <a
                  href={STRIPE_URL}
                  style={{
                    display: 'block', padding: '14px 24px',
                    background: 'linear-gradient(135deg, #0A7C6E 0%, #0D9E8D 100%)',
                    color: 'white', textDecoration: 'none', borderRadius: 10,
                    fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700,
                    boxShadow: '0 4px 16px rgba(10,124,110,0.3)',
                  }}
                >
                  Activer La Sentinelle — 249€ HT/mois →
                </a>
              )}

              <button
                onClick={() => setShowJoinModal(true)}
                style={{
                  display: 'block', padding: '14px 24px', width: '100%',
                  background: 'white', color: '#0A7C6E',
                  border: '1.5px solid #0A7C6E', borderRadius: 10,
                  fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                👥 Rejoindre une clinique
              </button>

              <a
                href="/support"
                style={{
                  display: 'block', padding: '12px 24px',
                  background: 'transparent', color: '#9E9E9B',
                  border: '1.5px solid #EBEBEA',
                  textDecoration: 'none', borderRadius: 10,
                  fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500,
                }}
              >
                Contacter le support
              </a>

              <button
                onClick={handleLogout}
                style={{
                  padding: '10px 24px', background: 'none', border: 'none',
                  fontSize: 13, color: '#9E9E9B', cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                Se déconnecter
              </button>
            </div>
          </>
        ) : (
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: '#141412', marginBottom: 12, letterSpacing: '-0.01em' }}>
              Rejoindre une clinique
            </div>
            <p style={{ fontSize: 13, color: '#9E9E9B', marginBottom: 16 }}>
              Entrez l&apos;identifiant de la clinique fourni par votre responsable.
            </p>

            <input
              style={{ ...inputStyle, marginBottom: 8, borderColor: joinError ? '#E53E3E' : '#D4D4D2' }}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={clinicIdInput}
              onChange={e => { setClinicIdInput(e.target.value); setJoinError('') }}
            />

            {joinError && (
              <div style={{ fontSize: 12, color: '#E53E3E', marginBottom: 10, textAlign: 'left' }}>⚠️ {joinError}</div>
            )}
            {joinSuccess && (
              <div style={{ fontSize: 12, color: '#0A7C6E', marginBottom: 10, fontWeight: 600 }}>{joinSuccess}</div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                onClick={handleJoinClinic}
                disabled={joinLoading}
                style={{
                  flex: 1, padding: '12px 16px',
                  background: joinLoading ? '#9E9E9B' : '#0A7C6E',
                  color: 'white', border: 'none', borderRadius: 8,
                  fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 600,
                  cursor: joinLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {joinLoading ? 'Vérification…' : 'Rejoindre →'}
              </button>
              <button
                onClick={() => { setShowJoinModal(false); setJoinError(''); setClinicIdInput('') }}
                style={{
                  padding: '12px 16px', background: 'white', border: '1px solid #EBEBEA',
                  borderRadius: 8, fontSize: 14, color: '#9E9E9B', cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                Annuler
              </button>
            </div>

            <button
              onClick={handleLogout}
              style={{
                marginTop: 16, padding: '8px 24px', background: 'none', border: 'none',
                fontSize: 12, color: '#9E9E9B', cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              Se déconnecter
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
