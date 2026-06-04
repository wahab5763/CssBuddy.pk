import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { dashboardApi } from '@/api/dashboard'
import { practiceApi } from '@/api/practice'
import { Flame, BookOpen, RefreshCw, TrendingUp, Target, ChevronLeft, ChevronRight, Quote, Languages, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ── Types ──────────────────────────────────────────────── */
interface CarouselItem { type: 'quote' | 'idiom'; text: string; sub: string }
interface VocabWord    { word: string; meaning: string }
interface McqCard      { id: number; question: string; correct: string; subject: string; option_a: string | null; option_b: string | null; option_c: string | null; option_d: string | null }
interface BrowseMcq    extends McqCard { option_a: string | null; option_b: string | null; option_c: string | null; option_d: string | null }

/* ── Colour tokens ──────────────────────────────────────── */
const TEAL   = '#1D6660'
const ORANGE = '#F97316'

const SUBJECT_GRAD: Record<string, string> = {
  'Current Affairs':                    'from-sky-500 to-cyan-400',
  'Pakistan Affairs':                   'from-emerald-500 to-teal-500',
  'Islamic Studies':                    'from-teal-600 to-teal-400',
  'English (Precis & Composition)':     'from-orange-500 to-amber-400',
  'General Science & Ability':          'from-pink-500 to-rose-400',
}

/* ════════════════════════════════════════════════════════
   1. HERO CAROUSEL
   ════════════════════════════════════════════════════════ */
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
  const item = items[idx]
  const isIdiom = item.type === 'idiom'

  return (
    <div className="relative overflow-hidden rounded-3xl text-white shadow-lg"
      style={{ background: 'linear-gradient(120deg, #1D6660 0%, #2D9E95 45%, #0f4c48 100%)' }}>
      {/* dot pattern overlay */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.5) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

      <div className="relative z-10 px-6 py-7 sm:px-10 sm:py-8 min-h-[140px] flex flex-col justify-between gap-4">
        <div className={cn('transition-opacity duration-250', fading ? 'opacity-0' : 'opacity-100')}>
          {/* Tag */}
          <div className="flex items-center gap-2 mb-3">
            <span className="flex items-center gap-1.5 bg-white/15 border border-white/25 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide">
              {isIdiom
                ? <><Languages size={11} /> English Idiom</>
                : <><Quote size={11} /> Quote</>}
            </span>
          </div>

          {/* Main text */}
          <p className="font-bold text-lg sm:text-xl leading-snug">
            {isIdiom ? `"${item.text}"` : `"${item.text}"`}
          </p>
          {item.sub && (
            <p className="text-white/75 text-sm mt-2 font-medium">
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
                  i === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/35 hover:bg-white/60')} />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => go(idx - 1)}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => go(idx + 1)}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   2. FLIP CARDS (infinite — new card on each unflip)
   ════════════════════════════════════════════════════════ */
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
    ? 'from-indigo-500 to-violet-500'
    : (SUBJECT_GRAD[card.subject] ?? 'from-[#1D6660] to-[#2D9E95]')

  const tag  = card.kind === 'vocab' ? 'GRE Vocab' : card.subject.split(' ')[0]

  const front = card.kind === 'vocab'
    ? <><p className="text-xl font-black leading-tight">{card.word}</p><p className="text-white/70 text-xs mt-2">Tap to reveal meaning</p></>
    : <><p className="text-xs font-semibold leading-snug line-clamp-4">{card.question}</p><p className="text-white/70 text-[10px] mt-2">Tap for answer</p></>

  const back = card.kind === 'vocab'
    ? <><p className="text-sm font-bold text-gray-800 dark:text-white leading-snug">{card.meaning}</p><p className="text-[10px] text-gray-400 mt-2">Tap to continue →</p></>
    : (() => {
        const opts: Record<string,'string'|null> = { A: card.option_a, B: card.option_b, C: card.option_c, D: card.option_d } as any
        const ans = opts[card.correct]
        return <><p className="text-xs font-bold text-gray-700 dark:text-gray-200 leading-snug"><span className="text-teal-600 dark:text-teal-400 font-black">{card.correct})</span> {ans || card.correct}</p><p className="text-[10px] text-gray-400 mt-2">Tap to continue →</p></>
      })()

  return (
    <div className={cn('flip-card h-44 cursor-pointer select-none', flipped && 'flipped')} onClick={handleClick}>
      <div className="flip-card-inner rounded-2xl">
        <div className={cn('flip-card-front rounded-2xl bg-gradient-to-br p-4 flex flex-col', grad)}>
          <span className="self-start text-[10px] font-bold bg-white/20 text-white border border-white/30 rounded-full px-2 py-0.5 mb-2">{tag}</span>
          <div className="flex-1 flex flex-col justify-center text-white">{front}</div>
        </div>
        <div className="flip-card-back rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4 flex flex-col justify-center shadow-md">
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

  // Index pointers into each pool (round-robin)
  const vIdx = useRef(0)
  const mIdx = useRef(0)

  // 8 card slots: 0-3 vocab, 4-7 mcq
  const [cards, setCards] = useState<(CardData | null)[]>(Array(8).fill(null))

  useEffect(() => {
    if (!vocabPool.length && !mcqPool.length) return
    setCards(prev => prev.map((c, i) => {
      if (c !== null) return c
      if (i < 4 && vocabPool.length) {
        const v = vocabPool[vIdx.current % vocabPool.length]
        vIdx.current++
        return { kind: 'vocab', word: v.word, meaning: v.meaning } as CardData
      }
      if (i >= 4 && mcqPool.length) {
        const m = mcqPool[mIdx.current % mcqPool.length]
        mIdx.current++
        return { kind: 'mcq', ...m } as CardData
      }
      return c
    }))
  }, [vocabPool, mcqPool])

  const advanceCard = useCallback((i: number) => {
    setCards(prev => {
      const next = [...prev]
      if (i < 4 && vocabPool.length) {
        const v = vocabPool[vIdx.current % vocabPool.length]
        vIdx.current++
        next[i] = { kind: 'vocab', word: v.word, meaning: v.meaning }
      } else if (i >= 4 && mcqPool.length) {
        const m = mcqPool[mIdx.current % mcqPool.length]
        mIdx.current++
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
        <h2 className="section-title mb-0 flex items-center gap-2">
          <BookOpen size={20} className="text-primary" />
          Daily Flash 8-Pack
          <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">Flip for answer</span>
        </h2>
        <button onClick={refresh} className="btn-ghost btn-sm text-gray-400 gap-1.5">
          <RotateCcw size={14} /> New Set
        </button>
      </div>

      <div className="mb-2 flex gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-gradient-to-r from-indigo-500 to-violet-500 inline-block" /> Cards 1–4: GRE Vocab</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: `linear-gradient(to right, ${TEAL}, #2D9E95)` }} /> Cards 5–8: MCQ</span>
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

/* ════════════════════════════════════════════════════════
   3. MCQ BROWSER (subject filter + correct highlighted)
   ════════════════════════════════════════════════════════ */
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

  const mcqs: BrowseMcq[]  = (data as any)?.items ?? []
  const total: number       = (data as any)?.total ?? 0
  const pages: number       = (data as any)?.pages ?? 1

  const OPTS: ['A','B','C','D'] = ['A','B','C','D']

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="section-title mb-0">📖 Question Bank</h2>
        <div className="flex items-center gap-2">
          <select value={subject} onChange={e => { setSubject(e.target.value); setPage(1) }}
            className="select text-sm py-1.5 h-9">
            <option value="">All Subjects</option>
            {(subjects as any[]).map((s: any) => (
              <option key={s.subject} value={s.subject}>{s.subject} ({s.count})</option>
            ))}
          </select>
          <span className="text-xs text-gray-400 whitespace-nowrap">{total} questions</span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-28 skeleton" />)}</div>
      ) : mcqs.length === 0 ? (
        <div className="card p-8 text-center text-gray-400 text-sm">No questions found.</div>
      ) : (
        <>
          <div className="space-y-3">
            {mcqs.map((m, idx) => {
              const correct = m.correct?.toUpperCase()
              return (
                <div key={m.id} className="card p-4 hover:shadow-sm transition-shadow">
                  {/* Question header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white leading-relaxed flex-1">
                      <span className="text-primary font-bold mr-2">{(page - 1) * 10 + idx + 1}.</span>
                      {m.question}
                    </p>
                    <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full text-white whitespace-nowrap"
                      style={{ background: TEAL }}>{m.subject.split(' ')[0]}</span>
                  </div>
                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {OPTS.map(opt => {
                      const text = m[`option_${opt.toLowerCase()}` as keyof BrowseMcq] as string | null
                      if (!text) return null
                      const isCorrect = opt === correct
                      return (
                        <div key={opt} className={cn(
                          'flex items-start gap-2 px-3 py-2 rounded-lg text-xs font-medium',
                          isCorrect
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                            : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
                        )}>
                          <span className={cn('font-black shrink-0', isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary')}>
                            {opt}.
                          </span>
                          <span className="flex-1">{text}</span>
                          {isCorrect && <span className="shrink-0 text-emerald-500">✓</span>}
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
              <span className="px-3 py-1.5 text-xs font-bold bg-primary/10 text-primary rounded-lg">
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

/* ════════════════════════════════════════════════════════
   STAT CARD
   ════════════════════════════════════════════════════════ */
function StatCard({ icon, value, label, gradient, sub }: {
  icon: React.ReactNode; value: string | number; label: string; gradient: string; sub?: string
}) {
  return (
    <div className="stat-card">
      <div className={cn('stat-icon', gradient)}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ════════════════════════════════════════════════════════ */
export function Dashboard() {
  const user = useAuthStore((s) => s.user)

  const { data: summary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn:  () => dashboardApi.summary().then(r => r.data),
  })

  const { data: carouselItems = [] } = useQuery<CarouselItem[]>({
    queryKey: ['dashboard-carousel'],
    queryFn:  () => dashboardApi.carousel().then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.name.split(' ')[0] || ''

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── Welcome strip ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-gray-400 text-sm">{greeting}{firstName ? `, ${firstName}` : ''} 👋</p>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">
            {user
              ? `Ready to ace ${user.profile?.exam_type || 'CSS'} ${user.profile?.exam_year || ''}?`
              : 'Start your CSS/PMS journey'}
          </h1>
        </div>
        {(summary as any)?.days_to_exam != null && (
          <div className="flex items-center gap-3 bg-[#1D6660]/10 dark:bg-[#1D6660]/20 rounded-2xl px-5 py-3 border border-[#1D6660]/20">
            <div className="text-center">
              <p className="text-3xl font-black text-[#1D6660] dark:text-teal-400">{(summary as any).days_to_exam}</p>
              <p className="text-xs text-gray-500 font-medium">Days to Exam</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Hero Carousel ── */}
      <HeroCarousel items={carouselItems} />

      {/* ── Stats row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={<Flame size={22} className="text-orange-500" />}
          gradient="bg-orange-50 dark:bg-orange-900/20"
          value={(summary as any)?.streak ?? 0} label="Day Streak" sub="Keep it going!" />
        <StatCard icon={<Target size={22} className="text-primary" />}
          gradient="bg-primary/10"
          value={user?.profile?.exam_year ?? '—'} label="Target Year" sub={user?.profile?.exam_type || 'CSS'} />
        <StatCard icon={<TrendingUp size={22} className="text-green-500" />}
          gradient="bg-green-50 dark:bg-green-900/20"
          value={user?.profile?.prep_level ?? 'Start'} label="Prep Level" sub="Keep improving" />
      </div>

      {/* ── Flash 8-Pack ── */}
      <FlashSection />

      {/* ── Question Browser ── */}
      <McqBrowser />

    </div>
  )
}
