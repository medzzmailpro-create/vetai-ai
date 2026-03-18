'use client'
import { useState } from 'react'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(250,250,248,0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #EBEBEA',
      padding: '0 24px',
    }}>
      <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', alignItems: 'center', height: 68, gap: 32 }}>
        <a href="/" style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: '#0A7C6E', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          Vetai<div style={{ width: 8, height: 8, background: '#F5A623', borderRadius: '50%' }} />
        </a>

        {/* Desktop links */}
        <ul style={{ display: 'flex', gap: 4, listStyle: 'none', flex: 1 }} className="hidden md:flex">
          {[['/#fonctionnalites','Fonctionnalités'],['/#comment-ca-marche','Comment ça marche'],['/demo','Démo'],['/pricing','Tarifs'],['/#contact','Contact']].map(([href, label]) => (
            <li key={href}>
              <a href={href} style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 600, color: '#5C5C59', textDecoration: 'none', padding: '6px 10px', borderRadius: 6, transition: 'color 0.2s' }}
                onMouseEnter={e => { (e.target as HTMLElement).style.color = '#0A7C6E'; (e.target as HTMLElement).style.background = '#E8F5F3' }}
                onMouseLeave={e => { (e.target as HTMLElement).style.color = '#5C5C59'; (e.target as HTMLElement).style.background = 'transparent' }}>
                {label}
              </a>
            </li>
          ))}
        </ul>

        <div style={{ display: 'flex', gap: 10 }}>
          <a href="/login" style={{ background: 'transparent', color: '#0A7C6E', border: '2px solid #0A7C6E', padding: '8px 16px', borderRadius: 8, fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}>
            Se connecter
          </a>
          <a href="/demo" style={{ background: '#F5A623', color: '#1a1a18', border: '2px solid #F5A623', padding: '8px 16px', borderRadius: 8, fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            Demander une démo
          </a>
        </div>

        {/* Hamburger */}
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 5, padding: 4 }}>
          <span style={{ display: 'block', width: 22, height: 2, background: '#2A2A28', borderRadius: 2 }} />
          <span style={{ display: 'block', width: 22, height: 2, background: '#2A2A28', borderRadius: 2 }} />
          <span style={{ display: 'block', width: 22, height: 2, background: '#2A2A28', borderRadius: 2 }} />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{ borderTop: '1px solid #EBEBEA', padding: '8px 24px 16px' }}>
          {[['/#fonctionnalites','Fonctionnalités'],['/#comment-ca-marche','Comment ça marche'],['/demo','Démo'],['/pricing','Tarifs'],['/#contact','Contact']].map(([href, label]) => (
            <a key={href} href={href} onClick={() => setMobileOpen(false)} style={{ display: 'block', padding: '10px 0', fontFamily: 'Syne, sans-serif', fontWeight: 600, color: '#5C5C59', textDecoration: 'none', borderBottom: '1px solid #F5F5F3' }}>
              {label}
            </a>
          ))}
        </div>
      )}
    </nav>
  )
}
