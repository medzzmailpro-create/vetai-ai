// Retell AI — gestion des appels téléphoniques

const RETELL_API_URL = 'https://api.retellai.com'

function retellHeaders() {
  return {
    Authorization: `Bearer ${process.env.RETELL_API_KEY}`,
    'Content-Type': 'application/json',
  }
}

export type RetellCall = {
  call_id: string
  call_status: 'registered' | 'ongoing' | 'ended' | 'error'
  from_number: string
  to_number: string
  duration_ms?: number
  recording_url?: string
  transcript?: string
}

/** Créer un appel sortant via Retell AI */
export async function createOutboundCall(toNumber: string, agentId: string): Promise<RetellCall> {
  const res = await fetch(`${RETELL_API_URL}/v2/create-phone-call`, {
    method: 'POST',
    headers: retellHeaders(),
    body: JSON.stringify({
      from_number: process.env.RETELL_PHONE_NUMBER,
      to_number: toNumber,
      agent_id: agentId,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Retell API error: ${err}`)
  }

  return res.json()
}

/** Récupérer les détails d'un appel */
export async function getCall(callId: string): Promise<RetellCall> {
  const res = await fetch(`${RETELL_API_URL}/v2/get-call/${callId}`, {
    headers: retellHeaders(),
  })

  if (!res.ok) throw new Error('Retell: call not found')
  return res.json()
}

/** Lister les appels récents */
export async function listCalls(limit = 20): Promise<RetellCall[]> {
  const res = await fetch(`${RETELL_API_URL}/v2/list-calls?limit=${limit}`, {
    headers: retellHeaders(),
  })

  if (!res.ok) return []
  const data = await res.json()
  return data.calls ?? []
}

/** Créer ou mettre à jour un agent Retell avec la voix ElevenLabs */
export async function upsertRetellAgent(params: {
  agentName: string
  systemPrompt: string
  elevenLabsVoiceId?: string
}) {
  const body: Record<string, unknown> = {
    agent_name: params.agentName,
    response_engine: {
      type: 'retell-llm',
      llm_id: process.env.RETELL_LLM_ID,
    },
    voice_id: params.elevenLabsVoiceId ?? process.env.ELEVENLABS_VOICE_ID ?? 'eleven_multilingual_v2',
    language: 'fr-FR',
  }

  const res = await fetch(`${RETELL_API_URL}/v2/create-agent`, {
    method: 'POST',
    headers: retellHeaders(),
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new Error('Retell: failed to create agent')
  return res.json()
}
