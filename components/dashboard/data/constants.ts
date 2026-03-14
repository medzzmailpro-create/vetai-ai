
import type { Page, ReportRange, SidebarSection } from '../types/types'

export const TITLES: Record<Page, [string, string]> = {
  overview: ['Tableau de bord', "Vue d'ensemble"],
  clients: ['Clients & Dossiers', '248 clients actifs'],
  agenda: ['Agenda', 'Semaine du 9 mars 2026'],
  comms: ['Communications', 'Historique complet'],
  'agents-dash': ['Agents IA', 'Statut et performance'],
  rapports: ['Rapport Global', 'Vue agrégée des performances'],
  facturation: ['Facturation', "Gérez votre abonnement"],
  securite: ['Sécurité', "Contrôles d'accès et connexions"],
  configuration: ['Configuration', 'Paramétrage des agents IA'],
  settings: ['Paramètres', 'Configuration de votre compte'],
  equipe: ['Mon équipe', 'Membres de la clinique'],
}

export const SIDEBAR_ITEMS: SidebarSection[] = [
  {
    section: 'Principal',
    items: [
      { id: 'overview', icon: '🏠', label: "Vue d'ensemble" },
      { id: 'clients', icon: '👥', label: 'Clients & Dossiers' },
      { id: 'agenda', icon: '📅', label: 'Agenda' },
      { id: 'comms', icon: '💬', label: 'Communications' },
    ],
  },
  {
    section: 'IA & Données',
    items: [
      { id: 'agents-dash', icon: '🤖', label: 'Agents IA' },
      { id: 'rapports', icon: '📊', label: 'Rapports' },
    ],
  },
  {
    section: 'Équipe',
    items: [
      { id: 'equipe', icon: '👥', label: 'Mon équipe' },
    ],
  },
  {
    section: 'Compte',
    items: [
      { id: 'facturation', icon: '💳', label: 'Facturation' },
      { id: 'securite', icon: '🔒', label: 'Sécurité' },
      { id: 'configuration', icon: '🧩', label: 'Configuration' },
      { id: 'settings', icon: '⚙️', label: 'Paramètres' },
    ],
  },
]

export const REPORT_RANGE_LABELS: Record<ReportRange, string> = {
  daily: 'Quotidien',
  weekly: 'Hebdomadaire',
  monthly: 'Mensuel',
  quarterly: 'Trimestriel',
  yearly: 'Annuel',
  custom: 'Personnalisé',
}

export const REPORT_KPIS = [
  '📞 Appels traités',
  '📅 RDV pris par IA',
  '📊 Taux de réponse',
  '❌ No-shows évités',
  '💰 Revenus générés',
  '📞 Appels manqués évités',
  '⏱ Temps économisé',
]
