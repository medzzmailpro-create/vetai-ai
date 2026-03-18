'use client'
import { useState, useEffect } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { supabase } from '@/lib/supabase/client'
import { comms } from '../data/mockData'
import { sectionCard } from '../utils/styles'
import type { Page, SmsRow } from '../types/types'

type Props = {
  selectedCommId: number | null
  setSelectedCommId: Dispatch<SetStateAction<number | null>>
  isDemo?: boolean
  clinicId?: string
  setPage?: Dispatch<SetStateAction<Page>>
}

type TranscriptMessage = {
  role: 'user' | 'assistant'
  text: string
  timestamp?: string
}

function parseTranscription(raw: string | TranscriptMessage[] | unknown): TranscriptMessage[] {
  if (Array.isArray(raw)) return raw as TranscriptMessage[]
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed as TranscriptMessage[]
    } catch { /* not JSON */ }
    return raw.trim() ? [{ role: 'user' as const, text: raw }] : []
  }
  return []
}

function ChatBubble({ msg }: { msg: TranscriptMessage }) {
  const isAgent = msg.role === 'assistant'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isAgent ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
      <div style={{ fontSize: 11, color: isAgent ? '#0A7C6E' : '#9E9E9B', marginBottom: 4 }}>
        {isAgent ? '🤖 Agent IA' : '👤 Client'}
      </div>
      <div style={{ maxWidth: '70%', padding: '10px 14px', borderRadius: isAgent ? '16px 4px 16px 16px' : '4px 16px 16px 16px', background: isAgent ? '#0A7C6E' : '#F0F0EE', color: isAgent ? 'white' : '#2A2A28', fontSize: 13, lineHeight: 1.6 }}>
        {msg.text}
      </div>
      {msg.timestamp && <div style={{ fontSize: 10, color: '#9E9E9B', marginTop: 4 }}>{msg.timestamp}</div>}
    </div>
  )
}

type CommRow = {
  id: number | string
  icon: string
  channel: string
  agent: string
  clientName: string
  contact: string
  duration: string
  datetime: string
  summary: string
  transcription: string | TranscriptMessage[]
  audio_url: string
}

function TabBar({ activeTab, setActiveTab }: { activeTab: 'calls' | 'sms'; setActiveTab: (t: 'calls' | 'sms') => void }) {
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#F0F0EE', borderRadius: 10, padding: 4, width: 'fit-content' }}>
      {(['calls', 'sms'] as const).map(tab => (
        <button key={tab} onClick={() => setActiveTab(tab)} style={{
          padding: '6px 18px', borderRadius: 8, border: 'none',
          background: activeTab === tab ? 'white' : 'transparent',
          fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600,
          color: activeTab === tab ? '#0A7C6E' : '#9E9E9B', cursor: 'pointer',
          boxShadow: activeTab === tab ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
        }}>
          {tab === 'calls' ? '📞 Appels' : '💬 SMS'}
        </button>
      ))}
    </div>
  )
}

export default function CommunicationsPage({ selectedCommId, setSelectedCommId, isDemo = true, clinicId = '', setPage }: Props) {
  const [activeTab, setActiveTab] = useState<'calls' | 'sms'>('calls')
  const [liveComms, setLiveComms] = useState<CommRow[]>([])
  const [smsList, setSmsList] = useState<SmsRow[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedSmsId, setSelectedSmsId] = useState<string | null>(null)
  const [transcriptionsEnabled, setTranscriptionsEnabled] = useState(true)
  const [transcriptionsLoading, setTranscriptionsLoading] = useState(true)

  useEffect(() => {
    if (isDemo) { setLiveComms(comms as unknown as CommRow[]); return }
    if (!clinicId) return
    const load = async () => {
      setLoading(true)
      try {
        const { data: calls } = await supabase
          .from('calls')
          .select('id, created_at, duration_ms, status, transcript, audio_url, caller_number')
          .eq('clinic_id', clinicId)
          .order('created_at', { ascending: false })
          .limit(20)

        if (calls && calls.length > 0) {
          setLiveComms(calls.map((c, i) => ({
            id: i + 1,
            icon: '📞',
            channel: 'Appel téléphonique',
            agent: 'Agent Téléphone',
            clientName: c.caller_number ?? 'Client',
            contact: `Téléphone · ${c.caller_number ?? '—'}`,
            duration: c.duration_ms ? `${Math.floor(c.duration_ms / 60000)}:${String(Math.floor((c.duration_ms % 60000) / 1000)).padStart(2, '0')}` : '—',
            datetime: new Date(c.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }),
            summary: c.status ?? '',
            transcription: c.transcript ?? '',
            audio_url: c.audio_url ?? '',
          })))
        } else {
          setLiveComms([])
        }
      } catch {
        setLiveComms([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isDemo, clinicId])

  // Load transcriptions enabled status from clinic_agents
  useEffect(() => {
    if (isDemo || !clinicId) { setTranscriptionsLoading(false); return }
    const load = async () => {
      try {
        const { data } = await supabase
          .from('clinic_agents')
          .select('is_enabled')
          .eq('clinic_id', clinicId)
          .eq('agent_type', 'transcription')
          .single()
        if (data != null) setTranscriptionsEnabled(data.is_enabled)
        else setTranscriptionsEnabled(true) // default: enabled
      } catch { setTranscriptionsEnabled(true) }
      finally { setTranscriptionsLoading(false) }
    }
    load()
  }, [isDemo, clinicId])

  useEffect(() => {
    if (isDemo || !clinicId) return
    const load = async () => {
      try {
        const { data } = await supabase
          .from('sms_messages')
          .select('id, body, direction, status, created_at, clients(name)')
          .eq('clinic_id', clinicId)
          .order('created_at', { ascending: false })
          .limit(50)
        if (data) {
          setSmsList(data.map((s: Record<string, unknown>) => ({
            id: s.id as string,
            body: (s.body as string) ?? '',
            direction: (s.direction as 'inbound' | 'outbound') ?? 'inbound',
            status: (s.status as string) ?? '',
            created_at: s.created_at as string,
            client_name: ((s.clients as Record<string, string> | null)?.name) ?? '—',
          })))
        }
      } catch { /* silent */ }
    }
    load()
  }, [isDemo, clinicId])

  const commsList = isDemo ? (comms as unknown as CommRow[]) : liveComms
  const activeComm = (selectedCommId == null ? commsList[0] : commsList.find((c, i) => (c.id === selectedCommId || i + 1 === selectedCommId))) || commsList[0]
  const messages = activeComm ? parseTranscription(activeComm.transcription) : []
  const selectedSms = smsList.find(s => s.id === selectedSmsId) ?? smsList[0] ?? null

  // Gate: transcriptions disabled for live accounts
  if (!isDemo && !transcriptionsLoading && !transcriptionsEnabled) {
    return (
      <div style={{ ...sectionCard, padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>📝</div>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: '#2A2A28', marginBottom: 10 }}>
          Les transcriptions sont désactivées.
        </div>
        <div style={{ fontSize: 14, color: '#9E9E9B', lineHeight: 1.7 }}>
          Vous pouvez les réactiver dans{' '}
          {setPage ? (
            <button
              onClick={() => setPage('configuration')}
              style={{ background: 'none', border: 'none', color: '#0A7C6E', fontWeight: 700, cursor: 'pointer', fontSize: 14, textDecoration: 'underline', padding: 0 }}
            >
              Configurations de la clinique
            </button>
          ) : (
            <a href="/dashboard" style={{ color: '#0A7C6E', fontWeight: 700, textDecoration: 'underline' }}>
              Configurations de la clinique
            </a>
          )}
          .
        </div>
      </div>
    )
  }

  if (!isDemo && !loading && activeTab === 'calls' && commsList.length === 0) {
    return (
      <div>
        <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div style={{ ...sectionCard, padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>💬</div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: '#2A2A28', marginBottom: 8 }}>Aucune communication pour le moment</div>
          <div style={{ fontSize: 13, color: '#9E9E9B', lineHeight: 1.7 }}>
            Votre agent IA remplira cette section automatiquement<br />
            dès qu&apos;il aura traité des appels ou messages.
          </div>
        </div>
      </div>
    )
  }

  if (!isDemo && activeTab === 'sms') {
    return (
      <div>
        <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
        {smsList.length === 0 ? (
          <div style={{ ...sectionCard, padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>💬</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: '#2A2A28', marginBottom: 8 }}>Aucun SMS pour le moment</div>
            <div style={{ fontSize: 13, color: '#9E9E9B' }}>Les SMS envoyés et reçus par votre agent apparaîtront ici.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px,1fr) minmax(360px,1.4fr)', gap: 20 }}>
            <div style={{ ...sectionCard, padding: 16 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: '#2A2A28', marginBottom: 14 }}>SMS</div>
              {smsList.map(s => (
                <div key={s.id} onClick={() => setSelectedSmsId(s.id)}
                  style={{ padding: 12, borderRadius: 8, marginBottom: 6, cursor: 'pointer', border: selectedSmsId === s.id ? '1.5px solid #0A7C6E' : '1px solid #EBEBEA', background: selectedSmsId === s.id ? '#E8F5F3' : '#F9F9F7' }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{s.direction === 'inbound' ? '📥' : '📤'}</span>
                    <div>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: '#2A2A28' }}>{s.client_name}</div>
                      <div style={{ fontSize: 11, color: '#9E9E9B' }}>{new Date(s.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })} · {s.direction === 'inbound' ? 'Reçu' : 'Envoyé'}</div>
                      <div style={{ fontSize: 11, color: '#5C5C59', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{s.body}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {selectedSms && (
              <div style={{ ...sectionCard, padding: 20 }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: '#141412', marginBottom: 20 }}>
                  {selectedSms.direction === 'inbound' ? '📥' : '📤'} SMS {selectedSms.direction === 'inbound' ? 'reçu' : 'envoyé'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  {[['Client', selectedSms.client_name], ['Direction', selectedSms.direction === 'inbound' ? 'Entrant' : 'Sortant'], ['Statut', selectedSms.status || '—'], ['Date', new Date(selectedSms.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })]].map(([l, v]) => (
                    <div key={l}>
                      <div style={{ fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: '#9E9E9B', marginBottom: 2 }}>{l}</div>
                      <div style={{ fontSize: 13, color: '#3E3E3C' }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: '#9E9E9B', marginBottom: 8 }}>Contenu</div>
                <div style={{ padding: 16, background: '#FAFAF8', borderRadius: 8, border: '1px solid #EBEBEA', fontSize: 14, color: '#2A2A28', lineHeight: 1.7 }}>
                  {selectedSms.body}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      {!isDemo && <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px,1fr) minmax(360px,1.4fr)', gap: 20 }}>
        <div style={{ ...sectionCard, padding: 16 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: '#2A2A28', marginBottom: 14 }}>Conversations</div>
          {loading && <div style={{ fontSize: 13, color: '#9E9E9B', padding: 12 }}>Chargement…</div>}
          {commsList.map((c, i) => (
            <div key={c.id ?? i} onClick={() => setSelectedCommId(typeof c.id === 'number' ? c.id : i + 1)}
              style={{ padding: 12, borderRadius: 8, marginBottom: 6, cursor: 'pointer', border: activeComm?.id === c.id ? '1.5px solid #0A7C6E' : '1px solid #EBEBEA', background: activeComm?.id === c.id ? '#E8F5F3' : '#F9F9F7' }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <span style={{ fontSize: 20 }}>{c.icon}</span>
                <div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: '#2A2A28' }}>{c.clientName}</div>
                  <div style={{ fontSize: 11, color: '#9E9E9B' }}>{c.datetime} · {c.agent}</div>
                  <div style={{ fontSize: 11, color: '#5C5C59', marginTop: 2 }}>{c.summary}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {activeComm && (
          <div style={{ ...sectionCard, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: '#141412' }}>{activeComm.icon} {activeComm.channel}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => window.alert('Relance envoyée (simulation).')} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #0A7C6E', background: 'transparent', color: '#0A7C6E', fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Relancer</button>
                <button onClick={() => window.alert('Note ajoutée (simulation).')} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #D4D4D2', background: 'white', color: '#5C5C59', fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Ajouter note</button>
                <button onClick={() => window.alert('PDF téléchargé (simulation).')} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #D4D4D2', background: 'white', color: '#5C5C59', fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Télécharger PDF</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[['Agent utilisé', activeComm.agent], ['Nom du client', activeComm.clientName], ['Contact', activeComm.contact], ['Durée', activeComm.duration], ['Date / heure', activeComm.datetime]].map(([l, v]) => (
                <div key={l}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: '#9E9E9B', marginBottom: 2 }}>{l}</div>
                  <div style={{ fontSize: 13, color: '#3E3E3C' }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: '#9E9E9B', marginBottom: 6 }}>Replay de l&apos;appel</div>
            {activeComm.audio_url ? (
              <audio controls src={activeComm.audio_url} style={{ width: '100%', marginBottom: 16 }} />
            ) : (
              <div style={{ fontSize: 13, color: '#9E9E9B', marginBottom: 16, padding: 12, borderRadius: 8, border: '1px solid #EBEBEA', background: '#F9F9F7' }}>Aucun audio disponible</div>
            )}
            <div style={{ fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: '#9E9E9B', marginBottom: 12 }}>Transcription complète</div>
            <div style={{ maxHeight: 320, overflowY: 'auto', padding: '12px 8px', borderRadius: 8, border: '1px solid #EBEBEA', background: '#FAFAF8' }}>
              {messages.length === 0 ? (
                <div style={{ fontSize: 13, color: '#9E9E9B', textAlign: 'center', padding: 16 }}>Aucune transcription disponible</div>
              ) : (
                messages.map((msg, i) => <ChatBubble key={i} msg={msg} />)
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
