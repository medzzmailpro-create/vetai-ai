import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac, timingSafeEqual } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Vérification HMAC-SHA256 de la signature Retell AI
function verifyRetellSignature(req: NextRequest, body: string): boolean {
  const secret = process.env.RETELL_WEBHOOK_SECRET
  if (!secret) return true // Dev : pas de secret configuré

  const signature = req.headers.get('x-retell-signature')
  if (!signature) return false

  const expected = createHmac('sha256', secret).update(body, 'utf8').digest('hex')

  try {
    const sigBuf = Buffer.from(signature)
    const expBuf = Buffer.from(expected)
    if (sigBuf.length !== expBuf.length) return false
    return timingSafeEqual(sigBuf, expBuf)
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text()

  if (!verifyRetellSignature(req, body)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const event = payload.event as string
  const call = payload.call as Record<string, unknown>

  if (!call) {
    return NextResponse.json({ ok: true })
  }

  const callId = call.call_id as string

  if (event === 'call_started') {
    await supabase.from('calls').upsert({
      retell_call_id: callId,
      from_number: call.from_number as string,
      to_number: call.to_number as string,
      status: 'ongoing',
    }, { onConflict: 'retell_call_id' })
  }

  if (event === 'call_ended') {
    const analysis = call.call_analysis as Record<string, unknown> | undefined
    const durationMs = call.duration_ms as number | undefined

    await supabase.from('calls').upsert({
      retell_call_id: callId,
      from_number: call.from_number as string,
      to_number: call.to_number as string,
      status: 'ended',
      duration_ms: durationMs,
      transcript: call.transcript as string,
      recording_url: call.recording_url as string,
      summary: analysis?.call_summary as string,
      ended_at: new Date().toISOString(),
    }, { onConflict: 'retell_call_id' })

    // Si un RDV a été pris, envoyer un SMS de confirmation via Twilio
    const customData = analysis?.custom_analysis_data as Record<string, unknown> | undefined
    if (customData?.appointment_booked && customData?.client_phone) {
      await sendSmsConfirmation(
        customData.client_phone as string,
        customData.appointment_summary as string ?? 'Votre rendez-vous a bien été enregistré.'
      )

      await supabase.from('calls').update({ appointment_booked: true, client_name: customData.client_name as string })
        .eq('retell_call_id', callId)
    }
  }

  return NextResponse.json({ ok: true })
}

async function sendSmsConfirmation(toNumber: string, message: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken || !fromNumber) return

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`

  const params = new URLSearchParams({
    To: toNumber,
    From: fromNumber,
    Body: `🐾 Clinique Vétérinaire\n${message}\nPour modifier votre RDV, répondez à ce SMS.`,
    StatusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio`,
  })

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (res.ok) {
    const data = await res.json()
    await supabase.from('sms_messages').insert({
      twilio_sid: data.sid,
      to_number: toNumber,
      from_number: fromNumber,
      body: params.get('Body'),
      status: 'queued',
      direction: 'outbound',
    })
  }
}
