import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { Star, Eye, MessageCircle, Mail, Shield, Zap, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NoteFile { filename: string; display_name: string; size: number }

export function PremiumNotes() {
  const [previewFile, setPreviewFile] = useState<string | null>(null)

  const { data: notes = [] } = useQuery<NoteFile[]>({
    queryKey: ['premium-notes'],
    queryFn: () => apiClient.get('/api/premium/notes').then((r) => r.data),
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Star size={26} className="text-yellow-500 fill-yellow-500" /> Premium Notes
        </h1>
        <p className="page-sub">Curated Screening & MPT preparation materials</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notes list */}
        <div className="lg:col-span-2 space-y-3">
          {notes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Star size={28} /></div>
              <p className="empty-title">Premium notes coming soon</p>
              <p className="empty-sub">Contact us via WhatsApp or email to get early access</p>
            </div>
          ) : notes.map((n) => (
            <div key={n.filename}
              onClick={() => setPreviewFile(n.filename)}
              className={cn(
                'card-interactive flex items-center justify-between p-4 border-2 transition-all',
                previewFile === n.filename ? 'border-primary shadow-glow-sm' : 'border-transparent'
              )}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  previewFile === n.filename ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                )}>
                  <FileText size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{n.display_name}</p>
                  <p className="text-xs text-gray-400">{(n.size / 1024).toFixed(0)} KB · PDF</p>
                </div>
              </div>
              <button className="btn-outline btn-sm gap-1.5 text-primary border-primary/30">
                <Eye size={13} /> Preview
              </button>
            </div>
          ))}
        </div>

        {/* Sidebar: payment + preview */}
        <div className="space-y-4">
          {/* Pricing card */}
          <div className="card overflow-hidden">
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-5 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Star size={18} className="fill-white" />
                <span className="font-bold text-sm">Premium Access</span>
              </div>
              <div className="text-4xl font-black">Rs 500</div>
              <p className="text-white/80 text-xs mt-1">One-time · All notes included</p>
            </div>
            <div className="p-5 space-y-4">
              {/* Features */}
              <ul className="space-y-2">
                {['Screening Test Notes', 'MPT Preparation Material', 'Topic-wise Summaries', 'Quick Revision Guides'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Zap size={13} className="text-yellow-500 shrink-0" /> {f}
                  </li>
                ))}
              </ul>

              {/* Payment methods */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Payment Methods</p>
                <div className="space-y-1">
                  {['JazzCash', 'NayaPay', 'EasyPaisa'].map((m) => (
                    <div key={m} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">{m}</span>
                      <span className="font-mono font-bold text-primary">03332531119</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">Account name: Abdul Wahab</p>
              </div>

              {/* CTAs */}
              <div className="space-y-2">
                <a href="https://wa.me/923332531119?text=I want to buy Premium Notes - CssBuddy.pk"
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-semibold transition-colors">
                  <MessageCircle size={16} /> WhatsApp to Order
                </a>
                <a href="mailto:cssbuddy.pk@gmail.com?subject=Premium Notes Order"
                  className="flex items-center justify-center gap-2 w-full py-2.5 btn-outline">
                  <Mail size={15} /> Email Us
                </a>
              </div>

              <p className="flex items-center gap-1.5 text-xs text-gray-400 justify-center">
                <Shield size={12} /> Secure payment · Instant delivery
              </p>
            </div>
          </div>

          {/* PDF Preview */}
          {previewFile && (
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
                <p className="text-xs font-semibold text-gray-500">Preview (3 pages)</p>
                <span className="badge-yellow">Free Preview</span>
              </div>
              <iframe
                src={`/api/premium/notes/${previewFile}/preview`}
                className="w-full h-72"
                title="Note preview"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
