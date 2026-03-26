# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start development server
npm run build      # Production build
npm run lint       # ESLint
npx tsc --noEmit   # TypeScript check (run before committing)
```

There are no tests configured in this project.

## Architecture

**Vetai** is a Next.js 14 App Router SaaS for veterinary clinics. All UI text is in French.

### Auth Flow

`middleware.ts` uses `@supabase/ssr` (cookie-based SSR sessions):
- `/` → redirects to `/dashboard` if logged in
- `/dashboard/*` → redirects to `/login` if no session
- `/admin/*` → requires session + `support` role in `clinic_members`

`app/dashboard/page.tsx` additionally checks `profiles.has_paid` and redirects to `/payment-required` if false (admin email bypasses this).

### Dashboard Shell

`components/dashboard/Dashboard.tsx` is the main state manager. It:
- Holds all global state: current page, modals, user data, clinic config, clients, agents
- Loads data from Supabase on mount (profiles, clinic_config, clinic_members)
- Renders Sidebar + Topbar + one of 11 page components
- Shows `FirstLoginPopup` (cannot dismiss without filling `clinic_name`) on first login

Navigation is page-based (not URL-based) — clicking sidebar items sets a `page` state string.

### Supabase Client

Always use `lib/supabase/client.ts` for browser-side queries — it's a singleton `createBrowserClient` instance. API routes use `createClient` from `@supabase/supabase-js` with `SUPABASE_SERVICE_ROLE_KEY`.

### Styling

Components use **inline styles** (not Tailwind classes) throughout the dashboard. Tailwind is used on the public landing page. Shared style objects live in `components/dashboard/utils/styles.ts` (`inputStyle`, `sectionCard`).

Theme: teal `#0A7C6E` primary, `#F5A623` amber accent, background `#F5F5F3`. Syne font for headings, DM Sans for body.

### Key Supabase Tables

| Table | Purpose |
|---|---|
| `profiles` | `has_paid`, `onboarding_completed`, `is_demo`, `clinic_id` |
| `clinic_config` | Clinic settings — one row per user (unique on `user_id`) |
| `clinic_members` | `user_id` + `role` ('owner' \| 'staff' \| 'support') |
| `clients` | Client/animal records |
| `appointments` | Booking records |
| `ai_agents` | Agent config per clinic |
| `calls` | Retell AI call logs |
| `sms_messages` | Twilio SMS logs |
| `notification_prefs` | Per-user notification settings |
| `support_tickets` | Support form submissions |

### External Integrations

- **Claude (Anthropic)** — IA agent conversation via `app/api/agents/route.ts`
- **Retell AI** — Voice phone calls; webhook at `app/api/webhooks/retell/route.ts`
- **Twilio** — SMS; webhook at `app/api/webhooks/twilio/route.ts`
- **Stripe** — Subscription payments; webhook at `app/api/stripe/webhook/route.ts`
- **Resend** — Transactional email

### TypeScript Types

All dashboard types are in `components/dashboard/types/types.ts`. The `Page` union type defines valid dashboard pages. Always check existing types before adding new ones.

### Data Fallback Pattern

Dashboard pages that query Supabase must gracefully fall back to mock data from `components/dashboard/data/mockData.ts` when tables are empty or queries fail — never throw errors to the user.
