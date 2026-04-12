'use client'

import { SearchIcon } from 'lucide-react'
import Link from 'next/link'
import React, { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react'
import { DayPicker } from 'react-day-picker'

import 'react-day-picker/style.css'

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

function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function toIsoFromDateAndTime(date: Date, timeHHMM: string): string {
  const parts = timeHHMM.split(':').map((x) => parseInt(x, 10))
  const h = Number.isFinite(parts[0]) ? parts[0] : 23
  const m = Number.isFinite(parts[1]) ? parts[1] : 59
  const d = new Date(date)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [total, setTotal] = useState(0)
  const [nextOffset, setNextOffset] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [timeoutFn, setTimeoutFn] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [activeQuery, setActiveQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const limit = 30

  const blockDialogRef = useRef<HTMLDialogElement>(null)
  const [blockUser, setBlockUser] = useState<AdminUserRow | null>(null)
  const [blockSelectedDate, setBlockSelectedDate] = useState<Date | undefined>(undefined)
  const [blockTime, setBlockTime] = useState('23:59')
  const [blockReason, setBlockReason] = useState('')

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

  useEffect(() => {
    const el = blockDialogRef.current
    if (!el) return
    if (blockUser) {
      if (!el.open) el.showModal()
    } else if (el.open) {
      el.close()
    }
  }, [blockUser])

  useEffect(() => {
    const el = blockDialogRef.current
    if (!el) return
    const onCancel = (e: Event) => {
      e.preventDefault()
      setBlockUser(null)
    }
    el.addEventListener('cancel', onCancel)
    return () => el.removeEventListener('cancel', onCancel)
  }, [])

  const patchUser = async (id: string, body: Record<string, unknown>): Promise<boolean> => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string }
      alert(j.error ?? res.statusText)
      return false
    }
    await fetchUsers(0, false)
    return true
  }

  const onClearBlock = (id: string) => {
    void patchUser(id, {
      listingCreationBlockedUntil: null,
      listingCreationBlockReason: null,
    })
  }

  const openBlockModal = (u: AdminUserRow) => {
    setBlockSelectedDate(undefined)
    setBlockTime('23:59')
    setBlockReason('')
    setBlockUser(u)
  }

  const onSubmitBlockModal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!blockUser || !blockSelectedDate) {
      alert('Please select a date.')
      return
    }
    const iso = toIsoFromDateAndTime(blockSelectedDate, blockTime)
    const ok = await patchUser(blockUser.id, {
      listingCreationBlockedUntil: iso,
      listingCreationBlockReason: blockReason.trim() || null,
    })
    if (ok) setBlockUser(null)
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
      <dialog
        ref={blockDialogRef}
        className="fixed inset-x-4 top-1/2 z-50 m-0 max-h-[90vh] w-[calc(100%-2rem)] max-w-md -translate-y-1/2 rounded-2xl border border-border bg-surface p-0 shadow-dialog backdrop:bg-black/45 backdrop:backdrop-blur-sm mx-auto"
        onClose={() => setBlockUser(null)}
      >
        {blockUser && (
          <form onSubmit={onSubmitBlockModal} className="flex max-h-[90vh] flex-col">
            <div className="border-b border-border px-4 py-3.5">
              <h2 className="text-base font-semibold text-foreground">Block new listings</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                <span className="break-all">{blockUser.email ?? blockUser.id}</span>
              </p>
            </div>
            <div className="overflow-y-auto px-4 py-4">
              <p className="mb-3 text-lg text-foreground">Block until</p>
              <div className="flex justify-center ">
                <DayPicker
                  mode="single"

                  selected={blockSelectedDate}
                  onSelect={setBlockSelectedDate}
                  disabled={{ before: startOfToday() }}
                  className="admin-block-day-picker"
                  classNames={{

                    today: 'font-semibold',
                    day: ' text-primary-foreground',
                    weekday: ' text-primary-foreground',
                    month_caption: ' text-primary-foreground mb-5',
                    chevron: 'fill-white',

                  }}
                />
              </div>

              <label className="mt-4 block text-sm font-medium text-foreground">
                Reason <span className="font-normal text-muted-foreground">(optional)</span>
                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  rows={3}
                  placeholder="Reason shown to moderators…"
                  className="mt-1.5 block w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground shadow-sm transition-colors focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
            </div>
            <div className="flex flex-col gap-2 border-t border-border px-4 py-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                onClick={() => setBlockUser(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-105"
              >
                Confirm block
              </button>
            </div>
          </form>
        )}
      </dialog>

      <div className="flex flex-wrap items-center gap-3">
        <form className="flex flex-wrap items-end gap-2">
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
              {users.map((user) => (
                <tr key={user.id} className="border-b border-border align-top">
                  <td className="p-2">
                    <span className="break-all">{user.email ?? '—'}</span>
                    <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">{user.id}</div>
                  </td>
                  <td className="p-2">{user.displayName ?? '—'}</td>
                  <td className="p-2">
                    <select
                      value={user.role}
                      onChange={(e) => onRoleChange(user.id, e.target.value)}
                      className="max-w-[120px] rounded border border-border bg-transparent px-1 py-1 text-xs"
                    >
                      <option value="user">user</option>
                      <option value="landlord">landlord</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="p-2 text-xs text-muted-foreground">
                    {user.listingCreationBlockedUntil ? (
                      <>
                        Until {new Date(user.listingCreationBlockedUntil).toLocaleString()}
                        {user.listingCreationBlockReason && (
                          <div className="mt-1 text-muted-foreground">{user.listingCreationBlockReason}</div>
                        )}
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="p-2 space-y-2">
                    <Link
                      href={`/admin/users/${user.id}/listings`}
                      className="mr-2 inline-block text-xs underline"
                    >
                      Listings
                    </Link>
                    {user.listingCreationBlockedUntil && (
                      <button
                        type="button"
                        className="text-xs underline"
                        onClick={() => onClearBlock(user.id)}
                      >
                        Clear block
                      </button>
                    )}

                    {!user.listingCreationBlockedUntil && <button
                      type="button"
                      className="text-xs font-medium text-primary underline decoration-primary/40 underline-offset-2 transition hover:text-primary hover:decoration-primary"
                      onClick={() => openBlockModal(user)}
                    >
                      Block this user
                    </button>}

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
