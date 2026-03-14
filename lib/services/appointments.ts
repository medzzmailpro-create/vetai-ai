import { supabase } from '@/lib/supabase/client'

export async function getAppointments() {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .order('starts_at', { ascending: true })

  if (error) throw error
  return data
}