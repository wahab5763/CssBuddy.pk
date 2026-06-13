import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { FileText, Download, X, BookOpen, Calendar, ChevronRight, ExternalLink } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { cn } from '@/lib/utils'

/* ── Helpers ─────────────────────────────────────────── */
function paperUrl(subject: string, year: string, file: string) {
  return `/static/pastpapers/${encodeURIComponent(subject)}/${encodeURIComponent(year)}/${encodeURIComponent(file)}`
}

function cleanName(filename: string) {
  return filename.replace('.pdf', '').replace(/-/g, ' ').replace(/_/g, ' ')
}

/* ── Subject colour map ──────────────────────────────── */
const SUBJECT_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  'Current Affairs':            { color: 'text-sky-700 dark:text-sky-300',     bg: 'bg-sky-50 dark:bg-sky-900/30 border-sky-200 dark:border-sky-800',     icon: '🌍' },
  'English':                    { color: 'text-blue-700 dark:text-blue-300',    bg: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',  icon: '✍️' },
  'Essay':                      { color: 'text-purple-700 dark:text-purple-300',bg: 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800', icon: '📝' },
  'General Science & Ability':  { color: 'text-orange-700 dark:text-orange-300',bg: 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800', icon: '🔬' },
  'Islamiat':                   { color: 'text-teal-700 dark:text-teal-300',    bg: 'bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-800',  icon: '☪️' },
  'Pakistan Affairs':           { color: 'text-green-700 dark:text-green-300',  bg: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800', icon: '🇵🇰' },
  'Syllabus':                   { color: 'text-gray-700 dark:text-gray-300',    bg: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',     icon: '📋' },
}
const DEFAULT_CFG = { color: 'text-primary', bg: 'bg-primary/5 border-primary/20', icon: '📄' }

/* ── PDF Viewer modal ─────────────────────────────────── */
function PdfViewer({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 animate-fade-in">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-900 border-b border-gray-700 shrink-0">
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold truncate">{title}</p>
          <p className="text-gray-400 text-xs">CSS/PMS Past Paper</p>
        </div>
        <a href={url} download
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors">
          <Download size={13} /> Download
        </a>
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors">
          <ExternalLink size={13} /> Open Tab
        </a>
        <button onClick={onClose}
          className="w-8 h-8 rounded-lg bg-white/10 hover:bg-red-500/70 flex items-center justify-center text-white transition-colors">
          <X size={16} />
        </button>
      </div>
      <iframe src={url} className="flex-1 w-full border-0" title={title} />
    </div>
  )
}

/* ── Year section ─────────────────────────────────────── */
function YearSection({
  subject, year, files, onView,
}: {
  subject: string; year: string; files: string[]; onView: (url: string, title: string) => void
}) {
  const cfg = SUBJECT_CONFIG[subject] ?? DEFAULT_CFG
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black text-white bg-gradient-to-br from-[#1D6660] to-[#2D9E95]">
          {year.slice(-2)}
        </span>
        <span className="font-bold text-gray-800 dark:text-gray-100">{year}</span>
        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
          {files.length} paper{files.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pl-2">
        {files.map((f) => {
          const url = paperUrl(subject, year, f)
          return (
            <button key={f} onClick={() => onView(url, cleanName(f))}
              className={cn(
                'group flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-150 hover:shadow-sm',
                cfg.bg,
              )}>
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', cfg.color, 'bg-white/60 dark:bg-black/20')}>
                <FileText size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-semibold truncate', cfg.color)}>{cleanName(f)}</p>
                <p className="text-xs text-gray-400">CSS {year} · PDF</p>
              </div>
              <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 shrink-0 transition-colors" />
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── Main page ────────────────────────────────────────── */
export function PastPapers() {
  const [activeSubject, setActiveSubject] = useState<string | null>(null)
  const [viewer, setViewer] = useState<{ url: string; title: string } | null>(null)

  const { data = {}, isLoading } = useQuery<Record<string, Record<string, string[]>>>({
    queryKey: ['past-papers'],
    queryFn: () => apiClient.get('/api/pastpapers/papers').then((r) => r.data),
  })

  const subjects = Object.keys(data)
  const active = activeSubject ?? subjects[0] ?? ''
  const totalPapers = Object.values(data).reduce((acc, years) =>
    acc + Object.values(years).reduce((a, f) => a + f.length, 0), 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        icon={<FileText size={22} className="text-white" />}
        title="Past Papers"
        subtitle="CSS/PMS examination papers from 2016 to 2023 — view or download instantly"
      />

      {/* Stats row */}
      {!isLoading && subjects.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <BookOpen size={18} />, value: subjects.length, label: 'Subjects', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
            { icon: <FileText size={18} />, value: totalPapers, label: 'Papers', color: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400' },
            { icon: <Calendar size={18} />, value: '2016–2023', label: 'Years', color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' },
          ].map(({ icon, value, label, color }) => (
            <div key={label} className="card flex items-center gap-3 p-4">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', color)}>{icon}</div>
              <div>
                <p className="text-xl font-black text-gray-900 dark:text-white">{value}</p>
                <p className="text-xs text-gray-400">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="space-y-2">{[...Array(7)].map((_, i) => <div key={i} className="h-12 skeleton rounded-xl" />)}</div>
          <div className="lg:col-span-3 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 skeleton" />)}</div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Subject sidebar ── */}
          <aside className="lg:w-56 shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 px-1">Subjects</p>
            <div className="space-y-1">
              {subjects.map((s) => {
                const cfg = SUBJECT_CONFIG[s] ?? DEFAULT_CFG
                const paperCount = Object.values(data[s] || {}).reduce((a, f) => a + f.length, 0)
                const isActive = (activeSubject ?? subjects[0]) === s
                return (
                  <button key={s} onClick={() => setActiveSubject(s)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-150',
                      isActive
                        ? 'bg-[#1D6660] text-white shadow-sm'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200',
                    )}>
                    <span className="text-base shrink-0">{cfg.icon}</span>
                    <span className="flex-1 text-sm font-semibold truncate">{s}</span>
                    <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded-md shrink-0',
                      isActive ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400')}>
                      {paperCount}
                    </span>
                  </button>
                )
              })}
            </div>
          </aside>

          {/* ── Papers area ── */}
          <div className="flex-1 min-w-0">
            {active && data[active] ? (
              <div className="space-y-6">
                {/* Subject header */}
                <div className={cn('flex items-center gap-3 p-4 rounded-2xl border', (SUBJECT_CONFIG[active] ?? DEFAULT_CFG).bg)}>
                  <span className="text-3xl">{(SUBJECT_CONFIG[active] ?? DEFAULT_CFG).icon}</span>
                  <div>
                    <h2 className={cn('font-bold text-lg', (SUBJECT_CONFIG[active] ?? DEFAULT_CFG).color)}>{active}</h2>
                    <p className="text-xs text-gray-400">
                      {Object.keys(data[active]).length} years · {Object.values(data[active]).reduce((a, f) => a + f.length, 0)} papers available
                    </p>
                  </div>
                </div>

                {/* Year sections — newest first */}
                {Object.entries(data[active])
                  .sort(([a], [b]) => b.localeCompare(a))
                  .map(([year, files]) => (
                    <YearSection
                      key={year} subject={active} year={year} files={files}
                      onView={(url, title) => setViewer({ url, title })}
                    />
                  ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">Select a subject</div>
            )}
          </div>
        </div>
      )}

      {/* PDF Viewer */}
      {viewer && (
        <PdfViewer url={viewer.url} title={viewer.title} onClose={() => setViewer(null)} />
      )}
    </div>
  )
}
