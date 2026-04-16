import { NextResponse } from 'next/server'
import twilio from 'twilio'
import { getTwilioVerifyEnvIssue, isTwilioVerifyConfigured } from '@/lib/env'
import { normalizePhoneE164 } from '@/lib/phone'

export async function POST(request: Request) {
  if (!isTwilioVerifyConfigured()) {
    return NextResponse.json(
      { error: 'SMS verification is not configured (Twilio Verify env vars).' },
      { status: 503 }
    )
  }
  const envIssue = getTwilioVerifyEnvIssue()
  if (envIssue) {
    return NextResponse.json({ error: envIssue }, { status: 503 })
  }

  let body: { phoneE164?: string }
  try {
    body = (await request.json()) as { phoneE164?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const to = normalizePhoneE164(body.phoneE164 ?? '')
  if (!to.trim()) {
    return NextResponse.json({ error: 'Phone is required' }, { status: 400 })
  }

  const sid = process.env.TWILIO_ACCOUNT_SID!
  const token = process.env.TWILIO_AUTH_TOKEN!
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID!

  const client = twilio(sid, token)
  try {
    await client.verify.v2.services(serviceSid).verifications.create({
      to,
      channel: 'sms',
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to send SMS'
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
