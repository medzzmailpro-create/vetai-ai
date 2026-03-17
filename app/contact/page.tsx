'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Erreur serveur')
      setStatus('success')
      setForm({ name: '', email: '', message: '' })
    } catch {
      setStatus('error')
      setErrorMsg('Une erreur est survenue. Veuillez réessayer ou nous écrire directement.')
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    fontSize: 15,
    fontFamily: 'DM Sans, sans-serif',
    color: '#141412',
    background: '#FAFAF9',
    border: '1px solid #DDDDD9',
    borderRadius: 8,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'DM Sans, sans-serif',
    fontSize: 13,
    fontWeight: 600,
    color: '#141412',
    marginBottom: 6,
    display: 'block',
  }

  return (
    <div style={{ background: '#F5F5F3', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Header */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #EBEBEA',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: 20,
            color: '#0A7C6E',
            letterSpacing: '-0.5px',
          }}>Vetai</span>
        </Link>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 560, margin: '0 auto', padding: '48px 24px' }}>
        <Link href="/" style={{
          fontSize: 13,
          color: '#0A7C6E',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 32,
        }}>
          ← Retour
        </Link>

        <h1 style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 'clamp(28px, 4vw, 40px)',
          fontWeight: 800,
          color: '#141412',
          marginBottom: 12,
          marginTop: 0,
        }}>
          Contactez-nous
        </h1>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: '#5C5C59', lineHeight: 1.8, marginBottom: 32, marginTop: 0 }}>
          Notre équipe répond sous 24h ouvrées.
        </p>

        {/* Email card */}
        <div style={{
          background: 'white',
          border: '1px solid #EBEBEA',
          borderRadius: 12,
          padding: '20px 24px',
          marginBottom: 32,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{ fontSize: 20 }}>✉️</span>
          <div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#8C8C89', marginBottom: 2 }}>
              Email direct
            </div>
            <a
              href="mailto:medzz.mailpro@gmail.com"
              style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 600, color: '#0A7C6E', textDecoration: 'none' }}
            >
              medzz.mailpro@gmail.com
            </a>
          </div>
        </div>

        {/* Form */}
        {status === 'success' ? (
          <div style={{
            background: '#F0FBF9',
            border: '1px solid #B2E0D9',
            borderRadius: 12,
            padding: '28px 24px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
            <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: '#0A7C6E', margin: '0 0 8px' }}>
              Message envoyé !
            </p>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: '#5C5C59', margin: 0, lineHeight: 1.7 }}>
              Nous avons bien reçu votre message et vous répondrons sous 24h ouvrées.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={labelStyle}>Nom complet</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Jean Dupont"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="jean@votreclinique.fr"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Message</label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                required
                rows={5}
                placeholder="Votre message..."
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              />
            </div>

            {status === 'error' && (
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#C0392B', margin: 0 }}>
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              style={{
                background: status === 'loading' ? '#7BBDB6' : '#0A7C6E',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: '14px 28px',
                fontSize: 15,
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 600,
                cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
                alignSelf: 'flex-start',
              }}
            >
              {status === 'loading' ? 'Envoi en cours…' : 'Envoyer le message'}
            </button>
          </form>
        )}
      </main>
    </div>
  )
}
