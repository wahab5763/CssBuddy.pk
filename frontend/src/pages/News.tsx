import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { newsApi } from '@/api/news'
import { ExternalLink, Newspaper, Clock } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import type { NewsArticle } from '@/types'
import { cn } from '@/lib/utils'

const SUBJECTS = [
  { label: 'Current Affairs',   emoji: '🌍' },
  { label: 'Pakistan Affairs',  emoji: '🇵🇰' },
  { label: 'Islamic Studies',   emoji: '☪️' },
  { label: 'English',           emoji: '✍️' },
  { label: 'General Science & Ability', emoji: '🔬' },
]

const SUBJECT_COLORS: Record<string, string> = {
  'Current Affairs':  'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
  'Pakistan Affairs': 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
  'Islamic Studies':  'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300',
  'English':          'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300',
  'General Science & Ability': 'bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300',
}

function ArticleCard({ article }: { article: NewsArticle }) {
  return (
    <a href={article.link} target="_blank" rel="noopener noreferrer"
      className="card-interactive flex flex-col gap-3 p-5 h-full">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={cn('badge text-xs', SUBJECT_COLORS[article.subject] || 'badge-gray')}>
          {SUBJECTS.find((s) => s.label === article.subject)?.emoji} {article.subject}
        </span>
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <Clock size={10} /> {article.source}
        </span>
      </div>
      <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-snug line-clamp-2 flex-1">
        {article.title}
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{article.summary}</p>
      <div className="flex items-center gap-1 text-xs text-primary font-semibold mt-auto">
        Read full article <ExternalLink size={11} />
      </div>
    </a>
  )
}

export function News() {
  const [selected, setSelected] = useState<string[]>(['Current Affairs', 'Pakistan Affairs'])

  const { data = [], isLoading } = useQuery<NewsArticle[]>({
    queryKey: ['news', selected],
    queryFn: () => newsApi.feeds(selected).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })

  const toggle = (s: string) =>
    setSelected((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        icon={<Newspaper size={22} className="text-white" />}
        title="News & Current Affairs"
        subtitle="Stay updated with the latest news relevant to your CSS/PMS preparation"
      />

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {SUBJECTS.map(({ label, emoji }) => (
          <button key={label} onClick={() => toggle(label)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all duration-150',
              selected.includes(label)
                ? 'border-primary bg-primary text-white shadow-glow-sm'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary/40'
            )}>
            {emoji} {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => <div key={i} className="h-48 skeleton" />)}
        </div>
      ) : data.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Newspaper size={28} /></div>
          <p className="empty-title">No articles found</p>
          <p className="empty-sub">Select at least one subject to see news articles</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((article, i) => <ArticleCard key={i} article={article} />)}
        </div>
      )}
    </div>
  )
}
