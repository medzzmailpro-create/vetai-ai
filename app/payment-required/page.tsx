'use client'

import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function PaymentRequiredPage() {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
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
          Vetai.AI<div style={{ width: 7, height: 7, background: '#F5A623', borderRadius: '50%' }} />
        </div>

        <div style={{ fontSize: 48, marginBottom: 20 }}>🔒</div>

        <div style={{
          fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800,
          color: '#141412', marginBottom: 12, letterSpacing: '-0.01em',
        }}>
          Accès non activé
        </div>

        <p style={{ fontSize: 15, color: '#5C5C59', lineHeight: 1.7, marginBottom: 32 }}>
          Votre accès n&apos;est pas activé.<br />
          Veuillez contacter l&apos;administrateur ou compléter votre abonnement pour accéder au dashboard.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <a
            href="/pricing"
            style={{
              display: 'block', padding: '14px 24px',
              background: 'linear-gradient(135deg, #0A7C6E 0%, #0D9E8D 100%)',
              color: 'white', textDecoration: 'none', borderRadius: 10,
              fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700,
              boxShadow: '0 4px 16px rgba(10,124,110,0.3)',
            }}
          >
            Activer mon abonnement →
          </a>

          <a
            href="mailto:medzz.mailpro@gmail.com"
            style={{
              display: 'block', padding: '12px 24px',
              background: 'transparent', color: '#0A7C6E',
              border: '1.5px solid #0A7C6E',
              textDecoration: 'none', borderRadius: 10,
              fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 600,
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
      </div>
    </div>
  )
}
