import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { event, call } = body

    if (event === 'call_analyzed' || event === 'call_ended') {
      await supabaseAdmin
        .from('call_logs')
        .insert({
          call_id: call.call_id,
          agent_id: call.agent_id,
          from_number: call.from_number,
          to_number: call.to_number,
          duration: call.duration_ms,
          transcript: call.transcript,
          summary: call.call_analysis?.call_summary,
          sentiment: call.call_analysis?.user_sentiment,
          call_successful: call.call_analysis?.call_successful,
          caller_name: call.call_analysis?.custom_analysis_data?.caller_name,
          animal_name: call.call_analysis?.custom_analysis_data?.animal_name,
          animal_type: call.call_analysis?.custom_analysis_data?.animal_type,
          reason: call.call_analysis?.custom_analysis_data?.reason,
          urgency_level: call.call_analysis?.custom_analysis_data?.urgency_level,
          appointment_requested: call.call_analysis?.custom_analysis_data?.appointment_requested,
          started_at: call.start_timestamp,
          ended_at: call.end_timestamp,
        })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}