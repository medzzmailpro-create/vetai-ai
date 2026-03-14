'use client'
import { useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Hero from '@/components/sections/Hero'
import Problem from '@/components/sections/Problem'
import Agents from '@/components/sections/Agents'
import { HowItWorks, Results } from '@/components/sections/HowItWorksResultsROI'
import Contact from '@/components/sections/Contact'

export default function LandingPage() {
  const [bannerVisible, setBannerVisible] = useState(true)

  return (
    <>
      {bannerVisible && (
        <div style={{
          background: 'linear-gradient(90deg, #065E53, #0A7C6E)',
          padding: '10px 24px',
          position: 'relative',
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: 13, color: 'white',
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 500, margin: 0,
            paddingRight: 32,
          }}>
            Réponse instantanée 24h/24 7j/7 à tous vos clients —{' '}
            <strong>avec un taux de satisfaction plus élevé que votre support actuel, ou remboursé.</strong>
            {' '}
            <a href="/pricing" style={{ color: '#F5A623', textDecoration: 'underline', fontWeight: 700 }}>
              En savoir plus →
            </a>
          </p>
          <button
            onClick={() => setBannerVisible(false)}
            aria-label="Fermer la bannière"
            style={{
              position: 'absolute', top: '50%', right: 16,
              transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.15)', border: 'none',
              color: 'white', borderRadius: '50%',
              width: 24, height: 24, cursor: 'pointer',
              fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}

      <Navbar />

      <main>
        <Hero />
        <Problem />
        <div id="fonctionnalites">
          <Agents />
        </div>
        <div id="comment-ca-marche">
          <HowItWorks />
        </div>
        <Results />
        <Contact />
      </main>

      <Footer />
    </>
  )
}
