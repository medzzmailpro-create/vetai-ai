import Link from 'next/link'

const sections = [
  {
    title: '1. Données collectées',
    content: (
      <ul style={{ margin: '0', paddingLeft: 20, lineHeight: 2 }}>
        <li>Adresse email et mot de passe (authentification)</li>
        <li>Nom et prénom du responsable de compte</li>
        <li>Informations de la clinique (nom, adresse, téléphone, type)</li>
        <li>Données d&apos;utilisation du service (rendez-vous, appels, préférences)</li>
        <li>Données des clients et animaux saisies dans l&apos;application</li>
      </ul>
    ),
  },
  {
    title: '2. Finalités du traitement',
    content: (
      <ul style={{ margin: '0', paddingLeft: 20, lineHeight: 2 }}>
        <li>Authentification et sécurité du compte</li>
        <li>Fourniture et amélioration du service Vetai</li>
        <li>Support client et réponse aux demandes</li>
        <li>Envoi de communications liées au compte (pas de marketing sans consentement)</li>
        <li>Analyse anonymisée d&apos;usage pour améliorer le produit</li>
      </ul>
    ),
  },
  {
    title: '3. Durée de conservation',
    content:
      "Données conservées pendant toute la durée du contrat d'abonnement, puis 3 ans supplémentaires pour respecter les obligations légales comptables et fiscales. Les données peuvent être supprimées sur demande écrite.",
  },
  {
    title: '4. Cookies',
    content:
      "Vetai utilise uniquement des cookies techniques nécessaires au fonctionnement du service : cookies de session, cookies d'authentification (Supabase). Aucun cookie publicitaire, aucun tracker tiers. Aucun bandeau cookie n'est requis car ces cookies sont strictement nécessaires.",
  },
  {
    title: '5. Vos droits RGPD',
    content: (
      <>
        <p style={{ margin: '0 0 12px' }}>
          Conformément au RGPD (articles 15 à 22), vous disposez des droits suivants :
        </p>
        <ul style={{ margin: '0', paddingLeft: 20, lineHeight: 2 }}>
          <li><strong>Accès</strong> : obtenir une copie de vos données personnelles</li>
          <li><strong>Rectification</strong> : corriger des données inexactes</li>
          <li><strong>Suppression</strong> : demander l&apos;effacement de vos données</li>
          <li><strong>Portabilité</strong> : recevoir vos données dans un format structuré</li>
          <li><strong>Opposition</strong> : vous opposer à certains traitements</li>
        </ul>
        <p style={{ margin: '12px 0 0' }}>
          Pour exercer ces droits :{' '}
          <a href="mailto:contact@vetai.fr" style={{ color: '#0A7C6E', textDecoration: 'none', fontWeight: 600 }}>
            contact@vetai.fr
          </a>
          . Réponse sous 30 jours.
        </p>
      </>
    ),
  },
  {
    title: '6. Sous-traitants',
    content: (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#F5F5F3' }}>
              <th style={{ textAlign: 'left', padding: '10px 12px', fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#141412', borderBottom: '1px solid #EBEBEA' }}>Sous-traitant</th>
              <th style={{ textAlign: 'left', padding: '10px 12px', fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#141412', borderBottom: '1px solid #EBEBEA' }}>Rôle</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Supabase', 'Base de données PostgreSQL'],
              ['Vercel', 'Hébergement et déploiement'],
              ['Stripe', 'Traitement des paiements'],
              ['Twilio', 'Envoi de SMS'],
              ['Resend', 'Envoi d\'emails transactionnels'],
            ].map(([name, role], i) => (
              <tr key={i} style={{ borderBottom: i < 4 ? '1px solid #F0F0EE' : 'none' }}>
                <td style={{ padding: '10px 12px', fontWeight: 600, color: '#141412' }}>{name}</td>
                <td style={{ padding: '10px 12px', color: '#5C5C59' }}>{role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  },
  {
    title: '7. Contact DPO',
    content: (
      <>
        Pour toute question relative à la protection de vos données, contactez notre délégué à la protection des données :{' '}
        <a href="mailto:contact@vetai.fr" style={{ color: '#0A7C6E', textDecoration: 'none', fontWeight: 600 }}>
          contact@vetai.fr
        </a>
      </>
    ),
  },
]

export default function PrivacyPage() {
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
          Politique de confidentialité
        </h1>
        <p style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 14,
          color: '#8C8C89',
          marginBottom: 40,
          marginTop: 0,
        }}>
          Dernière mise à jour : 17 mars 2026
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
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 15,
                color: '#5C5C59',
                lineHeight: 1.8,
              }}>
                {section.content}
              </div>
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
