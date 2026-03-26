import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

function getTwilio() {
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
}

export async function POST(req: NextRequest) {
  try {
    const { to, message, fromPhone } = await req.json()

    await getTwilio().messages.create({
      body: message,
      from: fromPhone, // numéro Twilio de la clinique
      to: to,          // numéro du client
    })

    return NextResponse.json({ success: true })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}