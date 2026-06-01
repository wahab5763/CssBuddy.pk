import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { partnerApi } from '@/api/partner'
import { subjectsApi } from '@/api/subjects'
import { apiClient } from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'
import { Users, MessageSquare, Clock, UserPlus, Send, BookOpen, ChevronLeft } from 'lucide-react'
import type { Connection, Message, PartnerUser } from '@/types'
import { cn } from '@/lib/utils'

type Tab = 'groups' | 'discover' | 'requests' | 'messages'

/* ── Shared helpers ─────────────────────────────────────────── */
function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sz = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg' }
  return (
    <div className={cn('rounded-full bg-gradient-brand flex items-center justify-center text-white font-bold shrink-0', sz[size])}>
      {name[0].toUpperCase()}
    </div>
  )
}

interface PartnerCardData extends PartnerUser {
  shared_subjects: string[]
  shared_count: number
}

function PartnerCard({ user, onConnect }: { user: PartnerCardData; onConnect: (id: number) => void }) {
  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <Avatar name={user.name} />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
          <p className="text-xs text-gray-400">{user.city || 'No city'} · {user.exam_type || 'CSS'}</p>
          {user.prep_level && <span className="badge-primary mt-1 text-[10px]">{user.prep_level}</span>}
        </div>
        {user.shared_count > 0 && (
          <div className="text-right shrink-0">
            <span className="text-lg font-black text-primary">{user.shared_count}</span>
            <p className="text-[10px] text-gray-400 leading-tight">shared<br/>subjects</p>
          </div>
        )}
      </div>

      {/* Shared subjects highlight */}
      {user.shared_subjects.length > 0 && (
        <div className="bg-primary/5 rounded-xl px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-primary/70 mb-1.5">Common Optionals</p>
          <div className="flex flex-wrap gap-1">
            {user.shared_subjects.map((s) => (
              <span key={s} className="badge bg-primary/10 text-primary text-[10px]">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Their optionals */}
      {user.optional_subjects.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">Their Optionals</p>
          <div className="flex flex-wrap gap-1">
            {user.optional_subjects.slice(0, 4).map((s) => (
              <span key={s} className={cn('badge text-[10px]', user.shared_subjects.includes(s) ? 'bg-primary/10 text-primary' : 'badge-gray')}>
                {s}
              </span>
            ))}
            {user.optional_subjects.length > 4 && (
              <span className="badge-gray text-[10px]">+{user.optional_subjects.length - 4}</span>
            )}
          </div>
        </div>
      )}

      <button onClick={() => onConnect(user.id)} className="btn-outline w-full gap-1.5 hover:border-primary hover:text-primary hover:bg-primary/5">
        <UserPlus size={14} /> Connect
      </button>
    </div>
  )
}

/* ── Groups Tab ─────────────────────────────────────────────── */
function GroupsTab({ onBrowseGroup }: { onBrowseGroup: (subject: string) => void }) {
  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['partner-groups'],
    queryFn: () => subjectsApi.groups().then((r) => r.data),
  })

  const user = useAuthStore((s) => s.user)
  const myOptionals: string[] = user?.optional_subjects ?? []
  const countMap = new Map(groups.map((g) => [g.subject, g.member_count]))

  if (myOptionals.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><BookOpen size={28} /></div>
        <p className="empty-title">No optional subjects selected</p>
        <p className="empty-sub">
          Go to your profile (top-right avatar → Edit Profile &amp; Subjects) and choose up to 6 optional subjects to see your groups here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 flex gap-3">
        <BookOpen size={20} className="text-primary shrink-0 mt-0.5" />
        <div className="text-sm text-gray-700 dark:text-gray-200">
          <strong>Your Optional Subject Groups</strong> — Click any group to see aspirants preparing the same optional. The number shows how many students are in that group.
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(myOptionals.length)].map((_, i) => <div key={i} className="h-24 skeleton" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {myOptionals.map((subject) => {
            const count = countMap.get(subject) ?? 0
            return (
              <button key={subject} onClick={() => onBrowseGroup(subject)}
                className="card-interactive text-left p-5 border-2 border-primary/20 hover:border-primary hover:shadow-glow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-snug">{subject}</p>
                    <span className="badge-primary mt-2 text-[10px]">Your optional</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-2xl font-black text-primary">{count}</span>
                    <p className="text-[10px] text-gray-400 leading-tight mt-0.5">
                      {count === 1 ? 'aspirant' : 'aspirants'}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── Group Members view ─────────────────────────────────────── */
function GroupMembersView({ subject, onBack }: { subject: string; onBack: () => void }) {
  const qc = useQueryClient()
  const { data } = useQuery({
    queryKey: ['group-members', subject],
    queryFn: () => subjectsApi.groupMembers(subject).then((r) => r.data),
  })

  const connect = async (id: number) => {
    await partnerApi.sendRequest(id)
    qc.invalidateQueries({ queryKey: ['group-members', subject] })
    qc.invalidateQueries({ queryKey: ['partner-discover'] })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="btn-ghost btn-sm gap-1"><ChevronLeft size={15} /> Groups</button>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">{subject}</h3>
          <p className="text-xs text-gray-400">{data?.total ?? 0} aspirants in this group</p>
        </div>
      </div>

      {(data?.items ?? []).length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Users size={28} /></div>
          <p className="empty-title">No members yet</p>
          <p className="empty-sub">You can be the first in this group!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data?.items ?? []).map((u: PartnerCardData) => <PartnerCard key={u.id} user={u} onConnect={connect} />)}
        </div>
      )}
    </div>
  )
}

/* ── Discover Tab ───────────────────────────────────────────── */
function DiscoverTab() {
  const qc = useQueryClient()
  const [filterSubject, setFilterSubject] = useState('')
  const [page, setPage] = useState(1)
  const user = useAuthStore((s) => s.user)

  const { data: subjectList } = useQuery({
    queryKey: ['all-subjects'],
    queryFn: () => subjectsApi.all().then((r) => r.data),
    staleTime: Infinity,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['partner-discover', filterSubject, page],
    queryFn: () => partnerApi.discover(page).then((r) => r.data),
    // Note: filter is server-side param — include it:
    // We pass it as a query param separately:
  })

  // Actually let's fetch with filter:
  const { data: filteredData, isLoading: filteredLoading } = useQuery({
    queryKey: ['partner-discover-filtered', filterSubject, page],
    queryFn: async () => {
      const res = await apiClient.get('/api/partner/discover', {
        params: { optional_subject: filterSubject || undefined, page, per_page: 12 },
      })
      return res.data
    },
  })

  const display = filteredData ?? data
  const loading = filteredLoading && isLoading

  const connect = async (id: number) => {
    await partnerApi.sendRequest(id)
    qc.invalidateQueries({ queryKey: ['partner-discover-filtered'] })
  }

  const myOptionals = user?.optional_subjects ?? []

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <select value={filterSubject} onChange={(e) => { setFilterSubject(e.target.value); setPage(1) }} className="select w-full">
            <option value="">All subjects</option>
            {(subjectList?.optional ?? []).map((s) => (
              <option key={s} value={s}>{s}{myOptionals.includes(s) ? ' ★' : ''}</option>
            ))}
          </select>
        </div>
        {filterSubject && (
          <button onClick={() => setFilterSubject('')} className="btn-ghost btn-sm text-gray-400">
            Clear filter
          </button>
        )}
      </div>

      {myOptionals.length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 flex gap-3">
          <span className="text-yellow-500 text-lg shrink-0">💡</span>
          <div className="text-sm text-yellow-700 dark:text-yellow-300">
            <strong>Tip:</strong> Add your optional subjects from the profile menu (top-right) to get matched with aspirants who share the same optionals. They'll appear sorted by most shared subjects.
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-52 skeleton" />)}
        </div>
      ) : (display?.items ?? []).length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Users size={28} /></div>
          <p className="empty-title">No aspirants found</p>
          <p className="empty-sub">{filterSubject ? 'No one has selected this subject yet' : 'Check back as more aspirants join'}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(display?.items ?? []).map((u: PartnerCardData) => <PartnerCard key={u.id} user={u} onConnect={connect} />)}
          </div>
          {display?.pages > 1 && (
            <div className="flex justify-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-outline btn-sm disabled:opacity-40">Prev</button>
              <span className="px-3 py-1.5 text-sm font-medium bg-primary/10 text-primary rounded-xl">Page {page}/{display.pages}</span>
              <button onClick={() => setPage((p) => Math.min(display.pages, p + 1))} disabled={page === display.pages} className="btn-outline btn-sm disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ── Requests Tab ───────────────────────────────────────────── */
function RequestsTab() {
  const qc = useQueryClient()
  const { data: incoming = [] } = useQuery({ queryKey: ['partner-incoming'], queryFn: () => partnerApi.incoming().then((r) => r.data) })
  const { data: sent = [] } = useQuery({ queryKey: ['partner-sent'], queryFn: () => partnerApi.sent().then((r) => r.data) })

  const accept = async (id: number) => { await partnerApi.accept(id); qc.invalidateQueries() }
  const reject = async (id: number) => { await partnerApi.reject(id); qc.invalidateQueries() }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="section-title"><Clock size={18} className="text-yellow-500" /> Incoming ({incoming.length})</h3>
        {incoming.length === 0 ? (
          <div className="card p-4 text-center text-sm text-gray-400">No pending requests</div>
        ) : incoming.map((r: { id: number; requester: PartnerCardData; icebreaker: string }) => (
          <div key={r.id} className="card p-4 mb-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar name={r.requester.name} size="sm" />
                <div>
                  <p className="font-semibold text-sm">{r.requester.name}</p>
                  <p className="text-xs text-gray-400">{r.requester.city} · {r.requester.exam_type}</p>
                  {r.icebreaker && <p className="text-xs text-gray-400 italic mt-0.5">"{r.icebreaker}"</p>}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => accept(r.id)} className="btn-sm bg-green-500 hover:bg-green-600 text-white rounded-xl px-3 gap-1">✓ Accept</button>
                <button onClick={() => reject(r.id)} className="btn-danger btn-sm gap-1">✕</button>
              </div>
            </div>
            {r.requester.shared_subjects?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {r.requester.shared_subjects.map((s) => <span key={s} className="badge-primary text-[10px]">{s}</span>)}
              </div>
            )}
          </div>
        ))}
      </div>

      <div>
        <h3 className="section-title"><Send size={18} className="text-blue-500" /> Sent ({sent.length})</h3>
        {sent.length === 0 ? (
          <div className="card p-4 text-center text-sm text-gray-400">No sent requests</div>
        ) : sent.map((r: { id: number; receiver: PartnerCardData }) => (
          <div key={r.id} className="card flex items-center justify-between p-4 mb-2">
            <div className="flex items-center gap-3">
              <Avatar name={r.receiver.name} size="sm" />
              <div>
                <p className="font-semibold text-sm">{r.receiver.name}</p>
                <p className="text-xs text-gray-400">{r.receiver.city}</p>
              </div>
            </div>
            <span className="badge-yellow">Pending</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Messages Tab ───────────────────────────────────────────── */
function MessagesTab() {
  const user = useAuthStore((s) => s.user)
  const [activeConn, setActiveConn] = useState<number | null>(null)
  const [text, setText] = useState('')
  const qc = useQueryClient()

  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ['partner-connections'],
    queryFn: () => partnerApi.connections().then((r) => r.data),
  })
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['partner-messages', activeConn],
    queryFn: () => partnerApi.messages(activeConn!).then((r) => r.data),
    enabled: !!activeConn,
    refetchInterval: 10000,
  })

  const send = async () => {
    if (!text.trim() || !activeConn) return
    await partnerApi.sendMessage(activeConn, text)
    setText('')
    qc.invalidateQueries({ queryKey: ['partner-messages', activeConn] })
  }

  const activePartner = connections.find((c) => c.id === activeConn)?.partner

  return (
    <div className="flex gap-4 h-[520px]">
      {/* Sidebar */}
      <div className="w-56 shrink-0 card p-2 overflow-y-auto">
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 px-2 py-1 mb-1">Connections ({connections.length})</p>
        {connections.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6 px-2">Accept a request to start messaging</p>
        ) : connections.map((c) => {
          const shared = (c.partner as PartnerCardData).shared_subjects ?? []
          return (
            <button key={c.id} onClick={() => setActiveConn(c.id)}
              className={cn('w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition-colors', activeConn === c.id ? 'bg-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800')}>
              <Avatar name={c.partner.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{c.partner.name}</p>
                {shared.length > 0 && (
                  <p className={cn('text-[10px] truncate', activeConn === c.id ? 'text-white/70' : 'text-primary')}>{shared[0]}{shared.length > 1 ? ` +${shared.length - 1}` : ''}</p>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Chat */}
      {activeConn ? (
        <div className="flex-1 card flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
            {activePartner && <Avatar name={activePartner.name} size="sm" />}
            <div className="flex-1">
              <p className="font-semibold text-sm">{activePartner?.name}</p>
              <p className="text-xs text-green-500">Connected</p>
            </div>
            {/* Shared subjects in header */}
            {activePartner && (activePartner as PartnerCardData).shared_subjects?.length > 0 && (
              <div className="hidden sm:flex gap-1 flex-wrap justify-end max-w-[180px]">
                {(activePartner as PartnerCardData).shared_subjects.map((s) => (
                  <span key={s} className="badge-primary text-[10px]">{s}</span>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-gray-400 text-center px-4">No messages yet. Say hello! 👋</p>
              </div>
            )}
            {messages.map((m: Message) => {
              const isMe = m.sender_id === user?.id
              return (
                <div key={m.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                  <div className={cn('max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed', isMe ? 'bg-gradient-brand text-white rounded-tr-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-sm')}>
                    {m.content}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex gap-2 p-3 border-t border-gray-100 dark:border-gray-800 shrink-0">
            <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Type a message…" className="input flex-1" />
            <button onClick={send} disabled={!text.trim()} className="btn-primary px-4 disabled:opacity-40">
              <Send size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 card flex items-center justify-center">
          <div className="empty-state py-8">
            <div className="empty-icon"><MessageSquare size={28} /></div>
            <p className="empty-title">No chat selected</p>
            <p className="empty-sub">Pick a connection from the left to start chatting</p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Main page ──────────────────────────────────────────────── */
function StudyPartnerContent() {
  const [tab, setTab] = useState<Tab>('groups')
  const [browsingGroup, setBrowsingGroup] = useState<string | null>(null)

  const tabs = [
    { id: 'groups' as const,   label: 'Groups',   icon: '📚' },
    { id: 'discover' as const, label: 'Discover',  icon: '🔍' },
    { id: 'requests' as const, label: 'Requests',  icon: '📩' },
    { id: 'messages' as const, label: 'Messages',  icon: '💬' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2"><Users size={26} className="text-green-500" /> Study Partner</h1>
        <p className="page-sub">Find aspirants who share your optional subjects and study together</p>
      </div>

      <div className="tabs w-fit flex-wrap">
        {tabs.map(({ id, label, icon }) => (
          <button key={id} onClick={() => { setTab(id); setBrowsingGroup(null) }}
            className={tab === id ? 'tab-active' : 'tab'}>
            {icon} {label}
          </button>
        ))}
      </div>

      {tab === 'groups' && !browsingGroup && <GroupsTab onBrowseGroup={setBrowsingGroup} />}
      {tab === 'groups' && browsingGroup && <GroupMembersView subject={browsingGroup} onBack={() => setBrowsingGroup(null)} />}
      {tab === 'discover' && <DiscoverTab />}
      {tab === 'requests' && <RequestsTab />}
      {tab === 'messages' && <MessagesTab />}
    </div>
  )
}

export function StudyPartner() {
  return <ProtectedRoute><StudyPartnerContent /></ProtectedRoute>
}
