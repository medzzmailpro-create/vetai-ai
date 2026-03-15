import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function linkRetellPhoneToAgent(twilioPhone: string, retellAgentId: string) {
  const res = await fetch('https://api.retellai.com/v2/create-phone-number', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RETELL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phone_number: twilioPhone,
      inbound_agent_id: retellAgentId,
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    if (res.status === 409) {
      const update = await fetch(`https://api.retellai.com/v2/update-phone-number/${encodeURIComponent(twilioPhone)}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${process.env.RETELL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inbound_agent_id: retellAgentId }),
      })
      if (!update.ok) {
        const updateErr = await update.json()
        throw new Error(`Retell update error: ${JSON.stringify(updateErr)}`)
      }
      return
    }
    throw new Error(`Retell error: ${JSON.stringify(err)}`)
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Utilisateur non connecté' }, { status: 401 })
    }

    const { activationKey } = await req.json()

    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('clinic_members')
      .select('clinic_id')
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Clinique introuvable' }, { status: 404 })
    }

    const { data: k, error: keyError } = await supabaseAdmin
      .from('activation_keys')
      .select('*')
      .eq('key', activationKey)
      .single()

    if (keyError || !k) {
      return NextResponse.json({ error: 'Clé invalide' }, { status: 400 })
    }

    if (k.is_used) {
      return NextResponse.json({ error: 'Clé déjà utilisée' }, { status: 400 })
    }

    const clinicId = membership.clinic_id
    const userId = user.id

    // ── Retell API ──────────────────────────────
    if (k.retell_agent_id && k.twilio_phone) {
      try {
        await linkRetellPhoneToAgent(k.twilio_phone, k.retell_agent_id)
      } catch (retellError: any) {
        return NextResponse.json({ error: `Erreur Retell : ${retellError.message}` }, { status: 500 })
      }
    }

    // ── Créer tous les agents dans Supabase ─────
    const agents = [
      {
        clinic_id: clinicId, user_id: userId,
        agent_id: `${activationKey}-phone`,
        name: 'Réceptionniste IA 24/24', type: 'phone', provider: 'retell',
        provider_agent_id: k.retell_agent_id,
        config: { twilio_phone: k.twilio_phone, twilio_account_sid: k.twilio_account_sid },
        is_active: true,
      },
      {
        clinic_id: clinicId, user_id: userId,
        agent_id: `${activationKey}-rdv`,
        name: 'Gestionnaire RDV IA', type: 'calendar', provider: 'google_calendar',
        provider_agent_id: k.calendar_id,
        config: { calendar_id: k.calendar_id, n8n_webhook: k.n8n_webhook_url },
        is_active: true,
      },
      {
        clinic_id: clinicId, user_id: userId,
        agent_id: `${activationKey}-rappels`,
        name: 'Rappels vaccins', type: 'notifications', provider: 'twilio_resend',
        provider_agent_id: k.twilio_phone,
        config: { twilio_phone: k.twilio_phone, n8n_webhook: k.n8n_webhook_url },
        is_active: true,
      },
      {
        clinic_id: clinicId, user_id: userId,
        agent_id: `${activationKey}-triage`,
        name: 'Triage urgences', type: 'triage', provider: 'openai',
        provider_agent_id: `${activationKey}-triage`,
        config: {},
        is_active: true,
      },
      {
        clinic_id: clinicId, user_id: userId,
        agent_id: `${activationKey}-comms`,
        name: 'Communication centralisée', type: 'communication', provider: 'twilio',
        provider_agent_id: k.twilio_phone,
        config: { twilio_phone: k.twilio_phone },
        is_active: true,
      },
      {
        clinic_id: clinicId, user_id: userId,
        agent_id: `${activationKey}-sync`,
        name: 'Sync logiciels véto', type: 'sync', provider: 'n8n',
        provider_agent_id: k.n8n_webhook_url,
        config: { n8n_webhook: k.n8n_webhook_url },
        is_active: true,
      },
    ]

    const { error: agentError } = await supabaseAdmin.from('ai_agents').insert(agents)
    if (agentError) {
      return NextResponse.json({ error: agentError.message }, { status: 500 })
    }

    await supabaseAdmin.from('activation_keys').update({ is_used: true }).eq('id', k.id)

    return NextResponse.json({ success: true, agents_created: agents.length })

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 })
  }
}