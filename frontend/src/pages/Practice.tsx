import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { practiceApi } from '@/api/practice'
import { useDebounce } from '@/hooks/useDebounce'
import type { Mcq, QuizSubmitResponse, SubjectCount } from '@/types'
import { CheckCircle, XCircle, Download, RotateCcw, BookOpen, Search, Play, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ── Quiz ─────────────────────────────────────────────────── */
type QuizStep = 'config' | 'questions' | 'results'

const SUBJECT_ICONS: Record<string, string> = {
  'Current Affairs': '🌍',
  'Pakistan Affairs': '🇵🇰',
  'Islamic Studies': '☪️',
  'English (Precis & Composition)': '✍️',
  'General Science & Ability': '🔬',
}

function QuizTab() {
  const [step, setStep] = useState<QuizStep>('config')
  const [subject, setSubject] = useState('mix')
  const [count, setCount] = useState(10)
  const [questions, setQuestions] = useState<Mcq[]>([])
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [result, setResult] = useState<QuizSubmitResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)

  const { data: subjects = [] } = useQuery<SubjectCount[]>({
    queryKey: ['practice-subjects'],
    queryFn: () => practiceApi.subjects().then((r) => r.data),
  })

  // 'mix' → backend mixes all subjects; display label used for submit/PDF title
  const displaySubject = subject === 'mix' ? 'Mixed Subjects' : subject

  const startQuiz = async () => {
    if (!subject) {
      setShake(true)
      setTimeout(() => setShake(false), 600)
      return
    }
    setLoading(true)
    try {
      const res = await practiceApi.startQuiz(subject, count, 'random')
      setQuestions(res.data.questions); setAnswers({}); setStep('questions')
    } finally { setLoading(false) }
  }

  const submitQuiz = async () => {
    const ans = Object.entries(answers).map(([id, sel]) => ({ mcq_id: Number(id), selected: sel }))
    setLoading(true)
    try {
      const res = await practiceApi.submitQuiz(displaySubject, ans)
      setResult(res.data); setStep('results')
    } finally { setLoading(false) }
  }

  const downloadPdf = async () => {
    const ans = Object.entries(answers).map(([id, sel]) => ({ mcq_id: Number(id), selected: sel }))
    const res = await practiceApi.downloadPdf(displaySubject, ans)
    const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
    const a = document.createElement('a'); a.href = url; a.download = `quiz_${displaySubject}.pdf`; a.click()
    URL.revokeObjectURL(url)
  }

  /* Config step */
  if (step === 'config') return (
    <div className="space-y-6">
      {/* Subject row — single horizontal scrollable line */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="label mb-0 text-base">Choose Subject</label>
          {subject === 'mix'
            ? <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                Equal mix from all subjects
              </span>
            : subject
              ? <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                  {subjects.find(s => s.subject === subject)?.count ?? 0} questions available
                </span>
              : <span className="text-xs text-gray-400">Select a subject to begin</span>}
        </div>
        <div className={cn('flex gap-3 overflow-x-auto pb-2 -mx-1 px-1', shake && 'animate-shake')}>

          {/* Mix card — always first */}
          <button onClick={() => setSubject('mix')}
            className={cn(
              'shrink-0 w-36 rounded-2xl border-2 p-3.5 text-left transition-all duration-150',
              subject === 'mix'
                ? 'border-primary bg-primary text-white shadow-glow-sm'
                : 'border-dashed border-primary/40 bg-primary/5 dark:bg-primary/10 hover:border-primary hover:shadow-card',
            )}>
            <span className="text-2xl leading-none mb-2 block">🎲</span>
            <p className={cn('text-xs font-semibold leading-snug', subject === 'mix' ? 'text-white' : 'text-primary dark:text-teal-400')}>
              Mixed Subjects
            </p>
            <p className={cn('text-[11px] mt-1.5 font-medium', subject === 'mix' ? 'text-white/70' : 'text-primary/60 dark:text-teal-500')}>
              All subjects
            </p>
          </button>

          {subjects.map((s) => {
            const active = subject === s.subject
            return (
              <button key={s.subject} onClick={() => setSubject(s.subject)}
                className={cn(
                  'shrink-0 w-36 rounded-2xl border-2 p-3.5 text-left transition-all duration-150',
                  active
                    ? 'border-primary bg-primary text-white shadow-glow-sm'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-primary/50 hover:shadow-card',
                )}>
                <span className="text-2xl leading-none mb-2 block">{SUBJECT_ICONS[s.subject] || '📚'}</span>
                <p className={cn('text-xs font-semibold leading-snug line-clamp-2', active ? 'text-white' : 'text-gray-800 dark:text-gray-100')}>
                  {s.subject}
                </p>
                <p className={cn('text-[11px] mt-1.5 font-medium', active ? 'text-white/70' : 'text-gray-400')}>
                  {s.count} Qs
                </p>
              </button>
            )
          })}
        </div>
        {shake && !subject && (
          <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
            <span>⚠</span> Please select a subject first
          </p>
        )}
      </div>

      {/* Count slider + Start in a tidy row */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Number of Questions</label>
            <span className="badge-primary text-base font-black px-3 py-1">{count}</span>
          </div>
          <input type="range" min={3} max={50} value={count} onChange={(e) => setCount(Number(e.target.value))}
            className="w-full h-2 accent-primary rounded-full cursor-pointer" />
          <div className="flex justify-between text-xs text-gray-400 mt-1"><span>3</span><span>50</span></div>
        </div>
        <button onClick={startQuiz} disabled={loading}
          className="btn-primary sm:w-44 py-3.5 text-base gap-2 shrink-0">
          <Play size={18} /> {loading ? 'Loading…' : 'Start Quiz'}
        </button>
      </div>
    </div>
  )

  /* Questions step */
  if (step === 'questions') {
    const answered = Object.keys(answers).length
    const allDone  = answered === questions.length
    const pct      = Math.round((answered / questions.length) * 100)
    return (
      <div className="space-y-5">
        {/* Progress bar — sticky, no buttons */}
        <div className="card p-4 sticky top-0 z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">
              {answered}/{questions.length} answered
              {allDone && <span className="ml-2 text-green-500 text-xs font-medium">✓ All done!</span>}
            </span>
            <span className="text-xs text-gray-400">{pct}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className={cn('h-full rounded-full transition-all duration-300', allDone ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-brand')}
              style={{ width: `${pct}%` }} />
          </div>
        </div>

        {questions.map((q, i) => (
          <div key={q.id} className="card p-5">
            <p className="font-semibold text-gray-900 dark:text-white mb-4 leading-relaxed">
              <span className="text-primary font-bold mr-2">Q{i + 1}.</span>{q.question}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                const text = q[`option_${opt.toLowerCase()}` as keyof Mcq] as string | null
                if (!text) return null
                const selected = answers[q.id] === opt
                return (
                  <button key={opt} onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                    className={cn(
                      'text-left px-4 py-3 rounded-xl border-2 text-sm transition-all duration-150 font-medium',
                      selected
                        ? 'border-primary bg-primary text-white shadow-glow-sm'
                        : 'border-gray-100 dark:border-gray-800 hover:border-primary/40 hover:bg-primary/5 text-gray-700 dark:text-gray-200'
                    )}>
                    <span className={cn('font-bold mr-2', selected ? 'text-white/80' : 'text-primary')}>{opt}.</span>
                    {text}
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {/* Bottom action bar */}
        <div className="card p-4 flex items-center justify-between gap-3">
          <button onClick={() => setStep('config')} className="btn-outline gap-2">
            <RotateCcw size={15} /> Restart
          </button>
          <button onClick={submitQuiz} disabled={loading || answered === 0}
            className={cn('flex-1 py-3 text-sm font-semibold gap-2 rounded-xl transition-all flex items-center justify-center',
              allDone
                ? 'bg-green-500 hover:bg-green-600 text-white shadow-md'
                : 'btn-primary')}>
            {loading ? <><RotateCcw size={15} className="animate-spin" /> Submitting…</> : allDone ? '🎯 Submit Quiz' : 'Submit Quiz'}
          </button>
        </div>
      </div>
    )
  }

  /* Results step */
  if (step === 'results' && result) {
    const pct = result.score_pct
    const color = pct >= 70 ? 'text-green-500' : pct >= 40 ? 'text-yellow-500' : 'text-red-500'
    const bgColor = pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-500'

    return (
      <div className="space-y-5">
        {/* Score card */}
        <div className="card p-6 text-center">
          <div className={cn('w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl font-black', bgColor)}>
            <Trophy className="text-white" size={36} />
          </div>
          <p className={cn('text-5xl font-black mb-1', color)}>{pct}%</p>
          <p className="text-gray-500 dark:text-gray-400 mb-1">{result.correct} correct out of {result.total}</p>
          <p className="text-sm text-gray-400">
            {pct >= 70 ? '🎉 Excellent! Keep up the great work!' : pct >= 40 ? '📚 Good effort! Review the wrong answers.' : '💪 Keep practicing, you will improve!'}
          </p>
          <div className="flex gap-3 mt-5">
            <button onClick={() => { setStep('config'); setResult(null) }} className="btn-outline flex-1">
              <RotateCcw size={14} /> New Quiz
            </button>
            <button onClick={downloadPdf} className="btn-primary flex-1">
              <Download size={14} /> PDF Report
            </button>
          </div>
        </div>

        {/* Answer review */}
        <h3 className="section-title">Answer Review</h3>
        {result.results.map((r, i) => (
          <div key={r.mcq_id} className={cn(
            'card p-4 border-l-4',
            r.is_correct ? 'border-l-green-500' : 'border-l-red-500'
          )}>
            <div className="flex items-start gap-3">
              {r.is_correct
                ? <CheckCircle size={18} className="text-green-500 shrink-0 mt-0.5" />
                : <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Q{i + 1}. {r.question}</p>
                {!r.is_correct && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-red-500">
                      Your answer: <strong>{r.selected || 'None'}</strong>
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Correct: <strong>{r.correct}.</strong> {(r as unknown as Record<string,string>)[`option_${r.correct.toLowerCase()}`]}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return null
}

/* ── Question Bank ─────────────────────────────────────────── */
function QuestionBank() {
  const [subject, setSubject] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const dSearch = useDebounce(search)

  const { data: subjects = [] } = useQuery<SubjectCount[]>({
    queryKey: ['practice-subjects'],
    queryFn: () => practiceApi.subjects().then((r) => r.data),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['question-bank', subject, page, dSearch],
    queryFn: () => practiceApi.questionBank({ subject, page, per_page: 15, search: dSearch }).then((r) => r.data),
  })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select value={subject} onChange={(e) => { setSubject(e.target.value); setPage(1) }} className="select sm:w-60">
          <option value="">All Subjects</option>
          {subjects.map((s) => <option key={s.subject} value={s.subject}>{s.subject}</option>)}
        </select>
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search questions…" className="input pl-9" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-28 skeleton" />)}</div>
      ) : (
        <>
          {data?.items.map((q: Mcq, i: number) => (
            <div key={q.id} className="card p-5">
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3 leading-relaxed">
                <span className="text-primary font-bold mr-2">{(page - 1) * 15 + i + 1}.</span>{q.question}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(['a', 'b', 'c', 'd'] as const).map((opt) => {
                  const text = q[`option_${opt}` as keyof Mcq] as string | null
                  if (!text) return null
                  const isCorrect = q.correct.toLowerCase() === opt
                  return (
                    <div key={opt} className={cn(
                      'px-3 py-2 rounded-lg text-xs font-medium',
                      isCorrect
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    )}>
                      <span className="font-bold mr-1">{opt.toUpperCase()}.</span>{text}
                      {isCorrect && <span className="ml-1">✓</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {data && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-gray-500">{data.total} total questions</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="btn-outline btn-sm disabled:opacity-40">Prev</button>
                <span className="px-3 py-1.5 text-sm font-medium bg-primary/10 text-primary rounded-lg">{page} / {data.pages ?? 1}</span>
                <button onClick={() => setPage((p) => Math.min(data.pages ?? 1, p + 1))} disabled={page === (data.pages ?? 1)}
                  className="btn-outline btn-sm disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ── Main page ─────────────────────────────────────────────── */
export function Practice() {
  const [tab, setTab] = useState<'quiz' | 'bank'>('quiz')

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2"><BookOpen size={26} className="text-primary" /> Practice</h1>
        <p className="page-sub">MCQ quiz mode or browse the full question bank</p>
      </div>

      <div className="tabs w-fit">
        <button onClick={() => setTab('quiz')} className={tab === 'quiz' ? 'tab-active' : 'tab'}>
          🎯 MCQ Quiz
        </button>
        <button onClick={() => setTab('bank')} className={tab === 'bank' ? 'tab-active' : 'tab'}>
          📚 Question Bank
        </button>
      </div>

      {tab === 'quiz' ? <QuizTab /> : <QuestionBank />}
    </div>
  )
}
