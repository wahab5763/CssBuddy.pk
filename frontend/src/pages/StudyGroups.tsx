import { useEffect, useRef, useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Send, Users, Clock, MessageCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { studyGroupsApi, groupWsUrl } from '@/api/studyGroups'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'
import { cn } from '@/lib/utils'

/* ── Colour tokens ────────────────────────────────────────────── */
const TEAL = '#1D6660'
const ORANGE = '#F97316'

/* ── Types ────────────────────────────────────────────────────── */
interface GroupMessage {
  id: number
  group_id: number
  sender_id: number | null
  sender_name: string
  content: string
  created_at: string
}

interface LastMessage {
  id: number
  sender_name: string
  content: string
  created_at: string
}

interface StudyGroup {
  id: number
  subject_name: string
  display_name: string
  member_count: number
  last_message: LastMessage | null
}

interface GroupMemberInfo {
  id: number
  name: string
  city: string | null
  prep_level: string | null
  exam_year: number | null
}

/* ── Helpers ──────────────────────────────────────────────────── */
function fmtTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

function fmtPreview(text: string, max = 40): string {
  return text.length > max ? text.slice(0, max) + '…' : text
}

function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m`
  const hrs = Math.floor(min / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

// Deterministic color per subject name for the dot indicator
const DOT_COLORS = [
  '#1D6660', '#F97316', '#8B5CF6', '#EC4899', '#0EA5E9',
  '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#14B8A6',
]
function subjectColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return DOT_COLORS[h % DOT_COLORS.length]
}

/* ── useGroupChat hook ────────────────────────────────────────── */
function useGroupChat(
  groupId: number | null,
  token: string | null,
  onMessage: (msg: GroupMessage) => void,
  onTyping: (userName: string) => void,
) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const connect = useCallback(() => {
    if (!groupId || !token) return
    if (wsRef.current) {
      wsRef.current.onclose = null
      wsRef.current.close()
    }
    const ws = new WebSocket(groupWsUrl(groupId, token))
    wsRef.current = ws

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'message') {
          onMessage(data as GroupMessage)
        } else if (data.type === 'typing') {
          onTyping(data.user_name)
        }
        // presence events: ignore for now
      } catch {}
    }

    ws.onclose = () => {
      // Reconnect after 3 seconds
      reconnectTimer.current = setTimeout(() => {
        connect()
      }, 3000)
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [groupId, token, onMessage, onTyping])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [connect])

  const send = useCallback(
    async (content: string) => {
      const trimmed = content.trim()
      if (!trimmed || !groupId) return
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'message', content: trimmed }))
      } else {
        // HTTP fallback
        try {
          await studyGroupsApi.sendMessage(groupId, trimmed)
        } catch {}
      }
    },
    [groupId]
  )

  const sendTyping = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'typing' }))
    }
  }, [])

  return { send, sendTyping }
}

/* ── Group list item ──────────────────────────────────────────── */
function GroupListItem({
  group,
  isActive,
  unreadCount,
  onClick,
}: {
  group: StudyGroup
  isActive: boolean
  unreadCount: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-4 py-3 flex items-center gap-3 transition-colors border-b border-gray-100 dark:border-gray-800',
        isActive
          ? 'bg-teal-50 dark:bg-teal-950/30'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
      )}
      style={isActive ? { borderLeft: `3px solid ${TEAL}` } : {}}
    >
      {/* Color dot */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
        style={{ background: subjectColor(group.subject_name) }}
      >
        {group.subject_name[0].toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              'text-sm font-semibold truncate',
              isActive
                ? 'text-teal-800 dark:text-teal-300'
                : 'text-gray-900 dark:text-white'
            )}
          >
            {group.display_name}
          </p>
          {group.last_message && (
            <span className="text-[10px] text-gray-400 shrink-0">
              {fmtRelative(group.last_message.created_at)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-1 mt-0.5">
          <p className="text-xs text-gray-400 truncate">
            {group.last_message
              ? fmtPreview(group.last_message.content)
              : `${group.member_count} member${group.member_count !== 1 ? 's' : ''}`}
          </p>
          {unreadCount > 0 && (
            <span
              className="text-[10px] text-white rounded-full px-1.5 py-0.5 font-bold shrink-0"
              style={{ background: ORANGE }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        {!group.last_message && (
          <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-0.5">
            {group.member_count} member{group.member_count !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </button>
  )
}

/* ── Members panel ────────────────────────────────────────────── */
function MembersPanel({ groupId }: { groupId: number }) {
  const { data } = useQuery<GroupMemberInfo[]>({
    queryKey: ['group-members', groupId],
    queryFn: () => studyGroupsApi.members(groupId).then((r) => r.data),
  })

  return (
    <div className="p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">
        Members ({data?.length ?? '…'})
      </p>
      <div className="space-y-2">
        {(data || []).map((m) => (
          <div key={m.id} className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ background: TEAL }}
            >
              {m.name[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">{m.name}</p>
              <p className="text-[10px] text-gray-400 truncate">
                {[m.city, m.prep_level, m.exam_year].filter(Boolean).join(' · ') || 'No details'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Chat panel ───────────────────────────────────────────────── */
function ChatPanel({
  group,
  currentUserId,
  token,
  onBack,
}: {
  group: StudyGroup
  currentUserId: number
  token: string
  onBack: () => void
}) {
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [input, setInput] = useState('')
  const [typingUser, setTypingUser] = useState<string | null>(null)
  const [showMembers, setShowMembers] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load initial messages
  const { data: initialMessages, isLoading } = useQuery<GroupMessage[]>({
    queryKey: ['group-messages', group.id],
    queryFn: () => studyGroupsApi.messages(group.id).then((r) => r.data),
  })

  useEffect(() => {
    if (initialMessages) setMessages(initialMessages)
  }, [initialMessages])

  const handleMessage = useCallback((msg: GroupMessage) => {
    setMessages((prev) => {
      // Avoid duplicates
      if (prev.some((m) => m.id === msg.id)) return prev
      return [...prev, msg]
    })
  }, [])

  const handleTyping = useCallback((userName: string) => {
    if (typingTimer.current) clearTimeout(typingTimer.current)
    setTypingUser(userName)
    typingTimer.current = setTimeout(() => setTypingUser(null), 2000)
  }, [])

  const { send, sendTyping } = useGroupChat(group.id, token, handleMessage, handleTyping)

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed) return
    setInput('')
    await send(trimmed)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    sendTyping()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0"
        style={{ background: TEAL }}
      >
        <button
          onClick={onBack}
          className="md:hidden p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white"
        >
          <ArrowLeft size={18} />
        </button>

        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
          style={{ background: subjectColor(group.subject_name), opacity: 0.9 }}
        >
          {group.subject_name[0].toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm truncate">{group.display_name}</p>
          <p className="text-xs text-teal-200">{group.member_count} members</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:flex items-center gap-1 text-[10px] text-teal-200 bg-white/10 px-2 py-1 rounded-full">
            <Clock size={10} />
            Messages expire in 7 days
          </span>
          <button
            onClick={() => setShowMembers((v) => !v)}
            className={cn(
              'p-1.5 rounded-lg transition-colors text-white',
              showMembers ? 'bg-white/20' : 'hover:bg-white/10'
            )}
            title="Members"
          >
            <Users size={18} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Messages area */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Expiry notice */}
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 shrink-0">
            <p className="text-[10px] text-gray-400 text-center">
              Messages in this group are automatically deleted after 7 days.
            </p>
          </div>

          {/* Message list */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
            {isLoading && (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!isLoading && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                <MessageCircle size={40} className="text-gray-200 dark:text-gray-700 mb-3" />
                <p className="text-gray-400 font-medium">Be the first to chat!</p>
                <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
                  Start the conversation for {group.subject_name}
                </p>
              </div>
            )}

            {messages.map((msg, idx) => {
              const isOwn = msg.sender_id === currentUserId
              const prevMsg = idx > 0 ? messages[idx - 1] : null
              const showSenderName =
                !isOwn &&
                (!prevMsg || prevMsg.sender_id !== msg.sender_id)

              return (
                <div
                  key={msg.id}
                  className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[70%] sm:max-w-[60%]',
                      isOwn ? 'items-end' : 'items-start'
                    )}
                  >
                    {showSenderName && (
                      <p
                        className="text-[10px] font-semibold mb-0.5 ml-1"
                        style={{ color: subjectColor(msg.sender_name) }}
                      >
                        {msg.sender_name}
                      </p>
                    )}
                    <div
                      className={cn(
                        'px-3 py-2 rounded-2xl text-sm leading-relaxed shadow-sm',
                        isOwn
                          ? 'rounded-tr-sm text-white'
                          : 'rounded-tl-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-sm'
                      )}
                      style={isOwn ? { background: TEAL } : {}}
                    >
                      {msg.content}
                    </div>
                    <p
                      className={cn(
                        'text-[9px] text-gray-400 mt-0.5',
                        isOwn ? 'text-right mr-1' : 'ml-1'
                      )}
                    >
                      {fmtTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              )
            })}

            {typingUser && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-700 rounded-2xl rounded-tl-sm px-3 py-2 text-xs text-gray-400 shadow-sm">
                  {typingUser} is typing…
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-2.5 flex items-end gap-2 shrink-0 bg-white dark:bg-gray-900">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Type a message… (Shift+Enter for newline)"
              className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 max-h-32 overflow-y-auto"
              style={{ lineHeight: '1.4' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="p-2.5 rounded-xl text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              style={{ background: input.trim() ? TEAL : '#9CA3AF' }}
              title="Send"
            >
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* Members side panel (desktop) */}
        {showMembers && (
          <div className="hidden md:block w-56 border-l border-gray-200 dark:border-gray-700 overflow-y-auto bg-gray-50 dark:bg-gray-800/30">
            <MembersPanel groupId={group.id} />
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Main page ────────────────────────────────────────────────── */
function StudyGroupsInner() {
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.accessToken)
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null)
  const [showMobileChat, setShowMobileChat] = useState(false)
  // Track the last seen message id per group for unread count
  const [lastSeen, setLastSeen] = useState<Map<number, number>>(new Map())

  const { data: groups = [], isLoading } = useQuery<StudyGroup[]>({
    queryKey: ['my-study-groups'],
    queryFn: () => studyGroupsApi.myGroups().then((r) => r.data),
    enabled: !!user && (user.optional_subjects?.length ?? 0) > 0,
    refetchInterval: 30000,
  })

  const handleSelectGroup = (group: StudyGroup) => {
    setSelectedGroup(group)
    setShowMobileChat(true)
    // Mark as seen
    if (group.last_message) {
      setLastSeen((prev) => new Map(prev).set(group.id, group.last_message!.id))
    }
  }

  const getUnreadCount = (group: StudyGroup): number => {
    if (!group.last_message) return 0
    const seen = lastSeen.get(group.id) ?? 0
    return group.last_message.id > seen ? 1 : 0
  }

  // Empty state: no optional subjects selected
  if (!user || (user.optional_subjects?.length ?? 0) === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: `${TEAL}20` }}
        >
          <Users size={32} style={{ color: TEAL }} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          No Study Groups Yet
        </h2>
        <p className="text-gray-500 max-w-sm">
          Select your optional subjects in your profile to automatically join subject-based
          study groups with other CSS aspirants.
        </p>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-62px)] flex overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* ── Left panel: Group list ── */}
      <div
        className={cn(
          'w-full md:w-72 md:flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0',
          showMobileChat ? 'hidden' : 'flex'
        )}
      >
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-800" style={{ background: TEAL }}>
          <p className="font-bold text-white text-sm">Study Groups</p>
          <p className="text-xs text-teal-200 mt-0.5">{groups.length} group{groups.length !== 1 ? 's' : ''}</p>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!isLoading && groups.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              No groups found. Try updating your optional subjects.
            </div>
          )}
          {groups.map((g) => (
            <GroupListItem
              key={g.id}
              group={g}
              isActive={selectedGroup?.id === g.id}
              unreadCount={getUnreadCount(g)}
              onClick={() => handleSelectGroup(g)}
            />
          ))}
        </div>
      </div>

      {/* ── Right panel: Chat ── */}
      <div
        className={cn(
          'flex-1 flex flex-col overflow-hidden',
          !showMobileChat && 'hidden md:flex'
        )}
      >
        {selectedGroup && token ? (
          <ChatPanel
            key={selectedGroup.id}
            group={selectedGroup}
            currentUserId={user.id}
            token={token}
            onBack={() => {
              setShowMobileChat(false)
              setSelectedGroup(null)
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: `${TEAL}15` }}
            >
              <MessageCircle size={32} style={{ color: TEAL }} />
            </div>
            <p className="text-gray-500 font-medium">Select a group to start chatting</p>
            <p className="text-sm text-gray-400 mt-1">
              Chat with fellow CSS aspirants in your subject groups
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export function StudyGroups() {
  return (
    <ProtectedRoute>
      <StudyGroupsInner />
    </ProtectedRoute>
  )
}
