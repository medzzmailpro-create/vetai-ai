'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

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

export default function RegisterPage() {
  const [success, setSuccess] = useState(false)
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [stripeLoading, setStripeLoading] = useState(false)

  const handleRegister = async () => {
    if (!prenom.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Veuillez remplir tous les champs obligatoires.')
      return
    }
    if (!email.includes('@') || !email.includes('.')) {
      setError('Veuillez entrer une adresse email valide.')
      return
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setError('')
    setLoading(true)

    const plan = new URLSearchParams(window.location.search).get('plan')
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin
    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { prenom: prenom.trim(), nom: nom.trim() },
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        setError('Cet email est déjà utilisé. Connectez-vous plutôt.')
      } else {
        setError(authError.message)
      }
      setLoading(false)
      return
    }

    // Si plan=sentinelle et user créé → rediriger vers Stripe (lien direct)
    if (plan === 'sentinelle' && data?.user) {
      setLoading(false)
      setStripeLoading(true)
      const stripeUrl = process.env.NEXT_PUBLIC_STRIPE_URL ?? 'https://buy.stripe.com/aFacN4b9adchgqqfKNdnW00'
      window.location.href = stripeUrl
      return
    } else {
      setLoading(false)
    }

    setSuccess(true)
  }

  const hasError = !!error
  const isProcessing = loading || stripeLoading

  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #F0FAF8 0%, #FAFAF8 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{
          background: 'white', border: '1.5px solid #EBEBEA', borderRadius: 20,
          padding: '48px 40px', maxWidth: 440, width: '100%',
          boxShadow: '0 12px 40px rgba(10,124,110,0.15), 0 4px 12px rgba(0,0,0,0.08)',
          textAlign: 'center',
        }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: '#0A7C6E', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28, justifyContent: 'center' }}>
            Vetai<div style={{ width: 8, height: 8, background: '#F5A623', borderRadius: '50%' }} />
          </div>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📬</div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: '#141412', marginBottom: 12 }}>
            Vérifiez votre email
          </div>
          <p style={{ fontSize: 14, color: '#5C5C59', lineHeight: 1.7, marginBottom: 24 }}>
            Un email de confirmation a été envoyé à <strong>{email}</strong>.<br />
            Cliquez sur le lien dans l&apos;email pour activer votre compte,
            puis revenez vous connecter.
          </p>
          <a href="/login" style={{ display: 'inline-block', padding: '12px 28px', background: '#0A7C6E', color: 'white', textDecoration: 'none', borderRadius: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 14 }}>
            Aller à la connexion →
          </a>
        </div>
      </div>
    )
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
        maxWidth: 440,
        width: '100%',
        boxShadow: '0 12px 40px rgba(10,124,110,0.15), 0 4px 12px rgba(0,0,0,0.08)',
      }}>

        {/* Logo */}
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: '#0A7C6E', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          Vetai<div style={{ width: 8, height: 8, background: '#F5A623', borderRadius: '50%' }} />
        </div>
        <p style={{ fontSize: 14, color: '#9E9E9B', marginBottom: 28 }}>Créez votre compte et choisissez votre offre</p>

        {error && (
          <div style={{ background: '#FFF5F5', border: '1.5px solid #E53E3E', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#C53030', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Prénom + Nom */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, color: '#3E3E3C', display: 'block', marginBottom: 6 }}>Prénom *</label>
            <input
              style={hasError && !prenom ? inputErrorStyle : inputStyle}
              type="text"
              placeholder="Sophie"
              value={prenom}
              onChange={e => { setPrenom(e.target.value); setError('') }}
            />
          </div>
          <div>
            <label style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, color: '#3E3E3C', display: 'block', marginBottom: 6 }}>Nom</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="Martin"
              value={nom}
              onChange={e => setNom(e.target.value)}
            />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, color: '#3E3E3C', display: 'block', marginBottom: 6 }}>Email *</label>
          <input
            style={hasError && !email.includes('@') ? inputErrorStyle : inputStyle}
            type="email"
            placeholder="sophie@clinique-parc.fr"
            value={email}
            onChange={e => { setEmail(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleRegister()}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, color: '#3E3E3C', display: 'block', marginBottom: 6 }}>Mot de passe * <span style={{ fontWeight: 400, color: '#9E9E9B' }}>(8 caractères min.)</span></label>
          <input
            style={inputStyle}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleRegister()}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, color: '#3E3E3C', display: 'block', marginBottom: 6 }}>Confirmer le mot de passe *</label>
          <input
            style={hasError && password !== confirmPassword ? inputErrorStyle : inputStyle}
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={e => { setConfirmPassword(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleRegister()}
          />
        </div>

        <button
          onClick={handleRegister}
          disabled={isProcessing}
          style={{
            width: '100%', padding: '15px 24px',
            background: isProcessing ? '#9E9E9B' : '#0A7C6E',
            color: 'white', border: 'none', borderRadius: 8,
            fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 16,
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            marginBottom: 16,
          }}>
          {stripeLoading ? 'Redirection vers le paiement…' : loading ? 'Création du compte…' : 'Créer mon compte →'}
        </button>

        <p style={{ fontSize: 13, color: '#9E9E9B', textAlign: 'center', marginBottom: 12 }}>
          En créant un compte, vous acceptez nos{' '}
          <a href="/cgu" style={{ color: '#0A7C6E', textDecoration: 'underline' }}>CGU</a>{' '}
          et notre{' '}
          <a href="/confidentialite" style={{ color: '#0A7C6E', textDecoration: 'underline' }}>politique de confidentialité</a>.
        </p>

        <div style={{ borderTop: '1px solid #F5F5F3', paddingTop: 16, textAlign: 'center' }}>
          <span style={{ fontSize: 13, color: '#9E9E9B' }}>Déjà un compte ?{' '}</span>
          <a href="/login" style={{ fontSize: 13, color: '#0A7C6E', fontWeight: 600, textDecoration: 'underline' }}>
            Se connecter
          </a>
        </div>
      </div>
    </div>
  )
}
