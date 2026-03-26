import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: Request) {
  const supabaseAdmin = getSupabaseAdmin()
  const { email, password, first_name, last_name, role } = await req.json()

  // Créer l'utilisateur dans auth (le trigger créera le profil automatiquement)
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // Mettre à jour le profil créé par le trigger avec les infos supplémentaires
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({
      first_name,
      last_name,
      role: role ?? 'client',
    })
    .eq('id', authData.user.id)

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}