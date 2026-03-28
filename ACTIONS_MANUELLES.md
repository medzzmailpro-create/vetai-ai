# 📋 ACTIONS MANUELLES — Vetai

> Ce fichier liste toutes les actions à effectuer manuellement dans les dashboards externes.
> Organisées par priorité. À compléter dans l'ordre.

---

## 🔴 CRITIQUE — À faire avant le premier déploiement

### SUPABASE — URL Configuration
**Où :** Supabase Dashboard → Authentication → URL Configuration
**Quoi :**
1. Site URL = `https://votre-domaine.vercel.app`
2. Redirect URLs (ajouter) :
   - `https://votre-domaine.vercel.app/auth/callback`
   - `https://votre-domaine.vercel.app/dashboard`
   - `http://localhost:3000/auth/callback`
3. Cliquer **Save**

**Pourquoi :** Sans ça, les liens de confirmation email redirigent vers localhost.

---

### VERCEL — Variables d'environnement
**Où :** Vercel Dashboard → votre projet → Settings → Environment Variables
**Quoi :** Ajouter toutes les variables suivantes (copier depuis `.env.local`) :

| Variable | Environnement |
|----------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All |
| `SUPABASE_SERVICE_ROLE_KEY` | All |
| `NEXT_PUBLIC_SITE_URL` | Production |
| `NEXT_PUBLIC_ADMIN_EMAIL` | All |
| `ANTHROPIC_API_KEY` | All |
| `STRIPE_SECRET_KEY` | Production |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | All |
| `STRIPE_WEBHOOK_SECRET` | Production |
| `STRIPE_PRICE_ID` | Production |
| `NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL` | All |
| `RESEND_API_KEY` | All |
| `CONTACT_NOTIFY_EMAIL` | All |
| `RETELL_API_KEY` | All |
| `RETELL_PHONE_NUMBER` | All |
| `RETELL_WEBHOOK_SECRET` | All |
| `RETELL_LLM_ID` | All |
| `TWILIO_ACCOUNT_SID` | All |
| `TWILIO_AUTH_TOKEN` | All |
| `TWILIO_PHONE_NUMBER` | All |
| `ELEVENLABS_API_KEY` | All |
| `ELEVENLABS_VOICE_ID` | All |
| `API_TOOL_SECRET` | All |

Puis cliquer **Redeploy**.

**Pourquoi :** Sans ces variables, le build peut échouer et les fonctionnalités ne sont pas opérationnelles.

---

## 🟠 IMPORTANT — À faire pour les paiements

### STRIPE — Mettre à jour le prix (249€ HT/mois)
**Où :** Stripe Dashboard → Products → "La Sentinelle"
**Quoi :**
1. Aller dans **Stripe Dashboard > Products > "La Sentinelle"**
2. Modifier ou créer un prix récurrent : **249€ HT/mois** (recurring, monthly)
3. Copier le `price_id` généré (format : `price_xxx`)
4. Aller dans **Vercel > Settings > Environment Variables > `STRIPE_PRICE_ID`**
5. Coller le nouveau `price_id`
6. **Redéployer** l'application

> ⚠️ Ne pas modifier un prix existant déjà utilisé par des clients actifs — créer un nouveau prix.
> Les clients existants gardent leur ancien tarif contractuel.

### STRIPE — Configurer le Webhook
**Où :** Stripe Dashboard → Developers → Webhooks → Add endpoint
**Quoi :**
- URL : `https://votre-domaine.vercel.app/api/stripe/webhook`
- Événements à écouter :
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
- Copier le **Signing secret** (`whsec_...`) → ajouter dans Vercel : `STRIPE_WEBHOOK_SECRET`

**Pourquoi :** Sans webhook, les paiements ne mettent pas à jour `has_paid` automatiquement.

### STRIPE — Portail client
**Où :** Stripe Dashboard → Settings → Billing → Customer portal
**Quoi :**
1. Activer le portail
2. Copier l'URL du portail → ajouter dans Vercel : `NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL`

---

## 🟡 IMPORTANT — Supabase SQL Migrations

**Où :** Supabase Dashboard → SQL Editor

### Migration 1 — Trigger profiles (déjà exécutée via MCP le 17/03/2026)
Fichier : `supabase/migrations/20260317_001_profiles_trigger.sql`
Crée automatiquement un profil dans `profiles` à chaque inscription.
✅ Exécutée

### Migration 2 — Table clinic_agents (déjà exécutée via MCP le 17/03/2026)
Fichier : `supabase/migrations/20260317_002_clinic_agents.sql`
Crée la table `clinic_agents` avec les 6 types d'agents par clinique.
✅ Exécutée

### Migration 3 — À exécuter manuellement si besoin
Si les tables `clinics` ou `clinic_members` n'ont pas de FK, vérifier les contraintes.

### Migration 4 — Toggle Transcriptions (18/03/2026)
Le toggle "Transcriptions" dans Configuration utilise la table `clinic_agents` **déjà existante**.
Aucune nouvelle table ni colonne requise.
La ligne `(clinic_id, agent_type='transcription')` est créée automatiquement via le trigger `init_clinic_agents` au moment de la création d'une clinique.

Si une clinique existante n'a pas encore de ligne `transcription` dans `clinic_agents`, le toggle crée la ligne via `upsert` au premier clic (aucun SQL manuel requis).

### Migration 5 — Colonne `role` dans `profiles` (19/03/2026)
La page "Mon équipe" utilise `profiles.role` pour afficher et modifier les rôles des membres.

**Valeurs autorisées :** `owner`, `veterinarian`, `secretary`

**SQL à exécuter dans Supabase Dashboard → SQL Editor :**
```sql
-- ============================================
-- MIGRATION 5 — Colonne role dans profiles
-- Date : 19/03/2026
-- But : Ajouter les rôles owner / veterinarian / secretary
-- ============================================

-- 1. Ajouter la colonne role si elle n'existe pas
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT;

-- 2. Appliquer la contrainte CHECK
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('owner', 'veterinarian', 'secretary'));

-- 3. Mettre à jour les propriétaires existants
UPDATE profiles p
SET role = 'owner'
FROM clinics c
WHERE c.owner_user_id = p.id
  AND (p.role IS NULL OR p.role != 'owner');

-- 4. Mettre à jour les membres staff → veterinarian
UPDATE profiles p
SET role = 'veterinarian'
FROM clinic_members cm
WHERE cm.user_id = p.id
  AND cm.role = 'staff'
  AND p.role IS NULL;

-- 5. Vérification (à exécuter après)
SELECT id, email, role FROM profiles ORDER BY role;
```

**Checklist post-migration :**
- [ ] SQL exécuté dans Supabase SQL Editor
- [ ] Vérifier dans Table Editor → profiles → colonne `role` visible
- [ ] Tester : le owner a bien role = 'owner'
- [ ] Tester : la page "Mon équipe" affiche les rôles

**Pourquoi :** La page Mon équipe lit `profiles.role` (owner/veterinarian/secretary) et permet au propriétaire de changer le rôle entre veterinarian et secretary. La suppression d'un membre met `clinic_id = null` et `role = null` dans profiles.

---

### Migration 6 — Colonnes Stripe dans `clinic_members` (26/03/2026)

Le webhook Stripe et la page checkout utilisent ces colonnes pour tracer les abonnements.

**SQL à exécuter dans Supabase Dashboard → SQL Editor :**
```sql
-- ============================================
-- MIGRATION 6 — Colonnes Stripe dans clinic_members
-- Date : 26/03/2026
-- But : Stocker les IDs Stripe pour chaque membre/abonnement
-- ============================================

-- 1. Colonne has_paid (accès payant)
ALTER TABLE clinic_members
  ADD COLUMN IF NOT EXISTS has_paid BOOLEAN NOT NULL DEFAULT false;

-- 2. Colonne stripe_customer_id
ALTER TABLE clinic_members
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- 3. Colonne stripe_subscription_id
ALTER TABLE clinic_members
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- 4. Vérification
SELECT id, user_id, has_paid, stripe_customer_id, stripe_subscription_id
FROM clinic_members
LIMIT 10;
```

**Checklist post-migration :**
- [ ] SQL exécuté dans Supabase SQL Editor
- [ ] Vérifier Table Editor → clinic_members → colonnes visibles
- [ ] Tester un paiement Stripe → vérifier que `has_paid = true` se met à jour

**Pourquoi :** Le webhook `checkout.session.completed` écrit `has_paid`, `stripe_customer_id`, `stripe_subscription_id` dans `clinic_members`. La route `create-checkout-session` lit `stripe_customer_id` pour distinguer le premier paiement (490€ + 249€/mois) des paiements suivants (249€/mois seulement).

---

### Migration 7 — Colonne `clinic_id` dans `clinic_members` (26/03/2026)

La cascade d'annulation d'abonnement nécessite de retrouver tous les membres d'une clinique via `clinic_id`.

**SQL à exécuter :**
```sql
-- ============================================
-- MIGRATION 7 — Colonne clinic_id dans clinic_members
-- Date : 26/03/2026
-- But : Permettre la cascade Stripe → désactiver tous les membres d'une clinique
-- ============================================

-- Ajouter clinic_id si manquant (devrait déjà exister)
ALTER TABLE clinic_members
  ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;

-- Ajouter last_seen si manquant
ALTER TABLE clinic_members
  ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;

-- Vérification
SELECT user_id, clinic_id, role, has_paid FROM clinic_members LIMIT 10;
```

**Pourquoi :** Quand Stripe envoie `customer.subscription.deleted`, le webhook retrouve le `clinic_id` via `clinic_members.stripe_subscription_id` puis désactive tous les membres de cette clinique (`has_paid = false` dans `clinic_members` ET `profiles`).

---

### Migration 8 — Système de trial dans `clinics` (28/03/2026)

Ajoute les colonnes nécessaires pour gérer la période d'essai et le statut d'abonnement par clinique.

**SQL à exécuter dans Supabase Dashboard → SQL Editor :**
```sql
-- ============================================
-- MIGRATION 8 — Système de trial dans clinics
-- Date : 28/03/2026
-- But : Gérer trial, expiration et statut d'abonnement
-- ============================================

ALTER TABLE clinics ADD COLUMN IF NOT EXISTS trial_start TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'none'
  CHECK (subscription_status IN ('none', 'trial', 'active', 'expired', 'cancelled'));

-- Mettre à jour les cliniques existantes qui ont déjà un abonnement actif Stripe
-- UPDATE clinics SET subscription_status = 'active', is_active = true
-- WHERE id IN (SELECT DISTINCT clinic_id FROM clinic_members WHERE has_paid = true);

-- Vérification
SELECT id, name, subscription_status, is_active, trial_start, trial_end FROM clinics LIMIT 10;
```

**Pour activer une démo de 14 jours pour une clinique (remplacer `<clinic_id>`) :**
```sql
UPDATE clinics
SET trial_start = NOW(),
    trial_end = NOW() + INTERVAL '14 days',
    subscription_status = 'trial',
    is_active = true
WHERE id = '<clinic_id>';
```

**Checklist post-migration :**
- [ ] SQL exécuté dans Supabase SQL Editor
- [ ] Vérifier Table Editor → clinics → colonnes visibles
- [ ] Mettre à jour les cliniques existantes payantes (UPDATE ci-dessus)
- [ ] Tester : clinique en trial → accès dashboard OK
- [ ] Tester : trial expiré → redirection /payment-required
- [ ] Tester : paiement Stripe → subscription_status = 'active'

**Variables d'environnement Vercel à ajouter :**
```
NEXT_PUBLIC_STRIPE_URL=https://buy.stripe.com/aFacN4b9adchgqqfKNdnW00
```

---

### SUPABASE — URL Configuration (mise à jour vetai.fr)
**Où :** Supabase Dashboard → Authentication → URL Configuration
**Quoi :**
1. Site URL = `https://www.vetai.fr`
2. Redirect URLs (ajouter) :
   - `https://www.vetai.fr/auth/callback`
   - `https://www.vetai.fr/dashboard`
3. Cliquer **Save**

**Pourquoi :** Les emails de confirmation Supabase utilisent `{{ .SiteURL }}` — il doit pointer vers vetai.fr.

---

### SUPABASE — Email Templates
**Où :** Supabase Dashboard → Authentication → Email Templates
**Quoi :** Vérifier que les liens dans les templates utilisent `{{ .SiteURL }}` (pas localhost).

---

### Migration 9 — Nouveau système de rôles dans `clinic_members` (28/03/2026)

Remplace les rôles `owner/admin/staff/viewer` par `proprietaire/responsable/veterinaire/secretaire`.

**SQL à exécuter dans Supabase Dashboard → SQL Editor :**
```sql
-- ============================================
-- MIGRATION 9 — Nouveau système de rôles clinic_members
-- Date : 28/03/2026
-- But : Passer à 4 rôles métier clairs
-- ============================================

-- 1. Supprimer la contrainte CHECK existante si elle existe
ALTER TABLE clinic_members
  DROP CONSTRAINT IF EXISTS clinic_members_role_check;

-- 2. Migrer les anciennes valeurs
UPDATE clinic_members SET role = 'proprietaire' WHERE role = 'owner';
UPDATE clinic_members SET role = 'responsable'  WHERE role = 'admin';
UPDATE clinic_members SET role = 'veterinaire'  WHERE role IN ('staff', 'veterinarian');
UPDATE clinic_members SET role = 'secretaire'   WHERE role IN ('viewer', 'secretary');

-- 3. Idem dans profiles si role y est stocké
UPDATE profiles SET role = 'proprietaire' WHERE role = 'owner';
UPDATE profiles SET role = 'responsable'  WHERE role = 'admin';
UPDATE profiles SET role = 'veterinaire'  WHERE role IN ('staff', 'veterinarian');
UPDATE profiles SET role = 'secretaire'   WHERE role IN ('viewer', 'secretary');

-- 4. Appliquer la nouvelle contrainte CHECK
ALTER TABLE clinic_members
  ADD CONSTRAINT clinic_members_role_check
  CHECK (role IN ('proprietaire', 'responsable', 'veterinaire', 'secretaire'));

-- 5. Vérification
SELECT user_id, clinic_id, role FROM clinic_members ORDER BY role;
```

**Règles métier à respecter :**
- `proprietaire` : 1 seul par clinique (le créateur)
- `responsable` : plusieurs possibles, droits élargis
- `veterinaire` : accès limité, pas de gestion d'équipe
- `secretaire` : accès limité, pas de gestion d'équipe

**Checklist post-migration :**
- [ ] SQL exécuté dans Supabase SQL Editor
- [ ] Vérifier Table Editor → clinic_members → colonne role mise à jour
- [ ] Tester que le propriétaire voit le badge 👑 dans "Mon équipe"
- [ ] Tester le changement de rôle en temps réel (Supabase Realtime)
- [ ] Tester le transfert de propriété (vérification mot de passe)

---

### STRIPE — Ajouter les événements webhook `invoice.paid`
**Où :** Stripe Dashboard → Developers → Webhooks → votre endpoint
**Quoi :** Ajouter l'événement `invoice.paid` à la liste des événements écoutés.
Ce nouvel événement confirme les renouvellements mensuels réussis.

---

## 🟡 IMPORTANT — APIs Externes

### RETELL AI
**Où :** Retell AI Dashboard
1. Créer un agent vocal
2. Configurer webhook : `https://votre-domaine.vercel.app/api/webhooks/retell`
3. Copier clé API → `RETELL_API_KEY`
4. Copier LLM ID → `RETELL_LLM_ID`

### TWILIO
**Où :** Twilio Console
1. Créer/configurer un numéro de téléphone
2. Webhook SMS : `https://votre-domaine.vercel.app/api/webhooks/twilio`
3. Copier Account SID + Auth Token

### RESEND
**Où :** Resend Dashboard
1. Vérifier/configurer votre domaine d'envoi
2. Copier clé API → `RESEND_API_KEY`
3. Note : le domaine `vetai.fr` doit être vérifié dans Resend pour l'envoi depuis `noreply@vetai.fr`

---

## 🔵 PAGES LÉGALES — À compléter

Les pages suivantes existent mais contiennent des espaces `[À COMPLÉTER]` :

### /mentions-legales
- [ ] Remplacer `[À COMPLÉTER — votre nom/société]` avec vos vraies informations légales (nom, adresse, SIRET)
- [ ] Remplacer `[À COMPLÉTER]` du directeur de publication

### /cgu-cgv
- [ ] Vérifier que le prix de `249€ HT/mois` est correct (tarif lancement)
- [ ] Vérifier les conditions de résiliation (actuellement : 6 mois d'engagement)

### /privacy
- [ ] Vérifier la liste des sous-traitants si d'autres services sont ajoutés

---

## 🟢 OPTIONNEL — Améliorations futures

### SUPABASE — Email Templates
**Où :** Supabase → Authentication → Email Templates
- Personnaliser le template "Confirm signup" avec branding Vetai
- Vérifier que `{{ .SiteURL }}` est utilisé (pas localhost)

### SUPABASE — Table `clients`
La table `clients` est distincte de `profiles` :
- `profiles` = comptes utilisateurs (vétérinaires, staff)
- `clients` = propriétaires d'animaux (clientèle des cliniques)
Ces deux tables servent des rôles différents, elles ne sont pas redondantes.

### SUPABASE — Données de démonstration
Pour le compte `demo@vetai.ai`, insérer des données de démonstration réalistes dans :
- `calls` (appels avec transcriptions)
- `appointments` (rendez-vous des 30 derniers jours)
- `clients` (quelques propriétaires et animaux)
- `agent_events` (activité récente)

### SÉCURITÉ — Clés exposées dans .env.local
⚠️ Les clés suivantes ont été trouvées dans `.env.local` :
- `SUPABASE_SERVICE_ROLE_KEY` — JWT complet exposé dans `.env.local`
- `ANTHROPIC_API_KEY` — Clé API Anthropic réelle

Ces clés ne sont PAS dans le code source (uniquement dans `.env.local`).
`.env.local` est bien dans `.gitignore` — NE PAS committer ce fichier.
Si ces clés ont été exposées par accident (git push), les régénérer immédiatement dans les dashboards respectifs.

---

## 🔐 Où renseigner les clés API en toute sécurité

### En local (développement)
Fichier : `.env.local` (à la racine du projet, **JAMAIS commité**)

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

ANTHROPIC_API_KEY=sk-ant-...

RETELL_API_KEY=key_...
RETELL_LLM_ID=llm_...

TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+33...

RESEND_API_KEY=re_...
```

### En production (Vercel)
1. Va sur https://vercel.com → ton projet → Settings → Environment Variables
2. Ajoute **CHAQUE** variable ci-dessus
3. Sélectionne "Production" (et "Preview" si besoin)
4. Ne **JAMAIS** cocher "Expose to browser" pour les clés secrètes
5. Seules les variables `NEXT_PUBLIC_*` sont autorisées côté client

### Règles de sécurité absolues
- **JAMAIS** de clé API dans le code source
- **JAMAIS** de clé dans un fichier commité sur Git
- **JAMAIS** de `SUPABASE_SERVICE_ROLE_KEY` côté client
- **JAMAIS** de `console.log()` avec des clés en production
- Les webhooks (Stripe, Retell, Twilio) doivent **TOUJOURS** vérifier la signature

---

## ✅ Résumé ordre de réalisation

1. ✅ Supabase : URL Configuration (Auth redirect)
2. ✅ Vercel : variables d'environnement + redéploiement
3. ⏳ Stripe : produit + prix + webhook + portail
4. ⏳ Retell AI + Twilio + Resend : webhooks
5. ⏳ Pages légales : compléter les informations manquantes
6. ⏳ Demo account : insérer données de démonstration

---

*Généré automatiquement le 17 mars 2026*
