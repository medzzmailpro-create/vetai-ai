
export const PAGES = ['overview', 'clients', 'agenda', 'comms', 'agents-dash', 'rapports', 'facturation', 'securite', 'configuration', 'settings', 'equipe'] as const
export type Page = typeof PAGES[number]

// Rôles clinic_members (post-migration 9)
export type UserRole = 'proprietaire' | 'responsable' | 'veterinaire' | 'secretaire'

// Helper : rôles avec droits de gestion (modifier/retirer des membres, voir l'ID clinique)
export function canManageTeam(role: UserRole): boolean {
  return role === 'proprietaire' || role === 'responsable'
}

export type Period = '24H' | '7J' | '30J' | '90J' | 'TOUT' | 'CUSTOM'
export type ReportRange = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'

export type NotificationItem = {
  id: number
  icon: string
  title: string
  description: string
  type: 'rdv' | 'message' | 'agent' | 'maintenance' | 'error'
  target: Page
}

export type SidebarItem = {
  id: Page
  icon: string
  label: string
}

export type SidebarSection = {
  section: string
  items: SidebarItem[]
}

export type Appointment = {
  time: string
  name: string
  animal: string
  badge: string
  bg: string
  border: string
  badgeBg: string
  badgeColor: string
  clientId: number
}

export type Activity = {
  icon: string
  bg: string
  client: string
  text: string
  time: string
  commId: number
}

export type CommItem = {
  id: number
  icon: string
  channel: string
  agent: string
  clientName: string
  contact: string
  duration: string
  datetime: string
  summary: string
  transcription: string
  audio_url?: string
}

export type AgentItem = {
  id: string
  icon: string
  name: string
  description: string
  defaultActive: boolean
}

export type ClientItem = {
  id: number
  prenom: string
  nom: string
  email: string
  tel: string
  animal: string
  espece: string
  race: string
  age: string
  sexe?: string
  poids?: string
  dateNaissance?: string
  couleur?: string
  puce?: string
  rdvCount: number
  lastRdv: string
  notes: string
  rappels: string[]
}

export type AgendaRdv = {
  time: string
  name: string
  motif: string
  badge: string
  color: string
  clientId?: number
}

export type AgendaDay = {
  day: string
  rdvs: AgendaRdv[]
}

// ── Supabase live types ──────────────────────────────────────────

export type Pet = {
  id: string
  name: string
  species: string
  breed: string
  birth_date: string
  client_id?: string
}

export type ClientNew = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone_primary: string
  clinic_id: string
  created_at: string
  pets: Pet[]
}

export type Vaccination = {
  vaccine_name: string
  date_administered: string
  next_due_date: string
}

export type AppointmentRow = {
  id: string
  starts_at: string
  ends_at: string
  status: 'confirmed' | 'pending' | 'cancelled' | string
  type: string
  client_name: string
  pet_name: string
  pet_species: string
}

export type AgentRow = {
  id: string
  name: string
  type: 'phone' | 'sms' | 'agenda' | 'chat' | string
  provider: string
  active: boolean
  config: Record<string, unknown>
  stats: Record<string, unknown>
  clinic_id: string
}

export type InvoiceRow = {
  id: string
  invoice_number: string | null
  amount_eur: number
  status: 'paid' | 'pending' | 'overdue' | string
  issued_at: string
  invoice_pdf_url: string | null
  client_name: string
}

export type SubscriptionRow = {
  plan_name: string
  status: string
  next_billing_date: string | null
  next_payment_amount_eur: number | null
}

export type ClinicMember = {
  id: string
  clinic_id: string
  user_id: string
  role: UserRole | string
  has_paid: boolean
  last_seen: string | null
  created_at: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  is_online: boolean
}

export type AgentEvent = {
  id: string
  event_type: string
  title: string
  description: string
  created_at: string
}

export type NotifRow = {
  id: string
  title: string
  body: string
  read: boolean
  created_at: string
}

export type SmsRow = {
  id: string
  body: string
  direction: 'inbound' | 'outbound'
  status: string
  created_at: string
  client_name: string
}
