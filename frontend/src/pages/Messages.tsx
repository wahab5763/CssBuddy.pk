import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Send, MessageCircle, Users, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { partnerApi, chatWsUrl } from '@/api/partner'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'
import { cn } from '@/lib/utils'

/* ── Colour tokens ────────────────────────────────────────────── */
const TEAL   = '#1D6660'
const ORANGE = '#F97316'

/* ── Types ────────────────────────────────────────────────────── */
interface ChatMessage {
  id: number
  connection_id: number
  sender_id: number
  sender_name: string
  content: string
  sent_at: string
  is_read: boolean
}

interface Partner {
  id: number; name: string; city: string | null
  prep_level: string | null; exam_type: string | null
  optional_subjects: string[]; shared_subjects: string[]
}

interface Connection {
  id: number; status: string; partner: Partner; created_at: string
}

/* ── Helpers ──────────────────────────────────────────────────── */
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sz = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' }
  return (
    <div className={cn('rounded-full flex items-center justify-center text-white font-bold shrink-0', sz[size])}
      style={{ background: `linear-gradient(135deg, ${TEAL}, #2D9E95)` }}>
      {name[0].toUpperCase()}
    </div>
  )
}

/* ── Real-time chat hook ──────────────────────────────────────── */
function useChat(
  connId: number | null,
  token: string | null,
  onMessage: (msg: ChatMessage) => void,
  onTyping: () => void,
) {
  const wsRef = useRef<WebSocket | null>(null)
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeRef = useRef(true)

  const connect = useCallback(() => {
    if (!connId || !token || !activeRef.current) return
    const ws = new WebSocket(chatWsUrl(connId, token))
    ws.onopen = () => { if (retryRef.current) { clearTimeout(retryRef.current); retryRef.current = null } }
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'message') onMessage(data as ChatMessage)
        if (data.type === 'typing') onTyping()
      } catch {}
    }
    ws.onclose = () => {
      if (activeRef.current) retryRef.current = setTimeout(connect, 3000)
    }
    wsRef.current = ws
  }, [connId, token, onMessage, onTyping])

  useEffect(() => {
    activeRef.current = true
    connect()
    return () => {
      activeRef.current = false
      if (retryRef.current) clearTimeout(retryRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  const sendWs = useCallback((payload: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload))
      return true
    }
    return false
  }, [])

  return { sendWs }
}

/* ── Chat panel (right side) ──────────────────────────────────── */
function ChatPanel({ conn, userId }: { conn: Connection; userId: number }) {
  const qc = useQueryClient()
  const token = useAuthStore((s) => s.accessToken)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [typing, setTyping] = useState(false)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* Fetch history */
  const { data: history = [] } = useQuery<ChatMessage[]>({
    queryKey: ['chat-messages', conn.id],
    queryFn: () => partnerApi.messages(conn.id).then((r) => r.data),
  })

  useEffect(() => { setMessages(history) }, [history])

  /* Scroll to bottom on new messages */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  /* Mark read on open */
  useEffect(() => {
    partnerApi.markRead(conn.id).catch(() => {})
  }, [conn.id])

  /* WS handlers */
  const handleIncoming = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev
      return [...prev, msg]
    })
    setTyping(false)
    partnerApi.markRead(conn.id).catch(() => {})
    qc.invalidateQueries({ queryKey: ['partner-connections'] })
  }, [conn.id, qc])

  const handleTyping = useCallback(() => {
    setTyping(true)
    if (typingTimer.current) clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => setTyping(false), 2500)
  }, [])

  const { sendWs } = useChat(conn.id, token, handleIncoming, handleTyping)

  /* Send message */
  const send = async () => {
    const content = text.trim()
    if (!content || sending) return
    setSending(true)
    setText('')
    const sent = sendWs({ type: 'message', content })
    if (!sent) {
      /* HTTP fallback */
      try {
        const res = await partnerApi.sendMessage(conn.id, content)
        const msg = res.data as ChatMessage
        setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg])
      } catch {}
    }
    setSending(false)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
    else sendWs({ type: 'typing' })
  }

  const partner = conn.partner

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <Avatar name={partner.name} />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 dark:text-white text-sm">{partner.name}</p>
          <p className="text-xs" style={{ color: TEAL }}>● Connected{partner.city ? ` · ${partner.city}` : ''}</p>
        </div>
        {partner.shared_subjects.length > 0 && (
          <div className="hidden sm:flex gap-1 flex-wrap justify-end max-w-[200px]">
            {partner.shared_subjects.slice(0, 3).map((s) => (
              <span key={s} className="badge-primary text-[10px]">{s}</span>
            ))}
            {partner.shared_subjects.length > 3 && (
              <span className="badge-gray text-[10px]">+{partner.shared_subjects.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageCircle size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-400">No messages yet. Say hello! 👋</p>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isMe = msg.sender_id === userId
          const prevMsg = messages[idx - 1]
          const sameSender = prevMsg && prevMsg.sender_id === msg.sender_id

          return (
            <div key={msg.id} className={cn('flex flex-col', isMe ? 'items-end' : 'items-start')}>
              {/* Show name only for first in a run from the other person */}
              {!isMe && !sameSender && (
                <p className="text-[10px] font-semibold text-gray-400 mb-0.5 ml-1">{msg.sender_name}</p>
              )}
              <div className={cn(
                'max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                isMe
                  ? 'text-white rounded-tr-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-sm',
              )} style={isMe ? { background: TEAL } : {}}>
                {msg.content}
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5 mx-1">{fmtTime(msg.sent_at)}</p>
            </div>
          )
        })}

        {typing && (
          <div className="flex items-center gap-2 text-gray-400">
            <div className="flex gap-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
            <span className="text-xs">{partner.name.split(' ')[0]} is typing…</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-end gap-2 p-3 border-t border-gray-100 dark:border-gray-800 shrink-0">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={`Message ${partner.name.split(' ')[0]}…`}
          rows={1}
          className="input flex-1 resize-none py-2.5 max-h-32 overflow-y-auto"
          style={{ lineHeight: '1.5' }}
        />
        <button onClick={send} disabled={!text.trim() || sending}
          className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white transition-opacity disabled:opacity-40"
          style={{ background: TEAL }}>
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}

/* ── Main page ────────────────────────────────────────────────── */
function MessagesContent() {
  const user = useAuthStore((s) => s.user)
  const [activeId, setActiveId] = useState<number | null>(null)
  const [showChat, setShowChat] = useState(false) // mobile toggle

  const { data: connections = [], isLoading } = useQuery<Connection[]>({
    queryKey: ['partner-connections'],
    queryFn: () => partnerApi.connections().then((r) => r.data),
    refetchInterval: 30_000,
  })

  const activeConn = connections.find((c) => c.id === activeId) ?? null

  const openChat = (id: number) => {
    setActiveId(id)
    setShowChat(true)
  }

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <MessageCircle size={24} style={{ color: TEAL }} /> Messages
        </h1>
        <p className="page-sub">Chat privately with your connected study partners</p>
      </div>

      {isLoading ? (
        <div className="flex gap-4 h-[600px]">
          <div className="w-64 skeleton rounded-2xl" />
          <div className="flex-1 skeleton rounded-2xl" />
        </div>
      ) : connections.length === 0 ? (
        /* Empty state */
        <div className="flex items-center justify-center h-[500px]">
          <div className="empty-state">
            <div className="empty-icon w-20 h-20"><Users size={36} /></div>
            <p className="empty-title text-lg">No connections yet</p>
            <p className="empty-sub max-w-xs">
              Connect with fellow aspirants in{' '}
              <Link to="/partner" className="font-semibold" style={{ color: TEAL }}>Study Partner</Link>
              {' '}to start chatting.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex gap-4 h-[600px]">

          {/* ── Left panel: connection list ── */}
          <aside className={cn(
            'w-full md:w-72 shrink-0 flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden',
            showChat ? 'hidden md:flex' : 'flex',
          )}>
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Chats ({connections.length})
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {connections.map((c) => {
                const p = c.partner
                const isActive = c.id === activeId
                return (
                  <button key={c.id} onClick={() => openChat(c.id)}
                    className={cn(
                      'w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150',
                      isActive
                        ? 'text-white'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200',
                    )}
                    style={isActive ? { background: TEAL } : {}}>
                    <Avatar name={p.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{p.name}</p>
                      {p.shared_subjects.length > 0 ? (
                        <p className={cn('text-[11px] truncate', isActive ? 'text-white/70' : 'text-gray-400')}>
                          {p.shared_subjects[0]}{p.shared_subjects.length > 1 ? ` +${p.shared_subjects.length - 1}` : ''}
                        </p>
                      ) : (
                        <p className={cn('text-[11px]', isActive ? 'text-white/60' : 'text-gray-400')}>
                          {p.city || p.exam_type || 'Study Partner'}
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </aside>

          {/* ── Right panel: chat ── */}
          <div className={cn('flex-1 flex flex-col', showChat ? 'flex' : 'hidden md:flex')}>
            {/* Mobile back button */}
            <button onClick={() => setShowChat(false)}
              className="md:hidden flex items-center gap-1.5 text-sm font-semibold mb-3"
              style={{ color: TEAL }}>
              <ArrowLeft size={16} /> All Chats
            </button>

            {activeConn ? (
              <ChatPanel conn={activeConn} userId={user!.id} />
            ) : (
              <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="empty-state py-10">
                  <div className="empty-icon"><MessageCircle size={32} /></div>
                  <p className="empty-title">Select a conversation</p>
                  <p className="empty-sub">Pick a chat from the left panel to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function Messages() {
  return <ProtectedRoute><MessagesContent /></ProtectedRoute>
}
