
'use client'
import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { supabase } from '@/lib/supabase/client'
import { SIDEBAR_ITEMS } from '../data/constants'
import type { Page } from '../types/types'

type Props = {
  page: Page
  setPage: Dispatch<SetStateAction<Page>>
  clinicName: string
  sidebarOpenMobile: boolean
  setSidebarOpenMobile: Dispatch<SetStateAction<boolean>>
  userRole?: 'owner' | 'staff'
  userFirstName?: string
  userLastName?: string
}

export default function Sidebar({ page, setPage, clinicName, sidebarOpenMobile, setSidebarOpenMobile, userRole: _userRole, userFirstName = '', userLastName = '' }: Props) {
  const displayName = (userFirstName || userLastName)
    ? `${userFirstName} ${userLastName}`.trim()
    : 'Mon compte'
  const initials = (userFirstName || userLastName)
    ? `${userFirstName.charAt(0)}${userLastName.charAt(0)}`.toUpperCase()
    : '?'

  // Load role from profiles to conditionally show Panel Support
  const [role, setRole] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('role').eq('id', user.id).single()
        .then(({ data }) => { if (data?.role) setRole(data.role) })
    })
  }, [])

  return (
    <>
      {sidebarOpenMobile && (
        <div
          onClick={() => setSidebarOpenMobile(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50 }}
        />
      )}

      <aside
        style={{
          width: 260,
          background: 'white',
          borderRight: '1px solid #EBEBEA',
          display: 'flex',
          flexDirection: 'column',
          position: sidebarOpenMobile ? 'fixed' : 'sticky',
          top: 0,
          left: sidebarOpenMobile ? 0 : undefined,
          height: '100vh',
          overflowY: 'auto',
          flexShrink: 0,
          zIndex: sidebarOpenMobile ? 60 : 1,
        }}
      >
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #EBEBEA' }}>
          <div
            onClick={() => {
              setPage('overview')
              setSidebarOpenMobile(false)
            }}
            style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: '#0A7C6E', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
          >
            Vetai.AI
            <div style={{ width: 7, height: 7, background: '#F5A623', borderRadius: '50%' }} />
          </div>
          <div style={{ fontSize: 12, color: '#9E9E9B', marginTop: 4 }}>{clinicName}</div>
        </div>

        {SIDEBAR_ITEMS.map(group => (
          <div key={group.section} style={{ padding: '12px 12px 0' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9E9E9B', padding: '8px 8px 4px' }}>
              {group.section}
            </div>
            {group.items.map(item => (
              <div
                key={item.id}
                onClick={() => {
                  setPage(item.id)
                  setSidebarOpenMobile(false)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 12px',
                  borderRadius: 8,
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: page === item.id ? '#E8F5F3' : 'transparent',
                  color: page === item.id ? '#0A7C6E' : '#5C5C59',
                }}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
        ))}

        {/* Panel Support — visible uniquement pour role = 'support' */}
        {role === 'support' && (
          <div style={{ padding: '8px 12px 0' }}>
            <div style={{ height: 1, background: '#EBEBEA', margin: '8px 0 10px' }} />
            <a
              href="/admin"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 8,
                fontFamily: 'Syne, sans-serif',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                background: '#FFF8E7',
                color: '#92590A',
                textDecoration: 'none',
                border: '1px solid rgba(245,166,35,0.3)',
              }}
            >
              <span style={{ fontSize: 16 }}>🛡️</span>
              Panel Support
            </a>
          </div>
        )}

        <div style={{ marginTop: 'auto', padding: '16px 12px', borderTop: '1px solid #EBEBEA' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, borderRadius: 8 }}>
            <div style={{ width: 36, height: 36, background: '#0A7C6E', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: '#2A2A28', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
              <div style={{ fontSize: 11, color: '#9E9E9B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clinicName}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
