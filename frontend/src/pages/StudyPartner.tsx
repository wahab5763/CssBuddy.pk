import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { partnerApi, chatWsUrl } from '@/api/partner'
import { apiClient } from '@/api/client'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'
import { PageHeader } from '@/components/common/PageHeader'
import { cn } from '@/lib/utils'
import {
  Users, MessageSquare, Send, ArrowLeft, MessageCircle,
  UserPlus, Search, CheckCheck, X, Compass, Inbox,
} from 'lucide-react'

/* ── Colour tokens ─────────────────────────────────────── */
const TEAL  = '#1D6660'
const TEAL2 = '#2D9E95'

/* ── Local types ───────────────────────────────────────── */
type Tab = 'discover' | 'requests' | 'chats'

interface PartnerInfo {
  id: number; name: string; city: string | null
  prep_level: string | null; exam_type: string | null
  optional_subjects: string[]; shared_subjects: string[]; shared_count: number
}
interface Conn { id: number; status: string; created_at: string; partner: PartnerInfo }
interface Msg {
  id: number; connection_id: number; sender_id: number; sender_name: string
  content: string; sent_at: string; is_read: boolean; _mine?: true
}

/* ── Helpers ───────────────────────────────────────────── */
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
}
function fmtDate(iso: string) {
  const d = new Date(iso), now = new Date()
  const yd = new Date(now); yd.setDate(now.getDate() - 1)
  if (d.toDateString() === now.toDateString()) return 'Today'
  if (d.toDateString() === yd.toDateString()) return 'Yesterday'
  return d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })
}
function sameDay(a: string, b: string) { return new Date(a).toDateString() === new Date(b).toDateString() }
function initials(name: string) { return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() }

const GRAD_POOL = [
  'linear-gradient(135deg,#1D6660,#2D9E95)',
  'linear-gradient(135deg,#3730a3,#6366f1)',
  'linear-gradient(135deg,#7c2d12,#f97316)',
  'linear-gradient(135deg,#14532d,#16a34a)',
  'linear-gradient(135deg,#4c1d95,#a855f7)',
  'linear-gradient(135deg,#0c4a6e,#0ea5e9)',
  'linear-gradient(135deg,#713f12,#eab308)',
]
function avatarGrad(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return GRAD_POOL[h % GRAD_POOL.length]
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  const sz = { xs: 'w-6 h-6 text-[9px]', sm: 'w-8 h-8 text-[11px]', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' }
  return (
    <div className={cn('rounded-full flex items-center justify-center text-white font-bold shrink-0', sz[size])}
      style={{ background: avatarGrad(name) }}>
      {initials(name)}
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   WEBSOCKET HOOK
   ════════════════════════════════════════════════════════ */
function useChatSocket(
  connId: number | null, token: string | null,
  onMessage: (m: Msg) => void, onTyping: () => void,
) {
  const wsRef    = useRef<WebSocket | null>(null)
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const alive    = useRef(true)
  const msgCb    = useRef(onMessage); useEffect(() => { msgCb.current  = onMessage })
  const typeCb   = useRef(onTyping);  useEffect(() => { typeCb.current = onTyping  })

  const connect = useCallback(() => {
    if (!connId || !token || !alive.current) return
    const ws = new WebSocket(chatWsUrl(connId, token))
    ws.onopen    = () => { if (retryRef.current) { clearTimeout(retryRef.current); retryRef.current = null } }
    ws.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data)
        if (d.type === 'message') msgCb.current(d as Msg)
        if (d.type === 'typing')  typeCb.current()
      } catch {}
    }
    ws.onclose = () => { if (alive.current) retryRef.current = setTimeout(connect, 3000) }
    wsRef.current = ws
  }, [connId, token])

  useEffect(() => {
    alive.current = true; connect()
    return () => { alive.current = false; if (retryRef.current) clearTimeout(retryRef.current); wsRef.current?.close() }
  }, [connect])

  return useCallback((payload: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) { wsRef.current.send(JSON.stringify(payload)); return true }
    return false
  }, [])
}

/* ════════════════════════════════════════════════════════
   CHAT WINDOW (right panel)
   ════════════════════════════════════════════════════════ */
function ChatWindow({ conn }: { conn: Conn }) {
  const myUser    = useAuthStore(s => s.user)
  const myId      = myUser?.id ?? -1
  const myName    = myUser?.name ?? ''
  const token     = useAuthStore(s => s.accessToken)
  const qc        = useQueryClient()

  const [messages, setMessages] = useState<Msg[]>([])
  const [text, setText]         = useState('')
  const [typing, setTyping]     = useState(false)
  const [sending, setSending]   = useState(false)

  const bottomRef   = useRef<HTMLDivElement>(null)
  const areaRef     = useRef<HTMLTextAreaElement>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load history whenever the conversation changes
  useEffect(() => {
    setMessages([])
    partnerApi.messages(conn.id).then(r => setMessages(r.data as Msg[])).catch(() => {})
    partnerApi.markRead(conn.id).catch(() => {})
  }, [conn.id])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  // Auto-grow textarea
  const growArea = () => {
    const el = areaRef.current; if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  const handleIncoming = useCallback((msg: Msg) => {
    if (Number(msg.sender_id) === myId) return  // skip our own WS echo
    setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
    setTyping(false)
    qc.invalidateQueries({ queryKey: ['partner-connections'] })
    partnerApi.markRead(conn.id).catch(() => {})
  }, [myId, conn.id, qc])

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
    if (areaRef.current) areaRef.current.style.height = 'auto'

    const tempId = -Date.now()
    // Optimistic add — flagged _mine so isMe check is always correct
    setMessages(prev => [...prev, {
      id: tempId, connection_id: conn.id, sender_id: myId,
      sender_name: myName, content, sent_at: new Date().toISOString(),
      is_read: true, _mine: true,
    }])

    try {
      const res = await partnerApi.sendMessage(conn.id, content)
      setMessages(prev => prev.map(m => m.id === tempId ? { ...(res.data as Msg), _mine: true } : m))
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId))
    }
    setSending(false)
    areaRef.current?.focus()
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
    else sendWs({ type: 'typing' })
  }

  const p = conn.partner

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

      {/* ─── Chat header ─── */}
      <div className="flex items-center gap-3 px-5 py-3.5 shrink-0 shadow-sm"
        style={{ background: `linear-gradient(135deg, ${TEAL} 0%, ${TEAL2} 100%)` }}>
        <div className="relative shrink-0">
          <Avatar name={p.name} size="md" />
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm leading-tight">{p.name}</p>
          <p className="text-white/65 text-[11px] mt-0.5">
            {p.city ? `${p.city} · ` : ''}{p.exam_type || 'CSS'} aspirant
          </p>
        </div>
        {p.shared_subjects.length > 0 && (
          <div className="hidden sm:flex flex-wrap gap-1 justify-end max-w-[200px]">
            {p.shared_subjects.slice(0, 3).map(s => (
              <span key={s} className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.18)', color: 'white', border: '1px solid rgba(255,255,255,0.28)' }}>
                {s.split(' ')[0]}
              </span>
            ))}
            {p.shared_subjects.length > 3 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)' }}>
                +{p.shared_subjects.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ─── Messages list ─── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0"
        style={{
          background: '#e8ede8',
          backgroundImage: 'radial-gradient(rgba(29,102,96,0.05) 1px, transparent 1px)',
          backgroundSize: '18px 18px',
        }}>

        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center gap-3 py-16">
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(29,102,96,0.12)' }}>
              <MessageCircle size={28} style={{ color: TEAL }} />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-600 text-sm">Say hello to {p.name.split(' ')[0]}! 👋</p>
              <p className="text-xs text-gray-400 mt-1">You're connected — start the conversation</p>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => {
          // Determine ownership: _mine flag is authoritative; fall back to sender_id compare
          const isMe    = msg._mine === true || Number(msg.sender_id) === myId
          const prev    = messages[idx - 1]
          const next    = messages[idx + 1]
          const prevMe  = prev  ? (prev._mine  === true || Number(prev.sender_id)  === myId) : null
          const nextMe  = next  ? (next._mine  === true || Number(next.sender_id)  === myId) : null
          // "Same sender as previous/next" means same ownership AND same calendar day
          const prevSame = prevMe !== null && prevMe === isMe && sameDay(prev!.sent_at, msg.sent_at)
          const nextSame = nextMe !== null && nextMe === isMe && sameDay(next!.sent_at, msg.sent_at)
          const isFirst  = !prevSame
          const isLast   = !nextSame
          const showDate = !prev || !sameDay(prev.sent_at, msg.sent_at)

          return (
            <div key={msg.id}>
              {/* Date separator */}
              {showDate && (
                <div className="flex items-center justify-center my-4">
                  <span className="text-[11px] font-semibold text-gray-500 bg-white/90 px-4 py-1 rounded-full shadow-xs border border-gray-200">
                    {fmtDate(msg.sent_at)}
                  </span>
                </div>
              )}

              <div className={cn(
                'flex items-end gap-1.5',
                isMe ? 'flex-row-reverse' : 'flex-row',
                isFirst ? 'mt-3' : 'mt-0.5',
              )}>
                {/* Partner avatar — only on last bubble in a group */}
                {!isMe && (
                  <div className="w-7 shrink-0 self-end mb-0.5">
                    {isLast
                      ? <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                          style={{ background: avatarGrad(p.name) }}>
                          {initials(p.name)}
                        </div>
                      : null
                    }
                  </div>
                )}

                <div className={cn('flex flex-col max-w-[68%]', isMe ? 'items-end' : 'items-start')}>
                  {/* Partner name — first bubble only */}
                  {!isMe && isFirst && (
                    <p className="text-[10px] font-bold mb-1 ml-3" style={{ color: TEAL }}>
                      {msg.sender_name || p.name}
                    </p>
                  )}

                  {/* Bubble */}
                  <div
                    className={cn(
                      'px-3.5 py-2 text-sm leading-relaxed break-words shadow-sm',
                      isMe
                        ? cn('text-white',
                            isFirst && isLast  ? 'rounded-2xl rounded-br-[4px]' :
                            isFirst            ? 'rounded-2xl rounded-br-sm' :
                            isLast             ? 'rounded-2xl rounded-br-[4px]' : 'rounded-2xl')
                        : cn('bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100',
                            isFirst && isLast  ? 'rounded-2xl rounded-bl-[4px]' :
                            isFirst            ? 'rounded-2xl rounded-bl-sm' :
                            isLast             ? 'rounded-2xl rounded-bl-[4px]' : 'rounded-2xl'),
                    )}
                    style={isMe ? { background: `linear-gradient(135deg, ${TEAL}, ${TEAL2})` } : {}}
                  >
                    {msg.content}
                  </div>

                  {/* Time + read tick — only on last bubble */}
                  {isLast && (
                    <div className={cn('flex items-center gap-1 mt-0.5', isMe ? 'mr-1' : 'ml-3')}>
                      <span className="text-[10px] text-gray-400">{fmtTime(msg.sent_at)}</span>
                      {isMe && <CheckCheck size={12} className="text-teal-500" />}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Typing indicator */}
        {typing && (
          <div className="flex items-end gap-1.5 mt-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
              style={{ background: avatarGrad(p.name) }}>
              {initials(p.name)}
            </div>
            <div className="flex items-center gap-1.5 px-4 py-3 bg-white dark:bg-gray-800 rounded-2xl rounded-bl-[4px] shadow-sm">
              {[0, 1, 2].map(i => (
                <span key={i} className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                  style={{ animationDelay: `${i * 160}ms` }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ─── Input bar ─── */}
      <div className="shrink-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-4 py-3">
        <div className="flex items-end gap-3">
          <div className={cn(
            'flex-1 flex items-end bg-gray-50 dark:bg-gray-800 rounded-2xl px-4 py-2',
            'border border-gray-200 dark:border-gray-700',
            'focus-within:border-[#1D6660] focus-within:ring-2 focus-within:ring-[#1D6660]/15 transition-all',
          )}>
            <textarea
              ref={areaRef}
              value={text}
              onChange={e => { setText(e.target.value); growArea() }}
              onKeyDown={onKeyDown}
              placeholder={`Message ${p.name.split(' ')[0]}…`}
              rows={1}
              className="flex-1 bg-transparent resize-none text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none py-1"
              style={{ lineHeight: '1.6', maxHeight: '120px', overflowY: 'auto' }}
            />
          </div>
          <button
            onClick={send}
            disabled={!text.trim() || sending}
            className="w-11 h-11 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 disabled:scale-100"
            style={{ background: text.trim() ? `linear-gradient(135deg, ${TEAL}, ${TEAL2})` : '#d1d5db' }}
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-300 dark:text-gray-600 mt-1.5">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   CHATS TAB — WhatsApp-style layout
   ════════════════════════════════════════════════════════ */
function ChatsTab() {
  const [activeId, setActiveId] = useState<number | null>(null)
  const [showChat, setShowChat] = useState(false)
  const [search, setSearch]     = useState('')

  const { data: connections = [], isLoading } = useQuery<Conn[]>({
    queryKey: ['partner-connections'],
    queryFn: () => partnerApi.connections().then(r => r.data),
    refetchInterval: 30_000,
  })

  const filtered   = connections.filter(c => c.partner.name.toLowerCase().includes(search.toLowerCase()))
  const activeConn = connections.find(c => c.id === activeId) ?? null

  const openChat = (id: number) => { setActiveId(id); setShowChat(true) }

  return (
    <div className="flex rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm"
      style={{ height: 'calc(100vh - 270px)', minHeight: '480px' }}>

      {/* ─── Sidebar (contact list) ─── */}
      <aside className={cn(
        'w-full md:w-72 lg:w-80 shrink-0 flex flex-col',
        'border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900',
        showChat ? 'hidden md:flex' : 'flex',
      )}>
        {/* Sidebar header */}
        <div className="px-4 py-3.5 shrink-0"
          style={{ background: `linear-gradient(135deg, ${TEAL}, ${TEAL2})` }}>
          <p className="text-white font-bold">Study Chats</p>
          <p className="text-white/65 text-[11px] mt-0.5">
            {connections.length} partner{connections.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Search */}
        <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search partners…"
              className="w-full pl-8 pr-3 py-2 text-xs bg-gray-100 dark:bg-gray-800 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-[#1D6660]/20 text-gray-700 dark:text-gray-200 placeholder-gray-400"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 space-y-2">
              {[...Array(4)].map((_, i) => <div key={i} className="h-16 skeleton rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 px-4 gap-2">
              <MessageSquare size={24} className="text-gray-300" />
              <p className="text-xs text-gray-400 text-center">
                {search ? 'No match found' : 'Accept a connection request to start chatting'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {filtered.map(c => {
                const p = c.partner
                const isActive = c.id === activeId
                return (
                  <button key={c.id} onClick={() => openChat(c.id)}
                    className={cn(
                      'w-full text-left flex items-center gap-3 px-4 py-3.5 relative transition-all duration-150',
                      isActive ? 'bg-teal-50 dark:bg-teal-950/40' : 'hover:bg-gray-50 dark:hover:bg-gray-800/60',
                    )}>
                    {isActive && (
                      <span className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full"
                        style={{ background: TEAL }} />
                    )}
                    <div className="relative shrink-0">
                      <Avatar name={p.name} />
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-gray-900" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-semibold truncate',
                        isActive ? 'text-[#1D6660] dark:text-teal-400' : 'text-gray-800 dark:text-gray-100')}>
                        {p.name}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">
                        {p.shared_subjects.length > 0
                          ? p.shared_subjects.slice(0, 2).join(' · ') + (p.shared_subjects.length > 2 ? ` +${p.shared_subjects.length - 2}` : '')
                          : (p.city ?? p.exam_type ?? 'Study Partner')}
                      </p>
                    </div>
                    {isActive && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: TEAL }} />}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </aside>

      {/* ─── Chat panel ─── */}
      <div className={cn('flex-1 flex flex-col min-w-0 min-h-0', showChat ? 'flex' : 'hidden md:flex')}>
        {/* Mobile back */}
        {showChat && (
          <div className="md:hidden shrink-0 px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <button onClick={() => setShowChat(false)}
              className="flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: TEAL }}>
              <ArrowLeft size={15} /> All Chats
            </button>
          </div>
        )}

        {activeConn ? (
          <ChatWindow conn={activeConn} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8"
            style={{
              background: '#e8ede8',
              backgroundImage: 'radial-gradient(rgba(29,102,96,0.05) 1px, transparent 1px)',
              backgroundSize: '18px 18px',
            }}>
            <div className="w-24 h-24 rounded-full flex items-center justify-center shadow-sm"
              style={{ background: 'rgba(29,102,96,0.12)' }}>
              <MessageCircle size={40} style={{ color: TEAL }} />
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-700 dark:text-gray-200 text-base">Your study chats</p>
              <p className="text-sm text-gray-400 mt-1 max-w-xs">
                Select a partner from the left to continue your conversation
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {['✨ Real-time messaging', '📚 Study together', '💡 Share tips'].map(t => (
                <span key={t} className="text-[11px] px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-500 shadow-xs">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   DISCOVER TAB
   ════════════════════════════════════════════════════════ */
interface PartnerCardData extends Omit<PartnerInfo, 'shared_count'> { shared_count: number }

function ConnectModal({ user, onClose, onSend }: {
  user: PartnerCardData; onClose: () => void; onSend: (icebreaker: string) => void
}) {
  const [ice, setIce] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm p-5 animate-fade-in"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-4">
          <Avatar name={user.name} size="md" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 dark:text-white">{user.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {[user.city, user.exam_type].filter(Boolean).join(' · ') || 'CSS Aspirant'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
            <X size={15} />
          </button>
        </div>

        {user.shared_subjects.length > 0 && (
          <div className="mb-4 p-3 rounded-xl" style={{ background: 'rgba(29,102,96,0.07)' }}>
            <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: TEAL }}>
              Common Optionals
            </p>
            <div className="flex flex-wrap gap-1">
              {user.shared_subjects.map(s => (
                <span key={s} className="text-[11px] px-2.5 py-0.5 rounded-full text-white font-semibold"
                  style={{ background: TEAL }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
          Icebreaker message <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={ice}
          onChange={e => setIce(e.target.value)}
          placeholder={`Hi ${user.name.split(' ')[0]}, I'm also preparing for CSS with similar optionals — let's study together!`}
          rows={3}
          className="input w-full resize-none text-sm"
        />
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="btn-outline flex-1 text-sm">Cancel</button>
          <button onClick={() => onSend(ice.trim())}
            className="flex-1 py-2 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${TEAL}, ${TEAL2})` }}>
            <UserPlus size={14} /> Send Request
          </button>
        </div>
      </div>
    </div>
  )
}

function PartnerCard({ user, onConnect }: {
  user: PartnerCardData; onConnect: (id: number, ice: string) => void
}) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <div className="card p-5 flex flex-col gap-3.5 hover:shadow-md transition-all duration-200">
        <div className="flex items-start gap-3">
          <Avatar name={user.name} size="md" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{user.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {user.city || 'Location unknown'} · {user.exam_type || 'CSS'}
            </p>
            {user.prep_level && (
              <span className="badge-primary mt-1.5 inline-block text-[10px]">{user.prep_level}</span>
            )}
          </div>
          {user.shared_count > 0 && (
            <div className="text-right shrink-0">
              <span className="text-2xl font-black leading-none" style={{ color: TEAL }}>
                {user.shared_count}
              </span>
              <p className="text-[10px] text-gray-400 leading-tight mt-0.5">shared<br/>subs</p>
            </div>
          )}
        </div>

        {user.shared_subjects.length > 0 && (
          <div className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(29,102,96,0.07)' }}>
            <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: TEAL }}>
              Common Optionals
            </p>
            <div className="flex flex-wrap gap-1">
              {user.shared_subjects.map(s => (
                <span key={s} className="text-[10px] px-2 py-0.5 rounded-full text-white font-semibold"
                  style={{ background: TEAL }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {user.optional_subjects.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">
              Their Optionals
            </p>
            <div className="flex flex-wrap gap-1">
              {user.optional_subjects.slice(0, 5).map(s => (
                <span key={s} className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={user.shared_subjects.includes(s)
                    ? { background: TEAL, color: 'white' }
                    : { background: 'var(--color-gray-100, #f3f4f6)', color: '#6b7280' }}>
                  {s}
                </span>
              ))}
              {user.optional_subjects.length > 5 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400">
                  +{user.optional_subjects.length - 5}
                </span>
              )}
            </div>
          </div>
        )}

        <button onClick={() => setShowModal(true)}
          className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border-2 transition-all duration-150"
          style={{ borderColor: TEAL, color: TEAL }}
          onMouseEnter={e => { e.currentTarget.style.background = TEAL; e.currentTarget.style.color = 'white' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = TEAL }}>
          <UserPlus size={14} /> Connect
        </button>
      </div>

      {showModal && (
        <ConnectModal
          user={user}
          onClose={() => setShowModal(false)}
          onSend={ice => { setShowModal(false); onConnect(user.id, ice) }}
        />
      )}
    </>
  )
}

function DiscoverTab() {
  const qc             = useQueryClient()
  const currentUser    = useAuthStore(s => s.user)
  const [filter, setFilter] = useState('')
  const [page, setPage]     = useState(1)

  const { data: groups = [] } = useQuery<{ subject: string; member_count: number }[]>({
    queryKey: ['partner-groups'],
    queryFn: () => apiClient.get('/api/partner/groups').then(r => r.data),
    staleTime: 5 * 60_000,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['partner-discover', filter, page],
    queryFn: () => apiClient.get('/api/partner/discover', {
      params: { optional_subject: filter || undefined, page, per_page: 12 },
    }).then(r => r.data),
    keepPreviousData: true,
  } as any)

  const items: PartnerCardData[] = (data as any)?.items ?? []
  const totalPages               = (data as any)?.pages ?? 1
  const myOptionals              = currentUser?.optional_subjects ?? []

  const connect = async (id: number, icebreaker: string) => {
    try {
      await partnerApi.sendRequest(id, icebreaker || undefined)
      qc.invalidateQueries({ queryKey: ['partner-discover'] })
    } catch {}
  }

  return (
    <div className="space-y-4">
      {myOptionals.length === 0 && (
        <div className="flex gap-3 p-4 rounded-2xl border"
          style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.3)' }}>
          <span className="text-xl shrink-0">💡</span>
          <p className="text-sm" style={{ color: '#92400e' }}>
            <strong>Add your optional subjects</strong> from the profile menu (top-right) to get matched with aspirants who share the same optionals — they'll appear sorted by most in common.
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1) }}
          className="select w-full sm:max-w-xs">
          <option value="">All optional subjects</option>
          {groups.map(g => (
            <option key={g.subject} value={g.subject}>
              {g.subject} ({g.member_count}){myOptionals.includes(g.subject) ? ' ★' : ''}
            </option>
          ))}
        </select>
        {filter && (
          <button onClick={() => { setFilter(''); setPage(1) }}
            className="btn-ghost btn-sm text-gray-400 gap-1.5">
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-64 skeleton rounded-2xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state py-16">
          <div className="empty-icon"><Compass size={28} /></div>
          <p className="empty-title">No aspirants found</p>
          <p className="empty-sub">
            {filter ? 'Try a different subject or clear the filter' : 'More aspirants are joining daily — check back soon'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(u => <PartnerCard key={u.id} user={u} onConnect={connect} />)}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="btn-outline btn-sm gap-1 disabled:opacity-40">
                <ArrowLeft size={13} /> Prev
              </button>
              <span className="px-3 py-1.5 text-xs font-bold rounded-xl"
                style={{ background: 'rgba(29,102,96,0.10)', color: TEAL }}>
                {page} / {totalPages}
              </span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="btn-outline btn-sm gap-1 disabled:opacity-40">
                Next <ArrowLeft size={13} className="rotate-180" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   REQUESTS TAB
   ════════════════════════════════════════════════════════ */
function RequestsTab() {
  const qc = useQueryClient()

  const { data: incoming = [] } = useQuery({
    queryKey: ['partner-incoming'],
    queryFn: () => partnerApi.incoming().then(r => r.data),
    refetchInterval: 30_000,
  })
  const { data: sent = [] } = useQuery({
    queryKey: ['partner-sent'],
    queryFn: () => partnerApi.sent().then(r => r.data),
    refetchInterval: 60_000,
  })

  const accept = async (id: number) => { await partnerApi.accept(id); qc.invalidateQueries() }
  const reject = async (id: number) => { await partnerApi.reject(id); qc.invalidateQueries() }
  const cancel = async (id: number) => { await partnerApi.cancel(id); qc.invalidateQueries({ queryKey: ['partner-sent'] }) }

  return (
    <div className="space-y-8 max-w-2xl">

      {/* Incoming */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Inbox size={16} className="text-amber-500" />
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">Incoming Requests</h3>
          {(incoming as any[]).length > 0 && (
            <span className="w-5 h-5 rounded-full text-white text-[10px] font-black flex items-center justify-center"
              style={{ background: '#f59e0b' }}>
              {(incoming as any[]).length}
            </span>
          )}
        </div>
        {(incoming as any[]).length === 0 ? (
          <div className="card p-5 text-center text-sm text-gray-400">No pending requests</div>
        ) : (
          <div className="space-y-2">
            {(incoming as any[]).map(r => (
              <div key={r.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <Avatar name={r.requester.name} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 dark:text-white">{r.requester.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {[r.requester.city, r.requester.exam_type].filter(Boolean).join(' · ') || 'CSS Aspirant'}
                    </p>
                    {r.icebreaker && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-2 bg-gray-50 dark:bg-gray-800/60 rounded-xl px-3 py-2">
                        "{r.icebreaker}"
                      </p>
                    )}
                    {r.requester.shared_subjects?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className="text-[10px] text-gray-400 self-center">Shared:</span>
                        {r.requester.shared_subjects.map((s: string) => (
                          <span key={s} className="text-[10px] px-2 py-0.5 rounded-full text-white font-semibold"
                            style={{ background: TEAL }}>{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => accept(r.id)}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold text-white hover:opacity-90 transition-opacity"
                      style={{ background: `linear-gradient(135deg, ${TEAL}, ${TEAL2})` }}>
                      Accept
                    </button>
                    <button onClick={() => reject(r.id)}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 transition-colors">
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sent */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Send size={15} className="text-sky-500" />
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">Sent Requests</h3>
          {(sent as any[]).length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-900/30 text-sky-600">
              {(sent as any[]).length}
            </span>
          )}
        </div>
        {(sent as any[]).length === 0 ? (
          <div className="card p-5 text-center text-sm text-gray-400">No sent requests</div>
        ) : (
          <div className="space-y-2">
            {(sent as any[]).map(r => (
              <div key={r.id} className="card p-4 flex items-center gap-3">
                <Avatar name={r.receiver.name} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{r.receiver.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {[r.receiver.city, r.receiver.exam_type].filter(Boolean).join(' · ') || 'CSS Aspirant'}
                  </p>
                  {r.icebreaker && (
                    <p className="text-xs text-gray-400 italic mt-0.5 truncate">"{r.icebreaker}"</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(245,158,11,0.12)', color: '#b45309' }}>
                    Pending
                  </span>
                  <button onClick={() => cancel(r.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                    title="Cancel request">
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════════════ */
function StudyPartnerContent() {
  const [tab, setTab] = useState<Tab>('discover')

  const { data: incoming = [] } = useQuery({
    queryKey: ['partner-incoming'],
    queryFn: () => partnerApi.incoming().then(r => r.data),
    refetchInterval: 60_000,
  })
  const badge = (incoming as any[]).length

  const TABS: { id: Tab; label: string; emoji: string }[] = [
    { id: 'discover',  label: 'Discover',  emoji: '🔍' },
    { id: 'requests',  label: 'Requests',  emoji: '📩' },
    { id: 'chats',     label: 'Chats',     emoji: '💬' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        icon={<Users size={22} className="text-white" />}
        title="Study Partner"
        subtitle="Find aspirants with matching optionals and chat in real time"
      />

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-2xl w-fit bg-gray-100 dark:bg-gray-800">
        {TABS.map(({ id, label, emoji }) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn(
              'relative flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
              tab === id
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
            )}>
            <span>{emoji}</span> {label}
            {id === 'requests' && badge > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[9px] font-black flex items-center justify-center"
                style={{ background: '#f97316' }}>
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'discover'  && <DiscoverTab />}
      {tab === 'requests'  && <RequestsTab />}
      {tab === 'chats'     && <ChatsTab />}
    </div>
  )
}

export function StudyPartner() {
  return <ProtectedRoute><StudyPartnerContent /></ProtectedRoute>
}
