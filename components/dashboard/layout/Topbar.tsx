
'use client'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Dispatch, SetStateAction } from 'react'
import { TITLES } from '../data/constants'
import type { Page, NotifRow } from '../types/types'

type Props = {
  page: Page
  setPage: Dispatch<SetStateAction<Page>>
  clinicName: string
  notifications: NotifRow[]
  onReadNotification: (id: string) => void
  setSidebarOpenMobile: Dispatch<SetStateAction<boolean>>
  notificationsOpen: boolean
  setNotificationsOpen: Dispatch<SetStateAction<boolean>>
  profileMenuOpen: boolean
  setProfileMenuOpen: Dispatch<SetStateAction<boolean>>
  onOpenNewAppointment: () => void
  onLogout: () => void
}

export default function Topbar({
  page, setPage, clinicName, notifications, onReadNotification,
  setSidebarOpenMobile, notificationsOpen, setNotificationsOpen,
  profileMenuOpen, setProfileMenuOpen, onOpenNewAppointment, onLogout,
}: Props) {
  const router = useRouter()

  return (
    <div style={{ background: 'white', borderBottom: '1px solid #EBEBEA', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10, gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => setSidebarOpenMobile(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4, padding: 4 }}>
          <span style={{ display: 'block', width: 20, height: 2, background: '#2A2A28', borderRadius: 2 }} />
          <span style={{ display: 'block', width: 20, height: 2, background: '#2A2A28', borderRadius: 2 }} />
          <span style={{ display: 'block', width: 20, height: 2, background: '#2A2A28', borderRadius: 2 }} />
        </button>
        <div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, color: '#141412' }}>{TITLES[page][0]}</h1>
          <p style={{ fontSize: 12, color: '#9E9E9B' }}>{page === 'overview' ? `Vue d'ensemble — ${clinicName}` : TITLES[page][1]}</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
        {/* Bell */}
        <div
          onClick={() => { setNotificationsOpen(v => !v); setProfileMenuOpen(false) }}
          style={{ position: 'relative', width: 36, height: 36, background: '#F5F5F3', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, cursor: 'pointer' }}
        >
          🔔
          {notifications.length > 0 && (
            <div style={{ position: 'absolute', top: 4, right: 4, width: 16, height: 16, background: '#E53E3E', borderRadius: '50%', fontSize: 9, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {notifications.length}
            </div>
          )}
        </div>

        <button onClick={onOpenNewAppointment} style={{ padding: '8px 14px', background: '#F5A623', color: '#1a1a18', border: '2px solid #F5A623', borderRadius: 8, fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          + Nouveau RDV
        </button>

        <div
          onClick={() => { setProfileMenuOpen(v => !v); setNotificationsOpen(false) }}
          style={{ width: 36, height: 36, background: '#E8F5F3', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700, color: '#0A7C6E', cursor: 'pointer' }}
        >
          SM
        </div>

        {profileMenuOpen && (
          <div style={{ position: 'absolute', top: 48, right: 0, background: 'white', borderRadius: 8, border: '1px solid #EBEBEA', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', minWidth: 180, padding: 8, zIndex: 20 }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid #F5F5F3', marginBottom: 4 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: '#2A2A28' }}>Dr. Sophie Martin</div>
              <div style={{ fontSize: 11, color: '#9E9E9B' }}>{clinicName}</div>
            </div>
            <div onClick={() => { setPage('settings'); setProfileMenuOpen(false) }} style={{ padding: '8px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, color: '#5C5C59' }}>⚙️ Paramètres</div>
            <div
              onClick={async () => {
                if (window.confirm('Voulez-vous vraiment vous déconnecter ?')) {
                  await supabase.auth.signOut()
                  router.push('/login')
                }
                setProfileMenuOpen(false)
              }}
              style={{ padding: '8px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600, color: '#C53030' }}
            >
              Déconnexion
            </div>
          </div>
        )}

        {notificationsOpen && (
          <div style={{ position: 'absolute', top: 48, right: 46, background: 'white', borderRadius: 12, border: '1px solid #EBEBEA', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', minWidth: 280, maxWidth: 340, padding: 8, zIndex: 25 }}>
            <div style={{ padding: '4px 8px 8px', borderBottom: '1px solid #F0F0ED', marginBottom: 4 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: '#2A2A28' }}>Centre de notifications</div>
            </div>
            <div style={{ maxHeight: 260, overflowY: 'auto' }}>
              {notifications.length === 0 && (
                <div style={{ fontSize: 13, color: '#9E9E9B', padding: '16px 8px', textAlign: 'center' }}>Aucune nouvelle notification</div>
              )}
              {notifications.map(n => (
                <div key={n.id} onClick={() => { onReadNotification(n.id); setNotificationsOpen(false) }}
                  style={{ display: 'flex', gap: 8, padding: 8, borderRadius: 8, cursor: 'pointer' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#F5F5F3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>🔔</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#2A2A28' }}>{n.title}</div>
                    <div style={{ fontSize: 11, color: '#5C5C59' }}>{n.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
