'use client'
import { useScrollAnimation } from '@/lib/hooks/useScrollAnimation'
import { BEFORE_AFTER } from '@/lib/data'

export default function Problem() {
  const ref = useScrollAnimation()

  return (
    <section ref={ref as React.RefObject<HTMLElement>} id="problem" style={{ background: '#141412', padding: '96px 24px' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <div className="fade-up" style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#F5A623', marginBottom: 12 }}>Le problème</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 800, color: 'white', lineHeight: 1.15, marginBottom: 16 }}>
            Vos ASV passent <span style={{ color: '#F5A623' }}>40% de leur journée</span> au téléphone.
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.6)', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
            Pendant ce temps, les vraies priorités attendent. Les patients aussi.
          </p>
        </div>

        <div className="fade-up" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            <div style={{ padding: '16px 28px', fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', background: 'rgba(229,62,62,0.15)', color: '#E53E3E' }}>❌ Sans Vetai.AI</div>
            <div style={{ padding: '16px 28px', fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', background: 'rgba(56,161,105,0.15)', color: '#38A169' }}>✅ Avec Vetai.AI</div>
          </div>
          {BEFORE_AFTER.map((row, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ padding: '16px 28px', fontSize: 14, color: 'rgba(255,255,255,0.5)', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>{row.before}</div>
              <div style={{ padding: '16px 28px', fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10 }}>{row.after}</div>
            </div>
          ))}
        </div>

        <div className="fade-up" style={{ marginTop: 40, padding: '28px 36px', background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)', borderRadius: 12, textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, lineHeight: 1.7 }}>
            <strong style={{ color: '#F5A623' }}>Vetai.AI change ça.</strong> 6 agents IA travaillent pour vous 24h/24 et libèrent votre équipe pour ce qui compte vraiment : les animaux.
          </p>
        </div>
      </div>
    </section>
  )
}
