'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const SCENARIOS = [
  {
    title: 'Appel entrant — Prise de RDV',
    icon: '📞',
    user: 'Bonjour, je voudrais prendre un rendez-vous pour mon chat Milo.',
    bot: 'Bonjour ! Je suis l\'assistant de la Clinique du Parc. Pour quel motif souhaitez-vous consulter ? Vaccination, contrôle de routine ou autre ?',
    user2: 'C\'est pour la vaccination annuelle.',
    bot2: 'Parfait ! J\'ai des disponibilités jeudi à 10h ou vendredi à 14h30. Quelle date vous convient ?',
    user3: 'Vendredi 14h30 c\'est parfait.',
    bot3: 'C\'est confirmé ! RDV vendredi à 14h30 pour Milo. Un SMS de confirmation vient d\'être envoyé au 06 xx xx xx xx. À vendredi !',
  },
  {
    title: 'Rappel automatique — Vaccin expiré',
    icon: '💊',
    user: '(Rappel automatique envoyé par SMS)',
    bot: '🐾 Rappel Clinique du Parc\n\nBernadette, le vaccin Rage de Rex arrive à expiration le 15/04. Souhaitez-vous prendre RDV ?\n\nRépondez OUI pour qu\'on vous rappelle.',
    user2: 'OUI',
    bot2: 'Super ! Nos créneaux disponibles cette semaine :\n— Lundi 14h\n— Mercredi 10h30\n— Vendredi 16h\n\nRépondez avec votre choix.',
    user3: 'Mercredi 10h30',
    bot3: '✅ RDV confirmé pour Rex — Mercredi à 10h30. On vous attend !',
  },
  {
    title: 'Question hors horaires — 23h',
    icon: '🌙',
    user: 'Mon chien a avalé du chocolat, c\'est grave ?',
    bot: 'Le chocolat est toxique pour les chiens. La gravité dépend de la quantité ingérée et du poids de l\'animal.\n\nPour une évaluation urgente, voici les infos :\n• Quantité approximative ingérée ?\n• Poids de votre chien ?',
    user2: '5 carrés de chocolat noir, mon chien pèse 8kg.',
    bot2: '⚠️ Pour un chien de 8kg, 5 carrés de chocolat noir peuvent être dangereux. Je vous conseille de contacter une clinique vétérinaire d\'urgence immédiatement.\n\nVoici le numéro de garde : 📞 [Numéro urgence vétérinaire]\n\nLa clinique du Parc ouvre demain à 8h. Souhaitez-vous un RDV en premier ?',
  },
]

const STATS = [
  { value: '< 2s', label: 'Temps de réponse moyen', icon: '⚡' },
  { value: '24h/24', label: 'Disponibilité', icon: '🕐' },
  { value: '−60%', label: 'Taux de no-shows', icon: '📉' },
  { value: '98%', label: 'Taux de satisfaction', icon: '⭐' },
]

export default function DemoPage() {
  const [activeScenario, setActiveScenario] = useState(0)
  const scenario = SCENARIOS[activeScenario]

  return (
    <>
      <Navbar />
      <main style={{ background: '#F5F5F3', minHeight: '100vh' }}>

        {/* Hero */}
        <section style={{
          background: 'linear-gradient(135deg, #065E53 0%, #0A7C6E 50%, #0D9E8D 100%)',
          padding: '80px 24px 72px',
          textAlign: 'center',
        }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(245,166,35,0.2)', border: '1px solid rgba(245,166,35,0.4)',
              borderRadius: 100, padding: '5px 14px',
              fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#F5A623',
              marginBottom: 24,
            }}>
              🎬 Démo interactive
            </div>
            <h1 style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 'clamp(28px, 4vw, 48px)',
              fontWeight: 800, color: 'white', lineHeight: 1.15,
              marginBottom: 16, letterSpacing: '-0.02em',
            }}>
              Voyez Vetai.AI en action
            </h1>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: 36 }}>
              Conversations réelles. Réponses instantanées. Voici comment votre IA gère les situations du quotidien vétérinaire.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a
                href="/#contact"
                style={{
                  background: '#F5A623', color: '#141412',
                  padding: '14px 28px', borderRadius: 10,
                  fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 4px 16px rgba(245,166,35,0.4)',
                }}
              >
                Demander une démo personnalisée →
              </a>
              <a
                href="/pricing"
                style={{
                  background: 'rgba(255,255,255,0.1)', color: 'white',
                  border: '1px solid rgba(255,255,255,0.25)',
                  padding: '14px 28px', borderRadius: 10,
                  fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Voir les tarifs
              </a>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section style={{ background: 'white', padding: '32px 24px', borderBottom: '1px solid #EBEBEA' }}>
          <div style={{ maxWidth: 800, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 20 }}>
            {STATS.map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: '#0A7C6E', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#9E9E9B', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: 11, color: '#C8C8C6', marginTop: 16 }}>Résultats estimés en moyenne sur la base de nos cliniques pilotes</p>
        </section>

        {/* Démos conversations */}
        <section style={{ padding: '72px 24px' }}>
          <div style={{ maxWidth: 920, margin: '0 auto' }}>

            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#0A7C6E', marginBottom: 12 }}>
                Scénarios réels
              </div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 800, color: '#141412', lineHeight: 1.2 }}>
                Comment Vetai.AI gère chaque situation
              </h2>
            </div>

            {/* Sélecteur scénarios */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
              {SCENARIOS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setActiveScenario(i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 18px', borderRadius: 999,
                    border: activeScenario === i ? '2px solid #0A7C6E' : '1.5px solid #D4D4D2',
                    background: activeScenario === i ? '#0A7C6E' : 'white',
                    color: activeScenario === i ? 'white' : '#5C5C59',
                    fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <span>{s.icon}</span> {s.title}
                </button>
              ))}
            </div>

            {/* Fenêtre conversation */}
            <div style={{
              background: 'white', borderRadius: 20,
              border: '1.5px solid #EBEBEA',
              boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
              overflow: 'hidden',
            }}>
              {/* Barre de titre simulée */}
              <div style={{
                background: 'linear-gradient(135deg, #065E53, #0A7C6E)',
                padding: '16px 20px',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  🐾
                </div>
                <div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: 'white' }}>Assistant Vetai.AI</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>● En ligne — répond en temps réel</div>
                </div>
              </div>

              {/* Messages */}
              <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <ChatBubble text={scenario.user} isUser />
                <ChatBubble text={scenario.bot} isUser={false} />
                {scenario.user2 && <ChatBubble text={scenario.user2} isUser />}
                {scenario.bot2 && <ChatBubble text={scenario.bot2} isUser={false} />}
                {scenario.user3 && <ChatBubble text={scenario.user3} isUser />}
                {scenario.bot3 && <ChatBubble text={scenario.bot3} isUser={false} />}
              </div>
            </div>

            {/* Note */}
            <p style={{ textAlign: 'center', fontSize: 13, color: '#9E9E9B', marginTop: 16 }}>
              Ces conversations illustrent le comportement de Vetai.AI. Les réponses sont adaptées à la configuration de votre clinique.
            </p>
          </div>
        </section>

        {/* Fonctionnalités démo */}
        <section style={{ background: 'white', padding: '72px 24px' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 800, color: '#141412', textAlign: 'center', marginBottom: 48, lineHeight: 1.2 }}>
              Tout ce que Vetai.AI sait faire
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
              {[
                { icon: '📞', title: 'Répondre 24h/24', desc: 'Décroche chaque appel, même à 23h, les week-ends et jours fériés.' },
                { icon: '📅', title: 'Gérer les RDV', desc: 'Propose des créneaux, confirme les RDV, envoie des rappels SMS.' },
                { icon: '💊', title: 'Rappels vaccins', desc: 'Détecte les vaccinations à renouveler et contacte automatiquement les propriétaires.' },
                { icon: '📝', title: 'Qualifier les urgences', desc: 'Pose les bonnes questions pour prioriser et orienter les cas urgents.' },
                { icon: '📊', title: 'Rapports automatiques', desc: 'Génère vos rapports d\'activité hebdomadaires sans intervention manuelle.' },
                { icon: '🔄', title: 'Synchronisation agenda', desc: 'S\'intègre à votre logiciel vétérinaire existant (Vetup, Asivet, Medialog…).' },
              ].map(f => (
                <div key={f.title} style={{
                  padding: 24, borderRadius: 16,
                  background: '#F5F5F3', border: '1px solid #EBEBEA',
                }}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: '#141412', marginBottom: 8 }}>{f.title}</div>
                  <div style={{ fontSize: 13, color: '#5C5C59', lineHeight: 1.6 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section style={{ padding: '72px 24px', textAlign: 'center' }}>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 800, color: '#141412', marginBottom: 16, lineHeight: 1.2 }}>
              Prêt à tester sur votre clinique ?
            </h2>
            <p style={{ fontSize: 16, color: '#5C5C59', marginBottom: 32, lineHeight: 1.7 }}>
              Notre équipe vous montre comment Vetai.AI s'adapte exactement à votre activité en 30 minutes.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a
                href="/#contact"
                style={{
                  background: '#0A7C6E', color: 'white',
                  padding: '16px 32px', borderRadius: 12,
                  fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 6px 24px rgba(10,124,110,0.3)',
                }}
              >
                Réserver une démo gratuite →
              </a>
              <a
                href="/pricing"
                style={{
                  background: 'white', color: '#0A7C6E',
                  border: '2px solid #0A7C6E',
                  padding: '16px 32px', borderRadius: 12,
                  fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Voir les tarifs
              </a>
            </div>
            <p style={{ fontSize: 13, color: '#9E9E9B', marginTop: 16 }}>Sans engagement — Réponse sous 24h</p>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}

function ChatBubble({ text, isUser }: { text: string; isUser: boolean }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      gap: 8, alignItems: 'flex-end',
    }}>
      {!isUser && (
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#E8F5F3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
          🐾
        </div>
      )}
      <div style={{
        maxWidth: '72%',
        background: isUser ? '#0A7C6E' : '#F5F5F3',
        color: isUser ? 'white' : '#2A2A28',
        padding: '10px 14px',
        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        fontSize: 14, lineHeight: 1.55,
        fontFamily: 'DM Sans, sans-serif',
        whiteSpace: 'pre-line' as const,
      }}>
        {text}
      </div>
    </div>
  )
}
