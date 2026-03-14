'use client'
import { useState, useEffect } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { supabase } from '@/lib/supabase/client'
import { agendaWeek } from '../data/mockData'
import type { Page, AppointmentRow } from '../types/types'
import { sectionCard } from '../utils/styles'
import { inputStyle } from '../utils/styles'

type Props = {
  setPage: Dispatch<SetStateAction<Page>>
  setSelectedClientId: Dispatch<SetStateAction<number | null>>
  onOpenNewAppointment: () => void
  clinicId: string
  isDemo: boolean
}

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmé',
  pending: 'En attente',
  cancelled: 'Annulé',
}
const STATUS_COLOR: Record<string, string> = {
  confirmed: '#38A169',
  pending: '#D69E2E',
  cancelled: '#E53E3E',
}
const STATUS_BG: Record<string, string> = {
  confirmed: '#F0FFF4',
  pending: '#FFFBF0',
  cancelled: '#FFF5F5',
}

function toLocalDateInput(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function AgendaPage({ setPage, setSelectedClientId, onOpenNewAppointment, clinicId, isDemo }: Props) {
  const [selectedDate, setSelectedDate] = useState(() => toLocalDateInput(new Date()))
  const [filterStatus, setFilterStatus] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all')
  const [appointments, setAppointments] = useState<AppointmentRow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isDemo || !clinicId) return
    const load = async () => {
      setLoading(true)
      try {
        const { data } = await supabase
          .from('appointments')
          .select('id, start_time, end_time, status, type, clients(name), pets(name, species)')
          .eq('clinic_id', clinicId)
          .gte('start_time', `${selectedDate}T00:00:00`)
          .lte('start_time', `${selectedDate}T23:59:59`)
          .order('start_time', { ascending: true })

        if (data) {
          setAppointments(data.map((r: Record<string, unknown>) => ({
            id: r.id as string,
            start_time: r.start_time as string,
            end_time: (r.end_time as string) ?? '',
            status: (r.status as string) ?? 'pending',
            type: (r.type as string) ?? '',
            client_name: ((r.clients as Record<string, string> | null)?.name) ?? '—',
            pet_name: ((r.pets as Record<string, string> | null)?.name) ?? '—',
            pet_species: ((r.pets as Record<string, string> | null)?.species) ?? '',
          })))
        }
      } catch { /* silent */ } finally {
        setLoading(false)
      }
    }
    load()
  }, [clinicId, isDemo, selectedDate])

  // ── DEMO layout ────────────────────────────────────────────────
  if (isDemo) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['24H', '7J', '30J', '90J', 'TOUT', 'Personnalisé'].map(v => (
              <button key={v} style={{ padding: '6px 14px', borderRadius: 999, border: v === '7J' ? '1px solid #0A7C6E' : '1px solid #D4D4D2', background: v === '7J' ? '#E8F5F3' : 'white', fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 600, color: v === '7J' ? '#0A7C6E' : '#5C5C59', cursor: 'pointer' }}>{v}</button>
            ))}
          </div>
          <button onClick={onOpenNewAppointment} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#F5A623', color: 'white', fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            + Nouveau RDV
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {agendaWeek.map(day => (
            <div key={day.day} style={{ ...sectionCard, padding: 14 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: '#0A7C6E', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #EBEBEA' }}>{day.day}</div>
              {day.rdvs.map((rdv, i) => (
                <div key={i} onClick={() => rdv.clientId ? (setSelectedClientId(rdv.clientId), setPage('clients')) : onOpenNewAppointment()}
                  style={{ padding: '8px 10px', borderRadius: 8, marginBottom: 8, borderLeft: `3px solid ${rdv.color}`, background: `${rdv.color}0a`, cursor: 'pointer' }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700, color: rdv.color }}>{rdv.badge} {rdv.time}</div>
                  <div style={{ fontSize: 11, color: '#2A2A28', fontWeight: 600, marginTop: 2 }}>{rdv.name}</div>
                  <div style={{ fontSize: 10, color: '#9E9E9B' }}>{rdv.motif}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── LIVE layout ────────────────────────────────────────────────
  const filtered = filterStatus === 'all' ? appointments : appointments.filter(a => a.status === filterStatus)

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{ ...inputStyle, width: 170, padding: '6px 10px', fontSize: 13 }}
          />
          {(['all', 'confirmed', 'pending', 'cancelled'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{
              padding: '6px 12px', borderRadius: 999,
              border: filterStatus === s ? `1px solid ${s === 'all' ? '#0A7C6E' : STATUS_COLOR[s]}` : '1px solid #D4D4D2',
              background: filterStatus === s ? (s === 'all' ? '#E8F5F3' : STATUS_BG[s]) : 'white',
              fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 600,
              color: filterStatus === s ? (s === 'all' ? '#0A7C6E' : STATUS_COLOR[s]) : '#5C5C59',
              cursor: 'pointer',
            }}>
              {s === 'all' ? 'Tous' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <button onClick={onOpenNewAppointment} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#F5A623', color: 'white', fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          + Nouveau RDV
        </button>
      </div>

      <div style={{ ...sectionCard, padding: 16 }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: '#2A2A28', marginBottom: 14 }}>
          {new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>

        {loading && (
          <>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 60, background: '#E8E8E6', borderRadius: 8, marginBottom: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: '#2A2A28', marginBottom: 4 }}>Aucun rendez-vous pour le moment.</div>
            <div style={{ fontSize: 13, color: '#9E9E9B' }}>Les rendez-vous pris par votre agent IA apparaîtront ici.</div>
          </div>
        )}

        {!loading && filtered.map(a => {
          const color = STATUS_COLOR[a.status] ?? '#9E9E9B'
          const bg = STATUS_BG[a.status] ?? '#F5F5F3'
          const time = new Date(a.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          const endTime = a.end_time ? new Date(a.end_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''
          return (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 8, marginBottom: 8, borderLeft: `4px solid ${color}`, background: bg, border: `1px solid ${color}33`, borderLeftWidth: 4 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700, color: '#5C5C59', minWidth: 60, flexShrink: 0 }}>
                {time}{endTime ? ` – ${endTime}` : ''}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: '#2A2A28' }}>{a.client_name}</div>
                <div style={{ fontSize: 11, color: '#9E9E9B' }}>{a.pet_name}{a.pet_species ? ` · ${a.pet_species}` : ''}{a.type ? ` · ${a.type}` : ''}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 100, background: bg, color, border: `1px solid ${color}55`, whiteSpace: 'nowrap' }}>
                {STATUS_LABEL[a.status] ?? a.status}
              </span>
            </div>
          )
        })}
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </div>
  )
}
