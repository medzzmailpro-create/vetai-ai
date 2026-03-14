'use client'
import { useScrollAnimation } from '@/lib/hooks/useScrollAnimation'
import { INTEGRATIONS, SECURITY } from '@/lib/data'

export function Integrations() {
  const ref = useScrollAnimation()
  return (
    <section ref={ref as React.RefObject<HTMLElement>} id="integrations" style={{ background: '#FAFAF8', padding: '96px 24px' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <div className="fade-up" style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#0A7C6E', marginBottom: 12 }}>Intégrations</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 800, color: '#141412', lineHeight: 1.15, marginBottom: 16 }}>
            Compatible avec <span style={{ color: '#0A7C6E' }}>vos outils existants</span>
          </h2>
          <p style={{ fontSize: 17, color: '#5C5C59', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
            La compatibilité avec votre logiciel vétérinaire est analysée lors de votre démo. Aucune surprise.
          </p>
        </div>

        <div className="fade-up" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 24 }}>
          {INTEGRATIONS.map(item => (
            <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'white', border: '1.5px solid #EBEBEA', borderRadius: 100, fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 600, color: '#3E3E3C', boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s', cursor: 'default' }}
              onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = '#0A7C6E'; el.style.color = '#0A7C6E' }}
              onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = '#EBEBEA'; el.style.color = '#3E3E3C' }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>{item.name}
            </div>
          ))}
        </div>
        <p className="fade-up" style={{ textAlign: 'center', fontSize: 14, color: '#9E9E9B' }}>
          ⚠️ Les intégrations avec les logiciels vétérinaires sont étudiées au cas par cas lors de la démo.{' '}
          <a href="#contact" style={{ color: '#0A7C6E', fontWeight: 600, textDecoration: 'none' }}>Contactez-nous</a>{' '}
          pour vérifier votre logiciel.
        </p>
      </div>
    </section>
  )
}

export function Security() {
  const ref = useScrollAnimation()
  return (
    <section ref={ref as React.RefObject<HTMLElement>} id="securite" style={{ background: '#141412', padding: '96px 24px' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <div className="fade-up" style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#F5A623', marginBottom: 12 }}>Sécurité & Conformité</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 800, color: 'white', lineHeight: 1.15, marginBottom: 16 }}>
            Vos données, <span style={{ color: '#F5A623' }}>100% en France</span>
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.6)', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
            Dans le secteur médical, la sécurité des données n'est pas une option.
          </p>
        </div>

        <div className="fade-up security-grid-resp" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {SECURITY.map(item => (
            <div key={item.title} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '28px 24px', textAlign: 'center', transition: 'all 0.3s' }}
              onMouseEnter={e => { const el = e.currentTarget; el.style.background = 'rgba(255,255,255,0.08)'; el.style.transform = 'translateY(-3px)' }}
              onMouseLeave={e => { const el = e.currentTarget; el.style.background = 'rgba(255,255,255,0.05)'; el.style.transform = '' }}>
              <div style={{ fontSize: 36, marginBottom: 14 }}>{item.icon}</div>
              <h4 style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: 'white', marginBottom: 8 }}>{item.title}</h4>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Garantie() {
  return (
    <section id="garantie" style={{ background: '#141412', padding: '56px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🛡️</div>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: 'white', marginBottom: 12 }}>
          Satisfait ou remboursé — 14 jours
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, lineHeight: 1.7, marginBottom: 24 }}>
          Si Vetai.AI ne répond pas à vos attentes dans les 14 premiers jours suivant l'activation, nous vous remboursons intégralement les frais d'installation. Sans question.
        </p>
        <a href="#contact" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 32px', background: '#F5A623', color: '#1a1a18', borderRadius: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textDecoration: 'none', fontSize: 16 }}>
          Démarrer sans risque →
        </a>
      </div>
    </section>
  )
}
