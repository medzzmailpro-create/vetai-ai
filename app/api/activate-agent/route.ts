import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

    // Trouver le clinic_id de l'utilisateur connecté
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('clinic_members')
      .select('clinic_id')
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Clinique introuvable' }, { status: 404 })
    }

    // Vérifier la clé
    const { data: keyRow, error: keyError } = await supabaseAdmin
      .from('activation_keys')
      .select('*')
      .eq('key', activationKey)
      .single()

    if (keyError || !keyRow) {
      return NextResponse.json({ error: 'Clé invalide' }, { status: 400 })
    }

    if (keyRow.is_used) {
      return NextResponse.json({ error: 'Clé déjà utilisée' }, { status: 400 })
    }

    // Créer l'agent pour CETTE clinique
    const { error: agentError } = await supabaseAdmin
  .from('ai_agents')
  .insert({
    clinic_id: membership.clinic_id,
    agent_id: activationKey,        // ← ajoute cette ligne
    name: 'Réceptionniste IA',
    type: keyRow.agent_type,
    provider: 'retell',
    provider_agent_id: activationKey,
    is_active: true,
  })

    if (agentError) {
      return NextResponse.json({ error: agentError.message }, { status: 500 })
    }

    // Marquer la clé comme utilisée
    await supabaseAdmin
      .from('activation_keys')
      .update({ is_used: true })
      .eq('id', keyRow.id)

    return NextResponse.json({ success: true })

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 })
  }
}