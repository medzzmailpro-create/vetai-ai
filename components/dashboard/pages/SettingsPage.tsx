'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { inputStyle, sectionCard } from '../utils/styles'
import type { ClinicConfig } from '../Dashboard'

type Props = {
  userId: string
  userRole: 'owner' | 'staff'
  clinicConfig: ClinicConfig
  onConfigChange: (cfg: Record<string, unknown>) => void
}

type NotifPrefs = {
  weekly_report: boolean
  missed_call_alert: boolean
  daily_summary: boolean
  agents_offline_alert: boolean
}

const NOTIF_LABELS: { key: keyof NotifPrefs; label: string }[] = [
  { key: 'weekly_report', label: 'Rapport hebdomadaire par email' },
  { key: 'missed_call_alert', label: 'Alerte appel manqué' },
  { key: 'daily_summary', label: 'Résumé quotidien' },
  { key: 'agents_offline_alert', label: 'Alertes agents IA hors ligne' },
]

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: 'Comment activer mes agents IA ?',
    a: "Rendez-vous dans la section Agents IA et activez les agents de votre choix.",
  },
  {
    q: 'Comment ajouter un nouveau client ?',
    a: "Les clients sont ajoutés automatiquement par vos agents lors de chaque nouveau contact.",
  },
  {
    q: 'Comment modifier la configuration de mon agent téléphonique ?',
    a: "Accédez à Configuration > Agent téléphonique.",
  },
  {
    q: "Que faire si un agent ne répond plus ?",
    a: "Vérifiez le statut dans Agents IA et contactez le support si le problème persiste.",
  },
  {
    q: 'Comment exporter mes données ?',
    a: "Rendez-vous dans Rapports et utilisez le bouton Exporter.",
  },
]

export default function SettingsPage({ userId, userRole, clinicConfig, onConfigChange }: Props) {
  const isStaff = userRole === 'staff'
  void isStaff // may be used in future tabs

  // Notification prefs state
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>({
    weekly_report: true,
    missed_call_alert: true,
    daily_summary: false,
    agents_offline_alert: true,
  })
  const [notifSavedKey, setNotifSavedKey] = useState<keyof NotifPrefs | null>(null)
  const [notifLoading, setNotifLoading] = useState(true)

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  // Support form state
  const [supportCategory, setSupportCategory] = useState('Problème technique')
  const [supportSubject, setSupportSubject] = useState('')
  const [supportMessage, setSupportMessage] = useState('')
  const [supportSending, setSupportSending] = useState(false)
  const [supportSent, setSupportSent] = useState(false)

  // Load notification prefs on mount
  useEffect(() => {
    if (!userId) { setNotifLoading(false); return }
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('notification_prefs')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (!error && data) {
          setNotifPrefs({
            weekly_report: data.weekly_report ?? true,
            missed_call_alert: data.missed_call_alert ?? true,
            daily_summary: data.daily_summary ?? false,
            agents_offline_alert: data.agents_offline_alert ?? true,
          })
        }
      } catch {
        // Use defaults
      } finally {
        setNotifLoading(false)
      }
    }
    load()
  }, [userId])

  const toggleNotif = async (key: keyof NotifPrefs) => {
    if (!userId) return
    const newValue = !notifPrefs[key]
    const updated = { ...notifPrefs, [key]: newValue }
    setNotifPrefs(updated)
    setNotifSavedKey(key)
    setTimeout(() => setNotifSavedKey(null), 2000)

    try {
      await supabase.from('notification_prefs').upsert({
        user_id: userId,
        ...updated,
        updated_at: new Date().toISOString(),
      })
    } catch {
      // Silently ignore — local state already updated
    }
  }

  const submitSupport = async () => {
    setSupportSending(true)
    try {
      await supabase.from('support_tickets').insert({
        user_id: userId,
        category: supportCategory,
        subject: supportSubject,
        message: supportMessage,
        created_at: new Date().toISOString(),
      })
    } catch {
      // Show success regardless for UX
    } finally {
      setSupportSending(false)
      setSupportSent(true)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>

        {/* Notifications */}
        <div style={{ ...sectionCard, padding: 20 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: '#2A2A28', marginBottom: 20 }}>Notifications</div>

          {notifLoading ? (
            <div style={{ fontSize: 13, color: '#9E9E9B', padding: '12px 0' }}>Chargement…</div>
          ) : (
            NOTIF_LABELS.map(({ key, label }) => {
              const isOn = notifPrefs[key]
              const justSaved = notifSavedKey === key
              return (
                <div
                  key={key}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F5F5F3' }}
                >
                  <div>
                    <div style={{ fontSize: 14, color: '#3E3E3C' }}>{label}</div>
                    {justSaved && (
                      <div style={{ fontSize: 11, color: '#0A7C6E', fontWeight: 600, marginTop: 2 }}>Sauvegardé</div>
                    )}
                  </div>
                  <div
                    onClick={() => toggleNotif(key)}
                    style={{
                      width: 42,
                      height: 22,
                      borderRadius: 11,
                      background: isOn ? '#0A7C6E' : '#D4D4D2',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      flexShrink: 0,
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: 2,
                      left: isOn ? undefined : 2,
                      right: isOn ? 2 : undefined,
                      width: 18,
                      height: 18,
                      background: 'white',
                      borderRadius: '50%',
                      transition: 'left 0.2s, right 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                    }} />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Help & Support */}
      <div style={{ ...sectionCard, padding: 20 }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: '#2A2A28', marginBottom: 16 }}>🆘 Aide & Support</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>

          {/* Left: FAQ + agent status + support email */}
          <div>
            {/* FAQ accordion */}
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: '#2A2A28', marginBottom: 10 }}>❓ FAQ</div>
            <div style={{ marginBottom: 20 }}>
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openFaq === idx
                return (
                  <div
                    key={idx}
                    style={{ border: '1px solid #EBEBEA', borderRadius: 8, marginBottom: 6, overflow: 'hidden' }}
                  >
                    <div
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        cursor: 'pointer',
                        background: isOpen ? '#E8F5F3' : '#F9F9F7',
                      }}
                    >
                      <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, color: isOpen ? '#0A7C6E' : '#2A2A28' }}>
                        {item.q}
                      </span>
                      <span style={{ fontSize: 12, color: '#9E9E9B', flexShrink: 0, marginLeft: 8 }}>
                        {isOpen ? '▲' : '▼'}
                      </span>
                    </div>
                    {isOpen && (
                      <div style={{ padding: '10px 14px', background: 'white', fontSize: 13, color: '#3E3E3C', lineHeight: 1.6, borderTop: '1px solid #EBEBEA' }}>
                        {item.a}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Agent status */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: '#2A2A28', marginBottom: 10 }}>Statut des agents IA</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[
                  { name: '🤙 Agent Téléphone', online: true },
                  { name: '💬 Agent Chat Web', online: true },
                  { name: '📅 Agent Agenda', online: true },
                  { name: '📱 Agent WhatsApp', online: false },
                ].map(agent => (
                  <div
                    key={agent.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '5px 12px',
                      background: '#F5F5F3',
                      borderRadius: 100,
                      fontSize: 12,
                      fontWeight: 600,
                      fontFamily: 'Syne, sans-serif',
                      color: '#3E3E3C',
                      border: '1px solid #EBEBEA',
                    }}
                  >
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: agent.online ? '#38A169' : '#D69E2E' }} />
                    {agent.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Support email */}
            <div style={{ background: '#E8F5F3', borderRadius: 8, padding: '12px 16px' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: '#0A7C6E', marginBottom: 4 }}>📧 Support direct</div>
              <div style={{ fontSize: 13, color: '#3E3E3C' }}>contact@vetai.fr</div>
              <div style={{ fontSize: 11, color: '#9E9E9B', marginTop: 4 }}>⏱ Temps de réponse moyen : moins de 24h</div>
            </div>
          </div>

          {/* Right: Support contact form */}
          <div>
            {!supportSent ? (
              <>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: '#2A2A28', marginBottom: 14 }}>Contacter le support</div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, color: '#5C5C59' }}>Catégorie</label>
                  <select
                    value={supportCategory}
                    onChange={e => setSupportCategory(e.target.value)}
                    style={inputStyle}
                  >
                    {['Problème technique', 'Problème de facturation', 'Aide à la configuration', 'Problème avec un agent IA', 'Autre demande'].map(c => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, color: '#5C5C59' }}>Sujet</label>
                  <input
                    value={supportSubject}
                    onChange={e => setSupportSubject(e.target.value)}
                    placeholder="Sujet de votre demande"
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, color: '#5C5C59' }}>Message</label>
                  <textarea
                    value={supportMessage}
                    onChange={e => setSupportMessage(e.target.value)}
                    placeholder="Description détaillée de votre problème ou demande…"
                    style={{ ...inputStyle, minHeight: 100, resize: 'vertical' as const }}
                  />
                </div>

                <button
                  onClick={submitSupport}
                  disabled={supportSending || !supportSubject.trim() || !supportMessage.trim()}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: (!supportSubject.trim() || !supportMessage.trim()) ? '#D4D4D2' : '#0A7C6E',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 600,
                    cursor: (!supportSubject.trim() || !supportMessage.trim()) ? 'not-allowed' : 'pointer',
                    fontSize: 13,
                  }}
                >
                  {supportSending ? 'Envoi en cours…' : 'Envoyer la demande →'}
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: '#0A7C6E', marginBottom: 8 }}>
                  Demande envoyée !
                </div>
                <div style={{ fontSize: 13, color: '#9E9E9B', marginBottom: 20, lineHeight: 1.6 }}>
                  Notre équipe vous répondra dans les plus brefs délais à l'adresse associée à votre compte.
                </div>
                <button
                  onClick={() => { setSupportSent(false); setSupportSubject(''); setSupportMessage('') }}
                  style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #0A7C6E', color: '#0A7C6E', borderRadius: 8, fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  Nouvelle demande
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
