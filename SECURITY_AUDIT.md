# Audit de sécurité VetAI — 23/03/2026

## Résumé
- Fichiers scannés : ~65
- 🔴 Problèmes critiques : 3
- 🟡 À vérifier manuellement / Catégorie B en attente : 9
- ✅ Validé : 8

---

## .env.example
- ✅ Réécrit — contient uniquement les 16 variables nécessaires
- ✅ Aucune valeur réelle présente (toutes les valeurs = vides ou commentaires)
- ✅ Variables supprimées : `RETELL_API_KEY`, `RETELL_PHONE_NUMBER`, `RETELL_WEBHOOK_SECRET`, `RETELL_LLM_ID`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `API_TOOL_SECRET`, `NEXT_PUBLIC_STRIPE_URL`, `NEXT_PUBLIC_SITE_URL`, `STRIPE_PRICE_ID`
- 🟡 Note : `STRIPE_PRICE_ID` est supprimé du .env.example mais toujours utilisé dans `app/api/stripe/create-checkout-session/route.ts:11` — à ajouter dans Vercel sans oublier

## .gitignore
- ✅ `.env.local` protégé
- ✅ `.env.production` ajouté (manquait)
- ✅ Aucun fichier `.env*` dans l'historique Git (vérifié via `git log --diff-filter=A`)
- ✅ Seul `.env.example` a été commité — fichier template sans valeurs réelles ✓

## Clés hardcodées
- ✅ Aucune clé trouvée en dur dans le code (grep sur `sk_live_`, `sk_test_`, `sk-ant-`, `eyJhbGciOi`, `sbp_`, `re_[20+]`, `key_[10+]`)

## Exposition côté client
- ✅ `SUPABASE_SERVICE_ROLE_KEY` : uniquement dans `app/api/` (12 routes) — jamais dans `components/`
- ✅ `ANTHROPIC_API_KEY` : non trouvé dans le code source (uniquement en .env.local)
- ✅ `STRIPE_SECRET_KEY` : uniquement dans `app/api/stripe/`
- ✅ `RESEND_API_KEY` : uniquement dans `app/api/`
- ✅ Aucune clé secrète dans les composants React

## Console.log
- 🟡 `app/admin/page.tsx:226,228` : deux `console.log` exposent des données cliniques (clinicId, payload, réponse Supabase) dans la console navigateur. Pas de clé API exposée mais données opérationnelles sensibles.

## Webhooks
- 🔴 **CRITIQUE** `app/api/stripe/webhook/route.ts` : vérifie la présence de `stripe-signature` mais ne valide **jamais** cryptographiquement via `stripe.webhooks.constructEvent()`. Tout attaquant peut forger un webhook Stripe.
- 🔴 **CRITIQUE** `app/api/webhooks/twilio/route.ts` : aucune vérification de signature Twilio (`validateRequest` absent). Injection de faux statuts SMS possible.
- 🔴 **CRITIQUE** `app/api/retell-webhook/route.ts` (legacy) : aucune vérification HMAC. Suppression ou sécurisation requise.
- 🟡 `app/api/webhooks/retell/route.ts` : vérification HMAC-SHA256 présente ✅ mais bypass silencieux si `RETELL_WEBHOOK_SECRET` absent (ligne 13 : `if (!secret) return true`). À durcir en production.

## Variables supprimées de .env — Références restantes dans le code

### ✅ Corrigé (Catégorie A)
| Fichier | Avant | Après |
|---|---|---|
| `app/api/webhooks/twilio/route.ts:33` | `process.env.TWILIO_PHONE_NUMBER` (direction SMS) | `params.get('Direction')` (paramètre natif Twilio) |
| `app/api/stripe/create-checkout-session/route.ts:12` | `NEXT_PUBLIC_SITE_URL` | `NEXT_PUBLIC_APP_URL` |
| `app/api/stripe/customer-portal/route.ts:11` | `NEXT_PUBLIC_SITE_URL` | `NEXT_PUBLIC_APP_URL` |
| `app/register/page.tsx:52` | `NEXT_PUBLIC_SITE_URL` | `NEXT_PUBLIC_APP_URL` |

### ⏳ En attente de décision — Catégorie B (usages master/admin VetAI)
Ces fichiers utilisent des clés **de la plateforme VetAI** (pas par clinique). Ils ne peuvent pas être remplacés par une lecture Supabase sans redéfinir l'architecture. À confirmer :

| Fichier | Variable | Usage | Décision recommandée |
|---|---|---|---|
| `app/api/activate-agent/route.ts:13,28` | `RETELL_API_KEY` | Provisionne les numéros Retell pour les cliniques (admin VetAI) | Renommer en `RETELL_MASTER_API_KEY` |
| `lib/services/retell.ts:7` | `RETELL_API_KEY` | Toutes les requêtes Retell API (créer agents, lister appels) | Renommer en `RETELL_MASTER_API_KEY` |
| `lib/services/retell.ts:28` | `RETELL_PHONE_NUMBER` | Numéro sortant par défaut | Renommer en `RETELL_MASTER_PHONE` ou supprimer si chaque clinique a le sien |
| `lib/services/retell.ts:73,75` | `RETELL_LLM_ID`, `ELEVENLABS_VOICE_ID` | LLM et voix par défaut pour création d'agents | Renommer en `RETELL_MASTER_LLM_ID` etc. |
| `lib/services/twilio.ts:4,5,13,26` | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` | Compte Twilio master VetAI pour tous les SMS | Renommer en `TWILIO_MASTER_*` ou passer par n8n |
| `app/api/send-sms/route.ts:5,6` | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` | Envoi SMS via SDK Twilio | Idem — dépend de `lib/services/twilio.ts` |
| `app/api/webhooks/retell/route.ts:95,96,97` | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` | SMS de confirmation après appel Retell | Idem ou lire depuis `ai_agents.config` |
| `app/api/webhooks/retell/route.ts:12` | `RETELL_WEBHOOK_SECRET` | Vérification HMAC signature Retell (sécurité plateforme) | **À GARDER** sous `RETELL_WEBHOOK_SECRET` (secret plateforme, pas par clinique) |
| `app/api/agents/route.ts:11` | `API_TOOL_SECRET` | Protège les endpoints outils IA (`/api/agents`) | **À GARDER** sous `API_TOOL_SECRET` (secret interne, non lié aux cliniques) |

## TypeScript
- ✅ 0 erreur (`npx tsc --noEmit` — cache .next supprimé et rechécké proprement)

## Fichiers modifiés
| Fichier | Modification |
|---|---|
| `.env.example` | Réécriture complète — suppression Retell/Twilio/ElevenLabs/API_TOOL_SECRET |
| `.gitignore` | Ajout de `.env.production` |
| `app/api/webhooks/twilio/route.ts:33` | Direction SMS : `process.env.TWILIO_PHONE_NUMBER` → `params.get('Direction')` |
| `app/api/stripe/create-checkout-session/route.ts:12` | `NEXT_PUBLIC_SITE_URL` → `NEXT_PUBLIC_APP_URL` |
| `app/api/stripe/customer-portal/route.ts:11` | `NEXT_PUBLIC_SITE_URL` → `NEXT_PUBLIC_APP_URL` |
| `app/register/page.tsx:52` | `NEXT_PUBLIC_SITE_URL` → `NEXT_PUBLIC_APP_URL` |

---

*Audit mis à jour le 23/03/2026 — VetAI Security Review v2*
