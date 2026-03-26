import { NextResponse } from 'next/server'
import twilio from 'twilio'
import { createClient } from '@/lib/supabase/server'
import {
  getTwilioVerifyEnvIssue,
  isSupabaseConfigured,
  isTwilioVerifyConfigured,
} from '@/lib/env'
import { normalizePhoneE164 } from '@/lib/phone'

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 })
  }
  if (!isTwilioVerifyConfigured()) {
    return NextResponse.json({ error: 'SMS verification is not configured' }, { status: 503 })
  }
  const envIssue = getTwilioVerifyEnvIssue()
  if (envIssue) {
    return NextResponse.json({ error: envIssue }, { status: 503 })
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { phoneE164?: string; code?: string }
  try {
    body = (await request.json()) as { phoneE164?: string; code?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const to = normalizePhoneE164(body.phoneE164 ?? '')
  const code = body.code?.trim() ?? ''
  if (!to || !code) {
    return NextResponse.json({ error: 'Phone and code are required' }, { status: 400 })
  }

  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)
  let check
  try {
    check = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verificationChecks.create({ to, code })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Verification failed'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  if (check.status !== 'approved') {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      phone_e164: to,
      phone_verified_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'This phone number is already verified on another account' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
