import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { Calendar, CheckCircle2, Circle, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Month { month: number; label: string; focus: string; tasks: string[] }
interface SubjectMilestone { subject: string; milestones: string[] }

const MONTH_COLORS = [
  'from-blue-500 to-indigo-500',
  'from-violet-500 to-purple-500',
  'from-pink-500 to-rose-500',
  'from-orange-500 to-amber-500',
  'from-green-500 to-emerald-500',
  'from-teal-500 to-cyan-500',
  'from-sky-500 to-blue-500',
  'from-indigo-500 to-violet-500',
  'from-purple-500 to-pink-500',
  'from-rose-500 to-red-500',
  'from-amber-500 to-yellow-500',
  'from-lime-500 to-green-500',
]

const SUBJECT_ICONS: Record<string, string> = {
  'Essay': '✍️',
  'English (Precis & Composition)': '📝',
  'General Science & Ability': '🔬',
  'Current Affairs': '🌍',
  'Pakistan Affairs': '🇵🇰',
  'Islamic Studies': '☪️',
}

export function StudyPlan() {
  const currentMonth = new Date().getMonth() + 1

  const { data: calendar = [] } = useQuery<Month[]>({
    queryKey: ['study-calendar'],
    queryFn: () => apiClient.get('/api/studyplan/calendar').then((r) => r.data),
  })
  const { data: milestones = [] } = useQuery<SubjectMilestone[]>({
    queryKey: ['study-milestones'],
    queryFn: () => apiClient.get('/api/studyplan/milestones').then((r) => r.data),
  })

  const currentPlan = calendar.find((m) => m.month === currentMonth)

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2"><Calendar size={26} className="text-blue-500" /> Study Plan</h1>
        <p className="page-sub">Your 12-month preparation roadmap for CSS/PMS success</p>
      </div>

      {/* Current month highlight */}
      {currentPlan && (
        <div className="bg-gradient-brand rounded-3xl p-6 text-white shadow-glow">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={18} className="text-yellow-300" />
            <span className="text-sm font-semibold text-white/80">This Month — {currentPlan.label}</span>
          </div>
          <h2 className="text-xl font-bold mb-3">{currentPlan.focus}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {currentPlan.tasks.map((t) => (
              <div key={t} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex items-center gap-2 border border-white/20">
                <CheckCircle2 size={15} className="text-green-300 shrink-0" />
                <span className="text-sm text-white/90">{t}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full 12-month timeline */}
      <section>
        <h2 className="section-title">Full 12-Month Timeline</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {calendar.map((m, idx) => {
            const isCurrent = m.month === currentMonth
            const isPast = m.month < currentMonth
            return (
              <div key={m.month} className={cn(
                'card p-5 transition-all duration-200',
                isCurrent ? 'ring-2 ring-primary shadow-glow-sm' : ''
              )}>
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
                  {m.tasks.map((t) => (
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
      </section>

      {/* Subject milestones */}
      <section>
        <h2 className="section-title">Subject Milestones</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {milestones.map((sm) => (
            <div key={sm.subject} className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">{SUBJECT_ICONS[sm.subject] || '📚'}</span>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">{sm.subject}</h3>
              </div>
              <ul className="space-y-2.5">
                {sm.milestones.map((m, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                    <Circle size={12} className="shrink-0 text-gray-200 dark:text-gray-700" />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
