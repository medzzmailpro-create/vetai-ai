import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  try {
    const {
      caller_name,
      phone,
      animal_name,
      animal_type,
      reason,
      preferred_date,
      preferred_time,
      agent_id,
    } = await req.json()

    // Trouver la clinique via l'agent
    const { data: agent } = await supabaseAdmin
      .from('ai_agents')
      .select('clinic_id')
      .eq('provider_agent_id', agent_id)
      .single()

    // Sauvegarder le RDV dans Supabase
    const { error } = await supabaseAdmin
      .from('appointments')
      .insert({
        clinic_id: agent?.clinic_id || null,
        caller_name,
        phone,
        animal_name,
        animal_type,
        reason,
        preferred_date,
        preferred_time,
        status: 'pending',
        source: 'phone_ai',
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}