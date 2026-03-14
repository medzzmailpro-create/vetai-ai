'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { supabase } from '@/lib/supabase/client'
import { appointments as mockAppointments, activities } from '../data/mockData'
import type { Period, Page, AppointmentRow, AgentEvent } from '../types/types'
import { inputStyle, sectionCard } from '../utils/styles'

type Props = {
  period: Period
  setPeriod: Dispatch<SetStateAction<Period>>
  customStart: string
  setCustomStart: Dispatch<SetStateAction<string>>
  customEnd: string
  setCustomEnd: Dispatch<SetStateAction<string>>
  setPage: Dispatch<SetStateAction<Page>>
  setSelectedClientId: Dispatch<SetStateAction<number | null>>
  setSelectedCommId: Dispatch<SetStateAction<number | null>>
  setSelectedReportKpi: Dispatch<SetStateAction<string>>
  clinicId: string
  isDemo: boolean
}

const periodData = {
  '24H': { revenue: '1 240€', noShows: '4', time: '2 h', missed: '8' },
  '7J': { revenue: '4 320€', noShows: '18', time: '7 h', missed: '36' },
  '30J': { revenue: '17 820€', noShows: '46', time: '28 h', missed: '112' },
  '90J': { revenue: '50 340€', noShows: '129', time: '82 h', missed: '306' },
  'TOUT': { revenue: '121 900€', noShows: '338', time: '214 h', missed: '904' },
  'CUSTOM': { revenue: '8 760€', noShows: '22', time: '12 h', missed: '58' },
}

type KpiKey = 'revenue' | 'time' | 'noShows' | 'missed'

const KPI_GREEN: { key: KpiKey; label: string; reportKpi: string }[] = [
  { key: 'revenue', label: '💰 Revenus générés', reportKpi: '💰 Revenus générés' },
  { key: 'time', label: '⏱ Temps gagné', reportKpi: '⏱ Temps économisé' },
  { key: 'noShows', label: '❌ No-shows évités', reportKpi: '❌ No-shows évités' },
  { key: 'missed', label: '📞 Appels manqués évités', reportKpi: '📞 Appels manqués évités' },
]

type CompResult =
  | { type: 'up'; pct: number }
  | { type: 'down'; pct: number }
  | { type: 'stable' }
  | { type: 'new' }
  | { type: 'none' }

type Comparison = Record<KpiKey, CompResult>

const VS_LABEL: Record<Period, string> = {
  '24H': 'vs hier',
  '7J': 'vs semaine précédente',
  '30J': 'vs mois précédent',
  '90J': 'vs trimestre précédent',
  'TOUT': '',
  'CUSTOM': 'vs période précédente',
}

const MOCK_COMPARISON: Record<Period, Comparison> = {
  '24H': { revenue: { type: 'up', pct: 29.2 }, time: { type: 'up', pct: 18.5 }, noShows: { type: 'up', pct: 33.3 }, missed: { type: 'up', pct: 14.3 } },
  '7J': { revenue: { type: 'up', pct: 12.4 }, time: { type: 'up', pct: 8.1 }, noShows: { type: 'down', pct: -5.3 }, missed: { type: 'up', pct: 20.0 } },
  '30J': { revenue: { type: 'up', pct: 18.7 }, time: { type: 'up', pct: 15.2 }, noShows: { type: 'up', pct: 9.1 }, missed: { type: 'down', pct: -3.8 } },
  '90J': { revenue: { type: 'up', pct: 22.3 }, time: { type: 'up', pct: 19.6 }, noShows: { type: 'up', pct: 14.7 }, missed: { type: 'up', pct: 11.1 } },
  'TOUT': { revenue: { type: 'none' }, time: { type: 'none' }, noShows: { type: 'none' }, missed: { type: 'none' } },
  'CUSTOM': { revenue: { type: 'up', pct: 7.5 }, time: { type: 'stable' }, noShows: { type: 'new' }, missed: { type: 'up', pct: 11.1 } },
}

function calcPct(curr: number, prev: number): CompResult {
  if (prev === 0) return curr === 0 ? { type: 'stable' } : { type: 'new' }
  const pct = Math.round(((curr - prev) / prev) * 1000) / 10
  if (Math.abs(pct) < 0.5) return { type: 'stable' }
  return pct > 0 ? { type: 'up', pct } : { type: 'down', pct }
}

function CompIndicator({ result, period }: { result: CompResult | undefined; period: Period }) {
  const vs = VS_LABEL[period]
  if (!result || result.type === 'none') {
    return <div style={{ fontSize: 12, marginTop: 6, color: 'rgba(255,255,255,0.5)' }}>Depuis le début</div>
  }
  if (result.type === 'up') {
    return <div style={{ fontSize: 12, marginTop: 6, color: '#86EFAC' }}>↑ +{result.pct}% {vs}</div>
  }
  if (result.type === 'down') {
    return <div style={{ fontSize: 12, marginTop: 6, color: '#FCA5A5' }}>↓ {result.pct}% {vs}</div>
  }
  if (result.type === 'stable') {
    return <div style={{ fontSize: 12, marginTop: 6, color: 'rgba(255,255,255,0.5)' }}>→ Stable {vs}</div>
  }
  if (result.type === 'new') {
    return <div style={{ fontSize: 12, marginTop: 6, color: '#FDE68A' }}>✦ Nouveau</div>
  }
  return null
}

const STATUS_COLORS: Record<string, { bg: string; border: string; badgeBg: string; badgeColor: string }> = {
  confirmed: { bg: '#F0FFF4', border: '#38A169', badgeBg: '#C6F6D5', badgeColor: '#276749' },
  pending:   { bg: '#FFFBF0', border: '#D69E2E', badgeBg: '#FEFCBF', badgeColor: '#975A16' },
  cancelled: { bg: '#FFF5F5', border: '#E53E3E', badgeBg: '#FED7D7', badgeColor: '#9B2C2C' },
  default:   { bg: '#F5F5F3', border: '#D4D4D2', badgeBg: '#EBEBEA', badgeColor: '#5C5C59' },
}

export default function OverviewPage({
  period, setPeriod, customStart, setCustomStart, customEnd, setCustomEnd,
  setPage, setSelectedClientId, setSelectedCommId, setSelectedReportKpi,
  clinicId, isDemo,
}: Props) {
  const data = periodData[period]

  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [gradientHovered, setGradientHovered] = useState(false)
  const customizeRef = useRef<HTMLDivElement>(null)

  const [kpiVisible, setKpiVisible] = useState<Record<KpiKey, boolean>>({
    revenue: true, time: true, noShows: true, missed: true,
  })

  const [comparison, setComparison] = useState<Comparison>(MOCK_COMPARISON[period])
  const [kpiLoading, setKpiLoading] = useState(false)

  // Today's appointments from Supabase
  const [todayAppointments, setTodayAppointments] = useState<AppointmentRow[]>([])
  const [agendaLoading, setAgendaLoading] = useState(false)

  // Recent agent events (live only)
  const [liveEvents, setLiveEvents] = useState<AgentEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (customizeRef.current && !customizeRef.current.contains(e.target as Node)) {
        setCustomizeOpen(false)
      }
    }
    if (customizeOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [customizeOpen])

  const toggleKpi = (key: KpiKey) => setKpiVisible(prev => ({ ...prev, [key]: !prev[key] }))

  // Fetch today's appointments from Supabase
  useEffect(() => {
    if (isDemo || !clinicId) return
    const fetchToday = async () => {
      setAgendaLoading(true)
      try {
        const today = new Date()
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString()

        const { data: rows } = await supabase
          .from('appointments')
          .select('id, starts_at, ends_at, status, type, clients(name), pets(name, species)')
          .eq('clinic_id', clinicId)
          .gte('starts_at', todayStart)
          .lte('starts_at', todayEnd)
          .order('starts_at', { ascending: true })

        if (rows) {
          setTodayAppointments(rows.map((r: Record<string, unknown>) => ({
            id: r.id as string,
            starts_at: r.starts_at as string,
            ends_at: (r.ends_at as string) ?? '',
            status: (r.status as string) ?? 'pending',
            type: (r.type as string) ?? '',
            client_name: ((r.clients as Record<string, string> | null)?.name) ?? '—',
            pet_name: ((r.pets as Record<string, string> | null)?.name) ?? '—',
            pet_species: ((r.pets as Record<string, string> | null)?.species) ?? '',
          })))
        }
      } catch { /* ignore */ } finally {
        setAgendaLoading(false)
      }
    }
    fetchToday()
  }, [clinicId, isDemo])

  // Fetch recent agent events
  useEffect(() => {
    if (isDemo || !clinicId) return
    const fetchEvents = async () => {
      setEventsLoading(true)
      try {
        const { data } = await supabase
          .from('agent_events')
          .select('id, event_type, title, description, created_at')
          .eq('clinic_id', clinicId)
          .order('created_at', { ascending: false })
          .limit(5)
        if (data) setLiveEvents(data as AgentEvent[])
      } catch { /* ignore */ } finally {
        setEventsLoading(false)
      }
    }
    fetchEvents()
  }, [clinicId, isDemo])

  // Fetch comparison KPIs
  const fetchComparison = useCallback(async () => {
    if (period === 'TOUT') { setComparison(MOCK_COMPARISON['TOUT']); return }

    const now = new Date()
    let periodStart: Date | null = null
    let prevStart: Date | null = null

    if (period === '24H') { periodStart = new Date(now.getTime() - 86400000); prevStart = new Date(now.getTime() - 172800000) }
    else if (period === '7J') { periodStart = new Date(now.getTime() - 7 * 86400000); prevStart = new Date(now.getTime() - 14 * 86400000) }
    else if (period === '30J') { periodStart = new Date(now.getTime() - 30 * 86400000); prevStart = new Date(now.getTime() - 60 * 86400000) }
    else if (period === '90J') { periodStart = new Date(now.getTime() - 90 * 86400000); prevStart = new Date(now.getTime() - 180 * 86400000) }
    else if (period === 'CUSTOM' && customStart && customEnd) {
      periodStart = new Date(customStart)
      const endDate = new Date(customEnd)
      prevStart = new Date(periodStart.getTime() - (endDate.getTime() - periodStart.getTime()))
    }

    if (!periodStart || !prevStart) { setComparison(MOCK_COMPARISON[period]); return }

    setKpiLoading(true)
    try {
      const pStart = periodStart.toISOString()
      const pPrevStart = prevStart.toISOString()
      const nowStr = now.toISOString()

      const clinicFilter = !isDemo && clinicId ? clinicId : null

      const buildQuery = (from: string, to: string) => {
        let q = supabase.from('calls').select('appointment_booked, duration_ms, status')
          .gte('created_at', from).lte('created_at', to)
        if (clinicFilter) q = q.eq('clinic_id', clinicFilter)
        return q
      }
      const buildAptQuery = (from: string, to: string) => {
        let q = supabase.from('appointments').select('status')
          .gte('starts_at', from).lte('starts_at', to)
        if (clinicFilter) q = q.eq('clinic_id', clinicFilter)
        return q
      }

      const [
        { data: currCalls }, { data: currApts },
        { data: prevCalls }, { data: prevApts },
      ] = await Promise.all([
        buildQuery(pStart, nowStr), buildAptQuery(pStart, nowStr),
        buildQuery(pPrevStart, pStart), buildAptQuery(pPrevStart, pStart),
      ])

      type CallRow = { appointment_booked: boolean; duration_ms: number; status: string }
      type AptRow = { status: string }

      const calcVals = (calls: CallRow[] | null, apts: AptRow[] | null) => ({
        revenue: (calls ?? []).filter(c => c.appointment_booked).length * 60,
        time: (calls ?? []).reduce((s, c) => s + (c.duration_ms ?? 0), 0),
        noShows: (apts ?? []).filter(a => a.status === 'confirmed').length,
        missed: (calls ?? []).filter(c => c.status === 'ended').length,
      })

      const curr = calcVals(currCalls as CallRow[] | null, currApts as AptRow[] | null)
      const prev = calcVals(prevCalls as CallRow[] | null, prevApts as AptRow[] | null)
      const totalActivity = Object.values(curr).reduce((a, b) => a + b, 0) + Object.values(prev).reduce((a, b) => a + b, 0)

      setComparison(totalActivity === 0 ? MOCK_COMPARISON[period] : {
        revenue: calcPct(curr.revenue, prev.revenue),
        time: calcPct(curr.time, prev.time),
        noShows: calcPct(curr.noShows, prev.noShows),
        missed: calcPct(curr.missed, prev.missed),
      })
    } catch {
      setComparison(MOCK_COMPARISON[period])
    } finally {
      setKpiLoading(false)
    }
  }, [period, customStart, customEnd, clinicId, isDemo])

  useEffect(() => { fetchComparison() }, [fetchComparison])

  // Agenda to display
  const agendaItems = isDemo ? mockAppointments : todayAppointments

  return (
    <>
      {/* Period selector row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(['24H', '7J', '30J', '90J', 'TOUT', 'CUSTOM'] as Period[]).map(p => {
            const isActive = period === p
            return (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: '6px 12px', borderRadius: 999,
                border: isActive ? '1px solid #0A7C6E' : '1px solid #D4D4D2',
                background: isActive ? '#E8F5F3' : 'white',
                fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 600,
                color: isActive ? '#0A7C6E' : '#5C5C59', cursor: 'pointer',
              }}>
                {p === 'CUSTOM' ? 'Personnalisé' : p}
              </button>
            )
          })}
        </div>

        <div ref={customizeRef} style={{ position: 'relative' }}>
          <button onClick={() => setCustomizeOpen(prev => !prev)} style={{
            padding: '6px 14px', borderRadius: 999, border: '1px solid #D4D4D2',
            background: customizeOpen ? '#F0F0EE' : 'white',
            fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 600,
            color: '#5C5C59', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            ⚙️ Personnaliser
          </button>
          {customizeOpen && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, background: 'white', border: '1px solid #EBEBEA', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.10)', padding: '12px 16px', minWidth: 240, zIndex: 100 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700, color: '#9E9E9B', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cartes KPI affichées</div>
              {KPI_GREEN.map(kpi => (
                <div key={kpi.key} onClick={() => toggleKpi(kpi.key)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F5F5F3', cursor: 'pointer' }}>
                  <span style={{ fontSize: 13, color: '#3E3E3C' }}>{kpi.label}</span>
                  <div style={{ width: 38, height: 20, borderRadius: 10, background: kpiVisible[kpi.key] ? '#0A7C6E' : '#D4D4D2', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 2, left: kpiVisible[kpi.key] ? undefined : 2, right: kpiVisible[kpi.key] ? 2 : undefined, width: 16, height: 16, background: 'white', borderRadius: '50%', transition: 'left 0.2s, right 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {period === 'CUSTOM' && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
          <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} style={{ ...inputStyle, width: 160, padding: '8px 10px' }} />
          <span style={{ fontSize: 12, color: '#9E9E9B' }}>→</span>
          <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} style={{ ...inputStyle, width: 160, padding: '8px 10px' }} />
        </div>
      )}

      {/* Green KPI block */}
      <div
        onClick={() => setPage('rapports')}
        onMouseEnter={() => setGradientHovered(true)}
        onMouseLeave={() => setGradientHovered(false)}
        style={{
          background: 'linear-gradient(135deg, #065E53, #0A7C6E)', borderRadius: 12, padding: '20px 24px', marginBottom: 20,
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 20,
          cursor: 'pointer', transition: 'opacity 0.15s, transform 0.15s',
          opacity: gradientHovered ? 0.92 : 1, transform: gradientHovered ? 'translateY(-1px)' : 'translateY(0)', position: 'relative',
        }}
      >
        {KPI_GREEN.map(({ key, label, reportKpi }) => (
          <div key={key} onClick={e => { e.stopPropagation(); setSelectedReportKpi(reportKpi); setPage('rapports') }} style={{ color: 'white' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
            {kpiLoading ? (
              <div style={{ height: 34, width: 90, background: 'rgba(255,255,255,0.2)', borderRadius: 6 }} />
            ) : (
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, lineHeight: 1.1 }}>{data[key]}</div>
            )}
            {kpiLoading ? (
              <div style={{ height: 14, width: 130, background: 'rgba(255,255,255,0.15)', borderRadius: 4, marginTop: 8 }} />
            ) : (
              <CompIndicator result={comparison[key]} period={period} />
            )}
          </div>
        ))}
        <div style={{ position: 'absolute', bottom: 12, right: 16, fontSize: 11, color: 'rgba(255,255,255,0.75)', fontFamily: 'Syne, sans-serif', fontWeight: 600 }}>→ Voir les rapports</div>
      </div>

      {/* Agent status */}
      <div style={{ ...sectionCard, padding: 16, marginBottom: 20 }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: '#2A2A28', marginBottom: 12 }}>Statut des agents IA</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {['🤙 Agent Téléphone', '💬 Agent Chat Web', '📅 Agent Agenda', '📱 Agent WhatsApp'].map((name, i) => (
            <div key={name} onClick={() => setPage('agents-dash')} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px',
              background: '#F5F5F3', borderRadius: 100, fontSize: 12, fontWeight: 600,
              fontFamily: 'Syne, sans-serif', color: '#3E3E3C', border: '1px solid #EBEBEA', cursor: 'pointer',
            }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: i === 3 ? '#D69E2E' : '#38A169' }} />
              {name}
            </div>
          ))}
        </div>
      </div>

      {/* Agenda + activité récente */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <div style={{ ...sectionCard, padding: 16 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: '#2A2A28', marginBottom: 12 }}>Agenda du jour</div>

          {agendaLoading && (
            <>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: 52, background: '#E8E8E6', borderRadius: 8, marginBottom: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))}
            </>
          )}

          {!agendaLoading && isDemo && (mockAppointments as Array<{ time: string; name: string; animal: string; badge: string; bg: string; border: string; badgeBg: string; badgeColor: string; clientId: number }>).map(a => (
            <div key={a.time} onClick={() => { setSelectedClientId(a.clientId); setPage('clients') }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, marginBottom: 6, borderLeft: `4px solid ${a.border}`, background: a.bg, cursor: 'pointer' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700, color: '#5C5C59', minWidth: 38 }}>{a.time}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 600, color: '#2A2A28' }}>{a.name}</div>
                <div style={{ fontSize: 10, color: '#9E9E9B' }}>{a.animal}</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: a.badgeBg, color: a.badgeColor }}>{a.badge}</span>
            </div>
          ))}

          {!agendaLoading && !isDemo && agendaItems.length === 0 && (
            <div style={{ fontSize: 13, color: '#9E9E9B', textAlign: 'center', padding: 16 }}>Aucun rendez-vous pour le moment.</div>
          )}

          {!agendaLoading && !isDemo && (agendaItems as AppointmentRow[]).map(a => {
            const colors = STATUS_COLORS[a.status] ?? STATUS_COLORS.default
            const time = new Date(a.starts_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
            return (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, marginBottom: 6, borderLeft: `4px solid ${colors.border}`, background: colors.bg }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700, color: '#5C5C59', minWidth: 38 }}>{time}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 600, color: '#2A2A28' }}>{a.client_name}</div>
                  <div style={{ fontSize: 10, color: '#9E9E9B' }}>{a.pet_name}{a.pet_species ? ` · ${a.pet_species}` : ''}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: colors.badgeBg, color: colors.badgeColor }}>{a.type || a.status}</span>
              </div>
            )
          })}
        </div>

        <div style={{ ...sectionCard, padding: 16 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: '#2A2A28', marginBottom: 12 }}>Activité récente</div>

          {eventsLoading && [1, 2, 3].map(i => (
            <div key={i} style={{ height: 38, background: '#E8E8E6', borderRadius: 6, marginBottom: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}

          {isDemo && activities.map((a, i) => (
            <div key={i} onClick={() => { setSelectedCommId(a.commId); setPage('comms') }}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: i < activities.length - 1 ? '1px solid #EBEBEA' : 'none', cursor: 'pointer' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, background: a.bg }}>
                {a.icon}
              </div>
              <div style={{ fontSize: 12, color: '#3E3E3C', lineHeight: 1.5 }}>
                <strong>{a.client}</strong> {a.text} <span style={{ color: '#9E9E9B' }}>· {a.time}</span>
              </div>
            </div>
          ))}

          {!isDemo && !eventsLoading && liveEvents.length === 0 && (
            <div style={{ fontSize: 13, color: '#9E9E9B', textAlign: 'center', padding: 16 }}>
              Aucune activité récente.
            </div>
          )}

          {!isDemo && !eventsLoading && liveEvents.map((e, i) => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: i < liveEvents.length - 1 ? '1px solid #EBEBEA' : 'none' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, background: '#E8F5F3' }}>
                🤖
              </div>
              <div style={{ fontSize: 12, color: '#3E3E3C', lineHeight: 1.5 }}>
                <strong>{e.title}</strong> {e.description && `— ${e.description}`} <span style={{ color: '#9E9E9B' }}>· {new Date(e.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </>
  )
}
