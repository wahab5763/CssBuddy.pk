import { useState, useCallback, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { partnerApi, chatWsUrl } from '@/api/partner'
import { apiClient } from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'
import { Users, MessageSquare, Clock, Send, ArrowLeft, MessageCircle } from 'lucide-react'
import type { PartnerUser } from '@/types'
import { cn } from '@/lib/utils'

const TEAL   = '#1D6660'
const ORANGE = '#F97316'

type Tab = 'discover' | 'requests' | 'messages'

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

/* ── Live chat helpers ──────────────────────────────────────── */
interface PChatMessage {
  id: number; connection_id: number; sender_id: number; sender_name: string
  content: string; sent_at: string; is_read: boolean
  _mine?: true   // local-only flag: set on messages I sent this session
}

interface PConn {
  id: number; status: string; created_at: string
  partner: { id: number; name: string; city: string | null; prep_level: string | null; exam_type: string | null; optional_subjects: string[]; shared_subjects: string[] }
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
}
function fmtDate(iso: string) {
  const d = new Date(iso), now = new Date()
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === now.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })
}
function sameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString()
}

function useChatSocket(
  connId: number | null,
  token: string | null,
  onMessage: (msg: PChatMessage) => void,
  onTyping: () => void,
) {
  const wsRef     = useRef<WebSocket | null>(null)
  const retryRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeRef = useRef(true)
  // Refs keep latest callbacks without triggering reconnect
  const msgRef  = useRef(onMessage)
  const typeRef = useRef(onTyping)
  useEffect(() => { msgRef.current  = onMessage })
  useEffect(() => { typeRef.current = onTyping  })

  const connect = useCallback(() => {
    if (!connId || !token || !activeRef.current) return
    const ws = new WebSocket(chatWsUrl(connId, token))
    ws.onopen = () => { if (retryRef.current) { clearTimeout(retryRef.current); retryRef.current = null } }
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'message') msgRef.current(data as PChatMessage)
        if (data.type === 'typing')  typeRef.current()
      } catch {}
    }
    ws.onclose = () => { if (activeRef.current) retryRef.current = setTimeout(connect, 3000) }
    wsRef.current = ws
  }, [connId, token]) // stable — only reconnects when conn/token change

  useEffect(() => {
    activeRef.current = true
    connect()
    return () => {
      activeRef.current = false
      if (retryRef.current) clearTimeout(retryRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  return useCallback((payload: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) { wsRef.current.send(JSON.stringify(payload)); return true }
    return false
  }, [])
}

function PartnerChatPanel({ conn }: { conn: PConn }) {
  // Read userId directly from store — never rely on a potentially stale prop
  const myUser  = useAuthStore((s) => s.user)
  const myId    = myUser?.id ?? 0
  const qc      = useQueryClient()
  const token   = useAuthStore((s) => s.accessToken)
  const [messages, setMessages] = useState<PChatMessage[]>([])
  const [text, setText]         = useState('')
  const [typing, setTyping]     = useState(false)
  const [sending, setSending]   = useState(false)
  const bottomRef   = useRef<HTMLDivElement>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch history once on mount
  useEffect(() => {
    partnerApi.messages(conn.id)
      .then(r => setMessages(r.data as PChatMessage[]))
      .catch(() => {})
    partnerApi.markRead(conn.id).catch(() => {})
  }, [conn.id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // Only receive messages from the OTHER person — skip our own WS echo
  const handleIncoming = useCallback((msg: PChatMessage) => {
    if (Number(msg.sender_id) === myId) return
    setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
    setTyping(false)
    qc.invalidateQueries({ queryKey: ['partner-connections'] })
  }, [myId, qc])

  const handleTyping = useCallback(() => {
    setTyping(true)
    if (typingTimer.current) clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => setTyping(false), 2500)
  }, [])

  const sendWs = useChatSocket(conn.id, token, handleIncoming, handleTyping)

  const send = async () => {
    const content = text.trim()
    if (!content || sending) return
    setSending(true)
    setText('')

    // Add immediately with _mine flag — guaranteed green regardless of any ID issue
    const tempId = -Date.now()
    setMessages(prev => [...prev, {
      id: tempId, connection_id: conn.id, sender_id: myId,
      sender_name: '', content, sent_at: new Date().toISOString(),
      is_read: true, _mine: true,
    }])

    try {
      const res = await partnerApi.sendMessage(conn.id, content)
      const saved = { ...(res.data as PChatMessage), _mine: true as const }
      setMessages(prev => prev.map(m => m.id === tempId ? saved : m))
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId))
    }
    setSending(false)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
    else sendWs({ type: 'typing' })
  }

  const p = conn.partner
  return (
    <div className="flex-1 flex flex-col rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm" style={{ background: 'white' }}>

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-5 py-3.5 shrink-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        {/* Avatar + online dot */}
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
            style={{ background: `linear-gradient(135deg, ${TEAL}, #2D9E95)` }}>
            {p.name[0].toUpperCase()}
          </div>
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-gray-900" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight">{p.name}</p>
          <p className="text-[11px] text-green-500 font-medium mt-0.5">
            Active now{p.city ? ` · ${p.city}` : ''}
          </p>
        </div>

        {p.shared_subjects.length > 0 && (
          <div className="hidden sm:flex gap-1.5 flex-wrap justify-end max-w-[200px]">
            {p.shared_subjects.slice(0, 3).map((s) => (
              <span key={s} className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                style={{ background: TEAL }}>{s}</span>
            ))}
            {p.shared_subjects.length > 3 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">
                +{p.shared_subjects.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
        style={{ background: '#f5f7f6' }}>

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-10">
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: `${TEAL}15` }}>
              <MessageCircle size={28} style={{ color: TEAL }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">No messages yet</p>
              <p className="text-xs text-gray-400 mt-1">Say hello to {p.name.split(' ')[0]}! 👋</p>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isMe        = msg._mine === true || Number(msg.sender_id) === myId
          const prevMsg     = messages[idx - 1]
          const nextMsg     = messages[idx + 1]
          const prevIsSame  = prevMsg && (prevMsg._mine ? isMe : !isMe && Number(prevMsg.sender_id) === Number(msg.sender_id))
          const nextIsSame  = nextMsg && (nextMsg._mine ? isMe : !isMe && Number(nextMsg.sender_id) === Number(msg.sender_id))
          const isLastInGrp = !nextIsSame
          const showDate    = !prevMsg || !sameDay(prevMsg.sent_at, msg.sent_at)
          const showTime    = isLastInGrp
          const showName    = !isMe && !prevIsSame

          return (
            <div key={msg.id}>
              {/* Date separator */}
              {showDate && (
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                  <span className="text-[10px] font-semibold text-gray-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
                    {fmtDate(msg.sent_at)}
                  </span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                </div>
              )}

              <div className={cn('flex items-end gap-2', isMe ? 'flex-row-reverse' : 'flex-row',
                prevIsSame ? 'mt-0.5' : 'mt-3')}>

                {/* Partner avatar — only on last in group */}
                {!isMe && (
                  <div className="shrink-0 w-7 self-end mb-1">
                    {isLastInGrp ? (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ background: `linear-gradient(135deg, ${TEAL}, #2D9E95)` }}>
                        {p.name[0].toUpperCase()}
                      </div>
                    ) : null}
                  </div>
                )}

                <div className={cn('flex flex-col max-w-[68%]', isMe ? 'items-end' : 'items-start')}>
                  {showName && (
                    <p className="text-[10px] font-semibold mb-1 ml-1" style={{ color: TEAL }}>
                      {msg.sender_name || p.name}
                    </p>
                  )}

                  <div className={cn(
                    'px-4 py-2.5 text-sm leading-relaxed shadow-sm',
                    isMe
                      ? cn('text-white', isLastInGrp ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl')
                      : cn('bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700',
                          isLastInGrp ? 'rounded-2xl rounded-bl-sm' : 'rounded-2xl'),
                  )}
                    style={isMe ? { background: `linear-gradient(135deg, #1D6660, #2D9E95)` } : {}}>
                    {msg.content}
                  </div>

                  {showTime && (
                    <p className={cn('text-[10px] text-gray-400 mt-1', isMe ? 'mr-1' : 'ml-1')}>
                      {fmtTime(msg.sent_at)}
                      {isMe && <span className="ml-1 text-teal-400">✓</span>}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Typing indicator */}
        {typing && (
          <div className="flex items-end gap-2 mt-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
              style={{ background: `linear-gradient(135deg, ${TEAL}, #2D9E95)` }}>
              {p.name[0].toUpperCase()}
            </div>
            <div className="flex items-center gap-1.5 px-4 py-3 bg-white dark:bg-gray-800 rounded-2xl rounded-bl-sm border border-gray-100 dark:border-gray-700 shadow-sm">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                  style={{ animationDelay: `${i * 160}ms` }} />
              ))}
            </div>
            <span className="text-[11px] text-gray-400 mb-1">{p.name.split(' ')[0]} is typing…</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input area ── */}
      <div className="shrink-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-4 py-3">
        <div className="flex items-end gap-3 bg-gray-50 dark:bg-gray-800 rounded-2xl px-4 py-2.5 border border-gray-200 dark:border-gray-700 focus-within:border-[#1D6660] focus-within:ring-2 focus-within:ring-[#1D6660]/20 transition-all">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={`Message ${p.name.split(' ')[0]}…`}
            rows={1}
            className="flex-1 bg-transparent resize-none text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none max-h-24 overflow-y-auto"
            style={{ lineHeight: '1.6' }}
          />
          <button onClick={send} disabled={!text.trim() || sending}
            className={cn(
              'shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200',
              text.trim()
                ? 'text-white shadow-sm hover:opacity-90 scale-100'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed',
            )}
            style={text.trim() ? { background: `linear-gradient(135deg, #1D6660, #2D9E95)` } : {}}>
            <Send size={15} />
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-300 dark:text-gray-600 mt-1.5">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}

/* ── Messages Tab ───────────────────────────────────────────── */
function MessagesTab() {
  const [activeId, setActiveId]  = useState<number | null>(null)
  const [showChat, setShowChat]  = useState(false)

  const { data: connections = [] } = useQuery<PConn[]>({
    queryKey: ['partner-connections'],
    queryFn:  () => partnerApi.connections().then((r) => r.data),
    refetchInterval: 30_000,
  })

  const activeConn = connections.find((c) => c.id === activeId) ?? null
  const openChat   = (id: number) => { setActiveId(id); setShowChat(true) }

  return (
    <div className="flex gap-0 h-[600px] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">

      {/* ── Sidebar ── */}
      <aside className={cn(
        'w-full md:w-72 shrink-0 flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900',
        showChat ? 'hidden md:flex' : 'flex',
      )}>
        {/* Gradient header */}
        <div className="px-5 py-4 shrink-0" style={{ background: `linear-gradient(135deg, ${TEAL}, #2D9E95)` }}>
          <p className="text-white font-bold text-base">Study Chats</p>
          <p className="text-white/70 text-xs mt-0.5">
            {connections.length} study partner{connections.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
          {connections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 gap-2">
              <MessageSquare size={28} className="text-gray-300" />
              <p className="text-xs text-gray-400 text-center">Accept a connection request to start chatting</p>
            </div>
          ) : connections.map((c) => {
            const p = c.partner
            const isActive = c.id === activeId
            return (
              <button key={c.id} onClick={() => openChat(c.id)}
                className={cn(
                  'w-full text-left flex items-center gap-3 px-4 py-3.5 transition-all duration-150 relative',
                  isActive
                    ? 'bg-teal-50 dark:bg-teal-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/60',
                )}>
                {/* Active indicator strip */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full" style={{ background: TEAL }} />
                )}

                {/* Avatar + online dot */}
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${TEAL}, #2D9E95)` }}>
                    {p.name[0].toUpperCase()}
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-gray-900" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-semibold truncate', isActive ? 'text-[#1D6660] dark:text-teal-400' : 'text-gray-800 dark:text-gray-100')}>
                    {p.name}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate mt-0.5">
                    {p.shared_subjects.length > 0
                      ? `${p.shared_subjects[0]}${p.shared_subjects.length > 1 ? ` +${p.shared_subjects.length - 1} subjects` : ''}`
                      : p.city ?? 'Study Partner'}
                  </p>
                </div>

                {isActive && (
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: TEAL }} />
                )}
              </button>
            )
          })}
        </div>
      </aside>

      {/* ── Chat area ── */}
      <div className={cn('flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900', showChat ? 'flex' : 'hidden md:flex')}>
        {/* Mobile back */}
        {showChat && (
          <div className="md:hidden px-4 pt-3 pb-0">
            <button onClick={() => setShowChat(false)}
              className="flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: TEAL }}>
              <ArrowLeft size={15} /> All Chats
            </button>
          </div>
        )}

        {activeConn ? (
          <PartnerChatPanel conn={activeConn} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8"
            style={{ background: '#f5f7f6' }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-sm"
              style={{ background: `${TEAL}18` }}>
              <MessageCircle size={36} style={{ color: TEAL }} />
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-700 dark:text-gray-200 text-base">Select a conversation</p>
              <p className="text-sm text-gray-400 mt-1">Choose a study partner from the left to start chatting</p>
            </div>
            <div className="flex gap-2 mt-2">
              {['✨ Real-time chat', '📚 Study together', '💡 Share tips'].map(t => (
                <span key={t} className="text-[11px] px-3 py-1 rounded-full bg-white border border-gray-200 text-gray-500 shadow-sm">{t}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Main page ──────────────────────────────────────────────── */
function StudyPartnerContent() {
  const [tab, setTab] = useState<Tab>('discover')

  const tabs = [
    { id: 'discover' as const, label: 'Discover',  icon: '🔍' },
    { id: 'requests' as const, label: 'Requests',  icon: '📩' },
    { id: 'messages' as const, label: 'Messages',  icon: '💬' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2"><Users size={26} className="text-green-500" /> Study Partner</h1>
        <p className="page-sub">Find aspirants who share your optional subjects and connect with them</p>
      </div>

      <div className="tabs w-fit">
        {tabs.map(({ id, label, icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={tab === id ? 'tab-active' : 'tab'}>
            {icon} {label}
          </button>
        ))}
      </div>

      {tab === 'discover' && <DiscoverTab />}
      {tab === 'requests' && <RequestsTab />}
      {tab === 'messages' && <MessagesTab />}
    </div>
  )
}

export function StudyPartner() {
  return <ProtectedRoute><StudyPartnerContent /></ProtectedRoute>
}
