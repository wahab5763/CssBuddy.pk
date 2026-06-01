import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { FileText, ExternalLink, X, Download, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const SUBJECT_COLORS: Record<string, string> = {
  Essay:            'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  English:          'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  'Current Affairs':'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  'Pakistan Affairs':'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
  'Islamic Studies':'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  'General Science':'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
}

function YearSection({ year, files, subject }: { year: string; files: string[]; subject: string; onView: (url: string) => void }) {
  const [expanded, setExpanded] = useState(true)
  const base = (f: string) => `/static/pastpapers/${subject.replace(/ /g, '_')}/${year}/${f}`

  return (
    <div className="card overflow-hidden">
      <button onClick={() => setExpanded((e) => !e)}
        className="flex items-center justify-between w-full px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{year.slice(-2)}</span>
          <span className="font-semibold text-gray-800 dark:text-gray-100">{year}</span>
          <span className="badge-gray">{files.length} {files.length === 1 ? 'paper' : 'papers'}</span>
        </div>
        {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>

      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {files.map((f) => (
            <a key={f} href={base(f)} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-primary/40 hover:bg-primary/5 transition-all duration-150 group">
              <FileText size={16} className="text-primary shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-200 truncate flex-1">{f.replace('.pdf', '')}</span>
              <ExternalLink size={12} className="text-gray-300 group-hover:text-primary transition-colors shrink-0" />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

export function PastPapers() {
  const [activeSubject, setActiveSubject] = useState<string | null>(null)
  const [viewingUrl, setViewingUrl] = useState<string | null>(null)

  const { data = {}, isLoading } = useQuery<Record<string, Record<string, string[]>>>({
    queryKey: ['past-papers'],
    queryFn: () => apiClient.get('/api/pastpapers/papers').then((r) => r.data),
  })

  const subjects = Object.keys(data)
  const active = activeSubject ?? subjects[0]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <FileText size={26} className="text-red-500" /> Past Papers
        </h1>
        <p className="page-sub">CSS/PMS examination papers from 2016 to 2023</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-14 skeleton" />)}</div>
      ) : (
        <>
          {/* Subject pills */}
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => {
              const colorKey = Object.keys(SUBJECT_COLORS).find((k) => s.includes(k)) || ''
              return (
                <button key={s} onClick={() => setActiveSubject(s)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all duration-150',
                    active === s
                      ? 'border-primary bg-primary text-white shadow-glow-sm'
                      : `border ${SUBJECT_COLORS[colorKey] || 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary/40'}`
                  )}>
                  {s}
                </button>
              )
            })}
          </div>

          {/* Papers */}
          {active && data[active] && (
            <div className="space-y-3">
              {Object.entries(data[active]).sort(([a], [b]) => b.localeCompare(a)).map(([year, files]) => (
                <YearSection key={year} year={year} files={files} subject={active} onView={setViewingUrl} />
              ))}
            </div>
          )}
        </>
      )}

      {/* PDF Viewer */}
      {viewingUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col animate-fade-in">
          <div className="flex items-center justify-between bg-gray-900/80 backdrop-blur-md px-4 py-3 border-b border-gray-800">
            <p className="text-white text-sm font-medium truncate">{viewingUrl.split('/').pop()}</p>
            <div className="flex items-center gap-2">
              <a href={viewingUrl} download className="btn-ghost btn-sm text-gray-300 gap-1.5"><Download size={14} /> Save</a>
              <button onClick={() => setViewingUrl(null)} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-white/20">
                <X size={16} />
              </button>
            </div>
          </div>
          <iframe src={viewingUrl} className="flex-1 w-full border-0" title="Past Paper" />
        </div>
      )}
    </div>
  )
}
