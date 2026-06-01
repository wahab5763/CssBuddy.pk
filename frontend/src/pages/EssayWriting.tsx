import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { essayApi } from '@/api/essay'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'
import type { Essay, EssayTopic } from '@/types'
import { PenLine, Upload, FileText, CheckCircle, Star, ExternalLink } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const STATUS = {
  pending:  { label: 'Under Review', class: 'badge-yellow' },
  reviewed: { label: 'Reviewed', class: 'badge-green' },
  rejected: { label: 'Rejected', class: 'badge-red' },
}

function SubmitTab() {
  const [category, setCategory] = useState('')
  const [topicId, setTopicId] = useState<number | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const qc = useQueryClient()

  const { data: categories = [] } = useQuery<string[]>({
    queryKey: ['essay-categories'],
    queryFn: () => essayApi.categories().then((r) => r.data),
  })
  const { data: topics = [] } = useQuery<EssayTopic[]>({
    queryKey: ['essay-topics', category],
    queryFn: () => essayApi.topics(category).then((r) => r.data),
    enabled: !!category,
  })

  const submit = async () => {
    if (!topicId || !file) return
    setSubmitting(true)
    try {
      const form = new FormData()
      form.append('topic_id', String(topicId))
      form.append('file', file)
      await essayApi.submit(form)
      setSuccess(true)
      qc.invalidateQueries({ queryKey: ['my-essays'] })
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      alert(err.response?.data?.detail || 'Submission failed')
    } finally { setSubmitting(false) }
  }

  if (success) return (
    <div className="text-center py-16">
      <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={40} className="text-green-500" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Essay Submitted!</h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto">
        Your essay has been submitted for review. You'll receive feedback and a score once reviewed.
      </p>
      <button onClick={() => { setSuccess(false); setFile(null); setTopicId(null) }}
        className="btn-primary mt-6">Submit Another</button>
    </div>
  )

  return (
    <div className="max-w-lg space-y-5">
      <div>
        <label className="label">Essay Category</label>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setTopicId(null) }} className="select">
          <option value="">Select a category</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {category && (
        <div>
          <label className="label">Topic</label>
          <select value={topicId ?? ''} onChange={(e) => setTopicId(Number(e.target.value))} className="select">
            <option value="">Select a topic</option>
            {topics.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>
      )}

      {/* Drag-drop upload */}
      <div>
        <label className="label">Upload Essay PDF</label>
        <label
          className={cn(
            'flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-all duration-200',
            file
              ? 'border-primary bg-primary/5'
              : 'border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:bg-primary/5'
          )}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const f = e.dataTransfer.files[0]
            if (f?.type === 'application/pdf') setFile(f)
          }}>
          {file ? (
            <>
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-3">
                <FileText size={28} className="text-primary" />
              </div>
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{file.name}</p>
              <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(0)} KB</p>
              <button onClick={(e) => { e.preventDefault(); setFile(null) }}
                className="mt-3 text-xs text-red-500 hover:underline">Remove file</button>
            </>
          ) : (
            <>
              <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-3">
                <Upload size={28} className="text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Drop your PDF here</p>
              <p className="text-xs text-gray-400 mt-1">or click to browse · PDF only · max 10MB</p>
            </>
          )}
          <input type="file" accept=".pdf" className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>
      </div>

      <button onClick={submit} disabled={!topicId || !file || submitting}
        className="btn-primary w-full py-3.5 text-base">
        {submitting ? 'Submitting…' : 'Submit Essay for Review'}
      </button>
    </div>
  )
}

function MySubmissionsTab() {
  const { data: essays = [], isLoading } = useQuery<Essay[]>({
    queryKey: ['my-essays'],
    queryFn: () => essayApi.mySubmissions().then((r) => r.data),
  })

  if (isLoading) return (
    <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-28 skeleton" />)}</div>
  )

  if (essays.length === 0) return (
    <div className="empty-state">
      <div className="empty-icon"><PenLine size={28} /></div>
      <p className="empty-title">No submissions yet</p>
      <p className="empty-sub">Submit your first essay to get feedback from our experts</p>
    </div>
  )

  return (
    <div className="space-y-4">
      {essays.map((e) => {
        const st = STATUS[e.status as keyof typeof STATUS] || STATUS.pending
        return (
          <div key={e.id} className="card p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                <p className="font-bold text-gray-900 dark:text-white">{e.topic?.title || 'Essay'}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {e.topic?.category} · Submitted {formatDate(e.submitted_at)}
                </p>
              </div>
              <span className={st.class}>{st.label}</span>
            </div>

            {e.score != null && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl p-4 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Star size={16} className="text-yellow-500 fill-yellow-500" />
                  <span className="font-bold text-green-700 dark:text-green-300 text-lg">{e.score}/100</span>
                </div>
                {e.feedback && <p className="text-sm text-green-700 dark:text-green-300">{e.feedback}</p>}
              </div>
            )}

            <a href={essayApi.fileUrl(e.id)} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline">
              <ExternalLink size={12} /> View submitted PDF
            </a>
          </div>
        )
      })}
    </div>
  )
}

function EssayContent() {
  const [tab, setTab] = useState<'submit' | 'submissions'>('submit')

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2"><PenLine size={26} className="text-pink-500" /> Essay Writing</h1>
        <p className="page-sub">Submit your essays for professional feedback and scoring</p>
      </div>
      <div className="tabs w-fit">
        <button onClick={() => setTab('submit')} className={tab === 'submit' ? 'tab-active' : 'tab'}>
          ✍️ Submit Essay
        </button>
        <button onClick={() => setTab('submissions')} className={tab === 'submissions' ? 'tab-active' : 'tab'}>
          📋 My Submissions
        </button>
      </div>
      {tab === 'submit' ? <SubmitTab /> : <MySubmissionsTab />}
    </div>
  )
}

export function EssayWriting() {
  return <ProtectedRoute><EssayContent /></ProtectedRoute>
}
