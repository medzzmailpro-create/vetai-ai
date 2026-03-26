# Infrastructure VetAI — Présentation Technique et Fonctionnelle

> Document destiné aux directeurs de cliniques vétérinaires, DSI et DPO souhaitant comprendre l'architecture, la sécurité et les fonctionnalités de la plateforme VetAI.

---

## 1. Introduction

### Un secteur vétérinaire sous pression

Les cliniques vétérinaires font face à un défi quotidien : gérer un flux d'appels téléphoniques important tout en assurant des soins de qualité. En France, une clinique de taille moyenne reçoit entre 80 et 150 appels par jour. Chaque appel manqué est un patient potentiellement non pris en charge, une urgence non détectée, une relation client fragilisée. Pourtant, les équipes ne peuvent pas être disponibles 24h/24 — et les propriétaires ne souhaitent pas toujours externaliser à des centres d'appel impersonnels.

### La proposition de valeur VetAI

VetAI est une plateforme SaaS conçue spécifiquement pour les professionnels de santé animale. Elle met à disposition de chaque clinique un **agent vocal intelligent**, disponible 24h/24 et 7j/7, capable de répondre aux appels, de qualifier les urgences, de prendre des rendez-vous et de transmettre les informations à l'équipe en temps réel. Le tout, sans remplacer le lien humain — mais en le renforçant, en libérant du temps précieux pour les soins.

VetAI s'appuie sur les meilleures technologies disponibles du marché (intelligence artificielle générative, infrastructure cloud européenne, téléphonie professionnelle) assemblées dans une solution clé en main, accessible depuis n'importe quel navigateur web, sans installation logicielle. L'objectif est simple : **ne manquer aucun appel, ne perdre aucun patient, sans alourdir la charge de travail de votre équipe**.

---

## 2. Architecture Technique

### Vue d'ensemble

VetAI est construite autour d'une architecture moderne dite **"serverless"**, c'est-à-dire sans serveur dédié à gérer : chaque composant est hébergé chez un fournisseur spécialisé, redondant et scalable. Voici comment les briques s'articulent :

```
Appel entrant (propriétaire d'animal)
        │
        ▼
┌──────────────────┐
│   Twilio (PSTN)  │  ← Réseau téléphonique, numéro dédié clinique
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Retell AI      │  ← Agent vocal IA (conversation naturelle)
│  (Voice Agent)   │
└────────┬─────────┘
         │ Transcription + résumé
         ▼
┌──────────────────┐     ┌──────────────────────┐
│  Anthropic Claude│────▶│  Supabase (PostgreSQL)│
│  (Analyse IA)    │     │  Base de données RLS  │
└──────────────────┘     └──────────┬───────────┘
                                    │
                          ┌─────────┴──────────┐
                          │                    │
                    ┌─────▼──────┐    ┌────────▼───────┐
                    │  Resend    │    │  Next.js        │
                    │  (Emails)  │    │  (Interface web)│
                    └────────────┘    └────────────────┘
                          │
                    ┌─────▼──────┐
                    │   Stripe   │
                    │ (Paiement) │
                    └────────────┘
```

### Les composants en détail

#### 🖥️ Interface web — Next.js (Vercel)
L'interface utilisateur de VetAI est développée avec **Next.js**, un framework web moderne reconnu pour sa performance et sa fiabilité. Elle est hébergée sur **Vercel**, la plateforme de référence pour les applications Next.js, qui garantit une disponibilité de 99,9 % et un chargement rapide depuis n'importe où en France. Aucune installation n'est requise : la plateforme est accessible depuis Chrome, Safari ou Edge, sur ordinateur ou tablette.

#### 🗄️ Base de données — Supabase (PostgreSQL)
Toutes les données de la clinique (profils, équipe, agents, historique des appels) sont stockées dans une base de données **PostgreSQL** hébergée chez **Supabase**, en région Europe de l'Ouest (`eu-west`). PostgreSQL est l'un des systèmes de gestion de base de données les plus robustes et éprouvés au monde, utilisé par des milliers d'entreprises en production.

Supabase ajoute par-dessus PostgreSQL une couche de sécurité appelée **Row Level Security (RLS)** : chaque ligne de données ne peut être lue ou modifiée que par l'utilisateur ou la clinique qui en est propriétaire. Concrètement, les données de la Clinique A sont physiquement inaccessibles à la Clinique B, même en cas d'erreur de requête.

#### 🤖 Intelligence artificielle — Anthropic Claude
Les transcriptions d'appels sont analysées par **Claude**, le modèle de langage développé par Anthropic. Claude génère des résumés structurés de chaque conversation, détecte les informations clés (motif de l'appel, urgence, coordonnées) et aide l'équipe vétérinaire à prioriser ses actions. Anthropic est l'une des entreprises d'IA les plus reconnues pour la sécurité et la fiabilité de ses modèles.

#### 📞 Téléphonie IA — Retell AI
L'agent vocal de VetAI est propulsé par **Retell AI**, une plateforme spécialisée dans les agents téléphoniques conversationnels. Retell AI permet à l'agent de mener des conversations naturelles, de comprendre les demandes complexes et de s'adapter au ton de l'appelant. Chaque clinique dispose d'un agent vocal configurable (nom, ton, consignes spécifiques).

#### 📡 Réseau téléphonique — Twilio
La couche réseau téléphonique est assurée par **Twilio**, leader mondial de la communication cloud. Twilio fournit à chaque clinique un numéro de téléphone dédié (ou porte le numéro existant), gère le routage des appels entrants vers l'agent Retell AI, et permet l'envoi de SMS de confirmation ou de rappel aux propriétaires d'animaux.

#### ✉️ Emails transactionnels — Resend
Les confirmations de rendez-vous, rappels et notifications automatiques sont envoyés via **Resend**, une plateforme d'email transactionnel moderne. Les emails sont émis depuis le domaine `vetai.fr`, garantissant un taux de délivrabilité élevé et une image professionnelle pour la clinique.

#### 💳 Paiement — Stripe
L'abonnement VetAI est géré via **Stripe**, la référence mondiale du paiement en ligne sécurisé. Stripe est certifié PCI-DSS niveau 1 (le plus haut niveau de sécurité pour le traitement des paiements). Les informations de carte bancaire ne transitent jamais par les serveurs de VetAI : elles sont traitées directement par Stripe dans un environnement sécurisé et isolé.

---

## 3. 🔒 Sécurité & Conformité RGPD

### Principes de sécurité par conception

La sécurité n'est pas une option ajoutée après coup chez VetAI : elle est intégrée dès la conception de l'architecture.

- **Clés et secrets côté serveur uniquement** — les clés d'API sensibles (connexion base de données, accès Anthropic, clés Stripe) sont stockées exclusivement en variables d'environnement côté serveur, sur Vercel. Elles ne sont jamais incluses dans le code source visible, ni exposées dans le navigateur de l'utilisateur.
- **Row Level Security (RLS)** — activée sur l'intégralité des tables Supabase. Chaque requête est automatiquement filtrée pour ne retourner que les données appartenant à la clinique connectée. Cette isolation est garantie au niveau de la base de données, indépendamment de la logique applicative.
- **HTTPS obligatoire** — toutes les communications entre le navigateur, le serveur et les APIs tierces sont chiffrées via TLS (HTTPS). Aucune donnée ne transite en clair sur le réseau.
- **Authentification sécurisée** — la gestion des sessions utilisateurs s'appuie sur le système d'authentification Supabase, qui gère les tokens de session, les expirations et les révocations de manière sécurisée.

### Hébergement en Europe

Conformément aux exigences du RGPD, **les données de vos clients et de vos patients sont hébergées en Europe**. Supabase opère dans la région `eu-west` (Irlande), ce qui signifie que vos données ne quittent pas l'Union européenne pour leur stockage principal.

### Conformité RGPD & sous-traitants

VetAI respecte les obligations du Règlement Général sur la Protection des Données (RGPD). La page `/privacy` du site détaille de manière transparente l'ensemble des sous-traitants impliqués dans le traitement des données :

| Sous-traitant | Rôle | Localisation données |
|---|---|---|
| **Supabase** | Base de données | EU (Irlande) |
| **Vercel** | Hébergement frontend | EU disponible |
| **Anthropic** | Analyse IA des transcriptions | USA (données temporaires) |
| **Retell AI** | Agent vocal IA | USA |
| **Twilio** | Téléphonie & SMS | USA / EU |
| **Resend** | Emails transactionnels | USA / EU |
| **Stripe** | Paiement | EU |

Les **mentions légales, Conditions Générales d'Utilisation (CGU) et Conditions Générales de Vente (CGV)** sont disponibles en permanence sur le site VetAI.

> En tant que responsable de traitement, votre clinique peut exercer ses droits d'accès, de rectification et d'effacement auprès de VetAI via l'adresse dédiée indiquée dans la politique de confidentialité.

---

## 4. Fonctionnalités Détaillées

### 📞 Accueil téléphonique IA 24h/24

L'agent vocal VetAI répond à chaque appel entrant, de jour comme de nuit, les weekends et jours fériés. Comme un secrétariat virtuel disponible 24h/24, il accueille l'appelant, comprend sa demande et agit en conséquence :

- **Qualification des urgences** : l'agent détecte les situations critiques (traumatisme, empoisonnement, difficultés respiratoires) et guide le propriétaire vers la conduite à tenir
- **Prise de rendez-vous** : l'agent collecte les informations nécessaires (animal, motif, disponibilités) et les transmet à votre équipe
- **Informations pratiques** : horaires, adresse, services disponibles — sans mobiliser votre équipe

**Bénéfice concret** : ne manquez plus jamais un appel, même en consultation, même la nuit.

### 📊 Tableau de bord clinique

L'interface web de VetAI donne à votre équipe une vue en temps réel de l'activité :

- **Journal des appels** : liste chronologique de tous les appels traités, avec statut et durée
- **Alertes urgences** : les appels identifiés comme urgents sont mis en évidence pour traitement prioritaire
- **Vue équipe** : suivi de la disponibilité et de l'activité de chaque membre

**Bénéfice concret** : votre équipe arrive le matin avec une vision complète de ce qui s'est passé la nuit, sans écouter chaque message vocal.

### 👥 Gestion d'équipe multi-rôles

Le propriétaire de la clinique invite ses collaborateurs en quelques clics, avec des niveaux d'accès adaptés :

- **Propriétaire (`owner`)** : accès complet à la configuration, la facturation et les rapports
- **Vétérinaire (`veterinarian`)** : accès aux dossiers patients et aux transcriptions
- **Secrétaire (`secretary`)** : accès à la prise de rendez-vous et au journal des appels

**Bénéfice concret** : chaque membre de l'équipe voit uniquement ce dont il a besoin, sans risque d'accès non autorisé aux données sensibles.

### 🤖 Transcription intelligente des appels

Chaque appel traité par l'agent vocal est automatiquement transcrit et analysé par Claude (Anthropic). Le résultat est une **fiche structurée** présentant :

- Le résumé de la conversation en quelques lignes
- Le motif principal de l'appel
- Les actions à entreprendre (rappel à planifier, urgence à traiter, RDV à confirmer)
- Les informations collectées (nom du propriétaire, nom de l'animal, espèce)

Cette fonctionnalité peut être activée ou désactivée par clinique selon les préférences. **Bénéfice concret** : votre équipe traite en 10 secondes ce qui nécessiterait 3 minutes d'écoute.

### ✉️ Notifications multicanal

VetAI envoie automatiquement des communications aux propriétaires d'animaux pour fluidifier la relation client :

- **SMS de confirmation** dès qu'un rendez-vous est pris par l'agent vocal
- **Email de rappel** la veille du rendez-vous
- **SMS de rappel** le jour même
- **Notifications internes** pour alerter l'équipe des urgences détectées

**Bénéfice concret** : réduisez les rendez-vous manqués et les no-shows sans effort supplémentaire pour votre équipe.

---

## 5. Tarification & Engagement

### Un abonnement simple et transparent

VetAI propose un modèle d'abonnement unique, sans surprise :

| | Détails |
|---|---|
| **Tarif** | 249 € HT / mois |
| **Engagement** | 6 mois minimum |
| **Facturation** | Mensuelle via Stripe |
| **Inclus** | Agent vocal IA, tableau de bord, transcriptions, notifications SMS + email, support |

L'abonnement inclut l'ensemble des fonctionnalités décrites dans ce document, pour une clinique et jusqu'à 5 membres d'équipe. Aucun frais à l'installation, aucun coût caché.

### Portail client en libre-service

Via le portail Stripe intégré à votre espace VetAI, vous pouvez à tout moment :

- Consulter vos factures et en télécharger les PDF
- Mettre à jour vos informations de paiement
- Gérer votre abonnement

Aucun contact nécessaire avec l'équipe VetAI pour ces opérations administratives courantes.

---

## 6. Roadmap & État d'Avancement

Voici l'état d'avancement actuel du développement de la plateforme VetAI :

### ✅ Réalisé

- **Infrastructure Supabase** — base de données opérationnelle avec triggers automatiques, tables métier et Row Level Security activée sur l'ensemble des données
- **Authentification & gestion des profils** — inscription, connexion, création automatique du profil utilisateur, gestion des rôles (`owner`, `veterinarian`, `secretary`)
- **Architecture multi-cliniques** — modèle de données permettant à chaque clinique d'isoler ses données, son équipe et ses agents

### ⏳ En cours de finalisation

- **Intégration Stripe** — mise en place du produit, du prix mensuel (249 € HT), des webhooks de paiement et du portail client en libre-service
- **Intégration Retell AI + Twilio** — connexion de l'agent vocal à l'infrastructure téléphonique, configuration des agents par clinique
- **Intégration Resend** — envoi des emails transactionnels (confirmations, rappels) depuis le domaine `vetai.fr`
- **Gestion des rôles d'équipe** — finalisation de la migration et des permissions par rôle au niveau base de données
- **Pages légales** — finalisation des CGU, CGV, mentions légales et politique de confidentialité
- **Données de démonstration** — mise en place d'un environnement de démo pour les cliniques en phase d'évaluation

### 🔮 À venir

- Intégration avec les logiciels métier vétérinaires existants (Vetosoft, CliniVet, etc.)
- Application mobile pour les vétérinaires en déplacement
- Rapports analytics avancés (taux de conversion des appels, pics d'activité, etc.)
- Support multilingue pour les cliniques en régions frontalières

---

*Document généré le 23 mars 2026 — VetAI SaaS, tous droits réservés.*
