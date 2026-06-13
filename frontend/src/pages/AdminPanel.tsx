import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/api/admin'
import { essayApi } from '@/api/essay'
import { AdminRoute } from '@/components/common/AdminRoute'
import { ShieldCheck, Users, BookOpen, PenLine, BarChart3, Upload, UserCheck, UserX, Globe } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const SUBJECTS = ['Current Affairs', 'Pakistan Affairs', 'Islamic Studies', 'General Science & Ability', 'English (Precis & Composition)', 'General Knowledge']

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <div className="stat-card">
      <div className={cn('stat-icon', color)}>{icon}</div>
      <div>
        <p className="text-2xl font-black text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </div>
  )
}

function OverviewTab() {
  const { data } = useQuery({ queryKey: ['admin-stats'], queryFn: () => adminApi.stats().then((r) => r.data) })
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <StatCard icon={<Users size={22} className="text-blue-500" />} label="Total Users" value={data?.users ?? '—'} color="bg-blue-50 dark:bg-blue-900/20" />
      <StatCard icon={<BookOpen size={22} className="text-teal-600" />} label="MCQs" value={data?.mcqs ?? '—'} color="bg-teal-50 dark:bg-teal-900/20" />
      <StatCard icon={<PenLine size={22} className="text-pink-500" />} label="Essays" value={data?.essays ?? '—'} color="bg-pink-50 dark:bg-pink-900/20" />
      <StatCard icon={<BarChart3 size={22} className="text-orange-500" />} label="Pending Essays" value={data?.essays_pending ?? '—'} color="bg-orange-50 dark:bg-orange-900/20" />
    </div>
  )
}

function UsersTab() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['admin-users'], queryFn: () => adminApi.users().then((r) => r.data) })
  const toggle = async (id: number) => { await adminApi.toggleUser(id); qc.invalidateQueries({ queryKey: ['admin-users'] }) }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">{data?.total ?? 0} registered users</p>
      {isLoading ? <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 skeleton" />)}</div> : (
        data?.items.map((u: { id: number; name: string; email: string; is_active: boolean; is_admin: boolean; exam_type: string; prep_level: string; created_at: string }) => (
          <div key={u.id} className="card flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center text-white font-bold text-sm shrink-0">
                {u.name[0]}
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900 dark:text-white">
                  {u.name} {u.is_admin && <span className="badge-primary text-[10px] ml-1">admin</span>}
                </p>
                <p className="text-xs text-gray-400">{u.email} · {u.exam_type} · {formatDate(u.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn('badge', u.is_active ? 'badge-green' : 'badge-red')}>{u.is_active ? 'Active' : 'Inactive'}</span>
              <button onClick={() => toggle(u.id)}
                className={cn('btn-sm rounded-xl px-3', u.is_active ? 'btn-danger' : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100')}>
                {u.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function EssaysTab() {
  const qc = useQueryClient()
  const [grading, setGrading] = useState<number | null>(null)
  const [score, setScore] = useState('')
  const [feedback, setFeedback] = useState('')

  const { data } = useQuery({ queryKey: ['admin-essays'], queryFn: () => essayApi.adminAll({}).then((r) => r.data) })

  const grade = async (id: number) => {
    await essayApi.grade(id, { score: Number(score), feedback, status: 'reviewed' })
    setGrading(null); setScore(''); setFeedback('')
    qc.invalidateQueries({ queryKey: ['admin-essays'] })
  }

  return (
    <div className="space-y-3">
      {(data?.items || []).map((e: { id: number; user: { name: string; email: string }; topic: { title: string; category: string } | null; status: string; score: number | null; submitted_at: string }) => (
        <div key={e.id} className={cn('card p-5 border-l-4', e.status === 'pending' ? 'border-l-yellow-400' : 'border-l-green-400')}>
          <div className="flex items-start justify-between">
            <div>
              <p className="font-bold text-sm text-gray-900 dark:text-white">{e.topic?.title || 'Untitled Essay'}</p>
              <p className="text-xs text-gray-400 mt-0.5">{e.user.name} · {e.topic?.category} · {formatDate(e.submitted_at)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn('badge', e.status === 'pending' ? 'badge-yellow' : 'badge-green')}>{e.status}</span>
              <button onClick={() => setGrading(grading === e.id ? null : e.id)} className="btn-primary btn-sm">
                {grading === e.id ? 'Cancel' : 'Grade'}
              </button>
            </div>
          </div>

          {grading === e.id && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
              <div>
                <label className="label">Score (0–100)</label>
                <input value={score} onChange={(e) => setScore(e.target.value)} type="number" min="0" max="100"
                  placeholder="85" className="input max-w-xs" />
              </div>
              <div>
                <label className="label">Feedback</label>
                <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3}
                  placeholder="Write detailed feedback for the student…" className="input resize-none" />
              </div>
              <button onClick={() => grade(e.id)} className="btn-primary gap-2">Save Grade</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function McqImportTab() {
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  const upload = async () => {
    if (!file) return
    setUploading(true)
    try {
      const res = await adminApi.uploadMcqs(subject, file)
      setMsg({ text: res.data.detail, ok: true })
      setFile(null)
    } catch {
      setMsg({ text: 'Upload failed. Check the file format.', ok: false })
    } finally { setUploading(false) }
  }

  return (
    <div className="max-w-lg space-y-5">
      <div className="card p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
        <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">Excel Format Required</p>
        <p className="text-xs text-blue-600 dark:text-blue-400">Columns: <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">question, option_a, option_b, option_c, option_d, correct</code></p>
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">The <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">correct</code> column should contain: A, B, C, or D</p>
      </div>

      <div>
        <label className="label">Subject</label>
        <select value={subject} onChange={(e) => setSubject(e.target.value)} className="select">
          {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <label className={cn(
        'flex flex-col items-center gap-3 p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all',
        file ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
      )}>
        <Upload size={24} className={file ? 'text-primary' : 'text-gray-400'} />
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {file ? file.name : 'Click to upload Excel file'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">.xlsx or .xls format</p>
        </div>
        <input type="file" accept=".xlsx,.xls" className="hidden"
          onChange={(e) => { setFile(e.target.files?.[0] || null); setMsg(null) }} />
      </label>

      <button onClick={upload} disabled={!file || uploading} className="btn-primary w-full py-3 gap-2">
        <Upload size={16} /> {uploading ? 'Importing…' : 'Import MCQs'}
      </button>

      {msg && (
        <div className={cn('p-4 rounded-xl text-sm font-medium', msg.ok ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400')}>
          {msg.ok ? '✅' : '❌'} {msg.text}
        </div>
      )}
    </div>
  )
}

interface ScrapeJob {
  status: 'running' | 'done' | 'error'
  added: number
  errors: number
  page: number
  total_pages: number
  subject: string
  message?: string
  last_error?: string
}

function ScrapeMcqsTab() {
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [pages, setPages] = useState(5)
  const [starting, setStarting] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [job, setJob] = useState<ScrapeJob | null>(null)

  useEffect(() => {
    if (!jobId || job?.status === 'done' || job?.status === 'error') return
    const id = setInterval(async () => {
      try {
        const res = await adminApi.scrapeStatus(jobId)
        setJob(res.data)
      } catch { /* ignore */ }
    }, 2000)
    return () => clearInterval(id)
  }, [jobId, job?.status])

  const start = async () => {
    setStarting(true)
    setJob(null)
    try {
      const res = await adminApi.scrapeMcqs(subject, pages)
      setJobId(res.data.job_id)
      setJob({ status: 'running', added: 0, errors: 0, page: 0, total_pages: pages, subject })
    } catch {
      setJob({ status: 'error', added: 0, errors: 0, page: 0, total_pages: pages, subject, message: 'Failed to start scraping.' })
    } finally { setStarting(false) }
  }

  const isRunning = job?.status === 'running'
  const progress = job ? Math.round((job.page / Math.max(job.total_pages, 1)) * 100) : 0

  return (
    <div className="max-w-lg space-y-5">
      <div className="card p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
        <div className="flex items-start gap-2.5">
          <Globe size={16} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-0.5">Auto-Scrape from PakMCQs.com</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              Fetches fresh MCQs directly from pakmcqs.com and saves to the database. Duplicate questions are skipped automatically.
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="label">Subject</label>
        <select value={subject} onChange={(e) => { setSubject(e.target.value); setJob(null) }} className="select" disabled={isRunning}>
          {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <label className="label">Pages to Scrape</label>
        <input
          type="number" min={1} max={298} value={pages}
          onChange={(e) => setPages(Math.max(1, Number(e.target.value)))}
          className="input max-w-[160px]" disabled={isRunning}
        />
        <p className="text-xs text-gray-400 mt-1">≈ {pages * 10} MCQs · each page has ~10 questions</p>
      </div>

      <button
        onClick={start}
        disabled={starting || isRunning}
        className="btn-primary w-full py-3 gap-2"
      >
        <Globe size={16} />
        {isRunning ? 'Scraping in progress…' : starting ? 'Starting…' : 'Start Scraping'}
      </button>

      {job && (
        <div className={cn(
          'rounded-2xl border p-4 space-y-3',
          job.status === 'done'    ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800' :
          job.status === 'error'   ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800' :
                                     'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800',
        )}>
          <div className="flex items-center justify-between">
            <span className={cn('text-sm font-bold',
              job.status === 'done'  ? 'text-green-700 dark:text-green-300' :
              job.status === 'error' ? 'text-red-700 dark:text-red-300' :
                                       'text-blue-700 dark:text-blue-300',
            )}>
              {job.status === 'done' ? '✅ Complete' : job.status === 'error' ? '❌ Error' : '⏳ Scraping…'}
            </span>
            {isRunning && (
              <span className="text-xs text-blue-500 font-medium">
                Page {job.page} / {job.total_pages}
              </span>
            )}
          </div>

          <div className="flex gap-5 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Added  </span>
              <span className="font-bold text-gray-900 dark:text-white">{job.added}</span>
            </div>
            {job.errors > 0 && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Errors  </span>
                <span className="font-bold text-red-600 dark:text-red-400">{job.errors}</span>
              </div>
            )}
          </div>

          {isRunning && (
            <div className="w-full bg-blue-100 dark:bg-blue-900/40 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {job.message && (
            <p className="text-xs text-red-600 dark:text-red-400">{job.message}</p>
          )}
          {job.last_error && (
            <p className="text-xs text-orange-600 dark:text-orange-400 font-mono break-all">Last error: {job.last_error}</p>
          )}
        </div>
      )}
    </div>
  )
}

type AdminTab = 'overview' | 'users' | 'essays' | 'mcqs' | 'scrape'

function AdminContent() {
  const [tab, setTab] = useState<AdminTab>('overview')

  const tabs: { id: AdminTab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'essays', label: 'Essays', icon: '✍️' },
    { id: 'mcqs', label: 'MCQ Import', icon: '📥' },
    { id: 'scrape', label: 'Scrape MCQs', icon: '🕷' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        icon={<ShieldCheck size={22} className="text-white" />}
        title="Admin Panel"
        subtitle="Manage users, essays, and content"
        badge="Admin"
      />
      <div className="tabs w-fit flex-wrap">
        {tabs.map(({ id, label, icon }) => (
          <button key={id} onClick={() => setTab(id)} className={tab === id ? 'tab-active' : 'tab'}>
            {icon} {label}
          </button>
        ))}
      </div>
      {tab === 'overview' && <OverviewTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'essays' && <EssaysTab />}
      {tab === 'mcqs' && <McqImportTab />}
      {tab === 'scrape' && <ScrapeMcqsTab />}
    </div>
  )
}

export function AdminPanel() {
  return <AdminRoute><AdminContent /></AdminRoute>
}
