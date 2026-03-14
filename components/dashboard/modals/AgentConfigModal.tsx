
'use client'
import { agents } from '../data/mockData'
import type { Dispatch, SetStateAction } from 'react'
import type { Page } from '../types/types'

type Props = {
  agentConfigId: string | null
  setAgentConfigId: Dispatch<SetStateAction<string | null>>
  setPage: Dispatch<SetStateAction<Page>>
}

export default function AgentConfigModal({ agentConfigId, setAgentConfigId, setPage }: Props) {
  if (!agentConfigId) return null

  return (
    <div onClick={() => setAgentConfigId(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 16, padding: 24, maxWidth: 440, width: '90%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 800, color: '#141412' }}>
            Configuration — {agents.find(a => a.id === agentConfigId)?.name}
          </div>
          <button onClick={() => setAgentConfigId(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9E9E9B' }}>✕</button>
        </div>
        <p style={{ fontSize: 13, color: '#9E9E9B', marginBottom: 16 }}>Pour une configuration avancée, rendez-vous dans la section Configuration.</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={() => { setPage('configuration'); setAgentConfigId(null) }} style={{ padding: '8px 16px', background: '#E8F5F3', color: '#0A7C6E', border: '1px solid #0A7C6E', borderRadius: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, cursor: 'pointer' }}>Aller à Configuration</button>
          <button onClick={() => setAgentConfigId(null)} style={{ padding: '8px 16px', background: '#0A7C6E', color: 'white', border: 'none', borderRadius: 8, fontFamily: 'Syne, sans-serif', fontWeight: 600, cursor: 'pointer' }}>Fermer</button>
        </div>
      </div>
    </div>
  )
}
