import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Twilio envoie les status callbacks en form-urlencoded
export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin()
  const body = await req.text()
  const params = new URLSearchParams(body)

  const messageSid = params.get('MessageSid')
  const messageStatus = params.get('MessageStatus') // queued | sent | delivered | failed | undelivered
  const to = params.get('To')
  const from = params.get('From')
  const messageBody = params.get('Body')

  if (!messageSid) {
    return NextResponse.json({ error: 'Missing MessageSid' }, { status: 400 })
  }

  // Mise à jour du statut du SMS dans Supabase
  const { error } = await supabase
    .from('sms_messages')
    .upsert({
      twilio_sid: messageSid,
      to_number: to,
      from_number: from,
      body: messageBody ?? undefined,
      status: messageStatus ?? 'unknown',
      direction: params.get('Direction')?.startsWith('outbound') ? 'outbound' : 'inbound',
    }, { onConflict: 'twilio_sid' })

  if (error) {
    console.error('Twilio webhook DB error:', error)
  }

  // Twilio attend une réponse 200 vide ou TwiML
  return new NextResponse('', { status: 200 })
}
