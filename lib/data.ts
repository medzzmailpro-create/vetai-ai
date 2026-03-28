export const CONTACT_EMAIL = 'contact@vetai.fr'

export const AGENTS = [
  { emoji: '🤙', title: 'Agent Téléphone', desc: 'Répond, informe et prend rendez-vous 24h/24. Aucun appel ne reste sans réponse, même la nuit et le week-end.' },
  { emoji: '💬', title: 'Agent Chat Web', desc: 'Intégré à votre site en quelques minutes, il répond aux questions en temps réel et guide vers la prise de RDV.' },
  { emoji: '📅', title: 'Agent Agenda', desc: 'Synchronise et optimise vos créneaux. Réduit les trous dans votre planning et évite les doubles réservations.' },
  { emoji: '📱', title: 'Agent WhatsApp / SMS', desc: 'Envoie confirmations, rappels de RDV et relances automatiques. Diminue significativement les no-shows.' },
  { emoji: '📊', title: 'Agent Analytics', desc: 'Tableau de bord en temps réel, rapports hebdomadaires, insights sur vos performances. Pilotez avec des données.' },
  { emoji: '🩺', title: 'Agent Suivi Patient', desc: 'Rappels vaccins, bilans post-opératoires, suivi des traitements. Plus aucun animal ne passe entre les mailles.' },
]

export const HOW_STEPS = [
  { icon: '📞', num: '1', title: 'Appel de 30 min', desc: 'On analyse votre activité, votre logiciel vétérinaire et vos besoins avec notre équipe.' },
  { icon: '⚙️', num: '2', title: 'Configuration', desc: 'Installation et paramétrage en 2 à 5 jours ouvrés selon votre logiciel vétérinaire.' },
  { icon: '🚀', num: '3', title: 'Les agents prennent le relais', desc: 'Appels, chats, SMS et rappels gérés automatiquement 24h/24 dès le premier jour.' },
  { icon: '📈', num: '4', title: 'Pilotage & rapports', desc: 'KPIs en temps réel dans votre dashboard + rapport hebdomadaire par email chaque lundi.' },
]

export const STATS = [
  { id: 'stat1', target: 2, suffix: 'h', prefix: '', label: 'Récupérées / jour / ASV' },
  { id: 'stat2', target: 35, suffix: '%', prefix: '+', label: 'De rendez-vous estimés' },
  { id: 'stat3', target: 60, suffix: '%', prefix: '-', label: 'De no-shows estimés' },
  { id: 'stat4', target: 98, suffix: '%', prefix: '', label: 'Taux de réponse visé' },
]

export const BEFORE_AFTER = [
  { before: '📵 ~8 appels manqués par jour', after: '📞 0 appel manqué — 24h/24' },
  { before: '⏱️ 3h/jour au téléphone par ASV', after: '⚡ ~20 minutes — le reste est automatisé' },
  { before: '😞 ~12 no-shows par mois', after: '✉️ Rappels automatiques — ~3 no-shows' },
  { before: '💊 Rappels vaccins manuels et oubliés', after: '🩺 Rappels vaccins 100% automatiques' },
  { before: '💬 Communications éparpillées', after: '🗂️ Tout centralisé dans le dashboard' },
]

export const SECURITY = [
  { icon: '🇫🇷', title: 'Hébergement France', desc: 'Données exclusivement sur serveurs OVHcloud en France. Aucun transit hors UE.' },
  { icon: '🔒', title: 'Chiffrement AES-256', desc: 'Toutes les données chiffrées en transit (TLS 1.3) et au repos (AES-256). Norme bancaire.' },
  { icon: '⚖️', title: 'Conforme RGPD', desc: 'DPA fourni à la signature. Vous restez propriétaire de vos données à tout moment.' },
  { icon: '🗑️', title: 'Droit à l\'oubli', desc: 'Export ou suppression de vos données sur simple demande. Aucune rétention abusive.' },
]

export const INTEGRATIONS = [
  { icon: '🐾', name: 'Vetup' },
  { icon: '💊', name: 'Asivet' },
  { icon: '🏥', name: 'Medialog' },
  { icon: '🩺', name: 'Vetosoft' },
  { icon: '📅', name: 'Google Agenda' },
  { icon: '📧', name: 'Gmail / Outlook' },
  { icon: '💬', name: 'WhatsApp Business' },
  { icon: '📱', name: 'SMS Pro' },
]

export const PLANS = [
  {
    name: 'Starter',
    install: '2 490 €',
    installments: '3 × 830 €',
    monthly: '149 €/mois',
    limit: 'Jusqu\'à 300 appels/mois',
    featured: false,
    support: 'Email uniquement',
    features: [
      'Agent Téléphone 24h/24',
      'Agent Chat Web',
      'Agent Agenda',
      'Agent Analytics',
      'Dashboard complet',
      'Rapport hebdomadaire automatique',
    ],
  },
  {
    name: 'Pro',
    install: '3 490 €',
    installments: '3 × 1 163 €',
    monthly: '249 €/mois',
    limit: 'Jusqu\'à 600 appels/mois',
    featured: true,
    badge: '⭐ Le plus populaire',
    support: 'Email + téléphone',
    features: [
      'Tout le Starter',
      'Agent WhatsApp / SMS',
      'Agent Suivi Patient',
      'Rappels vaccins & post-op',
      'Intégrations avancées',
      'Onboarding dédié (2h)',
    ],
  },
  {
    name: 'Enterprise',
    install: '5 990 €',
    installments: '3 × 1 997 €',
    monthly: '399 €/mois',
    limit: 'Appels illimités',
    featured: false,
    support: 'Dédié prioritaire',
    features: [
      'Tous les agents inclus',
      'Agent Marketing & Upsell',
      'Multi-sites / groupe de cliniques',
      'SLA garanti 99,9%',
      'Intégration sur mesure',
      'CSM dédié',
    ],
  },
]

export const FAQ = [
  {
    q: 'L\'IA remplace-t-elle mon équipe ?',
    a: 'Non, absolument pas. Vetai assiste votre équipe, elle ne la remplace pas. Les agents IA gèrent les tâches répétitives — appels entrants, confirmations, rappels — pour libérer vos ASV et vétérinaires pour ce qui nécessite une expertise humaine : l\'accueil, les soins, la relation client.',
  },
  {
    q: 'Combien de temps prend l\'installation ?',
    a: 'Entre 2 et 5 jours ouvrés selon votre logiciel vétérinaire. Le processus commence par un appel de 30 minutes avec notre équipe, puis nous gérons tout : intégration à votre agenda, configuration des scripts d\'appel, paramétrage des agents. Vous n\'avez besoin d\'aucune compétence technique.',
  },
  {
    q: 'Puis-je garder mon numéro de téléphone actuel ?',
    a: 'Oui, dans la grande majorité des cas. Nous utilisons une redirection d\'appel invisible depuis votre numéro existant. Vos clients composent le même numéro et Vetai prend en charge. En cas de besoin spécifique, notre équipe analyse la faisabilité lors du rendez-vous de démo.',
  },
  {
    q: 'Mes données et celles de mes clients sont-elles sécurisées ?',
    a: 'Oui. Vetai est conforme RGPD. Toutes les données sont hébergées en France (OVHcloud), chiffrées en transit (TLS 1.3) et au repos (AES-256). Nous ne revendons aucune donnée. Vous êtes propriétaire de vos données et pouvez demander leur export ou suppression à tout moment. Un DPA est fourni à la signature.',
  },
  {
    q: 'Que se passe-t-il si l\'IA ne sait pas répondre ?',
    a: 'L\'IA reconnaît ses limites. Si une question dépasse ses capacités, elle propose automatiquement un rappel humain, transfère l\'appel si quelqu\'un est disponible, ou prend un message. Vous recevez une alerte immédiate pour les cas nécessitant une intervention humaine.',
  },
  {
    q: 'Pourquoi 6 mois d\'engagement ?',
    a: 'L\'engagement de 6 mois est nécessaire pour que les agents IA soient pleinement optimisés pour votre clinique. L\'IA a besoin de ce temps pour apprendre vos spécificités — protocoles, horaires, cas récurrents. Après 6 mois, vous continuez mois par mois avec 30 jours de préavis.',
  },
  {
    q: 'Comment fonctionne la démo gratuite de 14 jours ?',
    a: 'Vous testez Vetai pendant 14 jours dans votre clinique, sans carte bancaire et sans engagement. Notre équipe installe et configure tout. Si vous décidez de continuer, vous activez votre abonnement. Sinon, on arrête — sans friction.',
  },
]

export const PILOT_PLACES = [
  {
    num: 'Place Pilote #1',
    icon: '✅',
    title: 'Disponible',
    subtitle: 'Tarif préférentiel · Onboarding premium',
    tag: '–20% sur l\'installation',
    tagColor: 'teal',
    featured: false,
    locked: false,
    features: [
      'Tarif installation préférentiel (–20%)',
      'Onboarding dédié 4h inclus',
      'Accès prioritaire aux nouvelles fonctionnalités',
      'Influence directe sur le produit',
    ],
  },
  {
    num: 'Place Pilote #2',
    icon: '✅',
    title: 'Disponible',
    subtitle: 'Rejoignez le programme pilote',
    tag: '–20% sur l\'installation',
    tagColor: 'teal',
    featured: true,
    locked: false,
    badge: 'Places limitées',
    features: [
      'Tarif installation préférentiel (–20%)',
      'Onboarding dédié 4h inclus',
      'Accès prioritaire aux nouvelles fonctionnalités',
      'Influence directe sur le produit',
    ],
  },
  {
    num: 'Place Pilote #3',
    icon: '🔒',
    title: 'Verrouillée',
    subtitle: 'Prochainement disponible',
    tag: 'Bientôt',
    tagColor: 'amber',
    featured: false,
    locked: true,
    features: [
      'Tarif installation à –40% (témoignage documenté)',
      'Accès beta aux fonctionnalités en avant-première',
      'Rapport mensuel offert (valeur 200€/an)',
      'Co-construction du produit avec l\'équipe',
    ],
  },
]
