-- Migration: clinic_agents table
-- Tracks which AI agents are enabled per clinic

CREATE TABLE IF NOT EXISTS public.clinic_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  agent_type text NOT NULL CHECK (agent_type IN ('receptionist', 'agenda', 'email', 'analytics', 'transcription', 'reminders')),
  is_enabled boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(clinic_id, agent_type)
);

ALTER TABLE public.clinic_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clinic_agents_select"
  ON public.clinic_agents FOR SELECT TO authenticated
  USING (clinic_id = get_my_clinic_id());

CREATE POLICY "clinic_agents_update_owner"
  ON public.clinic_agents FOR UPDATE TO authenticated
  USING (
    clinic_id = get_my_clinic_id()
    AND EXISTS (
      SELECT 1 FROM public.clinic_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "clinic_agents_insert_owner"
  ON public.clinic_agents FOR INSERT TO authenticated
  WITH CHECK (
    clinic_id = get_my_clinic_id()
    AND EXISTS (
      SELECT 1 FROM public.clinic_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Auto-initialize all 6 agents as disabled when a new clinic is created
CREATE OR REPLACE FUNCTION public.init_clinic_agents()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.clinic_agents (clinic_id, agent_type, is_enabled)
  VALUES
    (NEW.id, 'receptionist', false),
    (NEW.id, 'agenda', false),
    (NEW.id, 'email', false),
    (NEW.id, 'analytics', false),
    (NEW.id, 'transcription', false),
    (NEW.id, 'reminders', false)
  ON CONFLICT (clinic_id, agent_type) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_clinic_created ON public.clinics;
CREATE TRIGGER on_clinic_created
  AFTER INSERT ON public.clinics
  FOR EACH ROW EXECUTE FUNCTION public.init_clinic_agents();
