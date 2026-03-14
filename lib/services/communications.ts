import { supabase } from '@/lib/supabase/client'

export async function getCommunications() {
  const { data, error } = await supabase
    .from('communications')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}