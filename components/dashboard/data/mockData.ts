
import type { Activity, AgendaDay, AgentItem, Appointment, ClientItem, CommItem, NotificationItem } from '../types/types'

export const appointments: Appointment[] = [
  { time: '09:00', name: 'Bella — Martin', animal: '🐕 Urgence patte fracturée', badge: '🔴 Urgence', bg: 'rgba(229,62,62,0.04)', border: '#E53E3E', badgeBg: 'rgba(229,62,62,0.1)', badgeColor: '#E53E3E', clientId: 1 },
  { time: '10:30', name: 'Milo — Dupont', animal: '🐈 Suivi post-opératoire J+3', badge: '🟠 Prioritaire', bg: 'rgba(221,107,32,0.04)', border: '#DD6B20', badgeBg: 'rgba(221,107,32,0.1)', badgeColor: '#DD6B20', clientId: 2 },
  { time: '11:00', name: 'Oscar — Leblanc', animal: '🐕 Vaccination annuelle', badge: '🟡 Important', bg: 'rgba(214,158,46,0.04)', border: '#D69E2E', badgeBg: 'rgba(214,158,46,0.1)', badgeColor: '#D69E2E', clientId: 3 },
  { time: '14:00', name: 'Luna — Moreau', animal: '🐈 Bilan de santé annuel', badge: '🟢 Standard', bg: 'rgba(56,161,105,0.04)', border: '#38A169', badgeBg: 'rgba(56,161,105,0.1)', badgeColor: '#38A169', clientId: 4 },
]

export const activities: Activity[] = [
  { icon: '📞', bg: '#E8F5F3', client: 'Agent Téléphone', text: 'a pris rendez-vous avec Sophie Martin', time: '10:32', commId: 1 },
  { icon: '📱', bg: 'rgba(56,161,105,0.1)', client: 'Agent WhatsApp', text: 'a confirmé le rappel vaccin de Milo Dupont', time: '09:47', commId: 3 },
  { icon: '💬', bg: 'rgba(49,130,206,0.08)', client: 'Agent Chat Web', text: 'a répondu à une question sur la stérilisation', time: '09:15', commId: 2 },
]

export const comms: CommItem[] = [
    {
      id: 1,
      icon: '📞',
      channel: 'Appel téléphonique',
      agent: 'Agent Téléphone',
      clientName: 'Sophie Martin',
      contact: 'Téléphone · 06 12 34 56 78',
      duration: '08:32',
      datetime: "Aujourd'hui · 10:32",
      summary: 'RDV pris pour Bella (urgence patte fracturée)',
      transcription: "Bonjour, ici l'Agent Téléphone de la Clinique du Parc. Je vous appelle pour planifier un rendez-vous pour Bella concernant une urgence patte fracturée. Nous avons proposé un créneau aujourd'hui à 16h avec le Dr Martin. La cliente a confirmé sa disponibilité et a reçu un SMS de confirmation automatique.",
      audio_url: 'https://lcsydqzerktarhtzsodo.supabase.co/storage/v1/object/public/calls/appel-test.mp3'
    },
    {
      id: 2,
      icon: '💬',
      channel: 'Chat web',
      agent: 'Agent Chat Web',
      clientName: 'Visiteur site web',
      contact: 'Chat · clinique-parc.fr',
      duration: '03:12',
      datetime: "Aujourd'hui · 09:58",
      summary: 'Questions sur la stérilisation et les tarifs',
      transcription: "Bonjour, je souhaiterais des informations sur la stérilisation de mon chat.",
      audio_url: ''
    },
    {
      id: 3,
      icon: '📱',
      channel: 'WhatsApp',
      agent: 'Agent WhatsApp',
      clientName: 'M. Dupont (Milo)',
      contact: 'WhatsApp · +33 6 98 76 54 32',
      duration: '01:45',
      datetime: 'Hier · 17:14',
      summary: 'Confirmation du rappel vaccin pour Milo',
      transcription: "Bonjour, ici la Clinique du Parc. Nous vous rappelons que Milo est attendu demain.",
      audio_url: ''
    }
  ]

export const agents: AgentItem[] = [
  { id: 'phone', icon: '🤙', name: 'Agent Téléphone', description: 'Gère les appels entrants 24/7', defaultActive: true },
  { id: 'chat', icon: '💬', name: 'Agent Chat Web', description: 'Répond aux messages du site web', defaultActive: true },
  { id: 'agenda', icon: '📅', name: 'Agent Agenda', description: 'Propose des créneaux et planifie les RDV', defaultActive: true },
  { id: 'whatsapp', icon: '📱', name: 'Agent WhatsApp', description: 'Gère les conversations WhatsApp', defaultActive: true },
  { id: 'analytics', icon: '📊', name: 'Agent Analytics', description: 'Analyse les performances et les revenus', defaultActive: true },
  { id: 'followup', icon: '🩺', name: 'Agent Suivi Patient', description: 'Automatise les suivis post-consultation', defaultActive: true },
]

export const notifications: NotificationItem[] = [
  { id: 1, icon: '📅', title: 'Nouveau RDV pris', description: 'Agent Téléphone a planifié un RDV pour Bella à 16h.', type: 'rdv', target: 'agenda' },
  { id: 2, icon: '💬', title: 'Nouveau message reçu', description: 'Question sur les vaccins via le chat web.', type: 'message', target: 'comms' },
  { id: 3, icon: '💬', title: 'Message envoyé', description: 'Confirmation de RDV envoyée à M. Dupont.', type: 'message', target: 'comms' },
  { id: 4, icon: '🤖', title: 'Agent activé', description: 'Agent WhatsApp a été activé.', type: 'agent', target: 'agents-dash' },
  { id: 5, icon: '🛠', title: 'Maintenance planifiée', description: 'Maintenance prévue ce soir à 23h00.', type: 'maintenance', target: 'settings' },
  { id: 6, icon: '⚠️', title: 'Erreur détectée', description: 'Erreur de synchronisation avec le logiciel de caisse.', type: 'error', target: 'rapports' },
]

export const clientsData: ClientItem[] = [
  { id: 1, prenom: 'Sophie', nom: 'Martin', email: 'sophie.martin@email.fr', tel: '06 12 34 56 78', animal: '🐕 Bella', espece: 'Chien', race: 'Labrador', age: '3 ans', sexe: 'Femelle', poids: '28 kg', dateNaissance: '2023-03-15', couleur: 'Fauve', puce: '250268501234567', rdvCount: 8, lastRdv: '09/03/2026', notes: 'Allergie aux anti-inflammatoires classiques. Propriétaire très attentive.', rappels: ['Vaccin rage — Avril 2026', 'Vermifuge — Mai 2026'] },
  { id: 2, prenom: 'Paul', nom: 'Dupont', email: 'paul.dupont@email.fr', tel: '06 98 76 54 32', animal: '🐈 Milo', espece: 'Chat', race: 'Européen', age: '5 ans', sexe: 'Mâle', poids: '4.2 kg', dateNaissance: '2021-07-20', couleur: 'Tigré gris', puce: '250268509876543', rdvCount: 12, lastRdv: '08/03/2026', notes: 'Suivi post-opératoire en cours. Stérilisé.', rappels: ['Contrôle post-op — 15/03/2026'] },
  { id: 3, prenom: 'Claire', nom: 'Leblanc', email: 'claire.leblanc@email.fr', tel: '07 11 22 33 44', animal: '🐕 Oscar', espece: 'Chien', race: 'Golden Retriever', age: '2 ans', sexe: 'Mâle', poids: '32 kg', dateNaissance: '2024-01-10', couleur: 'Doré', puce: '250268501122334', rdvCount: 5, lastRdv: '11/03/2026', notes: 'Jeune chien, vaccinations en cours.', rappels: ['Rappel DHPPi — 11/04/2026'] },
  { id: 4, prenom: 'Marie', nom: 'Moreau', email: 'marie.moreau@email.fr', tel: '06 55 44 33 22', animal: '🐈 Luna', espece: 'Chat', race: 'Siamois', age: '7 ans', sexe: 'Femelle', poids: '3.8 kg', dateNaissance: '2019-05-01', couleur: 'Seal point', puce: '250268505544332', rdvCount: 15, lastRdv: '14/03/2026', notes: 'Suivi annuel. Bon état général.', rappels: ['Bilan sanguin — Juin 2026'] },
]

export const agendaWeek: AgendaDay[] = [
  { day: 'Lun 9', rdvs: [
    { time: '09:00', name: 'Bella — Martin', motif: 'Urgence patte', badge: '🔴', color: '#E53E3E', clientId: 1 },
    { time: '10:30', name: 'Milo — Dupont', motif: 'Post-op J+3', badge: '🟠', color: '#DD6B20', clientId: 2 },
    { time: '14:00', name: 'Luna — Moreau', motif: 'Bilan annuel', badge: '🟢', color: '#38A169', clientId: 4 },
  ]},
  { day: 'Mar 10', rdvs: [
    { time: '09:30', name: 'Oscar — Leblanc', motif: 'Vaccination', badge: '🟡', color: '#D69E2E', clientId: 3 },
    { time: '11:00', name: 'Nouveau client', motif: 'Première visite', badge: '🟢', color: '#38A169' },
  ]},
]
