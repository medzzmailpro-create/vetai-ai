'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ActivatePage() {
  const [activationKey, setActivationKey] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleActivate() {
    setMessage('')
    setLoading(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setMessage('Session introuvable, reconnecte-toi.')
      setLoading(false)
      return
    }

    const res = await fetch('/api/activate-agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ activationKey }),
    })

    const data = await res.json()
    setMessage(res.ok ? '✅ Agent activé !' : `❌ ${data.error}`)
    setLoading(false)
  }

  return (
    <div style={{ padding: 24, maxWidth: 400 }}>
      <h1>Activer mon agent IA</h1>
      <input
        value={activationKey}
        onChange={(e) => setActivationKey(e.target.value)}
        placeholder="Ex: VETAI-NANTES-01"
        style={{ display: 'block', marginBottom: 12, padding: 8, width: '100%' }}
      />
      <button onClick={handleActivate} disabled={loading || !activationKey}>
        {loading ? 'Activation...' : 'Activer'}
      </button>
      {message && <p>{message}</p>}
    </div>
  )
}