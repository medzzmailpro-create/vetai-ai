'use client'

import { useState } from 'react'
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
  transition: 'border-color 0.2s',
}

const inputErrorStyle = { ...inputStyle, border: '1.5px solid #E53E3E', background: '#FFF5F5' }

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [accessBlocked, setAccessBlocked] = useState(false)
  const [loading, setLoading] = useState(false)

  // Mot de passe oublié
  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetError, setResetError] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) { setError('Veuillez remplir tous les champs.'); return }
    setError('')
    setAccessBlocked(false)
    setLoading(true)

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Identifiants incorrects. Veuillez vérifier votre email et mot de passe.')
      setLoading(false)
      return
    }

    // Admin bypass — toujours autoriser, redirige vers /dashboard
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
    if (adminEmail && email.trim().toLowerCase() === adminEmail.toLowerCase()) {
      router.push('/dashboard')
      return
    }

    // Vérification rôle via profiles
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user?.id ?? '')
        .single()

      // Support → panel admin
      if (profile?.role === 'support') {
        router.push('/admin')
        return
      }
    } catch { /* table absente → continuer */ }

    // Vérification paiement via clinic_members
    try {
      const { data: member, error: memberError } = await supabase
        .from('clinic_members')
        .select('has_paid')
        .eq('user_id', authData.user?.id ?? '')
        .single()

      // Ligne absente ou erreur DB (migration pas encore faite) → autoriser
      if (memberError || member == null) {
        router.push('/dashboard')
        return
      }

      // has_paid = false explicitement → bloquer
      if (member.has_paid === false) {
        await supabase.auth.signOut()
        setAccessBlocked(true)
        setLoading(false)
        return
      }
    } catch { /* exception → autoriser l'accès */ }

    router.push('/dashboard')
  }

  const handleResetPassword = async () => {
    if (!resetEmail || !resetEmail.includes('@')) {
      setResetError('Veuillez entrer une adresse email valide.')
      return
    }
    setResetError('')
    setResetLoading(true)

    await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    // On affiche toujours le message de succès (sécurité : ne pas révéler si l'email existe)
    setResetSent(true)
    setResetLoading(false)
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

        {/* Logo */}
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: '#0A7C6E', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          Vetai<div style={{ width: 8, height: 8, background: '#F5A623', borderRadius: '50%' }} />
        </div>

        {/* ── VUE MOT DE PASSE OUBLIÉ ── */}
        {showReset ? (
          <>
            <p style={{ fontSize: 14, color: '#9E9E9B', marginBottom: 28 }}>
              Entrez votre email pour recevoir un lien de réinitialisation.
            </p>

            {resetSent ? (
              <div style={{ background: '#E8F5F3', border: '1px solid rgba(10,124,110,0.2)', borderRadius: 10, padding: '20px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📬</div>
                <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: '#0A7C6E', marginBottom: 4 }}>Email envoyé !</p>
                <p style={{ fontSize: 13, color: '#5C5C59', lineHeight: 1.6 }}>
                  Un email de réinitialisation a été envoyé si ce compte existe.
                </p>
              </div>
            ) : (
              <>
                {resetError && (
                  <div style={{ background: '#FFF5F5', border: '1.5px solid #E53E3E', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#C53030', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    ⚠️ {resetError}
                  </div>
                )}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, color: '#3E3E3C', display: 'block', marginBottom: 6 }}>Email</label>
                  <input
                    style={resetError ? inputErrorStyle : inputStyle}
                    type="email"
                    placeholder="sophie@clinique-parc.fr"
                    value={resetEmail}
                    onChange={e => { setResetEmail(e.target.value); setResetError('') }}
                    onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
                  />
                </div>
                <button
                  onClick={handleResetPassword}
                  disabled={resetLoading}
                  style={{ width: '100%', padding: '13px 24px', background: resetLoading ? '#9E9E9B' : '#0A7C6E', color: 'white', border: 'none', borderRadius: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 15, cursor: resetLoading ? 'not-allowed' : 'pointer', marginBottom: 16 }}>
                  {resetLoading ? 'Envoi…' : 'Envoyer le lien →'}
                </button>
              </>
            )}

            <button
              onClick={() => { setShowReset(false); setResetSent(false); setResetEmail(''); setResetError('') }}
              style={{ width: '100%', background: 'none', border: 'none', fontSize: 13, color: '#9E9E9B', cursor: 'pointer', marginTop: resetSent ? 16 : 0 }}>
              ← Retour à la connexion
            </button>
          </>
        ) : (

        /* ── VUE CONNEXION ── */
        <>
          <p style={{ fontSize: 14, color: '#9E9E9B', marginBottom: 32 }}>Connectez-vous à votre tableau de bord</p>

          {/* Erreur générique */}
          {error && (
            <div style={{ background: '#FFF5F5', border: '1.5px solid #E53E3E', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#C53030', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              ⚠️ {error}
            </div>
          )}

          {/* Erreur accès non activé — avec liens */}
          {accessBlocked && (
            <div style={{ background: '#FFF5F5', border: '1.5px solid #E53E3E', borderRadius: 8, padding: '14px', fontSize: 13, color: '#C53030', marginBottom: 16, lineHeight: 1.7 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>⚠️ Votre accès n&apos;est pas encore activé.</div>
              Complétez votre abonnement sur la{' '}
              <a href="/pricing" style={{ color: '#C53030', fontWeight: 700 }}>page tarifs</a>
              {' '}ou{' '}
              <a href="mailto:medzz.mailpro@gmail.com" style={{ color: '#C53030', fontWeight: 700 }}>contactez le support</a>
              {' '}si vous pensez que c&apos;est une erreur.
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, color: '#3E3E3C', display: 'block', marginBottom: 6 }}>Email</label>
            <input
              style={(error || accessBlocked) ? inputErrorStyle : inputStyle}
              type="email"
              placeholder="sophie@clinique-parc.fr"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); setAccessBlocked(false) }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, color: '#3E3E3C', display: 'block', marginBottom: 6 }}>Mot de passe</label>
            <input
              style={(error || accessBlocked) ? inputErrorStyle : inputStyle}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); setAccessBlocked(false) }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>

          <div style={{ textAlign: 'right', marginBottom: 24 }}>
            <button
              onClick={() => setShowReset(true)}
              style={{ background: 'none', border: 'none', fontSize: 12, color: '#0A7C6E', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
              Mot de passe oublié ?
            </button>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{ width: '100%', padding: '15px 24px', background: loading ? '#9E9E9B' : '#0A7C6E', color: 'white', border: 'none', borderRadius: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 16 }}>
            {loading ? 'Connexion…' : 'Se connecter →'}
          </button>

          <a href="/" style={{ display: 'block', textAlign: 'center', fontSize: 13, color: '#9E9E9B', textDecoration: 'none', marginBottom: 12 }}>
            ← Retour au site
          </a>
          <div style={{ borderTop: '1px solid #F5F5F3', paddingTop: 16, textAlign: 'center' }}>
            <span style={{ fontSize: 13, color: '#9E9E9B' }}>Pas encore de compte ?{' '}</span>
            <a href="/register" style={{ fontSize: 13, color: '#0A7C6E', fontWeight: 600, textDecoration: 'underline' }}>
              Créer un compte
            </a>
          </div>
        </>
        )}
      </div>
    </div>
  )
}
