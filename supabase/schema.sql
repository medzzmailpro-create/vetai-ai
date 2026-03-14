-- ============================================================
-- Stack IA — SaaS Vétérinaire
-- Tables: ai_agents, calls, sms_messages, telegram_messages
-- ============================================================

-- Extension pour la recherche vectorielle (optionnel)
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- ai_agents: config des agents par clinique
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_agents (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id      text NOT NULL, -- 'phone', 'whatsapp', 'telegram', 'chat', 'agenda', 'followup'
  name          text NOT NULL,
  provider      text,          -- 'retell', 'twilio', 'elevenlabs', 'telegram', 'claude'
  active        boolean DEFAULT true,
  config        jsonb DEFAULT '{}',
  stats         jsonb DEFAULT '{"calls_today": 0, "sms_sent": 0, "messages_today": 0}',
  created_at    timestamptz DEFAULT now(),
  UNIQUE (user_id, agent_id)
);

ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_agents: user owns" ON ai_agents
  USING (auth.uid() = user_id);

-- ============================================================
-- calls: log des appels Retell AI
-- ============================================================
CREATE TABLE IF NOT EXISTS calls (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  retell_call_id      text UNIQUE,
  from_number         text,
  to_number           text,
  status              text DEFAULT 'started', -- 'started' | 'ongoing' | 'ended' | 'failed'
  duration_ms         integer,
  transcript          text,
  recording_url       text,
  summary             text,
  appointment_booked  boolean DEFAULT false,
  client_name         text,
  created_at          timestamptz DEFAULT now(),
  ended_at            timestamptz
);

ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "calls: user owns" ON calls
  USING (auth.uid() = user_id);

-- ============================================================
-- sms_messages: log des SMS Twilio
-- ============================================================
CREATE TABLE IF NOT EXISTS sms_messages (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  twilio_sid      text UNIQUE,
  to_number       text,
  from_number     text,
  body            text,
  status          text DEFAULT 'queued', -- 'queued' | 'sent' | 'delivered' | 'failed'
  direction       text DEFAULT 'outbound', -- 'outbound' | 'inbound'
  related_call_id uuid REFERENCES calls(id) ON DELETE SET NULL,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sms_messages: user owns" ON sms_messages
  USING (auth.uid() = user_id);

-- ============================================================
-- telegram_messages: log des messages Telegram → Claude
-- ============================================================
CREATE TABLE IF NOT EXISTS telegram_messages (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_chat_id bigint,
  telegram_user   text,
  message_text    text,
  direction       text DEFAULT 'inbound', -- 'inbound' | 'outbound'
  ai_action text,  -- action déclenchée par l'IA
  response_text   text,  -- réponse envoyée
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE telegram_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "telegram_messages: user owns" ON telegram_messages
  USING (auth.uid() = user_id);

-- ============================================================
-- Index pour les performances
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_calls_user_id ON calls(user_id);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON calls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_user_id ON sms_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_user_id ON telegram_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_user_id ON ai_agents(user_id);

-- ============================================================
-- clinic_config: configuration de la clinique par utilisateur
-- ============================================================
CREATE TABLE IF NOT EXISTS clinic_config (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  clinic_name         text NOT NULL DEFAULT '',
  address             text DEFAULT '',
  phone               text DEFAULT '',
  email               text DEFAULT '',
  hours               text DEFAULT '',
  clinic_type         text DEFAULT 'Vétérinaire généraliste',
  transfert_enabled   boolean DEFAULT true,
  transfert_number    text DEFAULT '',
  duree_rdv           integer DEFAULT 20,
  buffer_rdv          integer DEFAULT 5,
  setup_done          boolean DEFAULT false,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);
ALTER TABLE clinic_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clinic_config: user owns" ON clinic_config
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- clinic_members: rôles utilisateurs (owner / staff)
-- ============================================================
CREATE TABLE IF NOT EXISTS clinic_members (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role        text NOT NULL DEFAULT 'owner',
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE clinic_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clinic_members: user owns" ON clinic_members
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- clients: dossiers clients et animaux
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  prenom          text DEFAULT '',
  nom             text DEFAULT '',
  email           text DEFAULT '',
  tel             text DEFAULT '',
  animal          text DEFAULT '',
  espece          text DEFAULT '',
  race            text DEFAULT '',
  age             text DEFAULT '',
  sexe            text DEFAULT '',
  poids           text DEFAULT '',
  date_naissance  date,
  couleur         text DEFAULT '',
  puce            text DEFAULT '',
  rdv_count       integer DEFAULT 0,
  last_rdv        date,
  notes           text DEFAULT '',
  rappels         text DEFAULT '',
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clients: user owns" ON clients
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- appointments: rendez-vous
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id   uuid REFERENCES clients(id) ON DELETE SET NULL,
  title       text NOT NULL DEFAULT 'Rendez-vous',
  start_at    timestamptz NOT NULL,
  end_at      timestamptz,
  status      text DEFAULT 'scheduled',
  notes       text DEFAULT '',
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "appointments: user owns" ON appointments
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- notification_prefs: préférences de notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_prefs (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  weekly_report         boolean DEFAULT true,
  missed_call_alert     boolean DEFAULT true,
  daily_summary         boolean DEFAULT false,
  agents_offline_alert  boolean DEFAULT true,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);
ALTER TABLE notification_prefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notification_prefs: user owns" ON notification_prefs
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- support_tickets: tickets support depuis le dashboard
-- ============================================================
CREATE TABLE IF NOT EXISTS support_tickets (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  category    text DEFAULT 'Autre',
  subject     text NOT NULL,
  message     text NOT NULL,
  status      text DEFAULT 'open',
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "support_tickets: user owns" ON support_tickets
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- contact_requests: demandes de démo depuis la landing page
-- ============================================================
CREATE TABLE IF NOT EXISTS contact_requests (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  prenom      text NOT NULL,
  nom         text DEFAULT '',
  email       text NOT NULL,
  clinique    text DEFAULT '',
  tel         text DEFAULT '',
  offre       text DEFAULT '',
  message     text DEFAULT '',
  created_at  timestamptz DEFAULT now()
);
-- Insert public via API route avec service role key (pas de RLS restrictive)

-- Index supplémentaires
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_at ON appointments(start_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_requests_created_at ON contact_requests(created_at DESC);

-- ============================================================
-- clinics: cliniques créées par les utilisateurs
-- ============================================================
CREATE TABLE IF NOT EXISTS clinics (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text NOT NULL DEFAULT '',
  address     text DEFAULT '',
  phone       text DEFAULT '',
  email       text DEFAULT '',
  owner_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clinics: owner or member" ON clinics
  FOR ALL USING (
    auth.uid() = owner_id
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND clinic_id = clinics.id
    )
  );

-- ============================================================
-- profiles: informations personnelles des utilisateurs
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id                   uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name           text DEFAULT '',
  last_name            text DEFAULT '',
  email                text DEFAULT '',
  phone                text DEFAULT '',
  clinic_id            uuid REFERENCES clinics(id) ON DELETE SET NULL,
  onboarding_completed boolean DEFAULT false,
  created_at           timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles: user owns" ON profiles
  FOR ALL USING (auth.uid() = id);

-- ============================================================
-- Trigger: crée un profil vide à chaque nouveau signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, COALESCE(NEW.email, ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- Colonnes paiement dans clinic_members (migration)
-- ============================================================
ALTER TABLE clinic_members ADD COLUMN IF NOT EXISTS has_paid boolean DEFAULT false;
ALTER TABLE clinic_members ADD COLUMN IF NOT EXISTS stripe_customer_id text;

CREATE INDEX IF NOT EXISTS idx_profiles_clinic_id ON profiles(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinics_owner_id ON clinics(owner_id);

-- ============================================================
-- MIGRATION — Colonnes has_paid + role dans profiles
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_paid boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'client';

-- ============================================================
-- Helper function — évite la récursion RLS sur profiles
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- ============================================================
-- RLS sur profiles — réécriture complète
-- (remplace la politique FOR ALL trop permissive)
-- ============================================================
DROP POLICY IF EXISTS "profiles: user owns" ON profiles;
DROP POLICY IF EXISTS "profiles: select" ON profiles;
DROP POLICY IF EXISTS "profiles: insert own" ON profiles;
DROP POLICY IF EXISTS "profiles: update" ON profiles;

-- SELECT : propre ligne (client) ou toutes lignes (support)
CREATE POLICY "profiles: select" ON profiles
  FOR SELECT USING (
    auth.uid() = id
    OR public.get_my_role() = 'support'
  );

-- INSERT : seulement sa propre ligne (trigger signup + onboarding upsert)
CREATE POLICY "profiles: insert own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- UPDATE : propre ligne (client) ou toutes lignes (support)
CREATE POLICY "profiles: update" ON profiles
  FOR UPDATE USING (
    auth.uid() = id OR public.get_my_role() = 'support'
  );

-- ============================================================
-- Trigger — empêche l'auto-promotion de role
-- (seul un compte support peut changer le champ role)
-- ============================================================
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role AND public.get_my_role() != 'support' THEN
    RAISE EXCEPTION 'Seuls les comptes support peuvent modifier le champ role.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_role_escalation_trigger ON profiles;
CREATE TRIGGER prevent_role_escalation_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_escalation();

-- ============================================================
-- RLS sur clinics — support peut lire toutes les cliniques
-- (nécessaire pour la jointure dans la page admin)
-- ============================================================
DROP POLICY IF EXISTS "clinics: support reads all" ON clinics;
CREATE POLICY "clinics: support reads all" ON clinics
  FOR SELECT USING (public.get_my_role() = 'support');
