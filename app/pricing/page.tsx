'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useScrollAnimation } from '@/lib/hooks/useScrollAnimation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase/client'

const PLACES_RESTANTES = parseInt(process.env.NEXT_PUBLIC_PLACES_RESTANTES ?? '3', 10)

// ── Value Stack ──────────────────────────────────────────────────────────────
const VALUE_STACK = [
  { icon: '🤙', label: 'Réceptionniste IA 24h/24 — Répond, trie et transfère chaque appel', value: '2 400€/mois', bonus: false },
  { icon: '📅', label: 'Gestionnaire RDV automatique — Zéro double réservation, agenda toujours plein', value: '800€/mois', bonus: false },
  { icon: '💉', label: 'Rappels vaccins automatisés — Aucun animal oublié, aucun client perdu', value: '600€/mois', bonus: false },
  { icon: '🚨', label: "Qualificateur d'urgences — Triage intelligent en temps réel", value: '400€/mois', bonus: false },
  { icon: '📊', label: 'Rapports hebdomadaires automatiques — Pilotez votre clinique sans effort', value: '300€/mois', bonus: false },
  { icon: '🔄', label: 'Synchronisation agenda — Vetup, Asivet, Medialog, Agreda', value: '500€/mois', bonus: false },
  { icon: '💬', label: 'BONUS · Suivi centralisé email + SMS + téléphone', value: '400€/mois', bonus: true },
  { icon: '🎯', label: 'BONUS · Support prioritaire dédié — Réponse sous 2h', value: '300€/mois', bonus: true },
  { icon: '🎓', label: 'BONUS · Onboarding complet + formation de toute votre équipe', value: '1 500€', bonus: true },
]

// ── Avant / Après ────────────────────────────────────────────────────────────
const BEFORE_AFTER = [
  { before: '📵 15 appels non répondus chaque jour', after: 'Chaque appel pris en charge, 24h/24 — même la nuit, même le week-end' },
  { before: '💸 ~20 000€ de CA évaporés chaque mois', after: 'Zéro consultation manquée. Agenda rempli automatiquement' },
  { before: '💉 Rappels vaccins oubliés = clients perdus', after: 'Rappels envoyés automatiquement — le client revient sans y penser' },
  { before: '🚑 Urgences mal triées, équipe débordée', after: 'Chaque urgence qualifiée, routée et notifiée en temps réel' },
  { before: '📋 Rapports manuels : 3h perdues chaque semaine', after: 'Rapport complet dans votre boîte mail chaque lundi matin' },
]

// ── FAQ ──────────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: "L'IA comprend-elle vraiment le vocabulaire vétérinaire ?",
    a: "Oui. Nos agents sont entraînés spécifiquement sur le domaine vétérinaire : urgences, protocoles vaccin, races, chirurgie, médicaments courants. Ce n'est pas une IA générique qu'on a juste renommée.",
  },
  {
    q: "Que se passe-t-il si l'IA ne sait pas répondre ?",
    a: "L'agent transfère automatiquement vers votre équipe avec un résumé de l'échange. Vous gardez le contrôle total. Chaque interaction est enregistrée et consultable dans votre dashboard.",
  },
  {
    q: "Compatible avec notre logiciel actuel — Vetup, Asivet, Agreda ?",
    a: "Oui. L'intégration est gérée par notre équipe lors de l'onboarding — vous ne touchez à rien. Compatible avec Vetup, Asivet, Medialog, Agreda et la plupart des logiciels vétérinaires français.",
  },
  {
    q: "Est-ce qu'il y a un engagement minimum ?",
    a: "Non. Résiliable à tout moment, sans frais ni pénalité. Mais nos clients ne partent pas — le ROI est trop évident dès le premier mois.",
  },
  {
    q: "Que se passe-t-il si ça ne change rien pour notre clinique ?",
    a: "On vous rembourse intégralement l'installation dans les 30 jours. Sans condition, sans question, sans discussion. C'est une promesse écrite dans votre contrat.",
  },
  {
    q: "Combien de temps pour être opérationnel ?",
    a: "48 heures. Notre équipe installe, configure et forme votre équipe. Vous ne touchez à rien. Le lundi vous signez, le mercredi La Sentinelle veille sur votre clinique.",
  },
  {
    q: "Pourquoi le prix va passer à 349€/mois ?",
    a: "Pour chaque nouvelle clinique, nous dédions un ingénieur à l'onboarding et un account manager au suivi continu. Au-delà de 20 cliniques actives, le coût de service augmente structurellement. Les premières cliniques gardent 249€/mois à vie — c'est contractuel.",
  },
]

// ── Composant FAQ ────────────────────────────────────────────────────────────
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{
      background: 'white', borderRadius: 12,
      border: open ? '1.5px solid #0A7C6E' : '1px solid #EBEBEA',
      overflow: 'hidden', transition: 'border-color 0.2s',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', padding: '16px 20px',
          background: 'none', border: 'none', cursor: 'pointer', gap: 12,
        }}
      >
        <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 600, color: '#2A2A28', textAlign: 'left' as const }}>
          {question}
        </span>
        <span style={{
          flexShrink: 0, width: 24, height: 24, borderRadius: '50%',
          background: open ? '#0A7C6E' : '#F5F5F3',
          color: open ? 'white' : '#5C5C59',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 300, lineHeight: 1,
          transition: 'background 0.2s, color 0.2s, transform 0.2s',
          transform: open ? 'rotate(45deg)' : 'none',
        }}>+</span>
      </button>
      {open && (
        <div style={{ padding: '0 20px 16px', fontSize: 14, color: '#5C5C59', lineHeight: 1.75 }}>
          {answer}
        </div>
      )}
    </div>
  )
}

// ── Page Pricing ─────────────────────────────────────────────────────────────
export default function Pricing() {
  const ref = useScrollAnimation()
  const router = useRouter()
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')

  const handleCheckout = async () => {
    setCheckoutError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/register?plan=sentinelle')
      return
    }
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setCheckoutError(data.error ?? 'Erreur lors de la redirection vers le paiement.')
        setCheckoutLoading(false)
      }
    } catch {
      setCheckoutError('Erreur réseau. Veuillez réessayer.')
      setCheckoutLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <section ref={ref as React.RefObject<HTMLElement>} id="pricing" style={{ background: '#F5F5F3', padding: '0 24px 120px' }}>

        {/* ══ BARRE URGENCE STICKY ════════════════════════════════ */}
        <div style={{
          background: 'linear-gradient(90deg, #0A7C6E, #0B9485)',
          padding: '11px 24px', textAlign: 'center',
          position: 'sticky', top: 68, zIndex: 90,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: 'white', margin: 0 }}>
            🚀 Tarif de lancement garanti à vie ·{' '}
            <span style={{ color: '#FFD166' }}>
              {PLACES_RESTANTES} place{PLACES_RESTANTES > 1 ? 's' : ''} restante{PLACES_RESTANTES > 1 ? 's' : ''}
            </span>
            {' '}· Passe à 349€ HT/mois + 890€ HT d&apos;installation après les 20 premières cliniques
          </p>
        </div>

        <div style={{ maxWidth: 720, margin: '0 auto' }}>

          {/* ══ EN-TÊTE : DOULEUR → PROMESSE ══════════════════════ */}
          <div style={{ textAlign: 'center', padding: '64px 0 40px' }}>

            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.4)',
              borderRadius: 100, padding: '6px 18px', marginBottom: 24,
            }}>
              <span style={{ fontSize: 14 }}>🔥</span>
              <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#C47B0E' }}>
                Offre de lancement — {PLACES_RESTANTES} places restantes
              </span>
            </div>

            <p style={{ fontSize: 15, color: '#9E9E9B', fontWeight: 500, marginBottom: 8, letterSpacing: '-0.01em' }}>
              Votre clinique perd en moyenne
            </p>
            <div style={{
              fontFamily: 'Syne, sans-serif', fontSize: 'clamp(48px, 8vw, 80px)', fontWeight: 800,
              color: '#141412', lineHeight: 1, letterSpacing: '-0.03em', marginBottom: 8,
            }}>
              20 000€
            </div>
            <p style={{ fontSize: 16, color: '#5C5C59', marginBottom: 32, lineHeight: 1.65 }}>
              chaque mois à cause des appels manqués, des no-shows<br />et des rappels vaccins oubliés.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginBottom: 32 }}>
              <div style={{ height: 1, width: 48, background: '#D4D4D2' }} />
              <span style={{ fontSize: 13, color: '#9E9E9B', fontWeight: 500 }}>La solution</span>
              <div style={{ height: 1, width: 48, background: '#D4D4D2' }} />
            </div>

            <h1 style={{
              fontFamily: 'Syne, sans-serif', fontSize: 'clamp(26px, 3.5vw, 44px)',
              fontWeight: 800, color: '#141412', lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: 16,
            }}>
              Votre clinique tourne seule.<br />
              <span style={{ color: '#0A7C6E' }}>24h/24. Sans recruter personne.</span>
            </h1>
            <p style={{ fontSize: 16, color: '#5C5C59', lineHeight: 1.75, maxWidth: 520, margin: '0 auto' }}>
              Un seul système IA qui répond à vos appels, remplit votre agenda, rappelle vos clients
              et qualifie vos urgences — synchronisé avec votre logiciel vétérinaire.
            </p>
          </div>

          {/* ══ AVANT / APRÈS ════════════════════════════════════ */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ background: 'white', borderRadius: 20, border: '1px solid #EBEBEA', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <div style={{ background: '#FEF2F2', padding: '12px 20px', textAlign: 'center', borderBottom: '1px solid #FEE2E2' }}>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700, color: '#991B1B', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
                    Aujourd&apos;hui sans Vetai
                  </span>
                </div>
                <div style={{ background: '#F0FAF9', padding: '12px 20px', textAlign: 'center', borderBottom: '1px solid #D1FAF6', borderLeft: '1px solid #EBEBEA' }}>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700, color: '#0A7C6E', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
                    Avec La Sentinelle
                  </span>
                </div>
              </div>
              {BEFORE_AFTER.map((item, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr',
                  borderBottom: i < BEFORE_AFTER.length - 1 ? '1px solid #F5F5F3' : 'none',
                }}>
                  <div style={{ padding: '14px 20px', fontSize: 13, color: '#7F1D1D', lineHeight: 1.55, background: i % 2 === 0 ? 'white' : '#FAFAF8' }}>
                    {item.before}
                  </div>
                  <div style={{ padding: '14px 20px', fontSize: 13, color: '#065F46', lineHeight: 1.55, borderLeft: '1px solid #EBEBEA', background: i % 2 === 0 ? '#FDFFFE' : '#F5FFFE' }}>
                    ✅ {item.after}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ══ BANNIÈRE PROMESSE ════════════════════════════════ */}
          <div style={{
            background: '#0A7C6E', borderRadius: 16, padding: '22px 28px',
            marginBottom: 28, display: 'flex', alignItems: 'flex-start', gap: 14,
          }}>
            <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>⚡</span>
            <p style={{ fontSize: 15, color: 'white', lineHeight: 1.7, margin: 0 }}>
              <strong style={{ fontFamily: 'Syne, sans-serif' }}>
                Votre clinique répond à chaque appel, chaque message, chaque urgence — 24h/24, 7j/7 — sans recruter un seul employé supplémentaire.
              </strong>
              {' '}Résultat garanti ou remboursé.
            </p>
          </div>

          {/* ══ PACK LA SENTINELLE ══════════════════════════════ */}
          <div
            id="pack"
            style={{
              background: 'white', borderRadius: 24,
              border: '2px solid #0A7C6E',
              boxShadow: '0 20px 60px rgba(10,124,110,0.15), 0 4px 16px rgba(0,0,0,0.06)',
              padding: '56px 40px 44px', position: 'relative',
            }}
          >
            {/* Badge top */}
            <div style={{
              position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)',
              background: 'linear-gradient(90deg, #F5A623, #FFB940)',
              color: '#1a1a18', fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700,
              padding: '6px 24px', borderRadius: 100, whiteSpace: 'nowrap' as const,
              boxShadow: '0 4px 12px rgba(245,166,35,0.35)', letterSpacing: '0.04em',
            }}>
              ⭐ ACCÈS LANCEMENT — TARIF GARANTI À VIE
            </div>

            {/* Nom du pack */}
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <div style={{
                fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: '#9E9E9B', marginBottom: 10,
              }}>
                Votre système IA vétérinaire tout-en-un
              </div>
              <div style={{
                fontFamily: 'Syne, sans-serif', fontSize: 42, fontWeight: 800,
                color: '#141412', letterSpacing: '-0.03em', marginBottom: 10, lineHeight: 1,
              }}>
                La Sentinelle
              </div>
              <div style={{ fontSize: 15, color: '#5C5C59', lineHeight: 1.65, maxWidth: 440, margin: '0 auto' }}>
                L&apos;IA qui veille sur votre clinique jour et nuit — appels, agenda, urgences, rappels, rapports.
                Tout automatisé. Rien à gérer.
              </div>
            </div>

            {/* Stats ROI */}
            <div style={{
              margin: '28px 0',
              background: '#F0FAF9', border: '1px solid rgba(10,124,110,0.15)',
              borderRadius: 14, padding: '18px 20px',
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, textAlign: 'center',
            }}>
              {[
                { val: '15+', unit: 'appels/jour', label: 'récupérés' },
                { val: '48h', unit: '', label: 'pour être opérationnel' },
                { val: 'x19', unit: '', label: 'retour sur investissement' },
              ].map(stat => (
                <div key={stat.label}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: '#0A7C6E', lineHeight: 1 }}>
                    {stat.val}
                    {stat.unit && <span style={{ fontSize: 12, fontWeight: 600 }}> {stat.unit}</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#5C5C59', marginTop: 5, lineHeight: 1.4 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Urgence */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              background: '#FEF7E8', border: '1px solid rgba(245,166,35,0.4)',
              borderRadius: 10, padding: '12px 16px', marginBottom: 28,
            }}>
              <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>⚡</span>
              <span style={{ fontSize: 13, color: '#B8710F', lineHeight: 1.55 }}>
                <strong style={{ fontFamily: 'Syne, sans-serif', color: '#92570C' }}>
                  Ce tarif est garanti à vie pour les premières cliniques.
                </strong>
                {' '}Dès que nous atteignons 20 cliniques, le mensuel passe à 349€ HT/mois + 890€ HT d&apos;installation.{' '}
                <strong style={{ color: '#92570C' }}>
                  Il reste {PLACES_RESTANTES} place{PLACES_RESTANTES > 1 ? 's' : ''} — c&apos;est contractuel.
                </strong>
              </span>
            </div>

            {/* PRIX */}
            <div style={{
              display: 'flex', justifyContent: 'center', gap: 0,
              marginBottom: 36, padding: '28px 0',
              borderTop: '1px solid #EBEBEA', borderBottom: '1px solid #EBEBEA',
            }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 11, color: '#9E9E9B', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>
                  Installation
                </div>
                <div style={{ fontSize: 14, color: '#C0C0BE', textDecoration: 'line-through', marginBottom: 4 }}>890€ HT</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 34, fontWeight: 800, color: '#141412', lineHeight: 1 }}>490€ HT</div>
                <div style={{ fontSize: 12, color: '#9E9E9B', marginTop: 6 }}>paiement unique · tarif lancement</div>
                <div style={{ marginTop: 8, display: 'inline-block', background: '#E8F5F3', color: '#0A7C6E', fontSize: 11, fontWeight: 700, fontFamily: 'Syne, sans-serif', padding: '2px 8px', borderRadius: 4 }}>
                  −400€
                </div>
              </div>

              <div style={{ width: 1, background: '#EBEBEA', margin: '0 24px' }} />

              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 11, color: '#9E9E9B', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>
                  Mensuel
                </div>
                <div style={{ fontSize: 14, color: '#C0C0BE', textDecoration: 'line-through', marginBottom: 4 }}>349€ HT/mois</div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 1 }}>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#0A7C6E', marginTop: 8 }}>€</span>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 54, fontWeight: 800, color: '#0A7C6E', lineHeight: 1 }}>249</span>
                </div>
                <div style={{ fontSize: 12, color: '#9E9E9B', marginTop: 6 }}>HT/mois · tarif lancement garanti à vie</div>
                <div style={{ marginTop: 8, display: 'inline-block', background: '#E8F5F3', color: '#0A7C6E', fontSize: 11, fontWeight: 700, fontFamily: 'Syne, sans-serif', padding: '2px 8px', borderRadius: 4 }}>
                  −100€/mois
                </div>
              </div>
            </div>

            {/* COMPARAISON CONCURRENCE */}
            <div style={{ background: '#FAFAF8', borderRadius: 14, border: '1px solid #EBEBEA', padding: '18px 20px', marginBottom: 32 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#9E9E9B', marginBottom: 14, textAlign: 'center' }}>
                Ce que vous payez ailleurs pour bien moins
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: '1 standardiste à mi-temps', price: '1 200€/mois', sub: 'Congés, arrêts, charges, formation continue' },
                  { label: 'Vetup + Asivet + logiciel rappels', price: '250€/mois', sub: 'Sans IA, sans 24h/24, sans qualification urgences' },
                  { label: 'Agence de prise de RDV externalisée', price: '800€/mois', sub: 'Horaires limités, scripts rigides, pas de suivi' },
                ].map(comp => (
                  <div key={comp.label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', background: 'white', borderRadius: 8,
                    border: '1px solid #F0F0EE', gap: 12,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: '#3E3E3C', fontWeight: 500 }}>{comp.label}</div>
                      <div style={{ fontSize: 11, color: '#9E9E9B', marginTop: 2 }}>{comp.sub}</div>
                    </div>
                    <div style={{ fontSize: 13, color: '#991B1B', fontWeight: 700, fontFamily: 'Syne, sans-serif', flexShrink: 0, textDecoration: 'line-through' }}>
                      {comp.price}
                    </div>
                  </div>
                ))}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px', background: '#F0FAF9', borderRadius: 8,
                  border: '1.5px solid rgba(10,124,110,0.3)', gap: 12,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: '#0A7C6E', fontWeight: 700, fontFamily: 'Syne, sans-serif' }}>✅ La Sentinelle — Vetai</div>
                    <div style={{ fontSize: 11, color: '#5C5C59', marginTop: 2 }}>Tout inclus · 24h/24 · IA vétérinaire · Synchro agenda complète</div>
                  </div>
                  <div style={{ fontSize: 16, color: '#0A7C6E', fontWeight: 800, fontFamily: 'Syne, sans-serif', flexShrink: 0 }}>249€ HT/mois</div>
                </div>
              </div>
            </div>

            {/* VALUE STACK */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#9E9E9B', marginBottom: 16, textAlign: 'center' }}>
                Tout ce qui est inclus
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {VALUE_STACK.map(item => (
                  <div key={item.label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '11px 16px',
                    background: item.bonus ? 'rgba(245,166,35,0.06)' : '#FAFAF8',
                    borderRadius: 10,
                    border: item.bonus ? '1px solid rgba(245,166,35,0.25)' : '1px solid #F0F0EE',
                    gap: 12,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                      <span style={{ fontSize: 17, flexShrink: 0 }}>{item.icon}</span>
                      <span style={{ fontSize: 13, color: '#3E3E3C', lineHeight: 1.45 }}>{item.label}</span>
                    </div>
                    <span />
                  </div>
                ))}
              </div>

              {/* Total valeur */}
              <div style={{
                background: 'linear-gradient(135deg, #F0FAF9, #E8F5F3)',
                border: '1.5px solid rgba(10,124,110,0.2)',
                borderRadius: 14, padding: '18px 22px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#0A7C6E', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 2 }}>
                      Vous payez
                    </div>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 30, fontWeight: 800, color: '#0A7C6E' }}>
                      249€ HT/mois
                    </div>
                  </div>
                </div>
                <div style={{ paddingTop: 10, borderTop: '1px solid rgba(10,124,110,0.12)', fontSize: 13, color: '#5C5C59' }}>
                  🎓 <strong>Onboarding</strong> —{' '}
                  <span style={{ color: '#0A7C6E', fontWeight: 700 }}>compris</span>
                </div>
              </div>
            </div>

            {/* GARANTIE */}
            <div style={{
              background: '#FEF7E8', border: '1.5px solid rgba(245,166,35,0.4)',
              borderRadius: 14, padding: '20px 22px', marginBottom: 28, textAlign: 'center',
            }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 800, color: '#92570C', marginBottom: 10 }}>
                🛡️ Garantie résultats — 30 jours
              </div>
              <p style={{ fontSize: 14, color: '#B8710F', lineHeight: 1.7, margin: 0 }}>
                Si dans les 30 premiers jours votre satisfaction client n&apos;augmente pas, vos no-shows ne diminuent pas,
                et votre équipe n&apos;est pas convaincue —{' '}
                <strong>on vous rembourse intégralement l&apos;installation. Sans condition. Sans question. Sans discussion.</strong>
              </p>
              <div style={{ marginTop: 12, fontSize: 12, color: '#C47B0E', fontStyle: 'italic' }}>
                C&apos;est une promesse écrite dans votre contrat, pas juste une phrase marketing.
              </div>
            </div>

            {/* PHRASE DE CLÔTURE */}
            <div style={{ textAlign: 'center', marginBottom: 28, padding: '0 8px' }}>
              <p style={{ fontSize: 15, color: '#3E3E3C', fontStyle: 'italic', lineHeight: 1.8, margin: 0 }}>
                &ldquo;La vraie question n&apos;est pas combien ça coûte.<br />
                C&apos;est combien vous coûte chaque appel manqué, chaque no-show, chaque rappel vaccin oublié.&rdquo;
              </p>
              <p style={{ fontSize: 14, color: '#5C5C59', marginTop: 12, lineHeight: 1.65 }}>
                La Sentinelle règle tout ça pour <strong style={{ color: '#0A7C6E' }}>moins cher qu&apos;un mi-temps</strong>.<br />
                Et contrairement à un mi-temps, elle ne prend pas de congés.
              </p>
            </div>

            {/* CTA PRINCIPAL */}
            <button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              style={{
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                gap: 10, width: '100%',
                background: checkoutLoading
                  ? 'linear-gradient(135deg, #5BAD9F 0%, #5BBDAE 100%)'
                  : 'linear-gradient(135deg, #0A7C6E 0%, #0D9E8D 100%)',
                color: 'white', border: 'none',
                cursor: checkoutLoading ? 'not-allowed' : 'pointer',
                padding: '20px 32px', borderRadius: 14,
                fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 700,
                boxShadow: '0 6px 24px rgba(10,124,110,0.35)',
                letterSpacing: '-0.01em',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => {
                if (!checkoutLoading) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 12px 36px rgba(10,124,110,0.45)'
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = ''
                e.currentTarget.style.boxShadow = '0 6px 24px rgba(10,124,110,0.35)'
              }}
            >
              {checkoutLoading ? 'Redirection vers le paiement…' : 'Activer La Sentinelle — 249€ HT/mois →'}
            </button>

            {checkoutError && (
              <p style={{ textAlign: 'center', fontSize: 13, color: '#C53030', marginTop: 8, fontWeight: 500 }}>
                ⚠️ {checkoutError}
              </p>
            )}

            <p style={{ textAlign: 'center', fontSize: 12, color: '#9E9E9B', marginTop: 10 }}>
              ⚡ Opérationnel en 48h · Formation incluse · Sans engagement · Garanti 30 jours
            </p>

            {/* Badges confiance */}
            <div style={{
              marginTop: 24, paddingTop: 20, borderTop: '1px solid #EBEBEA',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 20, flexWrap: 'wrap',
            }}>
              {[
                { icon: '🔒', label: 'RGPD conforme' },
                { icon: '🇫🇷', label: 'Hébergé en France' },
                { icon: '⚡', label: 'En ligne en 48h' },
                { icon: '🎓', label: 'Formation incluse' },
              ].map(b => (
                <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#5C5C59', fontWeight: 500 }}>
                  <span style={{ fontSize: 14 }}>{b.icon}</span>
                  {b.label}
                </div>
              ))}
            </div>
          </div>

          {/* ══ SOCIAL PROOF ═══════════════════════════════════════ */}
          <div style={{
            marginTop: 40, display: 'flex', justifyContent: 'center', alignItems: 'center',
            gap: 6, flexWrap: 'wrap',
          }}>
            {['🏥 Déjà utilisé par des cliniques vétérinaires en France', '⚡ Opérationnel en 48h', '🇫🇷 Support français'].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {i > 0 && <span style={{ color: '#D4D4D2', fontSize: 14 }}>·</span>}
                <span style={{ fontSize: 13, color: '#5C5C59', fontWeight: 500 }}>{item}</span>
              </div>
            ))}
          </div>

          {/* ══ FAQ ═══════════════════════════════════════════════ */}
          <div style={{ marginTop: 48 }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: '#141412', textAlign: 'center', marginBottom: 10, letterSpacing: '-0.01em' }}>
              Vous avez encore des doutes ?
            </h3>
            <p style={{ textAlign: 'center', fontSize: 14, color: '#9E9E9B', marginBottom: 28 }}>
              Voici les vraies questions que posent les vétérinaires avant de s&apos;engager.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {FAQ_ITEMS.map(faq => (
                <FaqItem key={faq.q} question={faq.q} answer={faq.a} />
              ))}
            </div>
          </div>

          {/* ══ CTA FINAL DARK ═════════════════════════════════════ */}
          <div style={{
            marginTop: 56, textAlign: 'center',
            padding: '52px 36px',
            background: '#141412', borderRadius: 24,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(10,124,110,0.25) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', bottom: -40, left: -40, width: 160, height: 160, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(10,124,110,0.15) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.3)',
              borderRadius: 100, padding: '5px 14px', marginBottom: 20,
            }}>
              <span style={{ fontSize: 12 }}>🔥</span>
              <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700, color: '#FFB940', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
                {PLACES_RESTANTES} place{PLACES_RESTANTES > 1 ? 's' : ''} restante{PLACES_RESTANTES > 1 ? 's' : ''}
              </span>
            </div>

            <h2 style={{
              fontFamily: 'Syne, sans-serif', fontSize: 'clamp(22px, 3vw, 36px)',
              fontWeight: 800, color: 'white', lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: 14,
            }}>
              Chaque jour sans La Sentinelle,<br />
              <span style={{ color: '#0D9E8D' }}>c&apos;est des appels perdus et de l&apos;argent laissé sur la table.</span>
            </h2>
            <p style={{ fontSize: 15, color: '#9E9E9B', lineHeight: 1.7, marginBottom: 28, maxWidth: 440, margin: '0 auto 28px' }}>
              249€ HT/mois. Moins cher qu&apos;un mi-temps. ROI garanti dès la première semaine. Remboursé si insatisfait.
            </p>

            <button
              onClick={handleCheckout}
              style={{
                display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: 10,
                background: 'linear-gradient(135deg, #0A7C6E 0%, #0D9E8D 100%)',
                color: 'white', border: 'none', cursor: 'pointer',
                padding: '18px 44px', borderRadius: 12,
                fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700,
                boxShadow: '0 6px 24px rgba(10,124,110,0.5)',
                letterSpacing: '-0.01em',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 12px 36px rgba(10,124,110,0.6)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = ''
                e.currentTarget.style.boxShadow = '0 6px 24px rgba(10,124,110,0.5)'
              }}
            >
              Je veux La Sentinelle — 249€ HT/mois →
            </button>
            <p style={{ fontSize: 12, color: '#5C5C59', marginTop: 12 }}>
              ⚡ Opérationnel en 48h · Sans engagement · Garantie 30 jours
            </p>
          </div>

        </div>
      </section>
      <Footer />
    </>
  )
}
