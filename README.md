# Cliniko — Assistant IA pour cliniques vétérinaires

SaaS Next.js 14 qui automatise l'accueil client d'une clinique vétérinaire : prise d'appels 24h/24, prise de rendez-vous, relances SMS, rapports d'activité, et tableau de bord de pilotage.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 14 App Router + TypeScript |
| Base de données | Supabase (PostgreSQL + Auth + RLS) |
| Auth | @supabase/ssr (cookie-based, SSR-compatible) |
| Styles | Inline styles (convention du projet) — polices Syne + DM Sans |
| IA | Claude claude-sonnet-4-6 (Anthropic) |
| Appels téléphoniques | Retell AI + ElevenLabs (clonage de voix) |
| SMS | Twilio |
| Messagerie | Telegram Bot API |
| Déploiement | Vercel |

---

## Lancer le projet

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # Build production
npx tsc --noEmit   # Vérification TypeScript
```

---

## Variables d'environnement (`.env.local`)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# URL publique (pour les webhooks)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Anthropic (Claude)
ANTHROPIC_API_KEY=...

# Sécurité API agents (openssl rand -hex 32)
API_TOOL_SECRET=...

# Telegram Bot
TELEGRAM_BOT_TOKEN=...

# Retell AI
RETELL_API_KEY=...
RETELL_PHONE_NUMBER=+33...
RETELL_WEBHOOK_SECRET=...
RETELL_LLM_ID=...

# ElevenLabs
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...

# Twilio
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+33...
```

---

## Structure du projet

```
cliniko/
│
├── app/                              # Routes Next.js (App Router)
│   ├── layout.tsx                    # Layout racine (métadonnées, polices Google)
│   ├── globals.css                   # Animations .fade-up / .fade-in
│   ├── page.tsx                      # Landing page publique
│   │
│   ├── pricing/page.tsx              # Page tarifs (offre lancement + FAQ)
│   ├── login/page.tsx                # Connexion / reset mot de passe (Supabase Auth)
│   ├── reset-password/page.tsx       # Formulaire nouveau mot de passe
│   ├── dashboard/page.tsx            # Shell protégé — charge le composant Dashboard
│   │
│   └── api/                          # API Routes (webhooks + outils IA)
│       ├── agents/route.ts           # Outils IA : book-appt, check-availability, SMS, etc.
│       └── webhooks/
│           ├── retell/route.ts       # Webhook Retell AI (appels entrants/sortants)
│           ├── twilio/route.ts       # Webhook Twilio (status SMS)
│           └── telegram/route.ts    # Webhook Telegram → Claude
│
├── components/                       # Composants React
│   ├── Navbar.tsx                    # Navigation sticky (landing page)
│   ├── Footer.tsx                    # Pied de page
│   │
│   ├── sections/                     # Sections de la landing page (dans l'ordre de page.tsx)
│   │   ├── Hero.tsx                  # Section héro avec CTA
│   │   ├── Problem.tsx               # Tableau avant/après
│   │   ├── Agents.tsx                # Les 6 agents IA
│   │   ├── HowItWorksResultsROI.tsx  # Comment ça marche + Résultats + Calculateur ROI
│   │   ├── IntegrationsSection.tsx   # Intégrations + Sécurité + Garantie
│   │   ├── Pilot.tsx                 # Programme pilote
│   │   ├── Pricing.tsx               # Tarifs avec offre lancement
│   │   ├── FAQ.tsx                   # FAQ accordion
│   │   └── Contact.tsx               # Formulaire de contact
│   │
│   └── dashboard/                    # Tableau de bord SaaS (protégé)
│       ├── Dashboard.tsx             # Shell principal : state global, navigation, modals
│       ├── layout/
│       │   ├── Sidebar.tsx           # Navigation latérale
│       │   └── Topbar.tsx            # Barre supérieure (profil, déconnexion)
│       ├── pages/                    # Une page par onglet du dashboard
│       │   ├── OverviewPage.tsx      # Vue d'ensemble : 4 KPIs + raccourcis
│       │   ├── ClientsPage.tsx       # Liste clients (Supabase) + édition inline
│       │   ├── AgendaPage.tsx        # Calendrier des rendez-vous
│       │   ├── CommunicationsPage.tsx # Historique appels + SMS + transcriptions
│       │   ├── AgentsPage.tsx        # Agents IA + stack IA (Retell, Claude, etc.)
│       │   ├── ReportsPage.tsx       # Rapports avec filtres de dates
│       │   ├── ConfigurationPage.tsx # Paramètres de la clinique (nom, horaires, agents)
│       │   ├── SettingsPage.tsx      # Notifs + formulaire support
│       │   ├── BillingPage.tsx       # Abonnement et facturation
│       │   └── SecurityPage.tsx      # Mot de passe, sessions, logs d'accès
│       ├── modals/
│       │   ├── FirstLoginPopup.tsx   # Setup obligatoire au premier login
│       │   ├── AppointmentModal.tsx  # Créer / modifier un rendez-vous
│       │   └── AgentConfigModal.tsx  # Configurer un agent IA
│       ├── data/
│       │   ├── mockData.ts           # Données de fallback (si Supabase vide)
│       │   └── constants.ts          # Labels sidebar, titres de pages, KPIs rapports
│       ├── types/
│       │   └── types.ts              # Types TypeScript : Page, Client, Appointment, Agent…
│       └── utils/
│           └── styles.ts             # Objets CSS réutilisables : inputStyle, sectionCard
│
├── lib/                              # Utilitaires et services
│   ├── hooks/
│   │   └── useScrollAnimation.ts    # Hook IntersectionObserver (animations .fade-up)
│   ├── supabase/
│   │   └── client.ts                # Client Supabase côté navigateur (@supabase/ssr)
│   ├── services/                    # Intégrations services externes
│   │   ├── retell.ts                # Retell AI : créer/lire des appels, gérer les agents
│   │   ├── twilio.ts                # Twilio : envoyer SMS, confirmations, rappels RDV
│   │   ├── telegram.ts              # Telegram Bot : envoyer messages, enregistrer webhook
│   │   ├── clients.ts               # Supabase : lire la table clients
│   │   ├── appointments.ts          # Supabase : lire la table appointments
│   │   ├── agents.ts                # Supabase : lire la table ai_agents
│   │   └── communications.ts        # Supabase : lire la table communications
│   └── data.ts                      # Données statiques landing page (agents, stats, FAQ…)
│
├── supabase/
│   └── schema.sql                   # DDL des tables IA (ai_agents, calls, sms_messages…)
│
├── middleware.ts                     # Auth SSR : /dashboard → /login si pas connecté
├── .env.local                        # Variables d'environnement (non committé)
└── next.config.js                    # Config Next.js
```

---

## Architecture des agents IA

```
Telegram ──→ /api/webhooks/telegram ──→ Claude (Anthropic API)

/api/agents (outils HTTP, sécurisés par API_TOOL_SECRET)
    ├── book-appointment
    ├── check-availability
    ├── get-client-info
    ├── send-sms (Twilio)
    └── get-next-appointments

Retell AI ──→ /api/webhooks/retell ──→ Supabase (calls) + Twilio SMS
Twilio ──────→ /api/webhooks/twilio ──→ Supabase (sms_messages status)
```

---

## Base de données (Supabase)

| Table | Usage |
|---|---|
| `clinic_config` | Config de la clinique (nom, horaires, agents, durée RDV) |
| `clinic_members` | Rôles utilisateurs (owner / staff) |
| `clients` | Dossiers clients / animaux |
| `appointments` | Rendez-vous |
| `ai_agents` | Config des agents IA par utilisateur |
| `calls` | Journal des appels Retell AI |
| `sms_messages` | Journal des SMS Twilio |
| `telegram_messages` | Journal des messages Telegram |
| `notification_prefs` | Préférences de notifications |
| `support_tickets` | Tickets support utilisateurs |

Toutes les tables ont RLS activé avec politique `auth.uid() = user_id`.

---

## Contact

medzz.mailpro@gmail.com
