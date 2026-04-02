import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/env'

export async function GET() {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY?.trim()
  const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY?.trim()
  if (!privateKey || !publicKey) {
    return NextResponse.json({ error: 'ImageKit is not configured' }, { status: 503 })
  }

  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const token = crypto.randomBytes(16).toString('hex')
  const expire = Math.floor(Date.now() / 1000) + 2400
  const signature = crypto.createHmac('sha1', privateKey).update(token + expire).digest('hex')

  const folder = process.env.IMAGEKIT_UPLOAD_FOLDER?.trim()
  return NextResponse.json({
    token,
    expire,
    signature,
    publicKey,
    ...(folder ? { folder } : {}),
  })
}
