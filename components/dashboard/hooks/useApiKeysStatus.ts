import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

/**
 * Checks whether a clinic has configured API keys (ai_agents table).
 * Same data source as AgentsPage.tsx — does NOT modify activate logic.
 */
export function useApiKeysStatus(clinicId: string | null) {
  const [hasApiKeys, setHasApiKeys] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clinicId) { setLoading(false); return }
    let cancelled = false
    const check = async () => {
      try {
        const { data } = await supabase
          .from('ai_agents')
          .select('id')
          .eq('clinic_id', clinicId)
          .limit(1)
        if (!cancelled) setHasApiKeys(!!(data && data.length > 0))
      } catch {
        if (!cancelled) setHasApiKeys(false)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    check()
    return () => { cancelled = true }
  }, [clinicId])

  return { hasApiKeys, loading }
}
