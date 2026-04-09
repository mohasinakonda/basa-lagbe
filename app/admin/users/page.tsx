'use client'

import { SearchIcon } from 'lucide-react'
import Link from 'next/link'
import React, { ChangeEvent, useCallback, useEffect, useState } from 'react'

type AdminUserRow = {
  id: string
  displayName: string | null
  email: string | null
  phoneE164: string | null
  role: string
  createdAt: string
  listingCreationBlockedUntil: string | null
  listingCreationBlockReason: string | null
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [total, setTotal] = useState(0)
  const [nextOffset, setNextOffset] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [timeoutFn, setTimeoutFn] = useState<NodeJS.Timeout | null>(null)
  const [activeQuery, setActiveQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const limit = 30

  const fetchUsers = useCallback(
    async (fromOffset: number, append: boolean) => {
      if (!append) {
        setLoading(true)
        setError(null)
      }
      try {
        const params = new URLSearchParams({ limit: String(limit), offset: String(fromOffset) })
        if (activeQuery.trim()) params.set('q', activeQuery.trim())
        const res = await fetch(`/api/admin/users?${params}`, { credentials: 'include' })
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string }
          setError(j.error ?? res.statusText)
          if (!append) setUsers([])
          return
        }
        const j = (await res.json()) as { users: AdminUserRow[]; total: number }
        const batch = j.users ?? []
        setTotal(j.total ?? 0)
        if (append) {
          setUsers((prev) => [...prev, ...batch])
        } else {
          setUsers(batch)
        }
        setNextOffset(fromOffset + batch.length)
      } finally {
        if (!append) setLoading(false)
      }
    },
    [activeQuery, limit]
  )

  useEffect(() => {
    void fetchUsers(0, false)
  }, [activeQuery, fetchUsers])

  const patchUser = async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string }
      alert(j.error ?? res.statusText)
      return
    }
    await fetchUsers(0, false)
  }

  const onClearBlock = (id: string) => {
    void patchUser(id, {
      listingCreationBlockedUntil: null,
      listingCreationBlockReason: null,
    })
  }

  const onSubmitBlock = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const id = fd.get('userId') as string
    const until = fd.get('until') as string
    const reason = (fd.get('reason') as string) || null
    if (!until) return
    const iso = new Date(until).toISOString()
    void patchUser(id, {
      listingCreationBlockedUntil: iso,
      listingCreationBlockReason: reason,
    })
    e.currentTarget.reset()
  }

  const onRoleChange = (id: string, role: string) => {
    if (!confirm(`Set role to ${role}?`)) return
    void patchUser(id, { role })
  }
  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setSearchInput(value)
    if (timeoutFn) {
      clearTimeout(timeoutFn)
    }
    const newTimeoutFn = setTimeout(() => {
      setActiveQuery(value)
    }, 800)
    setTimeoutFn(newTimeoutFn)
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <form
          className="flex flex-wrap items-end gap-2"

        >
          <div className="relative min-w-0 flex-1">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input

              type="search"
              placeholder="Search User"
              value={searchInput}
              onChange={handleSearch}
              className="h-10 w-full min-w-0 rounded-full border border-border bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground shadow-sm transition-shadow focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring"
              autoComplete="off"
            />
          </div>

        </form>
        <p className="text-sm text-muted-foreground">
          {total} user{total !== 1 ? 's' : ''}
        </p>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}{' '}
          <button type="button" className="underline" onClick={() => void fetchUsers(0, false)}>
            Retry
          </button>
        </p>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto rounded border border-border">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="p-2 font-medium">Email</th>
                <th className="p-2 font-medium">Name</th>
                <th className="p-2 font-medium">Role</th>
                <th className="p-2 font-medium">Listing block</th>
                <th className="p-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border align-top">
                  <td className="p-2">
                    <span className="break-all">{u.email ?? '—'}</span>
                    <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">{u.id}</div>
                  </td>
                  <td className="p-2">{u.displayName ?? '—'}</td>
                  <td className="p-2">
                    <select
                      value={u.role}
                      onChange={(e) => onRoleChange(u.id, e.target.value)}
                      className="max-w-[120px] rounded border border-border bg-transparent px-1 py-1 text-xs"
                    >
                      <option value="user">user</option>
                      <option value="landlord">landlord</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="p-2 text-xs text-muted-foreground">
                    {u.listingCreationBlockedUntil ? (
                      <>
                        Until {new Date(u.listingCreationBlockedUntil).toLocaleString()}
                        {u.listingCreationBlockReason && (
                          <div className="mt-1 text-muted-foreground">{u.listingCreationBlockReason}</div>
                        )}
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="p-2 space-y-2">
                    <Link
                      href={`/admin/users/${u.id}/listings`}
                      className="mr-2 inline-block text-xs underline"
                    >
                      Listings
                    </Link>
                    {u.listingCreationBlockedUntil && (
                      <button
                        type="button"
                        className="text-xs underline"
                        onClick={() => onClearBlock(u.id)}
                      >
                        Clear block
                      </button>
                    )}
                    <form onSubmit={onSubmitBlock} className="mt-2 space-y-1 border-t border-border pt-2">
                      <input type="hidden" name="userId" value={u.id} />
                      <input
                        type="datetime-local"
                        name="until"
                        className="w-full max-w-[200px] rounded border border-border bg-transparent px-1 py-1 text-xs"
                      />
                      <input
                        name="reason"
                        placeholder="Reason (optional)"
                        className="w-full max-w-[200px] rounded border border-border bg-transparent px-1 py-1 text-xs"
                      />
                      <button type="submit" className="block text-xs underline">
                        Block new listings
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && users.length === 0 && <p className="text-sm text-muted-foreground">No users.</p>}

      {!loading && !error && total > nextOffset && (
        <button
          type="button"
          className="text-sm underline"
          onClick={() => void fetchUsers(nextOffset, true)}
        >
          Load more
        </button>
      )}
    </div>
  )
}
