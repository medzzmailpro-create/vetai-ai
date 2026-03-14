'use client'
import { useScrollAnimation } from '@/lib/hooks/useScrollAnimation'
import { AGENTS } from '@/lib/data'

export default function Agents() {
  const ref = useScrollAnimation()

  return (
    <section ref={ref as React.RefObject<HTMLElement>} id="agents" style={{ background: '#FAFAF8', padding: '96px 24px' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <div className="fade-up" style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#0A7C6E', marginBottom: 12 }}>Fonctionnalités</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 800, color: '#141412', lineHeight: 1.15, marginBottom: 16 }}>
            6 agents IA, une clinique qui tourne <span style={{ color: '#0A7C6E' }}>toute seule</span>
          </h2>
          <p style={{ fontSize: 17, color: '#5C5C59', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
            Chaque agent est spécialisé, entraîné sur les pratiques vétérinaires françaises.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }} className="agents-grid-resp">
          {AGENTS.map((agent, i) => (
            <div key={agent.title} className="fade-up" style={{ transitionDelay: `${i * 0.05}s`, background: 'white', border: '1px solid #EBEBEA', borderRadius: 12, padding: 28, transition: 'all 0.3s ease', cursor: 'default', position: 'relative', overflow: 'hidden' }}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.transform = 'translateY(-4px)'
                el.style.boxShadow = 'var(--shadow-md)'
                el.style.borderColor = 'rgba(10,124,110,0.2)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.transform = ''
                el.style.boxShadow = ''
                el.style.borderColor = '#EBEBEA'
              }}>
              <div style={{ fontSize: 28, marginBottom: 14 }}>{agent.emoji}</div>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: '#141412', marginBottom: 8 }}>{agent.title}</h3>
              <p style={{ fontSize: 13.5, color: '#5C5C59', lineHeight: 1.6 }}>{agent.desc}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 36 }}>
          <div className="fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 24px', background: '#E8F5F3', borderRadius: 8, fontSize: 14, color: '#0A7C6E', fontWeight: 500 }}>
            🔒 Tous les agents fonctionnent en parallèle, 24h/24, sans interruption
          </div>
        </div>
      </div>
    </section>
  )
}
