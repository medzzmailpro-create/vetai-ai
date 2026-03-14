'use client'
import { useState } from 'react'
import { useScrollAnimation } from '@/lib/hooks/useScrollAnimation'
import { FAQ } from '@/lib/data'

export default function FAQSection() {
  const ref = useScrollAnimation()
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section ref={ref as React.RefObject<HTMLElement>} id="faq" style={{ background: '#F5F5F3', padding: '96px 24px' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <div className="fade-up" style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#0A7C6E', marginBottom: 12 }}>FAQ</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 800, color: '#141412', lineHeight: 1.15 }}>
            Questions <span style={{ color: '#0A7C6E' }}>fréquentes</span>
          </h2>
        </div>

        <div className="fade-up" style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {FAQ.map((item, i) => (
            <div key={i} style={{ border: '1px solid #EBEBEA', borderRadius: 8, background: 'white', overflow: 'hidden' }}>
              <button onClick={() => setOpen(open === i ? null : i)}
                style={{ width: '100%', padding: '18px 24px', fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 600, color: '#2A2A28', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, background: 'none', border: 'none', textAlign: 'left' }}>
                {item.q}
                <span style={{ fontSize: 18, transition: 'transform 0.3s', transform: open === i ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>▾</span>
              </button>
              <div style={{ maxHeight: open === i ? 300 : 0, overflow: 'hidden', transition: 'max-height 0.35s ease' }}>
                <p style={{ padding: '0 24px 18px', fontSize: 14, color: '#5C5C59', lineHeight: 1.7 }}>{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
