import Link from 'next/link'

const subprocessors = [
  { name: 'Supabase', role: 'Base de données PostgreSQL', country: 'UE' },
  { name: 'Vercel', role: 'Hébergement et déploiement', country: 'USA (SCCs)' },
  { name: 'Stripe', role: 'Traitement des paiements', country: 'USA (SCCs)' },
  { name: 'Twilio', role: 'Envoi de SMS', country: 'USA (SCCs)' },
  { name: 'Resend', role: 'Emails transactionnels', country: 'USA (SCcs)' },
]

const measures = [
  'Chiffrement en transit : TLS 1.3 sur toutes les communications',
  'Chiffrement au repos : AES-256 sur toutes les données stockées',
  'Contrôle d\'accès : authentification multi-facteur, principe du moindre privilège',
  'Journalisation : logs d\'accès et d\'audit conservés 12 mois',
  'Sauvegardes quotidiennes : rétention 30 jours, chiffrées',
  'Tests de sécurité : revues régulières, gestion des vulnérabilités',
  'Séparation des environnements : production isolée du staging et développement',
]

export default function RgpdDpaPage() {
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
          RGPD &amp; Accord de Traitement des Données (DPA)
        </h1>
        <p style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 15,
          color: '#5C5C59',
          lineHeight: 1.8,
          marginBottom: 40,
          marginTop: 0,
          maxWidth: 600,
        }}>
          Ce document décrit les engagements de Vetai en tant que sous-traitant de données au sens du RGPD (Règlement UE 2016/679).
        </p>

        {/* Section 1 */}
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#141412', marginBottom: 8, marginTop: 0 }}>
          1. Engagement de Vetai
        </h2>
        <div style={{ background: 'white', border: '1px solid #EBEBEA', borderRadius: 12, padding: '20px 24px', marginBottom: 12 }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: '#5C5C59', lineHeight: 1.8, margin: 0 }}>
            En tant que sous-traitant de données au sens du RGPD, Vetai s&apos;engage à traiter les données personnelles uniquement selon les instructions documentées du responsable de traitement (la clinique). Vetai ne traite jamais les données à des fins propres sans autorisation explicite, et garantit la confidentialité des données traitées.
          </p>
        </div>

        {/* Section 2 */}
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#141412', marginBottom: 8, marginTop: 32 }}>
          2. Mesures techniques et organisationnelles
        </h2>
        <div style={{ background: 'white', border: '1px solid #EBEBEA', borderRadius: 12, padding: '20px 24px', marginBottom: 12 }}>
          <ul style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: '#5C5C59', lineHeight: 2, margin: 0, paddingLeft: 20 }}>
            {measures.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>

        {/* Section 3 */}
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#141412', marginBottom: 8, marginTop: 32 }}>
          3. Sous-traitants ultérieurs
        </h2>
        <div style={{ background: 'white', border: '1px solid #EBEBEA', borderRadius: 12, padding: '20px 24px', marginBottom: 12 }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: '#5C5C59', lineHeight: 1.8, margin: '0 0 16px' }}>
            Vetai fait appel aux sous-traitants suivants, tous liés par des clauses contractuelles types (SCCs) conformes au RGPD :
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#F5F5F3' }}>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#141412', borderBottom: '1px solid #EBEBEA' }}>Sous-traitant</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#141412', borderBottom: '1px solid #EBEBEA' }}>Rôle</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#141412', borderBottom: '1px solid #EBEBEA' }}>Localisation</th>
                </tr>
              </thead>
              <tbody>
                {subprocessors.map((s, i) => (
                  <tr key={i} style={{ borderBottom: i < subprocessors.length - 1 ? '1px solid #F0F0EE' : 'none' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#141412', fontFamily: 'DM Sans, sans-serif' }}>{s.name}</td>
                    <td style={{ padding: '10px 12px', color: '#5C5C59', fontFamily: 'DM Sans, sans-serif' }}>{s.role}</td>
                    <td style={{ padding: '10px 12px', color: '#5C5C59', fontFamily: 'DM Sans, sans-serif' }}>{s.country}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4 */}
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#141412', marginBottom: 8, marginTop: 32 }}>
          4. Notification en cas de violation
        </h2>
        <div style={{ background: 'white', border: '1px solid #EBEBEA', borderRadius: 12, padding: '20px 24px', marginBottom: 12 }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: '#5C5C59', lineHeight: 1.8, margin: 0 }}>
            En cas de violation de données personnelles (au sens de l&apos;article 33 du RGPD), Vetai s&apos;engage à notifier le responsable de traitement dans les <strong style={{ color: '#141412' }}>72 heures</strong> suivant la détection de l&apos;incident, avec toutes les informations disponibles sur la nature, l&apos;étendue et les mesures prises.
          </p>
        </div>

        {/* Section 5 */}
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#141412', marginBottom: 8, marginTop: 32 }}>
          5. Droits d&apos;audit
        </h2>
        <div style={{ background: 'white', border: '1px solid #EBEBEA', borderRadius: 12, padding: '20px 24px', marginBottom: 12 }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: '#5C5C59', lineHeight: 1.8, margin: 0 }}>
            Le client (responsable de traitement) peut demander un audit de conformité RGPD sur demande écrite, avec un préavis raisonnable de 30 jours. Vetai fournira la documentation nécessaire et coopérera de bonne foi à toute vérification.
          </p>
        </div>

        {/* Section 6 / CTA */}
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#141412', marginBottom: 8, marginTop: 32 }}>
          6. Obtenir votre DPA signé
        </h2>
        <div style={{
          background: '#F0FBF9',
          border: '1px solid #B2E0D9',
          borderRadius: 12,
          padding: '24px',
        }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: '#5C5C59', lineHeight: 1.8, margin: '0 0 16px' }}>
            Un DPA signé est fourni à chaque clinique lors de la souscription à Vetai. Pour l&apos;obtenir ou pour toute question relative à la conformité RGPD, contactez-nous :
          </p>
          <a
            href="mailto:medzz.mailpro@gmail.com"
            style={{
              display: 'inline-block',
              background: '#0A7C6E',
              color: 'white',
              padding: '12px 24px',
              borderRadius: 8,
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 600,
              fontSize: 15,
              textDecoration: 'none',
            }}
          >
            medzz.mailpro@gmail.com
          </a>
        </div>
      </main>
    </div>
  )
}
