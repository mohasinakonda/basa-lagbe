'use client'

import Link from 'next/link'
import React, { useCallback, useEffect, useState } from 'react'

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            setActiveQuery(searchInput)
          }}
        >
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-(--foreground)/65">Search name or user id</span>
            <input
              name="q"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="rounded border border-(--foreground)/20 bg-transparent px-2 py-1.5 text-sm"
            />
          </label>
          <button
            type="submit"
            className="rounded bg-foreground px-3 py-1.5 text-sm text-background hover:opacity-90"
          >
            Search
          </button>
        </form>
        <p className="text-sm text-(--foreground)/60">
          {total} user{total !== 1 ? 's' : ''}
        </p>
      </div>

      {loading && <p className="text-sm text-(--foreground)/70">Loading…</p>}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}{' '}
          <button type="button" className="underline" onClick={() => void fetchUsers(0, false)}>
            Retry
          </button>
        </p>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto rounded border border-(--foreground)/15">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-(--foreground)/15 bg-(--foreground)/[0.04]">
                <th className="p-2 font-medium">Email</th>
                <th className="p-2 font-medium">Name</th>
                <th className="p-2 font-medium">Role</th>
                <th className="p-2 font-medium">Listing block</th>
                <th className="p-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-(--foreground)/10 align-top">
                  <td className="p-2">
                    <span className="break-all">{u.email ?? '—'}</span>
                    <div className="mt-0.5 font-mono text-[10px] text-(--foreground)/45">{u.id}</div>
                  </td>
                  <td className="p-2">{u.displayName ?? '—'}</td>
                  <td className="p-2">
                    <select
                      value={u.role}
                      onChange={(e) => onRoleChange(u.id, e.target.value)}
                      className="max-w-[120px] rounded border border-(--foreground)/20 bg-transparent px-1 py-1 text-xs"
                    >
                      <option value="user">user</option>
                      <option value="landlord">landlord</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="p-2 text-xs text-(--foreground)/75">
                    {u.listingCreationBlockedUntil ? (
                      <>
                        Until {new Date(u.listingCreationBlockedUntil).toLocaleString()}
                        {u.listingCreationBlockReason && (
                          <div className="mt-1 text-(--foreground)/55">{u.listingCreationBlockReason}</div>
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
                    <form onSubmit={onSubmitBlock} className="mt-2 space-y-1 border-t border-(--foreground)/10 pt-2">
                      <input type="hidden" name="userId" value={u.id} />
                      <input
                        type="datetime-local"
                        name="until"
                        className="w-full max-w-[200px] rounded border border-(--foreground)/20 bg-transparent px-1 py-1 text-xs"
                      />
                      <input
                        name="reason"
                        placeholder="Reason (optional)"
                        className="w-full max-w-[200px] rounded border border-(--foreground)/20 bg-transparent px-1 py-1 text-xs"
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

      {!loading && !error && users.length === 0 && <p className="text-sm text-(--foreground)/65">No users.</p>}

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
