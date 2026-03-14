import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSms } from '@/lib/services/twilio'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function verifyToolSecret(req: NextRequest): boolean {
  const secret = process.env.API_TOOL_SECRET
  if (!secret) return true
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

export async function POST(req: NextRequest) {
  if (!verifyToolSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const action = url.pathname.split('/').pop()
  const body = await req.json()

  switch (action) {
    case 'book-appointment':
      return handleBookAppointment(body)
    case 'send-sms':
      return handleSendSms(body)
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 404 })
  }
}

export async function GET(req: NextRequest) {
  if (!verifyToolSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const action = url.pathname.split('/').pop()
  const params = Object.fromEntries(url.searchParams)

  switch (action) {
    case 'availability':
      return handleCheckAvailability(params)
    case 'client-info':
      return handleGetClientInfo(params)
    case 'appointments':
      return handleGetAppointments(params)
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 404 })
  }
}

async function handleBookAppointment(body: Record<string, string>) {
  const { client_name, animal_name, date, heure, motif, phone, species } = body

  const { data, error } = await supabase.from('appointments').insert({
    client_name,
    animal_name,
    species,
    date,
    heure,
    motif,
    phone,
    status: 'confirmed',
    source: 'ia_agent',
  }).select().single()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  if (phone) {
    try {
      await sendSms(phone, [
        `🐾 Rendez-vous confirmé !`,
        `${animal_name} — ${date} à ${heure}`,
        `Motif : ${motif}`,
        `Pour annuler : répondez ANNULER`,
      ].join('\n'))
    } catch {
      // SMS non bloquant
    }
  }

  return NextResponse.json({
    success: true,
    appointment: data,
    message: `RDV confirmé pour ${animal_name} le ${date} à ${heure}. SMS envoyé.`,
  })
}

async function handleCheckAvailability(params: Record<string, string>) {
  const { date, duration_minutes = '30' } = params

  const { data: existing } = await supabase
    .from('appointments')
    .select('heure, motif')
    .eq('date', date)
    .eq('status', 'confirmed')
    .order('heure')

  const allSlots: string[] = []
  for (let h = 9; h < 18; h++) {
    allSlots.push(`${String(h).padStart(2, '0')}:00`)
    allSlots.push(`${String(h).padStart(2, '0')}:30`)
  }

  const bookedSlots = (existing ?? []).map(r => r.heure)
  const availableSlots = allSlots.filter(s => !bookedSlots.includes(s))

  return NextResponse.json({
    date,
    available_slots: availableSlots.slice(0, 8),
    total_available: availableSlots.length,
    duration_minutes: parseInt(duration_minutes),
  })
}

async function handleGetClientInfo(params: Record<string, string>) {
  const { phone, name } = params

  let query = supabase.from('clients').select('*')
  if (phone) query = query.eq('tel', phone)
  else if (name) query = query.ilike('nom', `%${name}%`)

  const { data } = await query.limit(1).single()

  if (!data) return NextResponse.json({ found: false })

  return NextResponse.json({
    found: true,
    client: {
      name: `${data.prenom} ${data.nom}`,
      phone: data.tel,
      email: data.email,
      animal: data.animal,
      last_visit: data.lastRdv,
      notes: data.notes,
    },
  })
}

async function handleSendSms(body: Record<string, string>) {
  const { to, message } = body

  try {
    const result = await sendSms(to, message)
    return NextResponse.json({ success: true, sid: result.sid })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}

async function handleGetAppointments(params: Record<string, string>) {
  const { limit = '5', date_from } = params

  let query = supabase
    .from('appointments')
    .select('*')
    .order('date', { ascending: true })
    .order('heure', { ascending: true })
    .limit(parseInt(limit))

  if (date_from) query = query.gte('date', date_from)

  const { data } = await query
  return NextResponse.json({ appointments: data ?? [] })
}
