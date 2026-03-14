'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { inputStyle, sectionCard } from '../utils/styles'

export default function SecurityPage() {
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdStatus, setPwdStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [pwdError, setPwdError] = useState('')

  const handleChangePassword = async () => {
    setPwdError('')
    if (!newPwd || newPwd.length < 8) { setPwdError('Le nouveau mot de passe doit contenir au moins 8 caractères.'); return }
    if (newPwd !== confirmPwd) { setPwdError('Les mots de passe ne correspondent pas.'); return }

    setPwdStatus('loading')
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { error } = await supabase.auth.updateUser({ password: newPwd })

    if (error) {
      setPwdError(error.message)
      setPwdStatus('error')
    } else {
      setPwdStatus('success')
      setCurrentPwd('')
      setNewPwd('')
      setConfirmPwd('')
      setTimeout(() => setPwdStatus('idle'), 3000)
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>

      {/* Changement mot de passe */}
      <div style={{ ...sectionCard, padding: 20 }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: '#2A2A28', marginBottom: 16 }}>Changer le mot de passe</div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Nouveau mot de passe</label>
          <input type="password" style={inputStyle} value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Minimum 8 caractères" />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Confirmer le nouveau mot de passe</label>
          <input type="password" style={inputStyle} value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="Répétez le mot de passe" />
        </div>

        {pwdError && (
          <div style={{ background: '#FFF0F0', border: '1px solid #FFCDD2', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#C53030', marginBottom: 12 }}>{pwdError}</div>
        )}
        {pwdStatus === 'success' && (
          <div style={{ background: '#F0FFF4', border: '1px solid #C6F6D5', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#276749', marginBottom: 12 }}>✓ Mot de passe mis à jour avec succès.</div>
        )}

        <button
          onClick={handleChangePassword}
          disabled={pwdStatus === 'loading'}
          style={{ padding: '8px 16px', background: pwdStatus === 'loading' ? '#9E9E9B' : '#0A7C6E', color: 'white', border: 'none', borderRadius: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, cursor: pwdStatus === 'loading' ? 'not-allowed' : 'pointer' }}
        >
          {pwdStatus === 'loading' ? 'Mise à jour…' : 'Mettre à jour'}
        </button>
      </div>

      {/* Sécurité du compte */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ ...sectionCard, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: '#2A2A28' }}>Double authentification</div>
            <div style={{
              display: 'inline-block', padding: '3px 10px', borderRadius: 100,
              background: '#E8F5F3', color: '#0A7C6E',
              fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700,
            }}>
              Gérée par Supabase
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#9E9E9B', lineHeight: 1.6 }}>
            La 2FA peut être activée depuis les paramètres de votre compte Supabase Auth. Contactez le support pour l'activer sur votre accès.
          </div>
        </div>

        <div style={{ ...sectionCard, padding: 16 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: '#2A2A28', marginBottom: 8 }}>Sessions actives</div>
          <div style={{ fontSize: 13, color: '#5C5C59', lineHeight: 1.6 }}>
            Pour déconnecter tous vos appareils, changez votre mot de passe ci-dessus. Cela invalide toutes les sessions actives.
          </div>
        </div>
      </div>
    </div>
  )
}
