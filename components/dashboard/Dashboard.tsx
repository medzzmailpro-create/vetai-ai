'use client'

import { useState, useEffect } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Page, AgentRow } from '../types/types'
import { sectionCard } from '../utils/styles'

type Props = {
  agentStates: Record<string, boolean>
  setAgentStates: Dispatch<SetStateAction<Record<string, boolean>>>
  setPage: Dispatch<SetStateAction<Page>>
  setAgentConfigId: Dispatch<SetStateAction<string | null>>
  clinicId: string
  isDemo: boolean
  userId: string
}

type ServiceStatus = 'online' | 'offline' | 'unconfigured'

type StackService = {
  id: string
  name: string
  role: string
  icon: string
  envKey: string
  cost: string
  docsUrl?: string
}

const STACK: StackService[] = [
  { id: 'telegram', name: 'Telegram Bot', role: 'Canal de commande principal', icon: '✈️', envKey: 'TELEGRAM_BOT_TOKEN', cost: 'Gratuit' },
  { id: 'retell', name: 'Retell AI', role: 'Appels téléphoniques 24/7', icon: '📞', envKey: 'RETELL_API_KEY', cost: '$0.07/min' },
  { id: 'elevenlabs', name: 'ElevenLabs', role: 'Voix réaliste (clone réceptionniste)', icon: '🎙️', envKey: 'ELEVENLABS_API_KEY', cost: '$22/mois' },
  { id: 'twilio', name: 'Twilio', role: 'SMS confirmation & rappels', icon: '💬', envKey: 'TWILIO_ACCOUNT_SID', cost: '~5€/mois' },
  { id: 'claude', name: 'Claude (Anthropic)', role: 'Modèle IA — compréhension & réponse', icon: '🤖', envKey: 'ANTHROPIC_API_KEY', cost: '~15€/mois' },
]

const AGENTS = [
  {
    id: 'phone',
    icon: '📞',
    name: 'Agent Téléphone',
    description: 'Retell AI + ElevenLabs — Décroche, comprend, book les RDV',
    provider: 'Retell AI',
    stats: { calls: 12, booked: 8 },
  },
  {
    id: 'telegram',
    icon: '✈️',
    name: 'Agent Telegram',
    description: 'Telegram → Claude — Commandes & automatisations',
    provider: 'Claude',
    stats: { messages: 34, actions: 21 },
  },
  {
    id: 'whatsapp',
    icon: '📱',
    name: 'Agent WhatsApp',
    description: 'Rappels RDV, confirmations, suivi post-consultation',
    provider: 'Twilio',
    stats: { sms: 47, delivered: 45 },
  },
  {
    id: 'chat',
    icon: '💬',
    name: 'Agent Chat Web',
    description: 'Répond aux questions sur le site web',
    provider: 'Claude',
    stats: { chats: 9, resolved: 9 },
  },
  {
    id: 'agenda',
    icon: '📅',
    name: 'Agent Agenda',
    description: 'Propose des créneaux et planifie les RDV automatiquement',
    provider: 'Claude',
    stats: { slots: 28, filled: 19 },
  },
  {
    id: 'followup',
    icon: '🩺',
    name: 'Agent Suivi',
    description: 'Rappels vaccins, contrôles, suivis post-op',
    provider: 'Twilio',
    stats: { rappels: 15, confirmed: 12 },
  },
]

const statColor = '#0A7C6E'

const AGENT_ICONS: Record<string, string> = {
  phone: '📞',
  sms: '💬',
  agenda: '📅',
  chat: '💬',
  telegram: '✈️',
  whatsapp: '📱',
  followup: '🩺',
}

const AGENT_LABELS: Record<string, string> = {
  phone: 'Agent Téléphone',
  sms: 'Agent SMS',
  agenda: 'Agent Agenda',
  chat: 'Agent Chat Web',
  telegram: 'Agent Telegram',
  whatsapp: 'Agent WhatsApp',
  followup: 'Agent Suivi',
}

const AGENT_DESC: Record<string, string> = {
  phone: 'Retell AI + ElevenLabs — Décroche, comprend, book les RDV',
  sms: 'Rappels RDV, confirmations, suivi post-consultation',
  agenda: 'Propose des créneaux et planifie les RDV automatiquement',
  chat: 'Répond aux questions sur le site web',
  telegram: 'Telegram → Claude — Commandes & automatisations',
  whatsapp: 'Rappels RDV, confirmations, suivi post-consultation',
  followup: 'Rappels vaccins, contrôles, suivis post-op',
}

export default function AgentsPage({
  agentStates,
  setAgentStates,
  setPage,
  setAgentConfigId,
  clinicId,
  isDemo,
  userId,
}: Props) {
  void userId

  const [serviceStatuses, setServiceStatuses] = useState<Record<string, ServiceStatus>>({})
  const [tab, setTab] = useState<'agents' | 'stack'>('agents')
  const [liveAgents, setLiveAgents] = useState<AgentRow[]>([])
  const [agentsLoading, setAgentsLoading] = useState(false)

  useEffect(() => {
    if (isDemo || !clinicId) return

    const load = async () => {
      setAgentsLoading(true)

      try {
        const { data } = await supabase
          .from('ai_agents')
          .select('*')
          .eq('clinic_id', clinicId)

        if (data) {
          setLiveAgents(data as AgentRow[])
        }
      } catch {
        // silent
      } finally {
        setAgentsLoading(false)
      }
    }

    load()
  }, [clinicId, isDemo])

  const toggleLiveAgent = async (agent: AgentRow) => {
    const newVal = !agent.is_active

    setLiveAgents(prev =>
      prev.map(a => (a.id === agent.id ? { ...a, is_active: newVal } : a))
    )

    try {
      await supabase
        .from('ai_agents')
        .update({ is_active: newVal })
        .eq('id', agent.id)
    } catch {
      setLiveAgents(prev =>
        prev.map(a => (a.id === agent.id ? { ...a, is_active: agent.is_active } : a))
      )
    }
  }

  useEffect(() => {
    const statuses: Record<string, ServiceStatus> = {}

    STACK.forEach(service => {
      statuses[service.id] = 'unconfigured'
    })

    statuses.claude = 'online'
    setServiceStatuses(statuses)
  }, [])

  const configuredCount = Object.values(serviceStatuses).filter(
    status => status !== 'unconfigured'
  ).length

  const activeAgents = isDemo
    ? Object.values(agentStates).filter(Boolean).length
    : liveAgents.filter(agent => agent.is_active).length

  const totalAgents = isDemo ? AGENTS.length : liveAgents.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12,
        }}
      >
        {[
          { label: 'Agents actifs', value: `${activeAgents} / ${totalAgents}`, color: '#0A7C6E' },
          {
            label: 'Services configurés',
            value: `${configuredCount} / ${STACK.length}`,
            color: configuredCount >= 4 ? '#38A169' : '#DD6B20',
          },
          { label: "Appels aujourd'hui", value: '12', color: '#3182CE' },
          { label: 'SMS envoyés', value: '47', color: '#805AD5' },
        ].map(kpi => (
          <div key={kpi.label} style={{ ...sectionCard, padding: '14px 16px' }}>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: kpi.color,
                fontFamily: 'Syne, sans-serif',
              }}
            >
              {kpi.value}
            </div>
            <div style={{ fontSize: 11, color: '#9E9E9B', marginTop: 2 }}>
              {kpi.label}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {(['agents', 'stack'] as const).map(currentTab => (
          <button
            key={currentTab}
            onClick={() => setTab(currentTab)}
            style={{
              padding: '7px 16px',
              borderRadius: 999,
              border: tab === currentTab ? '1.5px solid #0A7C6E' : '1px solid #D4D4D2',
              background: tab === currentTab ? '#0A7C6E' : 'white',
              color: tab === currentTab ? 'white' : '#5C5C59',
              fontFamily: 'Syne, sans-serif',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {currentTab === 'agents' ? '🤖 Agents IA' : '🔌 Stack IA'}
          </button>
        ))}
      </div>

      {tab === 'agents' && isDemo && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {AGENTS.map(agent => {
            const active = agentStates[agent.id] ?? true
            const statEntries = Object.entries(agent.stats)

            return (
              <div key={agent.id} style={{ ...sectionCard, padding: 16 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 999,
                      background: active ? '#E8F5F3' : '#F5F5F3',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    {agent.icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        marginBottom: 2,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'Syne, sans-serif',
                          fontSize: 13,
                          fontWeight: 700,
                          color: '#2A2A28',
                        }}
                      >
                        {agent.name}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          color: active ? '#38A169' : '#9E9E9B',
                          fontWeight: 700,
                        }}
                      >
                        {active ? '● Actif' : '○ Inactif'}
                      </span>
                    </div>

                    <div style={{ fontSize: 11, color: '#9E9E9B', lineHeight: 1.4 }}>
                      {agent.description}
                    </div>

                    <div
                      style={{
                        fontSize: 10,
                        color: statColor,
                        marginTop: 4,
                        fontWeight: 600,
                      }}
                    >
                      via {agent.provider}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  {statEntries.map(([key, value]) => (
                    <div
                      key={key}
                      style={{
                        background: '#F5F5F3',
                        borderRadius: 8,
                        padding: '6px 10px',
                        flex: 1,
                        textAlign: 'center',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: '#2A2A28',
                          fontFamily: 'Syne, sans-serif',
                        }}
                      >
                        {value}
                      </div>
                      <div style={{ fontSize: 10, color: '#9E9E9B' }}>{key}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <button
                    onClick={() => setAgentStates(prev => ({ ...prev, [agent.id]: true }))}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 999,
                      border: '1px solid #0A7C6E',
                      background: active ? '#0A7C6E' : '#E8F5F3',
                      color: active ? 'white' : '#0A7C6E',
                      fontFamily: 'Syne, sans-serif',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Activer
                  </button>

                  <button
                    onClick={() => setAgentStates(prev => ({ ...prev, [agent.id]: false }))}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 999,
                      border: '1px solid #D4D4D2',
                      background: 'white',
                      color: '#C53030',
                      fontFamily: 'Syne, sans-serif',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Désactiver
                  </button>

                  <button
                    onClick={() => setPage('rapports')}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 999,
                      border: '1px solid #D4D4D2',
                      background: 'white',
                      color: '#5C5C59',
                      fontFamily: 'Syne, sans-serif',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Stats
                  </button>

                  <button
                    onClick={() => setAgentConfigId(agent.id)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 999,
                      border: '1px solid #D4D4D2',
                      background: 'white',
                      color: '#5C5C59',
                      fontFamily: 'Syne, sans-serif',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Configurer
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'agents' && !isDemo && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {agentsLoading &&
            [1, 2, 3, 4].map(i => (
              <div
                key={i}
                style={{
                  height: 140,
                  background: '#E8E8E6',
                  borderRadius: 12,
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
            ))}

          {!agentsLoading && liveAgents.length === 0 && (
            <div
              style={{
                ...sectionCard,
                padding: 40,
                textAlign: 'center',
                gridColumn: '1 / -1',
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>🤖</div>
              <div
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#2A2A28',
                  marginBottom: 4,
                }}
              >
                Aucun agent configuré
              </div>
              <div style={{ fontSize: 13, color: '#9E9E9B' }}>
                Vos agents IA apparaîtront ici après configuration.
              </div>
            </div>
          )}

          {!agentsLoading &&
            liveAgents.map(agent => {
              const icon = AGENT_ICONS[agent.type] ?? '🤖'
              const label = AGENT_LABELS[agent.type] ?? agent.type
              const desc = AGENT_DESC[agent.type] ?? ''

              return (
                <div key={agent.id} style={{ ...sectionCard, padding: 16 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 999,
                        background: agent.is_active ? '#E8F5F3' : '#F5F5F3',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        flexShrink: 0,
                      }}
                    >
                      {icon}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          marginBottom: 2,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'Syne, sans-serif',
                            fontSize: 13,
                            fontWeight: 700,
                            color: '#2A2A28',
                          }}
                        >
                          {label}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            color: agent.is_active ? '#38A169' : '#9E9E9B',
                            fontWeight: 700,
                          }}
                        >
                          {agent.is_active ? '● Actif' : '○ Inactif'}
                        </span>
                      </div>

                      <div style={{ fontSize: 11, color: '#9E9E9B', lineHeight: 1.4 }}>
                        {desc}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    <button
                      onClick={() => toggleLiveAgent(agent)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: 999,
                        border: `1px solid ${agent.is_active ? '#C53030' : '#0A7C6E'}`,
                        background: agent.is_active ? 'white' : '#0A7C6E',
                        color: agent.is_active ? '#C53030' : 'white',
                        fontFamily: 'Syne, sans-serif',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {agent.is_active ? 'Désactiver' : 'Activer'}
                    </button>

                    <button
                      onClick={() => setPage('rapports')}
                      style={{
                        padding: '5px 10px',
                        borderRadius: 999,
                        border: '1px solid #D4D4D2',
                        background: 'white',
                        color: '#5C5C59',
                        fontFamily: 'Syne, sans-serif',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Stats
                    </button>

                    <button
                      onClick={() => setAgentConfigId(agent.id)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: 999,
                        border: '1px solid #D4D4D2',
                        background: 'white',
                        color: '#5C5C59',
                        fontFamily: 'Syne, sans-serif',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Configurer
                    </button>
                  </div>
                </div>
              )
            })}
        </div>
      )}

      {tab === 'stack' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ ...sectionCard, padding: 16 }}>
            <div
              style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 13,
                fontWeight: 700,
                color: '#2A2A28',
                marginBottom: 12,
              }}
            >
              Flux de données
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
                fontSize: 12,
                color: '#5C5C59',
              }}
            >
              {[
                { icon: '✈️', label: 'Telegram' },
                { sep: '→' },
                { icon: '🤖', label: 'Claude' },
                { sep: '→' },
                { icon: '📞', label: 'Retell AI' },
              ].map((item, i) =>
                'sep' in item ? (
                  <span key={i} style={{ color: '#D4D4D2', fontSize: 16 }}>
                    {item.sep}
                  </span>
                ) : (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      background: '#F5F5F3',
                      borderRadius: 8,
                      padding: '4px 10px',
                    }}
                  >
                    <span>{item.icon}</span>
                    <span style={{ fontWeight: 600 }}>{item.label}</span>
                  </div>
                )
              )}
            </div>

            <div
              style={{
                marginTop: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
                fontSize: 12,
                color: '#5C5C59',
              }}
            >
              {[
                { icon: '📞', label: 'Appel entrant' },
                { sep: '→' },
                { icon: '📞', label: 'Retell AI' },
                { sep: '+' },
                { icon: '🎙️', label: 'ElevenLabs' },
                { sep: '→' },
                { icon: '💬', label: 'Twilio SMS' },
              ].map((item, i) =>
                'sep' in item ? (
                  <span key={i} style={{ color: '#D4D4D2', fontSize: 16 }}>
                    {item.sep}
                  </span>
                ) : (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      background: '#F5F5F3',
                      borderRadius: 8,
                      padding: '4px 10px',
                    }}
                  >
                    <span>{item.icon}</span>
                    <span style={{ fontWeight: 600 }}>{item.label}</span>
                  </div>
                )
              )}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 12,
            }}
          >
            {STACK.map(service => {
              const status = serviceStatuses[service.id] ?? 'unconfigured'
              const statusColor =
                status === 'online'
                  ? '#38A169'
                  : status === 'offline'
                    ? '#C53030'
                    : '#DD6B20'

              const statusLabel =
                status === 'online'
                  ? '● En ligne'
                  : status === 'offline'
                    ? '● Hors ligne'
                    : '○ À configurer'

              return (
                <div key={service.id} style={{ ...sectionCard, padding: 16 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 999,
                        background: '#F5F5F3',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                      }}
                    >
                      {service.icon}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontFamily: 'Syne, sans-serif',
                          fontSize: 13,
                          fontWeight: 700,
                          color: '#2A2A28',
                        }}
                      >
                        {service.name}
                      </div>
                      <div style={{ fontSize: 11, color: '#9E9E9B' }}>{service.role}</div>
                    </div>

                    <div
                      style={{
                        fontSize: 10,
                        color: statusColor,
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {statusLabel}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ fontSize: 11, color: '#9E9E9B' }}>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          background: '#F5F5F3',
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontSize: 10,
                        }}
                      >
                        {service.envKey}
                      </span>
                    </div>

                    <div style={{ fontSize: 11, fontWeight: 600, color: statColor }}>
                      {service.cost}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div
            style={{
              ...sectionCard,
              padding: 16,
              background: '#F0FAF9',
              border: '1.5px solid #0A7C6E',
            }}
          >
            <div
              style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 13,
                fontWeight: 700,
                color: '#0A7C6E',
                marginBottom: 10,
              }}
            >
              Économie par clinique
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: 8,
              }}
            >
              {[
                { label: 'Coût total', value: '~82€/mois', color: '#5C5C59' },
                { label: 'Votre prix', value: '149€/mois', color: '#2A2A28' },
                { label: 'Marge nette', value: '+67€/mois', color: '#38A169' },
                { label: '10 cliniques', value: '+670€/mois', color: '#0A7C6E' },
              ].map(item => (
                <div key={item.label} style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontFamily: 'Syne, sans-serif',
                      fontSize: 16,
                      fontWeight: 700,
                      color: item.color,
                    }}
                  >
                    {item.value}
                  </div>
                  <div style={{ fontSize: 10, color: '#9E9E9B' }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </div>
  )
}