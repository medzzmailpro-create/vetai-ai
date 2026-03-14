'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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

const inputErrorStyle = { ...inputStyle, border: '1.5px solid #E53E3E', background: '#FFF5F5' }

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase injecte le token dans le hash de l'URL (#access_token=...)
    // On écoute l'événement PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleReset = async () => {
    if (!password || password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    setError('')
    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError('Une erreur est survenue. Le lien est peut-être expiré.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/login'), 3000)
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
        maxWidth: 400,
        width: '100%',
        boxShadow: '0 12px 40px rgba(10,124,110,0.15), 0 4px 12px rgba(0,0,0,0.08)',
      }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: '#0A7C6E', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          Vetai.AI<div style={{ width: 8, height: 8, background: '#F5A623', borderRadius: '50%' }} />
        </div>

        {success ? (
          <div style={{ textAlign: 'center', paddingTop: 16 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, color: '#0A7C6E', marginBottom: 8 }}>
              Mot de passe mis à jour
            </h2>
            <p style={{ fontSize: 14, color: '#5C5C59', lineHeight: 1.6 }}>
              Redirection vers la connexion…
            </p>
          </div>
        ) : !ready ? (
          <div style={{ textAlign: 'center', paddingTop: 16 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔗</div>
            <p style={{ fontSize: 14, color: '#9E9E9B', lineHeight: 1.6, marginBottom: 24 }}>
              En attente de validation du lien…<br />
              Assurez-vous d'avoir cliqué sur le lien reçu par email.
            </p>
            <a href="/login" style={{ fontSize: 13, color: '#0A7C6E', textDecoration: 'none' }}>
              ← Retour à la connexion
            </a>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 14, color: '#9E9E9B', marginBottom: 28 }}>Choisissez un nouveau mot de passe.</p>

            {error && (
              <div style={{ background: '#FFF5F5', border: '1.5px solid #E53E3E', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#C53030', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, color: '#3E3E3C', display: 'block', marginBottom: 6 }}>Nouveau mot de passe</label>
              <input
                style={error ? inputErrorStyle : inputStyle}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleReset()}
              />
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, color: '#3E3E3C', display: 'block', marginBottom: 6 }}>Confirmer le mot de passe</label>
              <input
                style={error ? inputErrorStyle : inputStyle}
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleReset()}
              />
            </div>

            <button
              onClick={handleReset}
              disabled={loading}
              style={{ width: '100%', padding: '15px 24px', background: loading ? '#9E9E9B' : '#0A7C6E', color: 'white', border: 'none', borderRadius: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 16 }}>
              {loading ? 'Mise à jour…' : 'Définir le nouveau mot de passe →'}
            </button>

            <a href="/login" style={{ display: 'block', textAlign: 'center', fontSize: 13, color: '#9E9E9B', textDecoration: 'none' }}>
              ← Retour à la connexion
            </a>
          </>
        )}
      </div>
    </div>
  )
}
