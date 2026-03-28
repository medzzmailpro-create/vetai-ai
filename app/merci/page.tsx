import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bienvenue dans Vetai — Votre commande est confirmée',
  description: 'Votre accès à Vetai est en cours de configuration. Notre équipe vous contacte sous 24h.',
}

export default function MerciPage() {
  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F0FAF8 0%, #FAFAF8 60%, #FEF7E8 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', fontFamily: 'DM Sans, sans-serif',
    }}>
      <div style={{ maxWidth: 560, width: '100%', textAlign: 'center' }}>

        {/* Logo */}
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: '#0A7C6E', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 32 }}>
          Vetai
          <div style={{ width: 7, height: 7, background: '#F5A623', borderRadius: '50%' }} />
        </div>

        {/* Icône succès */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg, #0A7C6E, #0D9E8D)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 28px', fontSize: 36,
          boxShadow: '0 8px 32px rgba(10,124,110,0.3)',
        }}>
          ✓
        </div>

        {/* Titre */}
        <h1 style={{
          fontFamily: 'Syne, sans-serif', fontSize: 'clamp(26px, 4vw, 36px)',
          fontWeight: 800, color: '#141412', lineHeight: 1.2, marginBottom: 16,
        }}>
          Bienvenue dans Vetai ! 🎉
        </h1>

        {/* Sous-titre */}
        <p style={{ fontSize: 16, color: '#5C5C59', lineHeight: 1.7, marginBottom: 36 }}>
          Votre commande est confirmée. Notre équipe vous contacte <strong>sous 24h</strong> pour démarrer l'installation et la configuration de vos agents IA.
        </p>

        {/* Prochaines étapes */}
        <div style={{
          background: 'white', borderRadius: 16, padding: 28,
          border: '1.5px solid #EBEBEA',
          boxShadow: '0 4px 16px rgba(10,124,110,0.08)',
          marginBottom: 28, textAlign: 'left',
        }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: '#2A2A28', marginBottom: 16 }}>
            Prochaines étapes
          </div>
          {[
            { step: '1', title: 'Email de confirmation', desc: 'Vérifiez votre boîte mail — un récapitulatif vous a été envoyé.', done: true },
            { step: '2', title: 'Appel de lancement (24h)', desc: 'Notre équipe vous appelle pour analyser votre activité et configurer votre accès.', done: false },
            { step: '3', title: 'Configuration en 48h', desc: 'Installation de vos agents IA, paramétrage, et formation de votre équipe.', done: false },
            { step: '4', title: 'Go live !', desc: 'Vos agents prennent le relais. Zéro appel manqué dès le premier jour.', done: false },
          ].map(({ step, title, desc, done }) => (
            <div key={step} style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: done ? '#0A7C6E' : '#F5F5F3',
                border: done ? 'none' : '2px solid #D4D4D2',
                color: done ? 'white' : '#9E9E9B',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700,
              }}>
                {done ? '✓' : step}
              </div>
              <div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, color: '#2A2A28', marginBottom: 2 }}>{title}</div>
                <div style={{ fontSize: 13, color: '#9E9E9B', lineHeight: 1.5 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA dashboard */}
        <Link href="/dashboard" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '14px 28px', borderRadius: 10,
          background: 'linear-gradient(135deg, #0A7C6E, #0D9E8D)',
          color: 'white', textDecoration: 'none',
          fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700,
          boxShadow: '0 6px 24px rgba(10,124,110,0.3)',
          marginBottom: 16,
        }}>
          Accéder à mon tableau de bord →
        </Link>

        {/* Contact support */}
        <p style={{ fontSize: 13, color: '#9E9E9B', marginTop: 16 }}>
          Une question ? Écrivez-nous à{' '}
          <a href="mailto:contact@vetai.fr" style={{ color: '#0A7C6E', fontWeight: 600, textDecoration: 'none' }}>
            contact@vetai.fr
          </a>
        </p>

      </div>
    </main>
  )
}
