import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Telegram envoie les updates en JSON via le webhook
// Flow: Telegram → ce webhook → Claude → réponse Telegram
export async function POST(req: NextRequest) {
  const update = await req.json()

  const message = update.message ?? update.edited_message
  if (!message) {
    return NextResponse.json({ ok: true })
  }

  const chatId = message.chat.id as number
  const userId = message.from?.username ?? String(message.from?.id)
  const text = message.text as string

  if (!text) {
    return NextResponse.json({ ok: true })
  }

  // Enregistrer le message entrant
  await supabase.from('telegram_messages').insert({
    telegram_chat_id: chatId,
    telegram_user: userId,
    message_text: text,
    direction: 'inbound',
  })

  // Appeler Claude directement
  const response = await callClaude(text)

  if (response) {
    await sendTelegramMessage(chatId, response)

    await supabase.from('telegram_messages').insert({
      telegram_chat_id: chatId,
      telegram_user: 'bot',
      message_text: response,
      direction: 'outbound',
    })
  }

  return NextResponse.json({ ok: true })
}

async function callClaude(userMessage: string): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: `Tu es l'assistant IA d'une clinique vétérinaire. Tu aides à gérer les rendez-vous, répondre aux questions sur les animaux, et coordonner les soins. Réponds toujours en français, de manière professionnelle et bienveillante.`,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!res.ok) return null
    const data = await res.json()
    return data.content?.[0]?.text ?? null
  } catch {
    return null
  }
}

async function sendTelegramMessage(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
    }),
  })
}
