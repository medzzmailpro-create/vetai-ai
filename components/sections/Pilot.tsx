'use client'
import { useScrollAnimation } from '@/lib/hooks/useScrollAnimation'
import { PILOT_PLACES } from '@/lib/data'

export default function Pilot() {
  const ref = useScrollAnimation()

  return (
    <section ref={ref as React.RefObject<HTMLElement>} id="pilote" style={{ background: '#E8F5F3', padding: '96px 24px' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <div className="fade-up" style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#0A7C6E', marginBottom: 12 }}>Programme Pilote</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 800, color: '#141412', lineHeight: 1.15, marginBottom: 16 }}>
            Soyez parmi les <span style={{ color: '#0A7C6E' }}>premières cliniques</span>
          </h2>
          <p style={{ fontSize: 17, color: '#5C5C59', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
            Vetai.AI est en phase de lancement. Nous sélectionnons 3 cliniques pilotes pour construire le produit avec elles.
          </p>
        </div>

        <div className="fade-up pilot-grid-resp" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {PILOT_PLACES.map(place => (
            <div key={place.num} style={{
              background: 'white',
              border: place.featured ? '2px solid #0A7C6E' : '1px solid #EBEBEA',
              borderRadius: 12,
              padding: 32,
              textAlign: 'center',
              boxShadow: place.featured ? 'var(--shadow-md)' : 'var(--shadow-sm)',
              position: 'relative',
              transition: 'all 0.3s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = place.featured ? 'var(--shadow-md)' : 'var(--shadow-sm)' }}>

              {place.badge && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#F5A623', color: '#1a1a18', fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700, padding: '3px 14px', borderRadius: 100, whiteSpace: 'nowrap' }}>
                  {place.badge}
                </div>
              )}

              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700, color: '#9E9E9B', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>{place.num}</div>
              <div style={{ fontSize: 40, marginBottom: 14 }}>{place.icon}</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: place.featured ? '#0A7C6E' : '#141412', marginBottom: 6 }}>{place.title}</div>
              <div style={{ fontSize: 13, color: '#9E9E9B', marginBottom: 16 }}>{place.subtitle}</div>

              <div style={{ display: 'inline-block', background: place.tagColor === 'amber' ? '#FEF7E8' : '#E8F5F3', color: place.tagColor === 'amber' ? '#D4891A' : '#0A7C6E', fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, marginBottom: 16 }}>
                {place.tag}
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24, textAlign: 'left' }}>
                {place.features.map(f => (
                  <li key={f} style={{ fontSize: 13, color: '#5C5C59', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ color: '#0A7C6E', fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
                  </li>
                ))}
              </ul>

              {place.locked ? (
                <button disabled style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '12px 24px', background: '#F5F5F3', color: '#9E9E9B', border: '2px solid #D4D4D2', borderRadius: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 14, cursor: 'not-allowed' }}>
                  Prochainement
                </button>
              ) : (
                <a href="#contact" style={{ display: 'flex', justifyContent: 'center', padding: '12px 24px', background: place.featured ? '#F5A623' : 'transparent', color: place.featured ? '#1a1a18' : '#0A7C6E', border: '2px solid', borderColor: place.featured ? '#F5A623' : '#0A7C6E', borderRadius: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>
                  Candidater →
                </a>
              )}
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', fontSize: 13, color: '#9E9E9B', marginTop: 24 }}>
          Les résultats de nos cliniques pilotes seront publiés ici dès la fin de leur premier mois avec Vetai.AI.
        </p>
      </div>
    </section>
  )
}
