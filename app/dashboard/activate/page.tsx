'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

const inputStyle = {
  padding: '12px 16px',
  border: '1.5px solid #D4D4D2',
  borderRadius: 10,
  fontFamily: 'DM Sans, sans-serif',
  fontSize: 14,
  color: '#2A2A28',
  background: '#F5F5F3',
  outline: 'none',
  width: '100%',
  transition: 'border-color 0.2s',
}

export default function ActivatePage() {
  const [activationKey, setActivationKey] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleActivate() {
    if (!activationKey.trim()) {
      setMessage('Veuillez entrer une clé d\'activation.')
      return
    }
    setMessage('')
    setLoading(true)

    const { data: { session } } = await supabase.auth.getSession()
    const { data: { user } } = await supabase.auth.getUser()

    if (!session || !user) {
      setMessage('Session expirée. Veuillez vous reconnecter.')
      setLoading(false)
      return
    }

    const res = await fetch('/api/activate-agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ activationKey: activationKey.trim() }),
    })

    const data = await res.json()
    if (res.ok) {
      setSuccess(true)
      setMessage('Agent activé avec succès !')
    } else {
      setMessage(data.error ?? 'Clé invalide ou déjà utilisée.')
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '32px 0' }}>
      <a
        href="/dashboard"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, fontFamily: 'Syne, sans-serif', color: '#5C5C59', textDecoration: 'none', marginBottom: 20 }}
      >
        ← Retour au tableau de bord
      </a>
      <div style={{
        background: 'white', border: '1px solid #EBEBEA', borderRadius: 16,
        padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: '#141412', marginBottom: 6 }}>
          🔑 Activer un agent IA
        </div>
        <p style={{ fontSize: 14, color: '#9E9E9B', marginBottom: 28, lineHeight: 1.6 }}>
          Entrez la clé d&apos;activation fournie par l&apos;équipe Vetai pour activer votre agent.
        </p>

        {success ? (
          <div style={{ background: '#E8F5F3', border: '1px solid #0A7C6E', borderRadius: 10, padding: '20px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: '#0A7C6E', marginBottom: 4 }}>Agent activé !</div>
            <div style={{ fontSize: 13, color: '#5C5C59' }}>Votre agent est maintenant opérationnel. Rendez-vous dans la section Agents.</div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, color: '#3E3E3C', display: 'block', marginBottom: 8 }}>
                Clé d&apos;activation
              </label>
              <input
                style={{ ...inputStyle, borderColor: message && !success ? '#E53E3E' : '#D4D4D2' }}
                value={activationKey}
                onChange={e => { setActivationKey(e.target.value); setMessage('') }}
                placeholder="Ex: VETAI-NANTES-01"
                onKeyDown={e => e.key === 'Enter' && handleActivate()}
              />
            </div>

            {message && !success && (
              <div style={{ background: '#FFF5F5', border: '1px solid #E53E3E', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#C53030', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                ⚠️ {message}
              </div>
            )}

            <button
              onClick={handleActivate}
              disabled={loading || !activationKey.trim()}
              style={{
                width: '100%', padding: '13px 24px',
                background: loading || !activationKey.trim() ? '#9E9E9B' : '#0A7C6E',
                color: 'white', border: 'none', borderRadius: 10,
                fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700,
                cursor: loading || !activationKey.trim() ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {loading ? 'Activation en cours…' : 'Activer mon agent →'}
            </button>

            <div style={{ marginTop: 16, padding: '12px 16px', background: '#FEF7E8', borderRadius: 8, border: '1px solid rgba(245,166,35,0.3)' }}>
              <div style={{ fontSize: 12, color: '#92590A', lineHeight: 1.5 }}>
                💡 Votre clé d&apos;activation vous a été envoyée par email après votre souscription. Contactez <a href="mailto:contact@vetai.fr" style={{ color: '#0A7C6E', fontWeight: 600 }}>le support</a> si vous ne la trouvez pas.
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
