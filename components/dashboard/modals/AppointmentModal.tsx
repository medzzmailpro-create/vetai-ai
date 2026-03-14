
'use client'
import { useState } from 'react'
import { inputStyle } from '../utils/styles'

type Props = {
  open: boolean
  onClose: () => void
}

export default function AppointmentModal({ open, onClose }: Props) {
  const [client, setClient] = useState('')
  const [date, setDate] = useState('2026-03-11')
  const [heure, setHeure] = useState('09:00')
  const [motif, setMotif] = useState('')
  const [done, setDone] = useState(false)

  if (!open) return null

  const handleCreate = () => {
    if (!client || !motif) return
    setDone(true)
    setTimeout(() => {
      setDone(false)
      setClient('')
      setMotif('')
      setHeure('09:00')
      onClose()
    }, 1800)
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, padding: 32, maxWidth: 480, width: '90%' }}>

        {done ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#0A7C6E' }}>RDV créé !</div>
            <div style={{ fontSize: 13, color: '#9E9E9B', marginTop: 6 }}>{client} · {date} à {heure}</div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, color: '#141412' }}>📅 Nouveau rendez-vous</div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9E9E9B' }}>✕</button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Client *</label>
              <input style={inputStyle} placeholder="Nom du client..." value={client} onChange={e => setClient(e.target.value)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Date</label>
                <input style={inputStyle} type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div>
                <label style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Heure</label>
                <input style={inputStyle} type="time" value={heure} onChange={e => setHeure(e.target.value)} />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Motif *</label>
              <input style={inputStyle} placeholder="Ex: Vaccination, Bilan de santé..." value={motif} onChange={e => setMotif(e.target.value)} />
            </div>

            {(!client || !motif) && (
              <div style={{ fontSize: 12, color: '#9E9E9B', marginBottom: 12 }}>* Champs obligatoires</div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{ padding: '10px 20px', background: 'transparent', color: '#0A7C6E', border: '2px solid #0A7C6E', borderRadius: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
              <button
                onClick={handleCreate}
                disabled={!client || !motif}
                style={{ padding: '10px 20px', background: !client || !motif ? '#D4D4D2' : '#0A7C6E', color: 'white', border: 'none', borderRadius: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, cursor: !client || !motif ? 'not-allowed' : 'pointer' }}>
                Créer le RDV
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
