// Twilio — envoi de SMS de confirmation et rappels

function twilioHeaders() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID!
  const authToken = process.env.TWILIO_AUTH_TOKEN!
  return {
    Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  }
}

function twilioUrl(path: string) {
  return `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}${path}`
}

export type SmsResult = {
  sid: string
  status: string
  to: string
}

/** Envoyer un SMS */
export async function sendSms(to: string, body: string): Promise<SmsResult> {
  const params = new URLSearchParams({
    To: to,
    From: process.env.TWILIO_PHONE_NUMBER!,
    Body: body,
    StatusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio`,
  })

  const res = await fetch(twilioUrl('/Messages.json'), {
    method: 'POST',
    headers: twilioHeaders(),
    body: params.toString(),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Twilio SMS error: ${err.message}`)
  }

  return res.json()
}

/** Envoyer un SMS de confirmation de RDV */
export async function sendRdvConfirmation(params: {
  to: string
  clientName: string
  animalName: string
  date: string
  heure: string
  cliniqueName: string
}) {
  const body = [
    `🐾 ${params.cliniqueName}`,
    `Bonjour ${params.clientName}, votre RDV pour ${params.animalName}`,
    `est confirmé le ${params.date} à ${params.heure}.`,
    `Pour annuler ou modifier, répondez ANNULER ou MODIFIER.`,
  ].join('\n')

  return sendSms(params.to, body)
}

/** Envoyer un rappel de RDV (J-1) */
export async function sendRdvRappel(params: {
  to: string
  clientName: string
  animalName: string
  demain: string
  heure: string
  cliniqueName: string
}) {
  const body = [
    `🐾 ${params.cliniqueName} — Rappel`,
    `Bonjour ${params.clientName}, rappel de votre RDV pour ${params.animalName}`,
    `demain ${params.demain} à ${params.heure}.`,
    `Répondez CONFIRMER ou ANNULER.`,
  ].join('\n')

  return sendSms(params.to, body)
}
