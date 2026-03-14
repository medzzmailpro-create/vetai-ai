// Telegram Bot — canal vers Claude

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`

export type TelegramUpdate = {
  update_id: number
  message?: TelegramMessage
}

export type TelegramMessage = {
  message_id: number
  chat: { id: number; type: string }
  from?: { id: number; username?: string; first_name?: string }
  text?: string
  date: number
}

/** Envoyer un message Telegram */
export async function sendMessage(chatId: number, text: string, parseMode: 'Markdown' | 'HTML' = 'Markdown') {
  const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode }),
  })

  if (!res.ok) throw new Error('Telegram: sendMessage failed')
  return res.json()
}

/** Enregistrer le webhook Telegram (à appeler une seule fois au setup) */
export async function registerWebhook() {
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/telegram`

  const res = await fetch(`${TELEGRAM_API}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: webhookUrl }),
  })

  return res.json()
}

/** Obtenir les infos du bot */
export async function getBotInfo() {
  const res = await fetch(`${TELEGRAM_API}/getMe`)
  if (!res.ok) return null
  const data = await res.json()
  return data.result ?? null
}

/** Envoyer un message de bienvenue quand un utilisateur démarre le bot */
export function welcomeMessage(firstName: string): string {
  return [
    `👋 Bonjour *${firstName}* !`,
    `Je suis l'assistant IA de votre clinique vétérinaire.`,
    ``,
    `Je peux vous aider à :`,
    `📅 Prendre un rendez-vous`,
    `📋 Consulter vos RDV à venir`,
    `💊 Rappels de vaccins et traitements`,
    `❓ Répondre à vos questions`,
    ``,
    `Comment puis-je vous aider ?`,
  ].join('\n')
}
