'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function SupportPage() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user)
    })
  }, [])

  const backHref = isLoggedIn === false ? '/' : '/payment-required'

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

        <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>

        <div style={{
          fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800,
          color: '#141412', marginBottom: 12, letterSpacing: '-0.01em',
        }}>
          Contacter le support
        </div>

        <p style={{ fontSize: 15, color: '#5C5C59', lineHeight: 1.7, marginBottom: 32 }}>
          Envoyez-nous un email et nous vous répondrons sous 24h.
        </p>

        <a
          href="mailto:contact@vetai.fr"
          style={{
            display: 'block', padding: '14px 24px',
            background: 'linear-gradient(135deg, #0A7C6E 0%, #0D9E8D 100%)',
            color: 'white', textDecoration: 'none', borderRadius: 10,
            fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700,
            boxShadow: '0 4px 16px rgba(10,124,110,0.3)',
            marginBottom: 12,
          }}
        >
          ✉️ Envoyer un email →
        </a>

        <div style={{
          background: '#F5F5F3', borderRadius: 8, padding: '12px 16px',
          marginBottom: 24, fontSize: 14, color: '#3E3E3C',
        }}>
          <a href="mailto:contact@vetai.fr" style={{ color: '#0A7C6E', fontWeight: 600, textDecoration: 'none' }}>
            contact@vetai.fr
          </a>
        </div>

        {isLoggedIn !== null && (
          <a
            href={backHref}
            style={{
              fontSize: 13, color: '#9E9E9B', textDecoration: 'none',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            ← Retour
          </a>
        )}
      </div>
    </div>
  )
}
