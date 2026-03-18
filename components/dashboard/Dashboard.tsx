'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import Sidebar from './layout/Sidebar'
import Topbar from './layout/Topbar'
import OverviewPage from './pages/OverviewPage'
import ClientsPage from './pages/ClientsPage'
import AgendaPage from './pages/AgendaPage'
import CommunicationsPage from './pages/CommunicationsPage'
import AgentsPage from './pages/AgentsPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'
import BillingPage from './pages/BillingPage'
import SecurityPage from './pages/SecurityPage'
import ConfigurationPage from './pages/ConfigurationPage'
import EquipePage from './pages/EquipePage'
import FirstLoginPopup from './modals/FirstLoginPopup'
import AppointmentModal from './modals/AppointmentModal'
import AgentConfigModal from './modals/AgentConfigModal'
import { clientsData, agents } from './data/mockData'
import type { Page, Period, ReportRange, NotifRow } from './types/types'

export type ClinicConfig = {
  clinic_name: string
  address: string
  phone: string
  email: string
  hours: string
  clinic_type: string
  transfert_enabled: boolean
  transfert_number: string
  duree_rdv: number
  buffer_rdv: number
  setup_done: boolean
}

const DEFAULT_CONFIG: ClinicConfig = {
  clinic_name: '',
  address: '',
  phone: '',
  email: '',
  hours: '',
  clinic_type: 'Vétérinaire généraliste',
  transfert_enabled: true,
  transfert_number: '',
  duree_rdv: 20,
  buffer_rdv: 5,
  setup_done: false,
}

export default function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [page, setPage] = useState<Page>('overview')
  const [modalOpen, setModalOpen] = useState(false)
  const [period, setPeriod] = useState<Period>('7J')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false)
  const [selectedCommId, setSelectedCommId] = useState<number | null>(null)
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null)
  const [agentStates, setAgentStates] = useState<Record<string, boolean>>(
    () =>
      agents.reduce<Record<string, boolean>>((acc, agent) => {
        acc[agent.id] = agent.defaultActive
        return acc
      }, {})
  )
  const [agentConfigId, setAgentConfigId] = useState<string | null>(null)
  const [reportRange, setReportRange] = useState<ReportRange>('monthly')
  const [selectedReportKpi, setSelectedReportKpi] = useState('💰 Revenus générés')
  const [clientsState, setClientsState] = useState(clientsData)

  const [userId, setUserId] = useState<string>('')
  const [clinicId, setClinicId] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [userFirstName, setUserFirstName] = useState<string>('')
  const [userLastName, setUserLastName] = useState<string>('')
  const [userRole, setUserRole] = useState<'owner' | 'staff'>('owner')
  const [clinicConfig, setClinicConfig] = useState<ClinicConfig>(DEFAULT_CONFIG)
  const [showSetupPopup, setShowSetupPopup] = useState(false)
  const [configLoading, setConfigLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)
  const [liveNotifications, setLiveNotifications] = useState<NotifRow[]>([])

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        setUserId(user.id)
        setUserEmail(user.email ?? '')

        const { data: profileData } = await supabase
          .from('profiles')
          .select('first_name, last_name, onboarding_completed, is_demo, clinic_id')
          .eq('id', user.id)
          .single()

        const resolvedClinicId = profileData?.clinic_id ?? ''
        setClinicId(resolvedClinicId)

        if (profileData) {
          setUserFirstName(profileData.first_name ?? '')
          setUserLastName(profileData.last_name ?? '')
          setIsDemo(profileData.is_demo === true)
          if (!profileData.onboarding_completed) {
            setShowSetupPopup(true)
          }
        } else {
          setShowSetupPopup(true)
        }

        if (resolvedClinicId) {
          try {
            const { data: notifs } = await supabase
              .from('notifications')
              .select('id, title, body, read, created_at')
              .eq('clinic_id', resolvedClinicId)
              .eq('read', false)
              .order('created_at', { ascending: false })
              .limit(10)

            if (notifs) setLiveNotifications(notifs as NotifRow[])
          } catch {}
        }

        const { data: configData } = await supabase
          .from('clinic_config')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (configData) {
          setClinicConfig({
            clinic_name: configData.clinic_name ?? '',
            address: configData.address ?? '',
            phone: configData.phone ?? '',
            email: configData.email ?? '',
            hours: configData.hours ?? '',
            clinic_type: configData.clinic_type ?? 'Vétérinaire généraliste',
            transfert_enabled: configData.transfert_enabled ?? true,
            transfert_number: configData.transfert_number ?? '',
            duree_rdv: configData.duree_rdv ?? 20,
            buffer_rdv: configData.buffer_rdv ?? 5,
            setup_done: configData.setup_done ?? false,
          })
        }

        const { data: memberData } = await supabase
          .from('clinic_members')
          .select('role')
          .eq('user_id', user.id)
          .single()

        if (memberData?.role === 'staff') setUserRole('staff')
      } catch {
      } finally {
        setConfigLoading(false)
      }
    }

    loadUserData()
  }, [])

  const handleOnboardingComplete = (firstName: string, lastName: string) => {
    setUserFirstName(firstName)
    setUserLastName(lastName)
    setShowSetupPopup(false)
  }

  useEffect(() => {
    if (!userId || !clinicId) return

    const updateLastSeen = async () => {
      try {
        await supabase
          .from('clinic_members')
          .update({ last_seen: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('clinic_id', clinicId)
      } catch {}
    }

    updateLastSeen()
    const interval = setInterval(updateLastSeen, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [userId, clinicId])

  const handleReadNotification = async (id: string) => {
    setLiveNotifications(prev => prev.filter(n => n.id !== id))
    try {
      await supabase.from('notifications').update({ read: true }).eq('id', id)
    } catch {}
  }

  const clinicName = clinicConfig.clinic_name || 'Ma Clinique'

  if (configLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F5F5F3',
        }}
      >
        <div
          style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 16,
            color: '#9E9E9B',
          }}
        >
          Chargement…
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F5F3' }}>
      {showSetupPopup && (
        <FirstLoginPopup
          userId={userId}
          userEmail={userEmail}
          onComplete={handleOnboardingComplete}
        />
      )}

      <Sidebar
        page={page}
        setPage={setPage}
        clinicName={clinicName}
        sidebarOpenMobile={sidebarOpenMobile}
        setSidebarOpenMobile={setSidebarOpenMobile}
        userRole={userRole}
        userFirstName={userFirstName}
        userLastName={userLastName}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Topbar
          page={page}
          setPage={setPage}
          clinicName={clinicName}
          notifications={liveNotifications}
          onReadNotification={handleReadNotification}
          setSidebarOpenMobile={setSidebarOpenMobile}
          notificationsOpen={notificationsOpen}
          setNotificationsOpen={setNotificationsOpen}
          profileMenuOpen={profileMenuOpen}
          setProfileMenuOpen={setProfileMenuOpen}
          onOpenNewAppointment={() => setModalOpen(true)}
          onLogout={onLogout}
        />

        <main style={{ padding: '20px 24px', flex: 1, overflowY: 'auto' }}>
          {page === 'overview' && (
            <OverviewPage
              period={period}
              setPeriod={setPeriod}
              customStart={customStart}
              setCustomStart={setCustomStart}
              customEnd={customEnd}
              setCustomEnd={setCustomEnd}
              setPage={setPage}
              setSelectedClientId={setSelectedClientId}
              setSelectedCommId={setSelectedCommId}
              setSelectedReportKpi={setSelectedReportKpi}
              clinicId={clinicId}
              isDemo={isDemo}
            />
          )}

          {page === 'clients' && (
            <ClientsPage
              clientsState={clientsState}
              setClientsState={setClientsState}
              selectedClientId={selectedClientId}
              setSelectedClientId={setSelectedClientId}
              clinicId={clinicId}
              isDemo={isDemo}
            />
          )}

          {page === 'agenda' && (
            <AgendaPage
              setPage={setPage}
              setSelectedClientId={setSelectedClientId}
              onOpenNewAppointment={() => setModalOpen(true)}
              clinicId={clinicId}
              isDemo={isDemo}
            />
          )}

          {page === 'comms' && (
            <CommunicationsPage
              selectedCommId={selectedCommId}
              setSelectedCommId={setSelectedCommId}
              isDemo={isDemo}
              clinicId={clinicId}
              setPage={setPage}
            />
          )}

          {page === 'agents-dash' && (
            <AgentsPage
              agentStates={agentStates}
              setAgentStates={setAgentStates}
              setPage={setPage}
              setAgentConfigId={setAgentConfigId}
              clinicId={clinicId}
              isDemo={isDemo}
              userId={userId}
            />
          )}

          {page === 'rapports' && (
            <ReportsPage
              reportRange={reportRange}
              setReportRange={setReportRange}
              selectedReportKpi={selectedReportKpi}
              setSelectedReportKpi={setSelectedReportKpi}
              clinicId={clinicId}
              isDemo={isDemo}
            />
          )}

          {page === 'settings' && (
            <SettingsPage
              userId={userId}
              userRole={userRole}
              clinicConfig={clinicConfig}
              onConfigChange={(cfg) => setClinicConfig(cfg as ClinicConfig)}
            />
          )}

          {page === 'facturation' && userRole === 'owner' && <BillingPage clinicId={clinicId} />}

          {page === 'facturation' && userRole === 'staff' && (
            <div style={{ background: 'white', border: '1px solid #EBEBEA', borderRadius: 12, padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: '#2A2A28', marginBottom: 8 }}>
                Accès restreint
              </div>
              <div style={{ fontSize: 14, color: '#9E9E9B' }}>
                La facturation est réservée aux propriétaires de la clinique.
              </div>
            </div>
          )}

          {page === 'equipe' && <EquipePage clinicId={clinicId} />}
          {page === 'securite' && <SecurityPage />}

          {page === 'configuration' && (
            <ConfigurationPage
              config={clinicConfig}
              onConfigChange={setClinicConfig}
              userId={userId}
            />
          )}
        </main>
      </div>

      <AppointmentModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <AgentConfigModal agentConfigId={agentConfigId} setAgentConfigId={setAgentConfigId} setPage={setPage} />
    </div>
  )
}