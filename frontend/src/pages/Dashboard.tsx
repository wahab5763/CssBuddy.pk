import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { dashboardApi } from '@/api/dashboard'
import { Flame, BookOpen, RefreshCw, TrendingUp, Target, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FlashcardData {
  question: string; correct: string; subject: string
  option_a: string | null; option_b: string | null
  option_c: string | null; option_d: string | null
}

function FlipCard({ q }: { q: FlashcardData }) {
  const [flipped, setFlipped] = useState(false)
  const opts: Record<string, string | null> = { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d }
  const answer = opts[q.correct]

  const subjectColors: Record<string, string> = {
    'Current Affairs': 'from-blue-500 to-cyan-400',
    'Pakistan Affairs': 'from-emerald-500 to-teal-400',
    'Islamic Studies':  'from-teal-600 to-teal-400',
    'English (Precis & Composition)': 'from-orange-500 to-amber-400',
    'General Science & Ability': 'from-pink-500 to-rose-400',
  }
  const grad = subjectColors[q.subject] || 'from-primary to-secondary'

  return (
    <div className="flip-card h-40 cursor-pointer" onClick={() => setFlipped((f) => !f)}>
      <div className={cn('flip-card-inner rounded-2xl', flipped && 'flipped')}>
        {/* Front */}
        <div className={cn('flip-card-front card p-4 flex flex-col justify-between h-40 rounded-2xl')}>
          <span className={cn('badge text-white bg-gradient-to-r text-[10px]', grad)}>
            {q.subject.split(' ')[0]}
          </span>
          <p className="text-sm text-gray-700 dark:text-gray-200 font-medium line-clamp-3 flex-1 my-2">{q.question}</p>
          <p className="text-xs text-gray-400 flex items-center gap-1"><Sparkles size={10} /> Tap to reveal</p>
        </div>
        {/* Back */}
        <div className={cn('flip-card-back rounded-2xl bg-gradient-to-br p-4 flex flex-col justify-between h-40', grad)}>
          <span className="text-white/70 text-xs font-semibold">Answer ({q.correct})</span>
          <p className="text-white font-bold text-sm leading-snug flex-1 my-2">{answer || q.correct}</p>
          <p className="text-white/60 text-xs">Tap to go back</p>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, value, label, gradient, sub }: {
  icon: React.ReactNode; value: string | number; label: string; gradient: string; sub?: string
}) {
  return (
    <div className="stat-card">
      <div className={cn('stat-icon', gradient)}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

const GREETINGS = ['Good morning', 'Good afternoon', 'Good evening']

export function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const qc = useQueryClient()

  const { data: summary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => dashboardApi.summary().then((r) => r.data),
  })

  const { data: flashcards = [], isLoading: loadingCards } = useQuery({
    queryKey: ['flashcards'],
    queryFn: () => dashboardApi.flashcards(8).then((r) => r.data),
  })

  const hour = new Date().getHours()
  const greeting = hour < 12 ? GREETINGS[0] : hour < 17 ? GREETINGS[1] : GREETINGS[2]
  const firstName = user?.name.split(' ')[0] || ''

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-brand p-6 sm:p-8 text-white shadow-glow">
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute -bottom-12 -right-4 w-32 h-32 bg-white/5 rounded-full" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm font-medium">{greeting}{firstName ? `, ${firstName}` : ''} 👋</p>
            <h1 className="text-2xl sm:text-3xl font-bold mt-1 leading-tight">
              {user
                ? `Ready to ace ${user.profile?.exam_type || 'CSS'} ${user.profile?.exam_year || ''}?`
                : 'Start your CSS/PMS journey'}
            </h1>
            <p className="text-white/70 text-sm mt-2">
              {summary?.quote || 'Every expert was once a beginner. Keep going!'}
            </p>
          </div>

          {summary?.days_to_exam != null && (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-4 text-center shrink-0 border border-white/20">
              <p className="text-4xl font-black">{summary.days_to_exam}</p>
              <p className="text-white/70 text-xs font-medium mt-0.5">Days to Exam</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<Flame size={22} className="text-orange-500" />}
          gradient="bg-orange-50 dark:bg-orange-900/20"
          value={summary?.streak ?? 0}
          label="Day Streak"
          sub="Keep it going!"
        />
        <StatCard
          icon={<Target size={22} className="text-primary" />}
          gradient="bg-primary/10 dark:bg-primary/20"
          value={user?.profile?.exam_year ?? '—'}
          label="Target Year"
          sub={user?.profile?.exam_type || 'CSS'}
        />
        <StatCard
          icon={<TrendingUp size={22} className="text-green-500" />}
          gradient="bg-green-50 dark:bg-green-900/20"
          value={user?.profile?.prep_level ?? 'Start'}
          label="Prep Level"
          sub="Keep improving"
        />
      </div>

      {/* Flashcards */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">
            <BookOpen size={20} className="text-primary" />
            Quick Flashcards
            <span className="badge-primary ml-1">Tap to flip</span>
          </h2>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ['flashcards'] })}
            className="btn-ghost btn-sm text-gray-500 gap-1.5">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {loadingCards ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => <div key={i} className="h-40 skeleton" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {flashcards.map((q: FlashcardData, i: number) => <FlipCard key={i} q={q} />)}
          </div>
        )}
      </section>
    </div>
  )
}
