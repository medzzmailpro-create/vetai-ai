import { supabase } from '@/lib/supabase/client'

export async function getAgents() {
  const { data, error } = await supabase.from('ai_agents').select('*')
  if (error) throw error
  return data
}