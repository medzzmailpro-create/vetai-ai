import Link from 'next/link'

const sections = [
  {
    title: 'Éditeur',
    content: (
      <>
        Ce site est édité par [À COMPLÉTER — votre nom/société, adresse, SIRET].<br />
        Contact :{' '}
        <a href="mailto:medzz.mailpro@gmail.com" style={{ color: '#0A7C6E', textDecoration: 'none', fontWeight: 600 }}>
          medzz.mailpro@gmail.com
        </a>
      </>
    ),
  },
  {
    title: 'Hébergeur',
    content: (
      <>
        Vercel Inc., 340 Pine Street, Suite 1800, San Francisco, CA 94104, USA —{' '}
        <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" style={{ color: '#0A7C6E', textDecoration: 'none' }}>
          vercel.com
        </a>
      </>
    ),
  },
  {
    title: 'Directeur de publication',
    content: '[À COMPLÉTER]',
  },
  {
    title: 'Propriété intellectuelle',
    content:
      "L'ensemble du contenu de ce site (textes, images, logos) est la propriété exclusive de Vetai et est protégé par le droit d'auteur français. Toute reproduction, même partielle, est interdite sans autorisation écrite préalable.",
  },
  {
    title: 'Données personnelles',
    content: (
      <>
        Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression de vos données personnelles. Pour exercer ces droits :{' '}
        <a href="mailto:medzz.mailpro@gmail.com" style={{ color: '#0A7C6E', textDecoration: 'none', fontWeight: 600 }}>
          medzz.mailpro@gmail.com
        </a>
      </>
    ),
  },
]

export default function MentionsLegalesPage() {
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
          Mentions légales
        </h1>
        <p style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 14,
          color: '#8C8C89',
          marginBottom: 40,
          marginTop: 0,
        }}>
          Conformément aux dispositions de la loi n° 2004-575 du 21 juin 2004 pour la confiance en l&apos;économie numérique.
        </p>

        {sections.map((section, i) => (
          <div key={i}>
            <h2 style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 18,
              fontWeight: 700,
              color: '#141412',
              marginBottom: 8,
              marginTop: i === 0 ? 0 : 32,
            }}>
              {section.title}
            </h2>
            <div style={{
              background: 'white',
              border: '1px solid #EBEBEA',
              borderRadius: 12,
              padding: '20px 24px',
              marginBottom: 12,
            }}>
              <p style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 15,
                color: '#5C5C59',
                lineHeight: 1.8,
                margin: 0,
              }}>
                {section.content}
              </p>
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
