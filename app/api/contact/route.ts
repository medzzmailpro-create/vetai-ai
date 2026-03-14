import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  let body: Record<string, string>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const { prenom, nom, email, clinique, tel, offre, message } = body

  if (!prenom?.trim() || !email?.trim() || !email.includes('@')) {
    return NextResponse.json({ error: 'Prénom et email requis' }, { status: 400 })
  }

  // Insérer dans contact_requests (demandes publiques)
  const { error: contactError } = await supabase.from('contact_requests').insert({
    prenom: prenom.trim(),
    nom: nom?.trim() ?? '',
    email: email.trim().toLowerCase(),
    clinique: clinique?.trim() ?? '',
    tel: tel?.trim() ?? '',
    offre: offre ?? '',
    message: message?.trim() ?? '',
  })

  if (contactError) {
    console.error('contact_requests insert error:', contactError)
  }

  // Insérer aussi dans support_tickets pour notification équipe
  const subject = `Demande de démo — ${prenom.trim()} ${nom?.trim() ?? ''} (${clinique?.trim() ?? 'clinique inconnue'})`
  const ticketMessage = [
    `Email : ${email.trim()}`,
    tel ? `Tél : ${tel.trim()}` : '',
    offre ? `Offre : ${offre}` : '',
    message?.trim() ? `\nMessage : ${message.trim()}` : '',
  ].filter(Boolean).join('\n')

  await supabase.from('support_tickets').insert({
    category: 'contact',
    subject,
    message: ticketMessage,
    status: 'open',
  })

  // Notification email via Resend (optionnel)
  const notifyEmail = process.env.CONTACT_NOTIFY_EMAIL
  if (notifyEmail && process.env.RESEND_API_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Vetai.AI <noreply@cliniko.app>',
          to: [notifyEmail],
          subject: `Nouvelle demande : ${prenom.trim()} — ${clinique?.trim() ?? ''}`,
          text: `Nouvelle demande de démo Vetai.AI\n\n${subject}\n\n${ticketMessage}`,
        }),
      })
    } catch {
      // Email non bloquant
    }
  }

  return NextResponse.json({ ok: true })
}
