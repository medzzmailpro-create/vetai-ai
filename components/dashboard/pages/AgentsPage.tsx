'use client'

import { useState, useEffect } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Page } from '../types/types'
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

type ClinicAgent = {
  id: string
  clinic_id: string
  agent_type: string
  is_enabled: boolean
}

const AGENT_DEFINITIONS = [
  {
    type: 'receptionist',
    icon: '📞',
    name: 'Agent Téléphone',
    description: 'Réceptionniste IA 24/24 — Répond, informe et prend rendez-vous. Zéro appel manqué.',
    provider: 'Retell AI + ElevenLabs',
  },
  {
    type: 'agenda',
    icon: '📅',
    name: 'Agent Agenda',
    description: 'Gestionnaire RDV IA — Synchronise vos créneaux, évite les conflits et les trous.',
    provider: 'Claude (Anthropic)',
  },
  {
    type: 'email',
    icon: '📧',
    name: 'Agent Email',
    description: 'Communication emails — Répond aux emails entrants, envoie confirmations et rappels.',
    provider: 'Resend + Claude',
  },
  {
    type: 'analytics',
    icon: '📊',
    name: 'Dashboard Analytics',
    description: 'Stats & rapports — Tableau de bord temps réel, KPIs, rapports hebdomadaires automatiques.',
    provider: 'Interne',
  },
  {
    type: 'transcription',
    icon: '💬',
    name: 'Transcriptions',
    description: 'Historique communications — Transcriptions des appels, SMS et messages archivés.',
    provider: 'Retell AI + Claude',
  },
  {
    type: 'reminders',
    icon: '🔔',
    name: 'Rappels RDV',
    description: 'Rappels vaccins & suivis — Rappels automatiques vaccins, bilans post-op, suivis.',
    provider: 'Twilio',
  },
]

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
  const [clinicAgents, setClinicAgents] = useState<ClinicAgent[]>([])
  const [agentsLoading, setAgentsLoading] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)
  const [hasApiKeys, setHasApiKeys] = useState(false)

  useEffect(() => {
    if (isDemo || !clinicId) return
    const load = async () => {
      setAgentsLoading(true)
      try {
        const { data } = await supabase
          .from('clinic_agents')
          .select('*')
          .eq('clinic_id', clinicId)

        if (data && data.length > 0) {
          setClinicAgents(data as ClinicAgent[])
        } else {
          // Insert default agents if none exist
          const inserts = AGENT_DEFINITIONS.map(a => ({
            clinic_id: clinicId,
            agent_type: a.type,
            is_enabled: false,
          }))
          const { data: inserted } = await supabase
            .from('clinic_agents')
            .upsert(inserts, { onConflict: 'clinic_id,agent_type' })
            .select()
          if (inserted) setClinicAgents(inserted as ClinicAgent[])
        }

        // Check if API keys are configured via clinic_config or ai_agents
        const { data: aiAgents } = await supabase
          .from('ai_agents')
          .select('id')
          .eq('clinic_id', clinicId)
          .limit(1)
        setHasApiKeys(!!(aiAgents && aiAgents.length > 0))
      } catch { /* silent */ } finally {
        setAgentsLoading(false)
      }
    }
    load()
  }, [clinicId, isDemo])

  const getAgentState = (agentType: string): boolean => {
    if (isDemo) return agentStates[agentType] ?? false
    return clinicAgents.find(a => a.agent_type === agentType)?.is_enabled ?? false
  }

  const toggleAgent = async (agentType: string) => {
    if (isDemo) {
      setAgentStates(prev => ({ ...prev, [agentType]: !prev[agentType] }))
      return
    }
    if (!clinicId || !hasApiKeys) return

    const current = getAgentState(agentType)
    const newVal = !current
    setToggling(agentType)

    // Optimistic update
    setClinicAgents(prev =>
      prev.map(a => a.agent_type === agentType ? { ...a, is_enabled: newVal } : a)
    )

    try {
      const { error } = await supabase
        .from('clinic_agents')
        .upsert(
          { clinic_id: clinicId, agent_type: agentType, is_enabled: newVal, updated_at: new Date().toISOString() },
          { onConflict: 'clinic_id,agent_type' }
        )
      if (error) throw error
    } catch {
      // Revert on error
      setClinicAgents(prev =>
        prev.map(a => a.agent_type === agentType ? { ...a, is_enabled: current } : a)
      )
    } finally {
      setToggling(null)
    }
  }

  const activeCount = AGENT_DEFINITIONS.filter(a => getAgentState(a.type)).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {[
          { label: 'Agents actifs', value: `${activeCount} / ${AGENT_DEFINITIONS.length}`, color: '#0A7C6E' },
          { label: 'Appels aujourd\'hui', value: isDemo ? '12' : '—', color: '#3182CE' },
          { label: 'SMS envoyés', value: isDemo ? '47' : '—', color: '#805AD5' },
          { label: 'RDV pris par IA', value: isDemo ? '8' : '—', color: '#38A169' },
        ].map(kpi => (
          <div key={kpi.label} style={{ ...sectionCard, padding: '14px 16px' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: kpi.color, fontFamily: 'Syne, sans-serif' }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: 11, color: '#9E9E9B', marginTop: 2 }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* API keys notice for live accounts without keys */}
      {!isDemo && !agentsLoading && !hasApiKeys && (
        <div style={{ background: '#FEF7E8', border: '1px solid rgba(245,166,35,0.4)', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: '#92590A' }}>
              Clés API non configurées
            </div>
            <div style={{ fontSize: 12, color: '#92590A', marginTop: 2 }}>
              Configurez vos clés API dans{' '}
              <button
                onClick={() => setPage('configuration')}
                style={{ background: 'none', border: 'none', color: '#0A7C6E', fontWeight: 600, cursor: 'pointer', fontSize: 12, textDecoration: 'underline', padding: 0 }}
              >
                Activation
              </button>
              {' '}pour activer vos agents.
            </div>
          </div>
        </div>
      )}

      {/* Agents grid */}
      <div style={{ ...sectionCard, padding: 20 }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: '#2A2A28', marginBottom: 16 }}>
          Mes agents IA
        </div>

        {agentsLoading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{ height: 120, background: '#EBEBEA', borderRadius: 10, animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        )}

        {!agentsLoading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            {AGENT_DEFINITIONS.filter(a => a.type !== 'transcription' && a.type !== 'analytics').map(agent => {
              const isActive = getAgentState(agent.type)
              const isTogglingThis = toggling === agent.type
              const isBlocked = !isDemo && !hasApiKeys

              return (
                <div
                  key={agent.type}
                  style={{
                    background: isActive ? '#F0FDF9' : 'white',
                    border: isActive ? '1.5px solid #0A7C6E' : '1px solid #EBEBEA',
                    borderRadius: 12,
                    padding: '16px 18px',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                      background: isActive ? '#E8F5F3' : '#F5F5F3',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                    }}>
                      {agent.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: '#2A2A28' }}>
                          {agent.name}
                        </span>
                        {/* Toggle */}
                        <div
                          title={isBlocked ? 'Configurez vos clés API dans Activation' : undefined}
                          onClick={() => !isTogglingThis && !isBlocked && toggleAgent(agent.type)}
                          style={{
                            width: 40, height: 22, borderRadius: 11, flexShrink: 0,
                            background: isBlocked ? '#D4D4D2' : isActive ? '#0A7C6E' : '#D4D4D2',
                            position: 'relative',
                            cursor: isBlocked ? 'not-allowed' : isTogglingThis ? 'wait' : 'pointer',
                            transition: 'background 0.2s',
                            opacity: isTogglingThis ? 0.6 : 1,
                          }}
                        >
                          <div style={{
                            position: 'absolute', top: 3,
                            left: isActive && !isBlocked ? undefined : 3,
                            right: isActive && !isBlocked ? 3 : undefined,
                            width: 16, height: 16, background: 'white', borderRadius: '50%',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            transition: 'left 0.2s, right 0.2s',
                          }} />
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: isBlocked ? '#D4D4D2' : isActive ? '#38A169' : '#9E9E9B', fontWeight: 600, marginTop: 2 }}>
                        {isBlocked ? '⊘ Clés API requises' : isActive ? '● Actif' : '○ Inactif'}
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: 12, color: '#5C5C59', lineHeight: 1.5, marginBottom: 10 }}>
                    {agent.description}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* provider subtitle hidden per UX decision: <span style={{ fontSize: 10, color: '#0A7C6E', fontWeight: 600 }}>via {agent.provider}</span> */}
                    <span />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => setPage('rapports')}
                        style={{
                          padding: '4px 10px', borderRadius: 6,
                          border: '1px solid #D4D4D2', background: 'white',
                          color: '#5C5C59', fontFamily: 'Syne, sans-serif',
                          fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        Stats
                      </button>
                      <button
                        onClick={() => setAgentConfigId(agent.type)}
                        style={{
                          padding: '4px 10px', borderRadius: 6,
                          border: '1px solid #0A7C6E', background: 'white',
                          color: '#0A7C6E', fontFamily: 'Syne, sans-serif',
                          fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        Configurer
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </div>
  )
}
