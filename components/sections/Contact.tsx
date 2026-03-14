'use client'
import { useState } from 'react'
import { useScrollAnimation } from '@/lib/hooks/useScrollAnimation'
import { CONTACT_EMAIL } from '@/lib/data'

export default function Contact() {
  const ref = useScrollAnimation()
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', clinique: '', tel: '', offre: 'Pack Clinique — Offre lancement', message: '' })
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!form.prenom) { setError('Veuillez entrer votre prénom.'); return }
    if (!form.email || !form.email.includes('@') || !form.email.includes('.')) { setError('Veuillez entrer un email valide.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Erreur serveur')
      setSent(true)
    } catch {
      setError(`Une erreur s'est produite. Écrivez-nous directement à ${CONTACT_EMAIL}`)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = { padding: '10px 14px', border: '1.5px solid #D4D4D2', borderRadius: 8, fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#2A2A28', background: '#F5F5F3', outline: 'none', width: '100%', transition: 'border-color 0.2s' }

  return (
    <section ref={ref as React.RefObject<HTMLElement>} id="contact" style={{ background: '#FAFAF8', padding: '96px 24px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start' }} className="contact-grid-resp">

        {/* Info left */}
        <div className="fade-up">
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#F5A623', marginBottom: 12 }}>Démo gratuite</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 800, color: '#141412', lineHeight: 1.15, marginBottom: 12 }}>Réservez votre démo gratuite</h2>
          <p style={{ fontSize: 16, color: '#5C5C59', lineHeight: 1.7, marginBottom: 28 }}>
            En 30 minutes, notre équipe vous montre comment Vetai.AI s'adapte à votre clinique.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
            {[
              ['✓', 'Démo personnalisée sur votre activité'],
              ['✓', 'Réponse sous 24h garantie'],
              ['✓', 'Sans engagement, sans CB'],
              ['✓', 'Équipe basée en France 🇫🇷'],
              ['🛡️', 'Satisfait ou remboursé 14 jours'],
              ['💳', 'Paiement en 3 fois sans frais disponible'],
            ].map(([icon, text]) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 24, height: 24, background: '#E8F5F3', color: '#0A7C6E', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{icon}</div>
                <span style={{ fontSize: 14, color: '#3E3E3C' }}>{text}</span>
              </div>
            ))}
          </div>
          <div style={{ background: '#E8F5F3', borderRadius: 8, border: '1px solid rgba(10,124,110,0.15)', padding: '16px 20px' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: '#0A7C6E', marginBottom: 4 }}>📧 Vous préférez écrire ?</div>
            <div style={{ fontSize: 14, color: '#3E3E3C' }}>
              Envoyez un email directement à <strong>{CONTACT_EMAIL}</strong>
            </div>
          </div>
        </div>

        {/* Form right */}
        <div className="fade-up" style={{ transitionDelay: '0.1s' }}>
          <div style={{ background: 'white', border: '1.5px solid #EBEBEA', borderRadius: 20, padding: 32, boxShadow: 'var(--shadow-sm)' }}>
            {!sent ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, color: '#3E3E3C', display: 'block', marginBottom: 6 }}>Prénom *</label>
                    <input style={inputStyle} placeholder="Sophie" value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, color: '#3E3E3C', display: 'block', marginBottom: 6 }}>Nom</label>
                    <input style={inputStyle} placeholder="Martin" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
                  </div>
                </div>
                {[
                  { label: 'Email professionnel *', key: 'email', type: 'email', placeholder: 'sophie@clinique-parc.fr' },
                  { label: 'Nom de la clinique', key: 'clinique', type: 'text', placeholder: 'Clinique du Parc' },
                  { label: 'Téléphone', key: 'tel', type: 'tel', placeholder: '06 12 34 56 78' },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: 16 }}>
                    <label style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, color: '#3E3E3C', display: 'block', marginBottom: 6 }}>{f.label}</label>
                    <input style={inputStyle} type={f.type} placeholder={f.placeholder} value={(form as Record<string, string>)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                  </div>
                ))}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, color: '#3E3E3C', display: 'block', marginBottom: 6 }}>Offre qui vous intéresse</label>
                  <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.offre} onChange={e => setForm({ ...form, offre: e.target.value })}>
                    <option>Pack Clinique — Offre lancement</option>
                    <option>Pack Clinique — Tarif standard</option>
                    <option>Je veux d'abord en savoir plus</option>
                  </select>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, color: '#3E3E3C', display: 'block', marginBottom: 6 }}>Message (optionnel)</label>
                  <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} placeholder="Vos questions ou précisions..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
                </div>
                {error && <div style={{ background: 'rgba(229,62,62,0.08)', border: '1px solid rgba(229,62,62,0.2)', borderRadius: 6, padding: '10px 14px', fontSize: 13, color: '#E53E3E', marginBottom: 12 }}>{error}</div>}
                <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: '15px 24px', background: loading ? '#9E9E9B' : '#F5A623', color: '#1a1a18', border: 'none', borderRadius: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {loading ? 'Envoi en cours…' : 'Envoyer ma demande →'}
                </button>
                <p style={{ fontSize: 11, color: '#9E9E9B', textAlign: 'center', marginTop: 10 }}>Vos données sont traitées conformément au RGPD. Aucun spam.</p>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, color: '#0A7C6E', marginBottom: 8 }}>Merci !</h3>
                <p style={{ fontSize: 15, color: '#5C5C59', lineHeight: 1.6 }}>Notre équipe vous contacte sous 24h pour organiser votre démo personnalisée.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
