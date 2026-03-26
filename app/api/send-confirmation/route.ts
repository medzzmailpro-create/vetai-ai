import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

export async function POST(req: NextRequest) {
  try {
    const { clientEmail, clientName, petName, date, time, clinicName } = await req.json()

    const { error } = await getResend().emails.send({
      from: 'Vetai <rdv@vetai.fr>',
      to: clientEmail,
      subject: `✅ RDV confirmé — ${clinicName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #0A7C6E;">Bonjour ${clientName},</h2>
          <p>Votre rendez-vous pour <strong>${petName}</strong> est confirmé :</p>
          <div style="background: #F0FDF8; border-left: 4px solid #0A7C6E; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;">📅 <strong>${date}</strong> à <strong>${time}</strong></p>
            <p style="margin: 8px 0 0;">📍 ${clinicName}</p>
          </div>
          <p style="color: #9E9E9B; font-size: 13px;">Cet email a été envoyé automatiquement par Vetai.</p>
        </div>
      `,
    })

    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ success: true })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}