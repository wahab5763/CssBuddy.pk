import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import {
  Calendar, CheckCircle2, Circle, Lightbulb, Sparkles,
  Download, RotateCcw, BookOpen, Clock, Target,
  ChevronLeft, ChevronRight, Filter, Settings2,
} from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { cn } from '@/lib/utils'

/* ── Types ──────────────────────────────────────────────── */
interface Month      { month: number; label: string; focus: string; tasks: string[] }
interface DayEntry   { day: number; date: string; subject: string; topic: string; hours: number; tasks: string[]; done: boolean }
interface PlanStats  { total_days: number; total_hours: number; topic_count: number; exam_date: string; subjects: string[] }
interface PlanResult { days: DayEntry[]; stats: PlanStats }

/* ── Colour tokens ──────────────────────────────────────── */
const TEAL = '#1D6660'

const SUBJECT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  /* ── Compulsory ── */
  'Essay':                              { bg: 'bg-purple-50 dark:bg-purple-900/20',   text: 'text-purple-700 dark:text-purple-300',   dot: 'bg-purple-400'  },
  'English (Precis & Composition)':    { bg: 'bg-blue-50 dark:bg-blue-900/20',       text: 'text-blue-700 dark:text-blue-300',       dot: 'bg-blue-400'    },
  'General Science & Ability':         { bg: 'bg-orange-50 dark:bg-orange-900/20',   text: 'text-orange-700 dark:text-orange-300',   dot: 'bg-orange-400'  },
  'Pakistan Affairs':                   { bg: 'bg-green-50 dark:bg-green-900/20',     text: 'text-green-700 dark:text-green-300',     dot: 'bg-green-400'   },
  'Islamic Studies':                    { bg: 'bg-teal-50 dark:bg-teal-900/20',       text: 'text-teal-700 dark:text-teal-300',       dot: 'bg-teal-400'    },
  'Current Affairs':                    { bg: 'bg-sky-50 dark:bg-sky-900/20',         text: 'text-sky-700 dark:text-sky-300',         dot: 'bg-sky-400'     },
  /* ── Social Sciences ── */
  'International Relations':            { bg: 'bg-indigo-50 dark:bg-indigo-900/20',   text: 'text-indigo-700 dark:text-indigo-300',   dot: 'bg-indigo-400'  },
  'Political Science':                  { bg: 'bg-rose-50 dark:bg-rose-900/20',       text: 'text-rose-700 dark:text-rose-300',       dot: 'bg-rose-400'    },
  'Sociology':                          { bg: 'bg-pink-50 dark:bg-pink-900/20',       text: 'text-pink-700 dark:text-pink-300',       dot: 'bg-pink-400'    },
  'Public Administration':              { bg: 'bg-cyan-50 dark:bg-cyan-900/20',       text: 'text-cyan-700 dark:text-cyan-300',       dot: 'bg-cyan-400'    },
  'Psychology':                         { bg: 'bg-violet-50 dark:bg-violet-900/20',   text: 'text-violet-700 dark:text-violet-300',   dot: 'bg-violet-400'  },
  'Gender Studies':                     { bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20', text: 'text-fuchsia-700 dark:text-fuchsia-300', dot: 'bg-fuchsia-400' },
  'Philosophy':                         { bg: 'bg-purple-50 dark:bg-purple-900/20',   text: 'text-purple-700 dark:text-purple-300',   dot: 'bg-purple-400'  },
  'Criminology':                        { bg: 'bg-red-50 dark:bg-red-900/20',         text: 'text-red-700 dark:text-red-300',         dot: 'bg-red-400'     },
  /* ── Economics & Business ── */
  'Economics':                          { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-400' },
  'Business Administration':            { bg: 'bg-sky-50 dark:bg-sky-900/20',         text: 'text-sky-700 dark:text-sky-300',         dot: 'bg-sky-400'     },
  'Accounting & Auditing':              { bg: 'bg-amber-50 dark:bg-amber-900/20',     text: 'text-amber-700 dark:text-amber-300',     dot: 'bg-amber-400'   },
  'Statistics':                         { bg: 'bg-yellow-50 dark:bg-yellow-900/20',   text: 'text-yellow-700 dark:text-yellow-300',   dot: 'bg-yellow-400'  },
  'Computer Science':                   { bg: 'bg-blue-50 dark:bg-blue-900/20',       text: 'text-blue-700 dark:text-blue-300',       dot: 'bg-blue-400'    },
  /* ── Law ── */
  'Constitutional Law':                 { bg: 'bg-slate-50 dark:bg-slate-800',        text: 'text-slate-700 dark:text-slate-300',     dot: 'bg-slate-400'   },
  'International Law':                  { bg: 'bg-indigo-50 dark:bg-indigo-900/20',   text: 'text-indigo-700 dark:text-indigo-300',   dot: 'bg-indigo-400'  },
  'Muslim Law & Jurisprudence':         { bg: 'bg-teal-50 dark:bg-teal-900/20',       text: 'text-teal-700 dark:text-teal-300',       dot: 'bg-teal-400'    },
  /* ── History & Culture ── */
  'Islamic History & Culture':          { bg: 'bg-orange-50 dark:bg-orange-900/20',   text: 'text-orange-700 dark:text-orange-300',   dot: 'bg-orange-400'  },
  'History of Pakistan & India':        { bg: 'bg-green-50 dark:bg-green-900/20',     text: 'text-green-700 dark:text-green-300',     dot: 'bg-green-400'   },
  /* ── Languages & Literature ── */
  'English Literature':                 { bg: 'bg-violet-50 dark:bg-violet-900/20',   text: 'text-violet-700 dark:text-violet-300',   dot: 'bg-violet-400'  },
  'Urdu':                               { bg: 'bg-rose-50 dark:bg-rose-900/20',       text: 'text-rose-700 dark:text-rose-300',       dot: 'bg-rose-400'    },
  'Arabic':                             { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-400' },
  'Persian':                            { bg: 'bg-amber-50 dark:bg-amber-900/20',     text: 'text-amber-700 dark:text-amber-300',     dot: 'bg-amber-400'   },
  /* ── Geography & Environment ── */
  'Geography':                          { bg: 'bg-lime-50 dark:bg-lime-900/20',       text: 'text-lime-700 dark:text-lime-300',       dot: 'bg-lime-400'    },
  'Environmental Science':              { bg: 'bg-green-50 dark:bg-green-900/20',     text: 'text-green-700 dark:text-green-300',     dot: 'bg-green-400'   },
  'Agriculture & Forestry':             { bg: 'bg-lime-50 dark:bg-lime-900/20',       text: 'text-lime-700 dark:text-lime-300',       dot: 'bg-lime-400'    },
  /* ── Mathematics ── */
  'Pure Mathematics':                   { bg: 'bg-cyan-50 dark:bg-cyan-900/20',       text: 'text-cyan-700 dark:text-cyan-300',       dot: 'bg-cyan-400'    },
  'Applied Mathematics':                { bg: 'bg-sky-50 dark:bg-sky-900/20',         text: 'text-sky-700 dark:text-sky-300',         dot: 'bg-sky-400'     },
  /* ── Media ── */
  'Journalism & Mass Communication':    { bg: 'bg-pink-50 dark:bg-pink-900/20',       text: 'text-pink-700 dark:text-pink-300',       dot: 'bg-pink-400'    },
  /* ── System ── */
  'Revision':                           { bg: 'bg-gray-50 dark:bg-gray-800',          text: 'text-gray-600 dark:text-gray-300',       dot: 'bg-gray-400'    },
}
const DEFAULT_COLOR = { bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-200', dot: 'bg-gray-400' }
const MONTH_COLORS  = ['from-teal-600 to-teal-400','from-teal-500 to-cyan-400','from-pink-500 to-rose-500','from-orange-500 to-amber-500','from-green-500 to-emerald-500','from-teal-500 to-cyan-500','from-sky-500 to-blue-500','from-teal-700 to-teal-500','from-cyan-600 to-teal-400','from-rose-500 to-red-500','from-amber-500 to-yellow-500','from-lime-500 to-green-500']

const COMPULSORY_SUBJECTS = [
  'Essay', 'English (Precis & Composition)', 'General Science & Ability',
  'Pakistan Affairs', 'Islamic Studies', 'Current Affairs',
]

const OPTIONAL_GROUPS: { label: string; subjects: string[] }[] = [
  {
    label: 'Social Sciences',
    subjects: ['International Relations', 'Political Science', 'Sociology', 'Public Administration', 'Psychology', 'Gender Studies', 'Philosophy', 'Criminology'],
  },
  {
    label: 'Economics & Business',
    subjects: ['Economics', 'Business Administration', 'Accounting & Auditing', 'Statistics', 'Computer Science'],
  },
  {
    label: 'Law',
    subjects: ['Constitutional Law', 'International Law', 'Muslim Law & Jurisprudence'],
  },
  {
    label: 'History & Culture',
    subjects: ['Islamic History & Culture', 'History of Pakistan & India'],
  },
  {
    label: 'Languages & Literature',
    subjects: ['English Literature', 'Urdu', 'Arabic', 'Persian'],
  },
  {
    label: 'Geography & Environment',
    subjects: ['Geography', 'Environmental Science', 'Agriculture & Forestry'],
  },
  {
    label: 'Journalism & Media',
    subjects: ['Journalism & Mass Communication'],
  },
  {
    label: 'Mathematics',
    subjects: ['Pure Mathematics', 'Applied Mathematics'],
  },
]

const CSS_OPTIONAL_SUBJECTS = OPTIONAL_GROUPS.flatMap(g => g.subjects)
const CSS_SUBJECTS = [...COMPULSORY_SUBJECTS, ...CSS_OPTIONAL_SUBJECTS]

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' })
}

/* ── Reusable compact chip ───────────────────────────────── */
function SubjectChip({ s, on, onToggle }: { s: string; on: boolean; onToggle: (s: string) => void }) {
  const col = SUBJECT_COLORS[s] ?? DEFAULT_COLOR
  return (
    <button onClick={() => onToggle(s)}
      className={cn(
        'text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all leading-5',
        on
          ? `${col.bg} ${col.text} border-current`
          : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gray-400 dark:hover:border-gray-500',
      )}>
      {on && <span className={cn('inline-block w-1 h-1 rounded-full mr-0.5 align-middle', col.dot)} />}
      {s}
    </button>
  )
}

/* ════════════════════════════════════════════════════
   STAT CARD
   ════════════════════════════════════════════════════ */
function StatPill({ icon, value, label, color }: { icon: React.ReactNode; value: string | number; label: string; color: string }) {
  return (
    <div className={cn('flex items-center gap-3 rounded-2xl px-4 py-3 border', color)}>
      <div className="shrink-0">{icon}</div>
      <div>
        <p className="text-xl font-black leading-none">{value}</p>
        <p className="text-xs font-semibold mt-0.5 opacity-70">{label}</p>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════
   PLAN GENERATOR FORM
   ════════════════════════════════════════════════════ */
function PlanGenerator({ onGenerated, wide = false }: { onGenerated: (result: PlanResult) => void; wide?: boolean }) {
  const user = useAuthStore(s => s.user)

  const defaultExam = (() => {
    const y = new Date().getFullYear() + 1
    return `${y}-02-15`
  })()

  const [examDate,    setExamDate]    = useState(defaultExam)
  const [proficiency, setProficiency] = useState('Intermediate')
  const [hoursPerDay, setHoursPerDay] = useState(5)
  const [subjects,    setSubjects]    = useState<string[]>([...COMPULSORY_SUBJECTS])
  const [weakSubject, setWeakSubject] = useState('')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [generated,   setGenerated]   = useState(false)

  useEffect(() => {
    if (user?.optional_subjects?.length) {
      setSubjects(prev => [...new Set([...prev, ...user.optional_subjects])])
    }
  }, [user])

  const toggleSubject = (s: string) => {
    setSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  const generate = async () => {
    if (!examDate || subjects.length === 0) { setError('Please set exam date and select subjects.'); return }
    setError(''); setLoading(true)
    try {
      const res = await apiClient.post('/api/studyplan/generate', {
        exam_date: examDate, proficiency, subjects,
        weak_subject: weakSubject || null, hours_per_day: hoursPerDay,
      })
      onGenerated(res.data as PlanResult)
      setGenerated(true)
    } catch {
      setError('Failed to generate plan. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const daysLeft   = examDate ? Math.max(0, Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000)) : 0
  const compCount  = subjects.filter(s => COMPULSORY_SUBJECTS.includes(s)).length
  const optCount   = subjects.filter(s => !COMPULSORY_SUBJECTS.includes(s)).length
  const userOpts    = user?.optional_subjects ?? []
  const moreGroups  = OPTIONAL_GROUPS
    .map(g => ({ ...g, subjects: g.subjects.filter(s => !userOpts.includes(s)) }))
    .filter(g => g.subjects.length > 0)

  /* ── Collapsed summary (shown after first generation) ── */
  if (generated) {
    const summaryRows = [
      { icon: <Calendar size={12} className="text-primary shrink-0" />, text: new Date(examDate).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) + ` · ${daysLeft}d left` },
      { icon: <Clock     size={12} className="text-primary shrink-0" />, text: `${hoursPerDay}h / day · ${proficiency}` },
      { icon: <BookOpen  size={12} className="text-primary shrink-0" />, text: `${subjects.length} subjects (${compCount} compulsory + ${optCount} optional)` },
      ...(weakSubject ? [{ icon: <Target size={12} className="text-orange-400 shrink-0" />, text: `Focus: ${weakSubject}` }] : []),
    ]
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
          {summaryRows.map((row, i) => (
            <div key={i} className="flex items-start gap-2.5 px-3 py-2 bg-gray-50/60 dark:bg-gray-800/30">
              <span className="mt-0.5">{row.icon}</span>
              <span className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{row.text}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setGenerated(false)}
            className="btn-outline btn-sm gap-1.5 text-xs justify-center">
            <Settings2 size={12} /> Edit Settings
          </button>
          <button onClick={generate} disabled={loading}
            className="btn-primary btn-sm gap-1.5 text-xs justify-center">
            {loading
              ? <RotateCcw size={12} className="animate-spin" />
              : <RotateCcw size={12} />}
            Regenerate
          </button>
        </div>
        {error && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</p>}
      </div>
    )
  }

  /* ── Full form — shared input blocks ── */
  const motivationMsg =
    daysLeft > 240 ? 'Great head-start — use every day!' :
    daysLeft > 120 ? 'Solid time ahead — stay consistent!' :
    daysLeft > 60  ? 'Time to get serious — focus!' :
    daysLeft > 0   ? 'Crunch time — every hour counts!' : ''

  const examInputs = (
    <>
      <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)}
        min={new Date().toISOString().split('T')[0]}
        className="input text-xs py-1.5 w-full" />
      {daysLeft > 0 && (
        <div className="mt-2 flex items-center gap-2.5 px-3 py-2 bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-100 dark:border-teal-900/40">
          <Calendar size={14} className="text-teal-600 dark:text-teal-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-black text-teal-700 dark:text-teal-300 leading-none">{daysLeft} days remaining</p>
            <p className="text-[10px] text-teal-500/80 dark:text-teal-500 mt-0.5">{motivationMsg}</p>
          </div>
        </div>
      )}
    </>
  )

  const commitmentInputs = (
    <>
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-0.5">
            <Clock size={10} className="mr-0.5" /> Study hours / day
          </span>
          <span className="text-xs font-black text-primary tabular-nums">
            {hoursPerDay}h {hoursPerDay >= 5 && hoursPerDay <= 7 ? '✓' : ''}
          </span>
        </div>
        <input type="range" min={2} max={12} value={hoursPerDay}
          onChange={e => setHoursPerDay(Number(e.target.value))}
          className="w-full h-1.5 accent-primary rounded-full cursor-pointer" />
        <div className="flex justify-between text-[9px] mt-0.5">
          <span className="text-gray-400">2h light</span>
          <span className="text-teal-500 font-semibold">5–6h ideal</span>
          <span className="text-gray-400">12h max</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { key: 'Beginner',     sub: 'Starting fresh'   },
          { key: 'Intermediate', sub: 'Some prep done'   },
          { key: 'Advanced',     sub: 'Well prepared'    },
        ].map(({ key, sub }) => (
          <button key={key} onClick={() => setProficiency(key)}
            className={cn(
              'py-2 px-1 rounded-xl text-center border-2 transition-all',
              proficiency === key
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300',
            )}>
            <p className={cn('text-[10px] font-bold leading-tight', proficiency === key ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300')}>{key}</p>
            <p className="text-[9px] text-gray-400 leading-tight mt-0.5">{sub}</p>
          </button>
        ))}
      </div>
    </>
  )

  const subjectInputs = (
    <>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-gray-400">Active subjects</span>
        <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
          {compCount}C + {optCount}O
        </span>
      </div>
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="max-h-44 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
          <div className="p-2.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5">Compulsory (6)</p>
            <div className="flex flex-wrap gap-1">
              {COMPULSORY_SUBJECTS.map(s => (
                <SubjectChip key={s} s={s} on={subjects.includes(s)} onToggle={toggleSubject} />
              ))}
            </div>
          </div>
          {userOpts.length > 0 && (
            <div className="p-2.5">
              <p className="text-[9px] font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400 mb-1.5 flex items-center gap-0.5">
                <Sparkles size={8} /> Your Optionals
              </p>
              <div className="flex flex-wrap gap-1">
                {userOpts.map(s => (
                  <SubjectChip key={s} s={s} on={subjects.includes(s)} onToggle={toggleSubject} />
                ))}
              </div>
            </div>
          )}
          {moreGroups.map(group => (
            <div key={group.label} className="p-2.5">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5">{group.label}</p>
              <div className="flex flex-wrap gap-1">
                {group.subjects.map(s => (
                  <SubjectChip key={s} s={s} on={subjects.includes(s)} onToggle={toggleSubject} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )

  const weakInputs = (
    <select value={weakSubject} onChange={e => setWeakSubject(e.target.value)} className="select text-xs">
      <option value="">None — equally balanced plan</option>
      {compCount > 0 && (
        <optgroup label="Compulsory">
          {subjects.filter(s => COMPULSORY_SUBJECTS.includes(s)).map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </optgroup>
      )}
      {optCount > 0 && (
        <optgroup label="Optional">
          {subjects.filter(s => !COMPULSORY_SUBJECTS.includes(s)).map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </optgroup>
      )}
    </select>
  )

  const generateBtn = (
    <button onClick={generate} disabled={loading} className="btn-primary w-full py-3 text-sm gap-2">
      {loading
        ? <><RotateCcw size={14} className="animate-spin" /> Generating…</>
        : <><Sparkles size={14} /> Generate My Plan</>}
    </button>
  )

  /* ── Wide mode: 2×2 grid (before plan is generated) ── */
  if (wide) {
    return (
      <div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">

          {/* Step 1 — blue */}
          <div className="rounded-2xl border p-4 shadow-sm" style={{ background: '#50c878', borderColor: '#3aaf60' }}>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-7 h-7 rounded-full text-white text-[11px] font-black flex items-center justify-center shrink-0 shadow-lg ring-[3px] ring-white/50 bg-gradient-to-br from-teal-500 to-emerald-500">1</span>
              <p className="text-sm font-black leading-none tracking-tight bg-gradient-to-r from-teal-700 to-emerald-600 bg-clip-text text-transparent">
                Target Exam Date
              </p>
            </div>
            <p className="text-[11px] text-gray-800 dark:text-gray-800 mb-3 leading-relaxed">
              We'll count every remaining day and build a day-by-day schedule right up to your exam.
            </p>
            <div className="bg-white/60 rounded-xl p-2.5">{examInputs}</div>
          </div>

          {/* Step 2 — blue/indigo */}
          <div className="rounded-2xl border p-4 shadow-sm" style={{ background: '#50c878', borderColor: '#3aaf60' }}>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-7 h-7 rounded-full text-white text-[11px] font-black flex items-center justify-center shrink-0 shadow-lg ring-[3px] ring-white/50 bg-gradient-to-br from-blue-500 to-indigo-600">2</span>
              <p className="text-sm font-black leading-none tracking-tight bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
                Daily Commitment
              </p>
            </div>
            <p className="text-[11px] text-gray-800 dark:text-gray-800 mb-3 leading-relaxed">
              CSS rewards consistency over cramming. 5–6 h/day is the sweet spot. Be honest about your level.
            </p>
            <div className="bg-white/60 rounded-xl p-2.5">{commitmentInputs}</div>
          </div>

          {/* Step 3 — blue */}
          <div className="rounded-2xl border p-4 shadow-sm" style={{ background: '#50c878', borderColor: '#3aaf60' }}>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-7 h-7 rounded-full text-white text-[11px] font-black flex items-center justify-center shrink-0 shadow-lg ring-[3px] ring-white/50 bg-gradient-to-br from-purple-500 to-violet-600">3</span>
              <p className="text-sm font-black leading-none tracking-tight bg-gradient-to-r from-purple-700 to-violet-600 bg-clip-text text-transparent">
                Select Your Subjects
              </p>
            </div>
            <p className="text-[11px] text-gray-800 dark:text-gray-800 mb-3 leading-relaxed">
              CSS has <strong className="text-gray-900 font-bold">6 compulsory</strong> papers plus optionals — each worth 200 marks. Tap to toggle.
            </p>
            <div className="bg-white/60 rounded-xl p-2.5">{subjectInputs}</div>
          </div>

          {/* Step 4 — blue */}
          <div className="rounded-2xl border p-4 shadow-sm" style={{ background: '#50c878', borderColor: '#3aaf60' }}>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-7 h-7 rounded-full text-white text-[11px] font-black flex items-center justify-center shrink-0 shadow-lg ring-[3px] ring-white/50 bg-gradient-to-br from-orange-500 to-amber-500">4</span>
              <p className="text-sm font-black leading-none tracking-tight bg-gradient-to-r from-orange-700 to-amber-600 bg-clip-text text-transparent">
                Strengthen One Subject
              </p>
              <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full border border-amber-300/70 shrink-0">
                Optional
              </span>
            </div>
            <p className="text-[11px] text-gray-800 dark:text-gray-800 mb-3 leading-relaxed">
              Anxious about a subject? It'll receive <strong className="text-gray-900 font-bold">1.5× more sessions</strong> than others.
            </p>
            <div className="bg-white/60 rounded-xl p-2.5">{weakInputs}</div>
          </div>
        </div>

        {error && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2 mb-3">{error}</p>}
        {generateBtn}
      </div>
    )
  }

  /* ── Narrow mode: single-column with connector lines ── */
  return (
    <div>

      {/* Step 1 */}
      <div className="flex gap-3 pb-5">
        <div className="flex flex-col items-center shrink-0">
          <div className="w-6 h-6 rounded-full bg-teal-600 text-white text-[10px] font-black flex items-center justify-center shadow-sm">1</div>
          <div className="w-px flex-1 bg-gradient-to-b from-teal-200 to-gray-100 dark:from-teal-900/60 dark:to-gray-800 mt-1.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">Target Exam Date</p>
          <p className="text-[11px] text-gray-400 mt-1 mb-2.5 leading-relaxed">
            We'll count every remaining day and build a day-by-day schedule right up to your exam.
          </p>
          {examInputs}
        </div>
      </div>

      {/* Step 2 */}
      <div className="flex gap-3 pb-5">
        <div className="flex flex-col items-center shrink-0">
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center shadow-sm">2</div>
          <div className="w-px flex-1 bg-gradient-to-b from-blue-200 to-gray-100 dark:from-blue-900/60 dark:to-gray-800 mt-1.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">Daily Commitment</p>
          <p className="text-[11px] text-gray-400 mt-1 mb-2.5 leading-relaxed">
            CSS rewards consistency over cramming. 5–6 h/day is the sweet spot for most aspirants. Be honest about your level.
          </p>
          {commitmentInputs}
        </div>
      </div>

      {/* Step 3 */}
      <div className="flex gap-3 pb-5">
        <div className="flex flex-col items-center shrink-0">
          <div className="w-6 h-6 rounded-full bg-purple-600 text-white text-[10px] font-black flex items-center justify-center shadow-sm">3</div>
          <div className="w-px flex-1 bg-gradient-to-b from-purple-200 to-gray-100 dark:from-purple-900/60 dark:to-gray-800 mt-1.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">Select Your Subjects</p>
          <p className="text-[11px] text-gray-400 mt-1 mb-2.5 leading-relaxed">
            CSS has <strong className="text-gray-600 dark:text-gray-300">6 compulsory</strong> papers (everyone sits these) plus optional papers — each worth 200 marks. Tap to toggle.
          </p>
          {subjectInputs}
        </div>
      </div>

      {/* Step 4 */}
      <div className="flex gap-3 pb-5">
        <div className="flex flex-col items-center shrink-0">
          <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center shadow-sm">4</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">Strengthen One Subject</p>
            <span className="text-[9px] font-semibold text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded-full border border-orange-200 dark:border-orange-800 shrink-0">
              Optional
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1 mb-2.5 leading-relaxed">
            Anxious about a particular subject? It'll receive <strong className="text-gray-600 dark:text-gray-300">1.5× more sessions</strong> than other subjects in your plan.
          </p>
          {weakInputs}
        </div>
      </div>

      {error && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2 mb-3">{error}</p>}
      {generateBtn}
    </div>
  )
}

/* ════════════════════════════════════════════════════
   PLAN TABLE (day-by-day)
   ════════════════════════════════════════════════════ */
const PAGE_SIZE = 15

function PlanTable({ result, storageKey }: { result: PlanResult; storageKey: string }) {
  const [filterSubject, setFilterSubject] = useState('All')
  const [page,          setPage]          = useState(1)
  const [done,          setDone]          = useState<Set<number>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(storageKey) || '[]')) } catch { return new Set() }
  })

  const toggleDone = (day: number) => {
    setDone(prev => {
      const next = new Set(prev)
      next.has(day) ? next.delete(day) : next.add(day)
      localStorage.setItem(storageKey, JSON.stringify([...next]))
      return next
    })
  }

  const allSubjects = ['All', ...new Set(result.days.map(d => d.subject))]

  const filtered = useMemo(() =>
    filterSubject === 'All' ? result.days : result.days.filter(d => d.subject === filterSubject),
    [result.days, filterSubject],
  )

  const pages     = Math.ceil(filtered.length / PAGE_SIZE)
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const doneCount = result.days.filter(d => done.has(d.day)).length
  const pct       = Math.round((doneCount / result.days.length) * 100)

  const downloadCsv = () => {
    const header = 'Day,Date,Subject,Topic,Hours,Tasks,Done'
    const rows = result.days.map(d =>
      [d.day, d.date, `"${d.subject}"`, `"${d.topic}"`, d.hours,
        `"${Array.isArray(d.tasks) ? d.tasks.join(' | ') : d.tasks}"`, done.has(d.day) ? 'Yes' : 'No'].join(','),
    )
    const csv  = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a    = document.createElement('a')
    a.href     = URL.createObjectURL(blob)
    a.download = `css_study_plan_${result.stats.exam_date}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatPill icon={<Calendar size={18} className="text-teal-600" />}
          value={result.stats.total_days} label="Study Days"
          color="bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300" />
        <StatPill icon={<Clock size={18} className="text-blue-600" />}
          value={`${result.stats.total_hours}h`} label="Total Hours"
          color="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300" />
        <StatPill icon={<BookOpen size={18} className="text-purple-600" />}
          value={result.stats.topic_count} label="Topics Covered"
          color="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300" />
        <StatPill icon={<CheckCircle2 size={18} className="text-green-600" />}
          value={`${pct}%`} label={`${doneCount}/${result.days.length} done`}
          color="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300" />
      </div>

      {/* Progress bar */}
      {doneCount > 0 && (
        <div>
          <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">{pct}% complete — {result.days.length - doneCount} days remaining</p>
        </div>
      )}

      {/* Subject filter tabs + download */}
      <div className="flex items-start gap-2">
        <div className="flex gap-1.5 flex-wrap flex-1">
          {allSubjects.map(s => {
            const col = SUBJECT_COLORS[s] ?? DEFAULT_COLOR
            return (
              <button key={s} onClick={() => { setFilterSubject(s); setPage(1) }}
                className={cn('text-xs font-semibold px-3 py-1 rounded-full border transition-all',
                  filterSubject === s
                    ? s === 'All' ? 'bg-[#1D6660] text-white border-transparent' : `${col.bg} ${col.text} border-current`
                    : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gray-400')}>
                {s !== 'All' && <span className={cn('inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle', col.dot)} />}{s}
              </button>
            )
          })}
        </div>
        <button onClick={downloadCsv} className="btn-outline btn-sm gap-1.5 shrink-0">
          <Download size={14} /> CSV
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide w-8" />
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Day / Date</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Subject</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Topic</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Tasks</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide w-16">Hrs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {pageItems.map(d => {
                const col      = SUBJECT_COLORS[d.subject] ?? DEFAULT_COLOR
                const isDone   = done.has(d.day)
                const taskList = Array.isArray(d.tasks) ? d.tasks : (d.tasks as string).split(' | ')
                return (
                  <tr key={d.day} className={cn('transition-colors', isDone ? 'opacity-50' : 'hover:bg-gray-50 dark:hover:bg-gray-800/40')}>
                    <td className="px-3 py-3">
                      <button onClick={() => toggleDone(d.day)} className="text-gray-300 hover:text-primary transition-colors">
                        {isDone
                          ? <CheckCircle2 size={16} className="text-green-500" />
                          : <Circle size={16} />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-gray-900 dark:text-white text-xs">Day {d.day}</p>
                      <p className="text-[11px] text-gray-400">{fmtDate(d.date)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg', col.bg, col.text)}>
                        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', col.dot)} />{d.subject}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className={cn('text-xs font-medium leading-snug', isDone ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200')}>
                        {d.topic}
                      </p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {taskList.map((t, i) => (
                          <span key={i} className="text-[10px] font-medium px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md">
                            {t.trim()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{d.hours}h</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <p className="text-xs text-gray-400">{filtered.length} days · page {page} of {pages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="btn-outline btn-sm disabled:opacity-40 gap-1">
                <ChevronLeft size={13} /> Prev
              </button>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                className="btn-outline btn-sm disabled:opacity-40 gap-1">
                Next <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════
   12-MONTH TIMELINE
   ════════════════════════════════════════════════════ */
function MonthTimeline() {
  const currentMonth = new Date().getMonth() + 1
  const { data: calendar = [] } = useQuery<Month[]>({
    queryKey: ['study-calendar'],
    queryFn:  () => apiClient.get('/api/studyplan/calendar').then(r => r.data),
  })
  const currentPlan = calendar.find(m => m.month === currentMonth)

  return (
    <div className="space-y-6">
      {currentPlan && (
        <div className="rounded-3xl p-6 text-white shadow-lg"
          style={{ background: `linear-gradient(135deg, ${TEAL}, #2D9E95)` }}>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={18} className="text-yellow-300" />
            <span className="text-sm font-semibold text-white/80">This Month — {currentPlan.label}</span>
          </div>
          <h2 className="text-xl font-bold mb-3">{currentPlan.focus}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {currentPlan.tasks.map(t => (
              <div key={t} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex items-center gap-2 border border-white/20">
                <CheckCircle2 size={15} className="text-green-300 shrink-0" />
                <span className="text-sm text-white/90">{t}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {calendar.map((m, idx) => {
          const isCurrent = m.month === currentMonth
          const isPast    = m.month < currentMonth
          return (
            <div key={m.month} className={cn('card p-5 transition-all duration-200', isCurrent ? 'ring-2 ring-primary shadow-glow-sm' : '')}>
              <div className="flex items-center justify-between mb-3">
                <div className={cn('flex items-center justify-center w-9 h-9 rounded-xl text-white text-sm font-bold bg-gradient-to-br', MONTH_COLORS[idx % MONTH_COLORS.length])}>
                  {m.month}
                </div>
                <div className="flex gap-2">
                  {isCurrent && <span className="badge bg-primary text-white">Current</span>}
                  {isPast && !isCurrent && <span className="badge-gray">Past</span>}
                </div>
              </div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-0.5">{m.label}</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white mb-3">{m.focus}</p>
              <ul className="space-y-1.5">
                {m.tasks.map(t => (
                  <li key={t} className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <CheckCircle2 size={12} className={cn('shrink-0 mt-0.5', isPast ? 'text-green-400' : 'text-gray-300 dark:text-gray-600')} />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════════ */
export function StudyPlan() {
  const user = useAuthStore(s => s.user)
  const [tab,    setTab]    = useState<'generator' | 'timeline'>('generator')
  const [result, setResult] = useState<PlanResult | null>(null)

  const storageKey = `study-plan-done-${user?.id ?? 'guest'}`

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        icon={<Calendar size={22} className="text-white" />}
        title="Study Plan"
        subtitle="Generate a personalised day-by-day CSS/PMS study plan and track your progress"
      />

      {/* Tab switcher */}
      <div className="tabs w-fit">
        <button onClick={() => setTab('generator')} className={tab === 'generator' ? 'tab-active' : 'tab'}>
          🎯 Plan Generator
        </button>
        <button onClick={() => setTab('timeline')} className={tab === 'timeline' ? 'tab-active' : 'tab'}>
          📅 12-Month Timeline
        </button>
      </div>

      {tab === 'timeline' && <MonthTimeline />}

      {tab === 'generator' && (
        <div className={result ? 'flex flex-col lg:flex-row gap-6' : 'space-y-6'}>

          {/* ── Form / summary panel — full-width initially, sidebar after plan generated ── */}
          <aside className={cn('shrink-0', result ? 'lg:w-72' : 'w-full')}>
            <div className={cn('card overflow-hidden', result && 'lg:sticky lg:top-4')}>
              {/* Gradient banner header */}
              <div className="px-5 py-4 text-white" style={{ background: 'linear-gradient(135deg, #5a7a47 0%, #87a96b 55%, #6e9058 100%)' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles size={13} className="text-yellow-300" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">4-Step Guide</span>
                </div>
                <p className="font-black text-base leading-tight">Personalised Timeline</p>
                <p className="text-[11px] text-white/60 mt-0.5">Follow the steps to build your plan</p>
              </div>
              <div className="p-5">
                <PlanGenerator onGenerated={r => setResult(r)} wide={!result} />
              </div>
            </div>
          </aside>

          {/* ── Plan table or placeholder ── */}
          <div className={result ? 'flex-1 min-w-0' : ''}>
            {result ? (
              <PlanTable result={result} storageKey={storageKey} />
            ) : (
              <div className="flex flex-col items-center justify-center h-48 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 gap-4 text-center px-6">
                <div className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: `${TEAL}15` }}>
                  <Calendar size={24} style={{ color: TEAL }} />
                </div>
                <div>
                  <p className="font-bold text-gray-700 dark:text-gray-200">Your plan appears here</p>
                  <p className="text-sm text-gray-400 mt-1">Complete all 4 steps and click <strong>Generate My Plan</strong></p>
                </div>
                <div className="flex gap-2 flex-wrap justify-center">
                  {['📅 Day-by-day schedule', '🎯 Subject-balanced', '✅ Tick off days', '📥 Download CSV'].map(f => (
                    <span key={f} className="text-xs px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-gray-500 shadow-sm">{f}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
