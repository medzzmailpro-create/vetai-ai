'use client'
import { useEffect, useRef } from 'react'

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const els = ref.current?.querySelectorAll('.fade-up, .fade-in')
    if (!els) return
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') })
    }, { threshold: 0.1 })
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return (
    <section ref={ref} id="hero" style={{
      minHeight: '92vh', display: 'flex', alignItems: 'center',
      background: 'linear-gradient(135deg, #F0FAF8 0%, #FAFAF8 50%, #FEF7E8 100%)',
      padding: '80px 24px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(10,124,110,0.06) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(245,166,35,0.08) 0%, transparent 40%)' }} />

      <div style={{ maxWidth: 1160, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center', position: 'relative', width: '100%' }} className="hero-grid-resp">
        {/* Left */}
        <div>
          <div className="fade-up" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600, fontFamily: 'Syne, sans-serif', letterSpacing: '0.04em', textTransform: 'uppercase', background: '#E8F5F3', color: '#0A7C6E' }}>🤖 IA Vétérinaire</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600, fontFamily: 'Syne, sans-serif', letterSpacing: '0.04em', textTransform: 'uppercase', background: '#FEF7E8', color: '#D4891A' }}>🇫🇷 Fait en France</span>
          </div>

          <h1 className="fade-up" style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(36px, 4.5vw, 58px)', fontWeight: 800, lineHeight: 1.1, color: '#141412', marginBottom: 20 }}>
            <span style={{ color: '#0A7C6E' }}>Zéro appel manqué.</span><br />Plus de rendez-vous.<br />24h/24.
          </h1>

          <p className="fade-up" style={{ fontSize: 18, lineHeight: 1.7, color: '#5C5C59', marginBottom: 36, maxWidth: 480 }}>
            L'IA vétérinaire qui travaille pendant que vous soignez. Vos ASV se concentrent sur ce qui compte vraiment : les animaux.
          </p>

          <div className="fade-up" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 48 }}>
            <a href="/demo" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 32px', borderRadius: 8, fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 600, background: '#F5A623', color: '#1a1a18', textDecoration: 'none', border: '2px solid #F5A623' }}>
              Demander une démo →
            </a>
            <a href="#how" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 32px', borderRadius: 8, fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 600, background: 'transparent', color: '#0A7C6E', textDecoration: 'none', border: '2px solid #0A7C6E' }}>
              Voir en action
            </a>
          </div>

          <div className="fade-up" style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            {[
              { val: '+35%', label: 'RDV estimés' },
              { val: '0', label: 'Appel manqué' },
              { val: '~2h', label: 'Récupérées/jour/ASV' },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: '#0A7C6E' }}>{s.val}</div>
                <div style={{ fontSize: 13, color: '#9E9E9B', fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: '#9E9E9B', marginTop: 10, fontStyle: 'italic' }}>
            * Estimations indicatives basées sur l'analyse de 50+ cliniques vétérinaires françaises.
          </p>
        </div>

        {/* Right — dashboard mock */}
        <div className="fade-in" style={{ position: 'relative' }}>
          {/* Float 1 */}
          <div style={{ position: 'absolute', top: -20, right: -20, background: 'white', borderRadius: 12, padding: '12px 16px', boxShadow: 'var(--shadow-md)', border: '1px solid #EBEBEA', fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#0A7C6E', fontSize: 18, zIndex: 2 }}>
            +32% RDV <span style={{ fontSize: 11, color: '#9E9E9B', fontWeight: 500, display: 'block' }}>ce mois-ci</span>
          </div>

          <div className="dashboard-mock">
            <div style={{ background: '#F5F5F3', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #EBEBEA' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFBD2E' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840' }} />
              <span style={{ flex: 1, fontSize: 11, color: '#9E9E9B', textAlign: 'center', fontFamily: 'Syne, sans-serif' }}>dashboard.cliniko.fr</span>
            </div>
            <div style={{ background: '#0A7C6E', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: 'white' }}>🏥 Clinique du Parc · Tableau de bord</span>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                {[['47','Appels traités'],['23','RDV semaine'],['3','En attente'],['98%','Taux réponse']].map(([v,l]) => (
                  <div key={l} style={{ background: '#F5F5F3', borderRadius: 8, padding: 12, border: '1px solid #EBEBEA' }}>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: v === '98%' ? '#D4891A' : '#0A7C6E' }}>{v}</div>
                    <div style={{ fontSize: 10, color: '#9E9E9B' }}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#9E9E9B', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Agenda du jour</div>
              {[['09:00','Bella · Urgence patte','#E53E3E'],['10:30','Milo · Suivi post-op','#DD6B20'],['14:00','Luna · Bilan annuel','#38A169']].map(([time, name, color]) => (
                <div key={time} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F5F5F3', borderRadius: 6, padding: '8px 10px', borderLeft: `4px solid ${color}`, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'Syne, sans-serif', minWidth: 38, color: '#3E3E3C' }}>{time}</span>
                  <span style={{ fontSize: 11, flex: 1, color: '#3E3E3C' }}>{name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Float 2 */}
          <div style={{ position: 'absolute', bottom: 20, right: -30, background: 'white', borderRadius: 12, padding: '12px 16px', boxShadow: 'var(--shadow-md)', border: '1px solid #EBEBEA', fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#38A169', fontSize: 16, zIndex: 2 }}>
            0 appel manqué <span style={{ fontSize: 11, color: '#9E9E9B', fontWeight: 500, display: 'block' }}>aujourd'hui</span>
          </div>
        </div>
      </div>
    </section>
  )
}
