'use client'
import { useMemo, useState, useEffect } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { supabase } from '@/lib/supabase/client'
import { clientsData } from '../data/mockData'
import { inputStyle, sectionCard } from '../utils/styles'
import type { ClientItem, ClientNew, Pet, Vaccination } from '../types/types'

type Props = {
  clientsState: ClientItem[]
  setClientsState: Dispatch<SetStateAction<ClientItem[]>>
  selectedClientId: number | null
  setSelectedClientId: Dispatch<SetStateAction<number | null>>
  clinicId: string
  isDemo: boolean
}

function Field({ label, value, editing, onChange }: { label: string; value?: string; editing: boolean; onChange?: (v: string) => void }) {
  return (
    <div>
      <div style={{ fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: '#9E9E9B', marginBottom: 4 }}>{label}</div>
      {editing ? (
        <input style={{ ...inputStyle, padding: '6px 10px', fontSize: 13 }} value={value ?? ''} onChange={e => onChange?.(e.target.value)} />
      ) : (
        <div style={{ fontSize: 13, color: '#3E3E3C', fontWeight: 500, minHeight: 20 }}>{value || '—'}</div>
      )}
    </div>
  )
}

export default function ClientsPage({ clientsState, setClientsState, selectedClientId, setSelectedClientId, clinicId, isDemo }: Props) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('Tous')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [loadingClients, setLoadingClients] = useState(!isDemo)

  // Live clients for real accounts
  const [liveClients, setLiveClients] = useState<ClientNew[]>([])
  const [selectedLiveClientId, setSelectedLiveClientId] = useState<string | null>(null)
  const [editingLive, setEditingLive] = useState<Partial<ClientNew> | null>(null)

  // Vaccinations for selected pet
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([])
  const [vaccLoading, setVaccLoading] = useState(false)
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null)

  // Load real clients
  useEffect(() => {
    if (isDemo || !clinicId) { setLoadingClients(false); return }
    const load = async () => {
      setLoadingClients(true)
      try {
        const { data } = await supabase
          .from('clients')
          .select('id, first_name, last_name, email, phone_primary, clinic_id, created_at, pets(id, name, species, breed, birth_date)')
          .eq('clinic_id', clinicId)
          .order('created_at', { ascending: false })
        if (data) {
          setLiveClients((data as Record<string, unknown>[]).map(r => ({
            id: r.id as string,
            first_name: (r.first_name as string) ?? '',
            last_name: (r.last_name as string) ?? '',
            email: (r.email as string) ?? '',
            phone_primary: (r.phone_primary as string) ?? '',
            clinic_id: (r.clinic_id as string) ?? '',
            created_at: r.created_at as string,
            pets: (r.pets as Pet[]) ?? [],
          })))
        }
      } catch { /* silent */ } finally {
        setLoadingClients(false)
      }
    }
    load()
  }, [clinicId, isDemo])

  // Load vaccinations when a pet is selected
  useEffect(() => {
    if (!selectedPetId) { setVaccinations([]); return }
    const load = async () => {
      setVaccLoading(true)
      try {
        const { data } = await supabase
          .from('vaccinations')
          .select('vaccine_name, date_administered, next_due_date')
          .eq('pet_id', selectedPetId)
          .order('date_administered', { ascending: false })
        if (data) setVaccinations(data as Vaccination[])
      } catch { /* silent */ } finally {
        setVaccLoading(false)
      }
    }
    load()
  }, [selectedPetId])

  // ── DEMO MODE ──────────────────────────────────────────────────
  const [editingMock, setEditingMock] = useState<Partial<ClientItem> | null>(null)

  const filteredMock = useMemo(() => clientsState.filter(c => {
    const matchSearch = `${c.prenom} ${c.nom} ${c.animal}`.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'Tous' || c.espece === filter
    return matchSearch && matchFilter
  }), [clientsState, search, filter])

  const selectedMock = clientsState.find(c => c.id === selectedClientId) ?? null

  const saveEditMock = async () => {
    if (!editingMock || !selectedMock) return
    setSaving(true); setSaveMsg('')
    const updated = { ...selectedMock, ...editingMock }
    try { await supabase.from('clients').update(editingMock).eq('id', selectedMock.id) } catch { /* ignore */ }
    setClientsState(prev => prev.map(c => c.id === selectedMock.id ? updated : c))
    setSaving(false); setEditingMock(null)
    setSaveMsg('✓ Modifications enregistrées')
    setTimeout(() => setSaveMsg(''), 3000)
  }

  // ── LIVE MODE ──────────────────────────────────────────────────
  const filteredLive = useMemo(() => liveClients.filter(c => {
    const fullName = `${c.first_name} ${c.last_name}`
    const matchSearch = `${fullName} ${c.email} ${c.phone_primary}`.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'Tous' || (c.pets ?? []).some(p => p.species?.toLowerCase().includes(filter.toLowerCase()))
    return matchSearch && matchFilter
  }), [liveClients, search, filter])

  const selectedLive = liveClients.find(c => c.id === selectedLiveClientId) ?? null

  const saveEditLive = async () => {
    if (!editingLive || !selectedLive) return
    setSaving(true); setSaveMsg('')
    try {
      await supabase.from('clients').update({ first_name: editingLive.first_name, last_name: editingLive.last_name, email: editingLive.email, phone_primary: editingLive.phone_primary }).eq('id', selectedLive.id)
      setLiveClients(prev => prev.map(c => c.id === selectedLive.id ? { ...c, ...editingLive } : c))
    } catch { /* ignore */ }
    setSaving(false); setEditingLive(null)
    setSaveMsg('✓ Modifications enregistrées')
    setTimeout(() => setSaveMsg(''), 3000)
  }

  if (!loadingClients && !isDemo && liveClients.length === 0) {
    return (
      <div style={{ ...sectionCard, padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🐾</div>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: '#2A2A28', marginBottom: 8 }}>Aucun client enregistré</div>
        <div style={{ fontSize: 14, color: '#9E9E9B', maxWidth: 420, margin: '0 auto', lineHeight: 1.6 }}>
          Votre agent IA ajoutera automatiquement les clients après chaque appel.
        </div>
      </div>
    )
  }

  if (!loadingClients && isDemo && clientsState.length === 0) {
    return (
      <div style={{ ...sectionCard, padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🐾</div>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: '#2A2A28', marginBottom: 8 }}>Aucun client pour le moment</div>
        <div style={{ fontSize: 14, color: '#9E9E9B', maxWidth: 420, margin: '0 auto', lineHeight: 1.6 }}>
          Vos premiers patients apparaîtront ici automatiquement dès que vos agents prendront leurs premiers rendez-vous. 🐾
        </div>
      </div>
    )
  }

  // ── DEMO layout ────────────────────────────────────────────────
  if (isDemo) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: selectedMock ? 'minmax(300px,1fr) minmax(380px,1.4fr)' : '1fr', gap: 20 }}>
        <div style={{ ...sectionCard, padding: 20 }}>
          <div style={{ marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input placeholder="🔍 Rechercher..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 180 }} />
            <select value={filter} onChange={e => setFilter(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
              {['Tous', 'Chien', 'Chat', 'Lapin'].map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div style={{ fontSize: 12, color: '#9E9E9B', marginBottom: 12 }}>{filteredMock.length} client(s)</div>
          {filteredMock.map(c => (
            <div key={c.id} onClick={() => { setSelectedClientId(c.id); setEditingMock(null); setSaveMsg('') }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, marginBottom: 6, cursor: 'pointer', border: selectedClientId === c.id ? '1.5px solid #0A7C6E' : '1px solid #EBEBEA', background: selectedClientId === c.id ? '#E8F5F3' : '#F9F9F7' }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#E8F5F3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: '#0A7C6E', flexShrink: 0 }}>
                {c.prenom[0]}{c.nom[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: '#2A2A28' }}>{c.prenom} {c.nom}</div>
                <div style={{ fontSize: 11, color: '#9E9E9B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.animal} · {c.rdvCount} RDV</div>
              </div>
            </div>
          ))}
        </div>

        {selectedMock && (
          <div style={{ ...sectionCard, padding: 20, overflowY: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, color: '#141412' }}>
                  {editingMock ? `${editingMock.prenom ?? selectedMock.prenom} ${editingMock.nom ?? selectedMock.nom}` : `${selectedMock.prenom} ${selectedMock.nom}`}
                </div>
                <div style={{ fontSize: 13, color: '#9E9E9B', marginTop: 2 }}>{selectedMock.rdvCount} RDV · Dernier : {selectedMock.lastRdv}</div>
              </div>
              {!editingMock ? (
                <button onClick={() => setEditingMock({ prenom: selectedMock.prenom, nom: selectedMock.nom, email: selectedMock.email, tel: selectedMock.tel, animal: selectedMock.animal, espece: selectedMock.espece, race: selectedMock.race, age: selectedMock.age, notes: selectedMock.notes })}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #0A7C6E', background: 'white', color: '#0A7C6E', fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  ✏️ Modifier
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={saveEditMock} disabled={saving}
                    style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: saving ? '#9E9E9B' : '#0A7C6E', color: 'white', fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                    {saving ? '…' : '✓ Enregistrer'}
                  </button>
                  <button onClick={() => { setEditingMock(null); setSaveMsg('') }}
                    style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #D4D4D2', background: 'white', color: '#9E9E9B', fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Annuler
                  </button>
                </div>
              )}
            </div>
            {saveMsg && <div style={{ background: '#E8F5F3', border: '1px solid #0A7C6E', borderRadius: 6, padding: '8px 14px', fontSize: 13, color: '#0A7C6E', marginBottom: 16 }}>{saveMsg}</div>}
            <div style={{ background: '#F9F9F7', borderRadius: 8, padding: 16, marginBottom: 16, border: '1px solid #EBEBEA' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>👤 Contact</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Prénom" value={editingMock?.prenom ?? selectedMock.prenom} editing={!!editingMock} onChange={v => setEditingMock(p => ({ ...p, prenom: v }))} />
                <Field label="Nom" value={editingMock?.nom ?? selectedMock.nom} editing={!!editingMock} onChange={v => setEditingMock(p => ({ ...p, nom: v }))} />
                <Field label="Email" value={editingMock?.email ?? selectedMock.email} editing={!!editingMock} onChange={v => setEditingMock(p => ({ ...p, email: v }))} />
                <Field label="Téléphone" value={editingMock?.tel ?? selectedMock.tel} editing={!!editingMock} onChange={v => setEditingMock(p => ({ ...p, tel: v }))} />
              </div>
            </div>
            <div style={{ background: '#F9F9F7', borderRadius: 8, padding: 16, marginBottom: 16, border: '1px solid #EBEBEA' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>🐾 Animal</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Nom" value={editingMock?.animal ?? selectedMock.animal} editing={!!editingMock} onChange={v => setEditingMock(p => ({ ...p, animal: v }))} />
                <Field label="Espèce" value={editingMock?.espece ?? selectedMock.espece} editing={!!editingMock} onChange={v => setEditingMock(p => ({ ...p, espece: v }))} />
                <Field label="Race" value={editingMock?.race ?? selectedMock.race} editing={!!editingMock} onChange={v => setEditingMock(p => ({ ...p, race: v }))} />
                <Field label="Âge" value={editingMock?.age ?? selectedMock.age} editing={!!editingMock} onChange={v => setEditingMock(p => ({ ...p, age: v }))} />
              </div>
            </div>
            {selectedMock.rappels.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>🔔 Rappels</div>
                {selectedMock.rappels.map(r => (
                  <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#FEF7E8', borderRadius: 6, marginBottom: 6, border: '1px solid rgba(245,166,35,0.2)' }}>
                    <span>⏰</span><span style={{ fontSize: 13, color: '#3E3E3C' }}>{r}</span>
                  </div>
                ))}
              </div>
            )}
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>📝 Notes</div>
              {editingMock ? (
                <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical', fontSize: 13 }} value={editingMock.notes ?? ''} onChange={e => setEditingMock(p => ({ ...p, notes: e.target.value }))} />
              ) : (
                <div style={{ fontSize: 13, color: '#5C5C59', lineHeight: 1.6, padding: 12, background: '#F9F9F7', borderRadius: 8, border: '1px solid #EBEBEA' }}>{selectedMock.notes}</div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── LIVE layout ────────────────────────────────────────────────
  return (
    <div style={{ display: 'grid', gridTemplateColumns: selectedLive ? 'minmax(300px,1fr) minmax(380px,1.4fr)' : '1fr', gap: 20 }}>
      <div style={{ ...sectionCard, padding: 20 }}>
        <div style={{ marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input placeholder="🔍 Rechercher..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 180 }} />
          <select value={filter} onChange={e => setFilter(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
            {['Tous', 'Chien', 'Chat', 'Lapin', 'Autre'].map(f => <option key={f}>{f}</option>)}
          </select>
        </div>

        {loadingClients ? (
          <>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ height: 58, background: '#E8E8E6', borderRadius: 8, marginBottom: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </>
        ) : (
          <>
            <div style={{ fontSize: 12, color: '#9E9E9B', marginBottom: 12 }}>{filteredLive.length} client(s)</div>
            {filteredLive.map(c => {
              const initials = (c.first_name?.[0] ?? '') + (c.last_name?.[0] ?? '') || '?'
              const fullName = `${c.first_name} ${c.last_name}`.trim() || c.email || '—'
              return (
                <div key={c.id} onClick={() => { setSelectedLiveClientId(c.id); setEditingLive(null); setSaveMsg(''); setSelectedPetId(null) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, marginBottom: 6, cursor: 'pointer', border: selectedLiveClientId === c.id ? '1.5px solid #0A7C6E' : '1px solid #EBEBEA', background: selectedLiveClientId === c.id ? '#E8F5F3' : '#F9F9F7' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#E8F5F3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: '#0A7C6E', flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: '#2A2A28' }}>{fullName}</div>
                    <div style={{ fontSize: 11, color: '#9E9E9B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {(c.pets ?? []).map((p: Pet) => p.name).join(', ') || '—'}
                      {' · '}{new Date(c.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>

      {selectedLive && (
        <div style={{ ...sectionCard, padding: 20, overflowY: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, color: '#141412' }}>
                {editingLive
                  ? `${editingLive.first_name ?? selectedLive.first_name} ${editingLive.last_name ?? selectedLive.last_name}`.trim()
                  : `${selectedLive.first_name} ${selectedLive.last_name}`.trim() || selectedLive.email}
              </div>
              <div style={{ fontSize: 13, color: '#9E9E9B', marginTop: 2 }}>
                Inscrit le {new Date(selectedLive.created_at).toLocaleDateString('fr-FR')}
              </div>
            </div>
            {!editingLive ? (
              <button onClick={() => setEditingLive({ first_name: selectedLive.first_name, last_name: selectedLive.last_name, email: selectedLive.email, phone_primary: selectedLive.phone_primary })}
                style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #0A7C6E', background: 'white', color: '#0A7C6E', fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                ✏️ Modifier
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={saveEditLive} disabled={saving}
                  style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: saving ? '#9E9E9B' : '#0A7C6E', color: 'white', fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? '…' : '✓ Enregistrer'}
                </button>
                <button onClick={() => { setEditingLive(null); setSaveMsg('') }}
                  style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #D4D4D2', background: 'white', color: '#9E9E9B', fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Annuler
                </button>
              </div>
            )}
          </div>

          {saveMsg && <div style={{ background: '#E8F5F3', border: '1px solid #0A7C6E', borderRadius: 6, padding: '8px 14px', fontSize: 13, color: '#0A7C6E', marginBottom: 16 }}>{saveMsg}</div>}

          {/* Contact */}
          <div style={{ background: '#F9F9F7', borderRadius: 8, padding: 16, marginBottom: 16, border: '1px solid #EBEBEA' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>👤 Informations de contact</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Prénom" value={editingLive?.first_name ?? selectedLive.first_name} editing={!!editingLive} onChange={v => setEditingLive(p => ({ ...p, first_name: v }))} />
              <Field label="Nom" value={editingLive?.last_name ?? selectedLive.last_name} editing={!!editingLive} onChange={v => setEditingLive(p => ({ ...p, last_name: v }))} />
              <Field label="Email" value={editingLive?.email ?? selectedLive.email} editing={!!editingLive} onChange={v => setEditingLive(p => ({ ...p, email: v }))} />
              <Field label="Téléphone" value={editingLive?.phone_primary ?? selectedLive.phone_primary} editing={!!editingLive} onChange={v => setEditingLive(p => ({ ...p, phone_primary: v }))} />
            </div>
          </div>

          {/* Pets */}
          {(selectedLive.pets ?? []).length > 0 && (
            <div style={{ background: '#F9F9F7', borderRadius: 8, padding: 16, marginBottom: 16, border: '1px solid #EBEBEA' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>🐾 Animaux</div>
              {(selectedLive.pets ?? []).map((pet: Pet) => (
                <div key={pet.id}
                  onClick={() => setSelectedPetId(prev => prev === pet.id ? null : pet.id)}
                  style={{ padding: '10px 12px', borderRadius: 8, border: selectedPetId === pet.id ? '1.5px solid #0A7C6E' : '1px solid #EBEBEA', background: selectedPetId === pet.id ? '#E8F5F3' : 'white', marginBottom: 8, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: '#2A2A28' }}>{pet.name}</div>
                      <div style={{ fontSize: 11, color: '#9E9E9B' }}>{pet.species}{pet.breed ? ` · ${pet.breed}` : ''}{pet.birth_date ? ` · né(e) le ${new Date(pet.birth_date).toLocaleDateString('fr-FR')}` : ''}</div>
                    </div>
                    <span style={{ fontSize: 11, color: '#0A7C6E' }}>{selectedPetId === pet.id ? '▲ Vaccins' : '▼ Vaccins'}</span>
                  </div>

                  {/* Vaccinations */}
                  {selectedPetId === pet.id && (
                    <div style={{ marginTop: 10, borderTop: '1px solid #EBEBEA', paddingTop: 10 }}>
                      {vaccLoading ? (
                        <div style={{ height: 30, background: '#E8E8E6', borderRadius: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
                      ) : vaccinations.length === 0 ? (
                        <div style={{ fontSize: 12, color: '#9E9E9B' }}>Aucun vaccin enregistré.</div>
                      ) : (
                        vaccinations.map((v, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#3E3E3C', padding: '4px 0', borderBottom: i < vaccinations.length - 1 ? '1px solid #F5F5F3' : 'none' }}>
                            <span style={{ fontWeight: 600 }}>{v.vaccine_name}</span>
                            <span style={{ color: '#9E9E9B' }}>{new Date(v.date_administered).toLocaleDateString('fr-FR')} → {v.next_due_date ? new Date(v.next_due_date).toLocaleDateString('fr-FR') : '—'}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </div>
  )
}

// Re-export mockData default for Dashboard compatibility
export { clientsData }
