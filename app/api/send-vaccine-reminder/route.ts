import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

export async function POST(req: NextRequest) {
  try {
    const { clientEmail, clientName, petName, vaccineDate, clinicName, clinicPhone } = await req.json()

    const { error } = await getResend().emails.send({
      from: 'Vetai <rappels@vetai.fr>',
      to: clientEmail,
      subject: `💉 Rappel vaccin dans 7 jours — ${petName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #0A7C6E;">Bonjour ${clientName},</h2>
          <p>Le vaccin de <strong>${petName}</strong> arrive dans <strong>7 jours</strong>.</p>
          <div style="background: #FFF8E7; border-left: 4px solid #F5A623; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;">📅 Date du vaccin : <strong>${vaccineDate}</strong></p>
            <p style="margin: 8px 0 0;">📞 Appelez le : <strong>${clinicPhone}</strong></p>
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