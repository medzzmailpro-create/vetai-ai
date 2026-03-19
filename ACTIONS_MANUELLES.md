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
-- Ajouter la colonne role si elle n'existe pas
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT;

-- Appliquer la contrainte CHECK (limiter aux 3 valeurs + NULL)
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('owner', 'veterinarian', 'secretary'));

-- Mettre à jour les propriétaires existants (ceux qui ont owner_user_id dans clinics)
UPDATE profiles p
SET role = 'owner'
FROM clinics c
WHERE c.owner_user_id = p.id
  AND (p.role IS NULL OR p.role != 'owner');

-- Mettre à jour les membres existants (staff → veterinarian) si besoin
UPDATE profiles p
SET role = 'veterinarian'
FROM clinic_members cm
WHERE cm.user_id = p.id
  AND cm.role = 'staff'
  AND p.role IS NULL;
```

**Pourquoi :** La page Mon équipe lit `profiles.role` (owner/veterinarian/secretary) et permet au propriétaire de changer le rôle entre veterinarian et secretary. La suppression d'un membre met `clinic_id = null` et `role = null` dans profiles.

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

## ✅ Résumé ordre de réalisation

1. ✅ Supabase : URL Configuration (Auth redirect)
2. ✅ Vercel : variables d'environnement + redéploiement
3. ⏳ Stripe : produit + prix + webhook + portail
4. ⏳ Retell AI + Twilio + Resend : webhooks
5. ⏳ Pages légales : compléter les informations manquantes
6. ⏳ Demo account : insérer données de démonstration

---

*Généré automatiquement le 17 mars 2026*
