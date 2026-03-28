import Link from 'next/link'

const sections = [
  {
    icon: '🏠',
    title: 'Hébergement sécurisé',
    description:
      'Données hébergées sur Supabase (PostgreSQL) et Vercel, infrastructure sécurisée conforme aux normes européennes. Aucun transit hors UE.',
  },
  {
    icon: '🔒',
    title: 'Chiffrement des données',
    description:
      'Toutes les données sont chiffrées en transit (TLS 1.3) et au repos (AES-256). Norme de sécurité bancaire.',
  },
  {
    icon: '📋',
    title: 'Conformité RGPD',
    description:
      "Vetai est conforme au RGPD. Un DPA (Data Processing Agreement) est fourni à chaque clinique lors de la souscription.",
  },
  {
    icon: '👤',
    title: 'Droits des utilisateurs',
    description: (
      <>
        Vous pouvez demander l&apos;accès, la rectification ou la suppression de vos données à tout moment en écrivant à{' '}
        <a
          href="mailto:contact@vetai.fr"
          style={{ color: '#0A7C6E', textDecoration: 'none', fontWeight: 600 }}
        >
          contact@vetai.fr
        </a>
      </>
    ),
  },
]

export default function SecurityRgpdPage() {
  return (
    <div style={{ background: '#F5F5F3', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Header */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #EBEBEA',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: 20,
            color: '#0A7C6E',
            letterSpacing: '-0.5px',
          }}>Vetai</span>
        </Link>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px' }}>
        <Link href="/" style={{
          fontSize: 13,
          color: '#0A7C6E',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 32,
        }}>
          ← Retour
        </Link>

        <h1 style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 'clamp(28px, 4vw, 40px)',
          fontWeight: 800,
          color: '#141412',
          marginBottom: 12,
          marginTop: 0,
        }}>
          Sécurité &amp; RGPD
        </h1>
        <p style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 15,
          color: '#5C5C59',
          lineHeight: 1.8,
          marginBottom: 40,
          marginTop: 0,
          maxWidth: 560,
        }}>
          La protection de vos données et celles de vos clients est notre priorité absolue. Voici les mesures concrètes en place.
        </p>

        <div style={{ display: 'grid', gap: 16 }}>
          {sections.map((section, i) => (
            <div
              key={i}
              style={{
                background: 'white',
                border: '1px solid #EBEBEA',
                borderRadius: 12,
                padding: '20px 24px',
                display: 'flex',
                gap: 20,
                alignItems: 'flex-start',
              }}
            >
              <span style={{
                fontSize: 28,
                lineHeight: 1,
                flexShrink: 0,
                marginTop: 2,
              }}>{section.icon}</span>
              <div>
                <h2 style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#141412',
                  margin: '0 0 8px',
                }}>
                  {section.title}
                </h2>
                <p style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 15,
                  color: '#5C5C59',
                  lineHeight: 1.8,
                  margin: 0,
                }}>
                  {section.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          marginTop: 40,
          background: '#F0FBF9',
          border: '1px solid #B2E0D9',
          borderRadius: 12,
          padding: '20px 24px',
        }}>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 15,
            color: '#5C5C59',
            lineHeight: 1.8,
            margin: 0,
          }}>
            <strong style={{ color: '#141412' }}>Besoin du DPA complet ?</strong> Consultez notre page{' '}
            <Link href="/rgpd-dpa" style={{ color: '#0A7C6E', textDecoration: 'none', fontWeight: 600 }}>
              RGPD &amp; Accord de Traitement des Données
            </Link>{' '}
            ou écrivez-nous à{' '}
            <a href="mailto:contact@vetai.fr" style={{ color: '#0A7C6E', textDecoration: 'none', fontWeight: 600 }}>
              contact@vetai.fr
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
