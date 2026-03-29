import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100

export async function GET(request: Request) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response

  const { searchParams } = new URL(request.url)
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number(searchParams.get('limit') ?? DEFAULT_LIMIT) || DEFAULT_LIMIT)
  )
  const offset = Math.max(0, Number(searchParams.get('offset') ?? 0) || 0)
  const q = (searchParams.get('q') ?? '').trim()

  const { admin } = gate.ctx

  let query = admin
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (q) {
    const uuidRe =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (uuidRe.test(q)) {
      query = query.eq('id', q)
    } else {
      const safe = q.replace(/[%_]/g, '').slice(0, 80)
      if (safe) {
        query = query.ilike('display_name', `%${safe}%`)
      }
    }
  }

  const { data: profiles, error, count } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = profiles ?? []
  const emails: Record<string, string | null> = {}
  await Promise.all(
    rows.map(async (p) => {
      const { data, error: e } = await admin.auth.admin.getUserById(p.id)
      if (!e && data?.user) {
        emails[p.id] = data.user.email ?? null
      } else {
        emails[p.id] = null
      }
    })
  )

  const users = rows.map((p) => ({
    id: p.id,
    displayName: p.display_name,
    phoneE164: p.phone_e164,
    phoneVerifiedAt: p.phone_verified_at,
    role: p.role,
    createdAt: p.created_at,
    listingCreationBlockedUntil: p.listing_creation_blocked_until ?? null,
    listingCreationBlockReason: p.listing_creation_block_reason ?? null,
    email: emails[p.id] ?? null,
  }))

  return NextResponse.json({ users, total: count ?? users.length })
}
