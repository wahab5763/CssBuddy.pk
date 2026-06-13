import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { dashboardApi } from '@/api/dashboard'
import { practiceApi } from '@/api/practice'
import {
  BookOpen, ChevronLeft, ChevronRight, Quote, Languages,
  RotateCcw, LayoutDashboard, Zap, Library,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/common/PageHeader'

/* ── Types ──────────────────────────────────────────────────────────────── */
interface CarouselItem { type: 'quote' | 'idiom'; text: string; sub: string }
interface VocabWord    { word: string; meaning: string }
interface McqCard      { id: number; question: string; correct: string; subject: string; option_a: string | null; option_b: string | null; option_c: string | null; option_d: string | null }
interface BrowseMcq    extends McqCard { option_a: string | null; option_b: string | null; option_c: string | null; option_d: string | null }

/* ── Color palette ──────────────────────────────────────────────────────── */
const TEAL = '#1D6660'

// Jewel-tone flip card fronts — deep rich bases
const VOCAB_GRAD = 'from-[#1a6b3a] via-[#50C878] to-[#ACE1AF]'

const SUBJECT_GRAD: Record<string, string> = {
  'Current Affairs':                 'from-[#0c4a6e] via-[#0369a1] to-[#0ea5e9]',
  'Pakistan Affairs':                'from-[#052e16] via-[#166534] to-[#16a34a]',
  'Islamic Studies':                 'from-[#134e4a] via-[#0f766e] to-[#14b8a6]',
  'English (Precis & Composition)':  'from-[#7c2d12] via-[#c2410c] to-[#f97316]',
  'General Science & Ability':       'from-[#4c1d95] via-[#7c3aed] to-[#a78bfa]',
}

// Subject accent colors for MCQ Question Bank
const SUBJECT_ACCENT: Record<string, { border: string; badge: string; correct: string }> = {
  'Current Affairs':                 { border: 'border-l-sky-500',    badge: '#0284c7', correct: 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-200' },
  'Pakistan Affairs':                { border: 'border-l-emerald-500',badge: '#15803d', correct: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200' },
  'Islamic Studies':                 { border: 'border-l-teal-500',   badge: '#0f766e', correct: 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200' },
  'English (Precis & Composition)':  { border: 'border-l-orange-500', badge: '#c2410c', correct: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200' },
  'General Science & Ability':       { border: 'border-l-violet-500', badge: '#7c3aed', correct: 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 text-violet-800 dark:text-violet-200' },
}
const DEFAULT_ACCENT = { border: 'border-l-primary', badge: TEAL, correct: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200' }

/* ════════════════════════════════════════════════════════════════════════════
   1. HERO CAROUSEL
   ════════════════════════════════════════════════════════════════════════════ */
function HeroCarousel({ items }: { items: CarouselItem[] }) {
  const [idx, setIdx]       = useState(0)
  const [fading, setFading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const go = useCallback((next: number) => {
    setFading(true)
    setTimeout(() => {
      setIdx((next + items.length) % items.length)
      setFading(false)
    }, 250)
  }, [items.length])

  useEffect(() => {
    if (!items.length) return
    timerRef.current = setInterval(() => go(idx + 1), 5000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [idx, go, items.length])

  if (!items.length) return null
  const item   = items[idx]
  const isIdiom = item.type === 'idiom'

  return (
    <div className="relative overflow-hidden rounded-3xl text-white shadow-xl"
      style={{ background: 'linear-gradient(135deg, #5a7a47 0%, #87a96b 55%, #6e9058 100%)' }}>

      {/* Glow blobs */}
      <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(255,255,255,0.12)' }} />
      <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(90,122,71,0.35)' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-16 blur-3xl pointer-events-none"
        style={{ background: 'rgba(255,255,255,0.06)' }} />

      {/* Dot texture */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />

      <div className="relative z-10 px-6 py-7 sm:px-10 sm:py-9 min-h-[152px] flex flex-col justify-between gap-4">
        <div className={cn('transition-opacity duration-250', fading ? 'opacity-0' : 'opacity-100')}>

          {/* Tag pill */}
          <div className="flex items-center gap-2 mb-3">
            <span className="flex items-center gap-1.5 border rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide"
              style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.30)', color: 'rgba(255,255,255,0.92)' }}>
              {isIdiom
                ? <><Languages size={11} /> English Idiom</>
                : <><Quote size={11} /> Motivational Quote</>}
            </span>
          </div>

          {/* Main text */}
          <p className="font-bold text-lg sm:text-xl leading-snug text-white">
            &ldquo;{item.text}&rdquo;
          </p>
          {item.sub && (
            <p className="text-sm mt-2 font-medium" style={{ color: 'rgba(255,255,255,0.78)' }}>
              {isIdiom ? `Meaning: ${item.sub}` : `— ${item.sub}`}
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {items.map((_, i) => (
              <button key={i} onClick={() => go(i)}
                className={cn('h-1.5 rounded-full transition-all duration-300',
                  i === idx ? 'w-6' : 'w-1.5 hover:opacity-60')}
                style={{ background: i === idx ? '#ffffff' : 'rgba(255,255,255,0.35)' }} />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => go(idx - 1)}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}>
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => go(idx + 1)}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   2. FLIP CARDS
   ════════════════════════════════════════════════════════════════════════════ */
type CardData =
  | { kind: 'vocab'; word: string; meaning: string }
  | { kind: 'mcq';   question: string; correct: string; subject: string; option_a: string | null; option_b: string | null; option_c: string | null; option_d: string | null }

function FlipCard({ card, onUnflip }: { card: CardData; onUnflip: () => void }) {
  const [flipped, setFlipped] = useState(false)

  const handleClick = () => {
    if (flipped) { setFlipped(false); onUnflip() }
    else setFlipped(true)
  }

  const grad = card.kind === 'vocab'
    ? VOCAB_GRAD
    : (SUBJECT_GRAD[card.subject] ?? 'from-[#1D6660] via-[#1a7a73] to-[#2D9E95]')

  const tag = card.kind === 'vocab' ? 'GRE Vocab' : card.subject.split(' ')[0]

  const accentColor = card.kind === 'mcq'
    ? (SUBJECT_ACCENT[card.subject]?.badge ?? TEAL)
    : '#50C878'

  const front = card.kind === 'vocab'
    ? <>
        <p className="text-xl font-black leading-tight tracking-tight">{card.word}</p>
        <p className="text-white/60 text-xs mt-2">Tap to reveal meaning</p>
      </>
    : <>
        <p className="text-xs font-semibold leading-snug line-clamp-4">{card.question}</p>
        <p className="text-white/55 text-[10px] mt-2">Tap for answer</p>
      </>

  const back = card.kind === 'vocab'
    ? <>
        <p className="text-sm font-bold text-gray-800 dark:text-white leading-snug">{card.meaning}</p>
        <p className="text-[10px] text-gray-400 mt-2">Tap to continue →</p>
      </>
    : (() => {
        const opts: Record<string, string | null> = { A: card.option_a, B: card.option_b, C: card.option_c, D: card.option_d }
        const ans = opts[card.correct]
        return <>
          <p className="text-xs leading-snug text-gray-700 dark:text-gray-200">
            <span className="font-black text-base" style={{ color: accentColor }}>{card.correct})</span>{' '}
            <span className="font-bold">{ans || card.correct}</span>
          </p>
          <p className="text-[10px] text-gray-400 mt-2">Tap to continue →</p>
        </>
      })()

  return (
    <div className={cn('flip-card h-44 cursor-pointer select-none', flipped && 'flipped')} onClick={handleClick}>
      <div className="flip-card-inner rounded-2xl">

        {/* Front */}
        <div className={cn('flip-card-front rounded-2xl bg-gradient-to-br p-4 flex flex-col relative overflow-hidden', grad)}>
          {/* Subtle shimmer dot grid */}
          <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
          {/* Top glow */}
          <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl pointer-events-none bg-white/10" />
          <span className="relative z-10 self-start text-[10px] font-bold bg-white/20 border border-white/25 text-white rounded-full px-2.5 py-0.5 mb-2">
            {tag}
          </span>
          <div className="relative z-10 flex-1 flex flex-col justify-center text-white">{front}</div>
        </div>

        {/* Back */}
        <div className="flip-card-back rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 p-4 flex flex-col justify-center shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 rounded-t-2xl"
            style={{ background: `linear-gradient(to right, ${accentColor}, transparent)` }} />
          {back}
        </div>
      </div>
    </div>
  )
}

function FlashSection() {
  const qc = useQueryClient()

  const { data: vocabPool = [] } = useQuery<VocabWord[]>({
    queryKey: ['vocab-pool'],
    queryFn:  () => dashboardApi.vocab(40).then(r => r.data),
    staleTime: Infinity,
  })
  const { data: mcqPool = [] } = useQuery<McqCard[]>({
    queryKey: ['mcq-pool'],
    queryFn:  () => dashboardApi.flashcards(20).then(r => r.data),
    staleTime: Infinity,
  })

  const vIdx = useRef(0)
  const mIdx = useRef(0)
  const [cards, setCards] = useState<(CardData | null)[]>(Array(8).fill(null))

  useEffect(() => {
    if (!vocabPool.length && !mcqPool.length) return
    setCards(prev => prev.map((c, i) => {
      if (c !== null) return c
      if (i < 4 && vocabPool.length) {
        const v = vocabPool[vIdx.current % vocabPool.length]; vIdx.current++
        return { kind: 'vocab', word: v.word, meaning: v.meaning } as CardData
      }
      if (i >= 4 && mcqPool.length) {
        const m = mcqPool[mIdx.current % mcqPool.length]; mIdx.current++
        return { kind: 'mcq', ...m } as CardData
      }
      return c
    }))
  }, [vocabPool, mcqPool])

  const advanceCard = useCallback((i: number) => {
    setCards(prev => {
      const next = [...prev]
      if (i < 4 && vocabPool.length) {
        const v = vocabPool[vIdx.current % vocabPool.length]; vIdx.current++
        next[i] = { kind: 'vocab', word: v.word, meaning: v.meaning }
      } else if (i >= 4 && mcqPool.length) {
        const m = mcqPool[mIdx.current % mcqPool.length]; mIdx.current++
        next[i] = { kind: 'mcq', ...m }
      }
      return next
    })
  }, [vocabPool, mcqPool])

  const refresh = () => {
    vIdx.current = 0; mIdx.current = 0
    setCards(Array(8).fill(null))
    qc.invalidateQueries({ queryKey: ['vocab-pool'] })
    qc.invalidateQueries({ queryKey: ['mcq-pool'] })
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title mb-0 flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
            style={{ background: 'linear-gradient(135deg, #1a6b3a, #50C878)' }}>
            <Zap size={15} />
          </span>
          Daily Flash 8-Pack
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(80,200,120,0.15)', color: '#1a6b3a' }}>
            Flip for answer
          </span>
        </h2>
        <button onClick={refresh} className="btn-ghost btn-sm text-gray-400 gap-1.5 hover:text-emerald-600">
          <RotateCcw size={14} /> New Set
        </button>
      </div>

      {/* Legend */}
      <div className="mb-3 flex flex-wrap gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ background: 'linear-gradient(to right, #50C878, #ACE1AF)' }} />
          Cards 1–4: GRE Vocab
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ background: 'linear-gradient(to right, #1D6660, #2D9E95)' }} />
          Cards 5–8: MCQ
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {cards.map((card, i) =>
          card
            ? <FlipCard key={i} card={card} onUnflip={() => advanceCard(i)} />
            : <div key={i} className="h-44 skeleton rounded-2xl" />
        )}
      </div>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   3. MCQ BROWSER
   ════════════════════════════════════════════════════════════════════════════ */
function McqBrowser() {
  const [subject, setSubject] = useState('')
  const [page, setPage]       = useState(1)

  const { data: subjects = [] } = useQuery({
    queryKey: ['practice-subjects'],
    queryFn:  () => practiceApi.subjects().then(r => r.data),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['dash-mcqs', subject, page],
    queryFn:  () => dashboardApi.latestMcqs({ subject: subject || undefined, page, per_page: 10 }).then(r => r.data),
    keepPreviousData: true,
  } as any)

  const mcqs: BrowseMcq[] = (data as any)?.items ?? []
  const total: number      = (data as any)?.total ?? 0
  const pages: number      = (data as any)?.pages ?? 1

  const OPTS: ['A', 'B', 'C', 'D'] = ['A', 'B', 'C', 'D']

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="section-title mb-0 flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
            style={{ background: 'linear-gradient(135deg, #1D6660, #2D9E95)' }}>
            <Library size={15} />
          </span>
          Question Bank
          {total > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(29,102,96,0.10)', color: '#1D6660' }}>
              {total} questions
            </span>
          )}
        </h2>
        <select
          value={subject}
          onChange={e => { setSubject(e.target.value); setPage(1) }}
          className="select text-sm py-1.5 h-9 max-w-xs"
        >
          <option value="">All Subjects</option>
          {(subjects as any[]).map((s: any) => (
            <option key={s.subject} value={s.subject}>{s.subject} ({s.count})</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}</div>
      ) : mcqs.length === 0 ? (
        <div className="card p-8 text-center text-gray-400 text-sm">No questions found.</div>
      ) : (
        <>
          <div className="space-y-3">
            {mcqs.map((m, idx) => {
              const correct = m.correct?.toUpperCase()
              const accent  = SUBJECT_ACCENT[m.subject] ?? DEFAULT_ACCENT

              return (
                <div key={m.id} className={cn(
                  'card p-4 hover:shadow-md transition-all duration-150 border-l-4',
                  accent.border,
                )}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white leading-relaxed flex-1">
                      <span className="font-black mr-2" style={{ color: accent.badge }}>
                        {(page - 1) * 10 + idx + 1}.
                      </span>
                      {m.question}
                    </p>
                    <span
                      className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full text-white whitespace-nowrap shadow-sm"
                      style={{ background: accent.badge }}
                    >
                      {m.subject.split(' ')[0]}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {OPTS.map(opt => {
                      const text = m[`option_${opt.toLowerCase()}` as keyof BrowseMcq] as string | null
                      if (!text) return null
                      const isCorrect = opt === correct
                      return (
                        <div key={opt} className={cn(
                          'flex items-start gap-2 px-3 py-2 rounded-lg text-xs font-medium border',
                          isCorrect
                            ? accent.correct
                            : 'bg-gray-50 dark:bg-gray-800/60 border-transparent text-gray-600 dark:text-gray-400',
                        )}>
                          <span className={cn('font-black shrink-0 mt-px', isCorrect ? '' : 'text-gray-400')}
                            style={isCorrect ? { color: accent.badge } : {}}>
                            {opt}.
                          </span>
                          <span className="flex-1">{text}</span>
                          {isCorrect && <span className="shrink-0 font-bold text-[11px]" style={{ color: accent.badge }}>✓</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-gray-400">Page {page} of {pages}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="btn-outline btn-sm gap-1 disabled:opacity-40">
                <ChevronLeft size={14} /> Prev
              </button>
              <span className="px-3 py-1.5 text-xs font-bold rounded-lg"
                style={{ background: 'rgba(29,102,96,0.10)', color: '#1D6660' }}>
                {page} / {pages}
              </span>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                className="btn-outline btn-sm gap-1 disabled:opacity-40">
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ════════════════════════════════════════════════════════════════════════════ */
export function Dashboard() {
  const user = useAuthStore((s) => s.user)

  useQuery({
    queryKey: ['dashboard-summary'],
    queryFn:  () => dashboardApi.summary().then(r => r.data),
  })

  const { data: carouselItems = [] } = useQuery<CarouselItem[]>({
    queryKey: ['dashboard-carousel'],
    queryFn:  () => dashboardApi.carousel().then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })

  const hour      = new Date().getHours()
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.name.split(' ')[0] || ''

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Header */}
      <PageHeader
        icon={<LayoutDashboard size={22} className="text-white" />}
        greeting={`${greeting}${firstName ? `, ${firstName}` : ''} 👋`}
        title={user
          ? `Ready to ace ${user.profile?.exam_type || 'CSS'} ${user.profile?.exam_year || ''}?`
          : 'Start your CSS/PMS journey'}
        subtitle="Your personalised prep hub — vocabulary, flashcards, MCQs and more."
      />

      {/* Carousel */}
      <HeroCarousel items={carouselItems} />

      {/* Flash 8-Pack */}
      <FlashSection />

      {/* Question Bank */}
      <McqBrowser />

    </div>
  )
}
