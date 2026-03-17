import Link from 'next/link'

const sections = [
  {
    title: '1. Objet',
    content:
      "Les présentes Conditions Générales d'Utilisation et de Vente (CGU/CGV) régissent l'utilisation de Vetai, service d'assistance par intelligence artificielle pour cliniques vétérinaires, édité et opéré par Vetai. En utilisant le service, vous acceptez l'intégralité des présentes conditions.",
  },
  {
    title: '2. Accès au service',
    content: (
      <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2 }}>
        <li>L&apos;accès à Vetai nécessite une inscription avec des informations exactes et complètes.</li>
        <li>Chaque compte est strictement personnel et ne peut être partagé ou cédé.</li>
        <li>L&apos;utilisateur est seul responsable de la sécurisation de ses identifiants de connexion.</li>
        <li>Vetai se réserve le droit de suspendre tout compte en cas d&apos;utilisation frauduleuse ou abusive.</li>
      </ul>
    ),
  },
  {
    title: '3. Abonnement et prix',
    content: (
      <>
        <p style={{ margin: '0 0 12px' }}>
          L&apos;offre <strong style={{ color: '#141412' }}>«&nbsp;La Sentinelle&nbsp;»</strong> est facturée <strong style={{ color: '#0A7C6E' }}>290&nbsp;€/mois HT</strong>.
        </p>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2 }}>
          <li>Engagement minimum : 6 mois à compter de la date d&apos;activation.</li>
          <li>Renouvellement automatique mensuel au terme de la période d&apos;engagement.</li>
          <li>Préavis de résiliation : 30 jours avant la date de renouvellement.</li>
          <li>Facturation en début de période, paiement par prélèvement automatique (Stripe).</li>
          <li>Prix HT, TVA applicable selon la réglementation en vigueur.</li>
        </ul>
      </>
    ),
  },
  {
    title: '4. Garantie satisfait ou remboursé',
    content:
      "Vetai offre une garantie satisfait ou remboursé de 14 jours à compter de la date d'activation du compte. Aucune question ne sera posée. La demande de remboursement doit être adressée par email à medzz.mailpro@gmail.com dans ce délai.",
  },
  {
    title: '5. Limitations de responsabilité',
    content:
      "Vetai est un outil d'assistance opérationnelle pour les cliniques vétérinaires. Il ne constitue en aucun cas un outil de diagnostic médical ou un substitut au jugement clinique du vétérinaire. La responsabilité médicale reste exclusivement celle du vétérinaire. Vetai ne pourra être tenu responsable des décisions prises sur la base des informations traitées par le service.",
  },
  {
    title: '6. Propriété intellectuelle',
    content:
      "Le service Vetai, son interface, ses algorithmes, ses textes, ses logos et l'ensemble de son contenu sont protégés par le droit de la propriété intellectuelle française et internationale. Toute reproduction, représentation, modification ou exploitation non autorisée est strictement interdite.",
  },
  {
    title: '7. Résiliation',
    content: (
      <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2 }}>
        <li>La résiliation est possible après la période d&apos;engagement initiale de 6 mois.</li>
        <li>Un préavis de 30 jours doit être respecté, envoyé par email à medzz.mailpro@gmail.com.</li>
        <li>En cas de résiliation, les données sont conservées 30 jours avant suppression définitive.</li>
        <li>Vetai peut résilier le contrat sans préavis en cas de violation grave des présentes CGU.</li>
      </ul>
    ),
  },
  {
    title: '8. Droit applicable et juridiction',
    content:
      "Les présentes CGU/CGV sont soumises au droit français. En cas de litige, et après tentative de résolution amiable, les tribunaux de Paris seront seuls compétents, nonobstant pluralité de défendeurs ou appel en garantie.",
  },
  {
    title: '9. Contact',
    content: (
      <>
        Pour toute question relative aux présentes CGU/CGV :{' '}
        <a href="mailto:medzz.mailpro@gmail.com" style={{ color: '#0A7C6E', textDecoration: 'none', fontWeight: 600 }}>
          medzz.mailpro@gmail.com
        </a>
      </>
    ),
  },
]

export default function CguCgvPage() {
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
          Conditions Générales d&apos;Utilisation et de Vente
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

        {/* Footer note */}
        <div style={{
          marginTop: 40,
          padding: '16px 20px',
          background: '#FAFAF9',
          border: '1px solid #EBEBEA',
          borderRadius: 8,
        }}>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13,
            color: '#8C8C89',
            margin: 0,
            lineHeight: 1.7,
          }}>
            Ces conditions ont été rédigées en français et c&apos;est la version française qui prévaut en cas de litige. Vetai se réserve le droit de modifier ces CGU/CGV à tout moment, avec notification préalable de 30 jours par email.
          </p>
        </div>
      </main>
    </div>
  )
}
