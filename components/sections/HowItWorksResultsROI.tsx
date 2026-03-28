'use client'
import { useEffect, useRef, useState } from 'react'
import { useScrollAnimation } from '@/lib/hooks/useScrollAnimation'
import { HOW_STEPS, STATS } from '@/lib/data'

export function HowItWorks() {
  const ref = useScrollAnimation()
  return (
    <section ref={ref as React.RefObject<HTMLElement>} id="how" style={{ background: '#F5F5F3', padding: '96px 24px' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <div className="fade-up" style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#0A7C6E', marginBottom: 12 }}>Comment ça marche</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 800, color: '#141412', lineHeight: 1.15, marginBottom: 16 }}>
            Opérationnel en <span style={{ color: '#0A7C6E' }}>moins d'une semaine</span>
          </h2>
          <p style={{ fontSize: 17, color: '#5C5C59', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>Pas de compétence technique requise. Notre équipe gère tout, de A à Z.</p>
        </div>

        <div className="fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 36, left: '10%', right: '10%', height: 2, background: 'linear-gradient(90deg, #0A7C6E 0%, #0D9E8D 100%)', zIndex: 0 }} />
          {HOW_STEPS.map(step => (
            <div key={step.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 16px', position: 'relative', zIndex: 1 }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'white', border: '2px solid #0A7C6E', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, fontSize: 24, boxShadow: '0 0 0 8px #F5F5F3' }}>
                {step.icon}
              </div>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: '#141412', marginBottom: 8 }}>{step.title}</h3>
              <p style={{ fontSize: 13, color: '#5C5C59', lineHeight: 1.6 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Results() {
  const ref = useScrollAnimation()
  const [vals, setVals] = useState(STATS.map(() => 0))
  const animated = useRef(false)

  useEffect(() => {
    const section = document.getElementById('results')
    if (!section) return
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting && !animated.current) {
          animated.current = true
          STATS.forEach((stat, i) => {
            let start = -1
            const animate = (ts: number) => {
              if (start === -1) start = ts
              const progress = Math.min((ts - start) / 1500, 1)
              setVals(prev => { const next = [...prev]; next[i] = Math.floor(progress * stat.target); return next })
              if (progress < 1) requestAnimationFrame(animate)
            }
            requestAnimationFrame(animate)
          })
        }
      })
    }, { threshold: 0.15 })
    obs.observe(section)
    return () => obs.disconnect()
  }, [])

  return (
    <section ref={ref as React.RefObject<HTMLElement>} id="results" style={{ background: 'linear-gradient(135deg, #065E53 0%, #0A7C6E 100%)', padding: '96px 24px' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <div className="fade-up" style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#F5A623', marginBottom: 12 }}>Objectifs visés</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 800, color: 'white', lineHeight: 1.15, marginBottom: 16 }}>
            Des résultats <span style={{ color: '#F5A623' }}>dès les premières semaines</span>
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.6)', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
            Estimations basées sur les benchmarks du secteur vétérinaire français 2024.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }} className="stats-grid-resp">
          {STATS.map((stat, i) => (
            <div key={stat.id} className="fade-up" style={{ transitionDelay: `${i * 0.1}s`, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '36px 24px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 48, fontWeight: 800, color: 'white', lineHeight: 1, marginBottom: 8 }}>
                {stat.prefix}{vals[i]}{stat.suffix}
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{stat.label}</div>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 24, fontStyle: 'italic' }}>
          Ces chiffres sont des objectifs indicatifs. Les résultats réels dépendent de votre volume d'appels et de vos pratiques actuelles.
        </p>
      </div>
    </section>
  )
}

export function ROICalculator() {
  const ref = useScrollAnimation()
  const [appels, setAppels] = useState(8)
  const [ca, setCa] = useState(75)
  const [conv, setConv] = useState(60)
  const [jours, setJours] = useState(22)

  const rdvMois = Math.round(appels * conv / 100 * jours)
  const perteMois = Math.round(rdvMois * ca)
  const retour = Math.round((3490 + 249) / (perteMois / 4.3))

  return (
    <section ref={ref as React.RefObject<HTMLElement>} id="roi" style={{ background: '#F5F5F3', padding: '96px 24px' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <div className="fade-up" style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#0A7C6E', marginBottom: 12 }}>Calculateur ROI</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 800, color: '#141412', lineHeight: 1.15, marginBottom: 16 }}>
            Combien perdez-vous <span style={{ color: '#0A7C6E' }}>en ce moment ?</span>
          </h2>
          <p style={{ fontSize: 17, color: '#5C5C59', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>Estimez en 30 secondes ce que Vetai vous rapporte réellement.</p>
        </div>

        <div className="fade-up" style={{ background: 'white', border: '1px solid #EBEBEA', borderRadius: 20, padding: 40, boxShadow: 'var(--shadow-md)', maxWidth: 820, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }} className="roi-grid-resp">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {[
                { label: 'Appels manqués par jour', val: appels, set: setAppels, min: 1, max: 30, fmt: (v: number) => String(v) },
                { label: 'CA moyen par consultation (€)', val: ca, set: setCa, min: 30, max: 200, fmt: (v: number) => String(v) },
                { label: 'Taux de conversion appel → RDV', val: conv, set: setConv, min: 20, max: 90, fmt: (v: number) => v + '%' },
                { label: 'Jours ouvrés par mois', val: jours, set: setJours, min: 15, max: 26, fmt: (v: number) => String(v) },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, color: '#3E3E3C' }}>{s.label}</span>
                    <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 800, color: '#0A7C6E' }}>{s.fmt(s.val)}</span>
                  </div>
                  <input type="range" min={s.min} max={s.max} value={s.val} onChange={e => s.set(Number(e.target.value))} />
                </div>
              ))}
            </div>

            <div style={{ background: '#E8F5F3', borderRadius: 12, padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <div style={{ fontSize: 13, color: '#5C5C59', fontWeight: 500, marginBottom: 4 }}>💸 CA potentiellement perdu / mois</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: '#0A7C6E' }}>{perteMois.toLocaleString('fr-FR')} €</div>
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#5C5C59', fontWeight: 500, marginBottom: 4 }}>📅 RDV récupérables / mois</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: '#0A7C6E' }}>{rdvMois} RDV</div>
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#5C5C59', fontWeight: 500, marginBottom: 4 }}>🚀 Vetai Pro amorti en</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: '#D4891A' }}>
                  {retour <= 52 ? `< ${retour} sem.` : '> 1 an'}
                </div>
              </div>
              <p style={{ fontSize: 11, color: '#9E9E9B', fontStyle: 'italic', marginTop: -8 }}>Estimation indicative. Résultats réels variables.</p>
              <a href="#contact" style={{ display: 'flex', justifyContent: 'center', padding: '15px 24px', background: '#F5A623', color: '#1a1a18', borderRadius: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, textDecoration: 'none', fontSize: 15 }}>
                Je veux récupérer ce CA →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
