import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { Star, Eye, MessageCircle, Mail, Shield, Lock, FileText, X, Download, ExternalLink, Zap, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NoteFile { filename: string; display_name: string; size: number }

const TEAL   = '#1D6660'
const ORANGE = '#F97316'

/* ── Category tagging ────────────────────────────────── */
function getCategory(name: string): { label: string; color: string } {
  const n = name.toLowerCase()
  if (n.includes('pakistan') || n.includes('pak')) return { label: 'Pakistan Studies', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' }
  if (n.includes('current'))  return { label: 'Current Affairs',  color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' }
  if (n.includes('islamic') || n.includes('islam')) return { label: 'Islamic Studies', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' }
  if (n.includes('science') || n.includes('everyday')) return { label: 'Science', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' }
  if (n.includes('cce') || n.includes('spsc') || n.includes('screening')) return { label: 'Screening Test', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' }
  if (n.includes('most important') || n.includes('important')) return { label: 'Most Important', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' }
  return { label: 'General', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' }
}

function fmtSize(bytes: number) {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`
}

/* ── Preview Modal ───────────────────────────────────── */
function PreviewModal({ note, onClose }: { note: NoteFile; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 animate-fade-in">
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-900 border-b border-gray-700 shrink-0">
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-bold truncate">{note.display_name}</p>
          <p className="text-yellow-400 text-xs font-medium flex items-center gap-1">
            <Star size={10} className="fill-yellow-400" /> Free Preview · First 3 pages
          </p>
        </div>
        <a href={`https://wa.me/923332531119?text=I want to buy Premium Notes - ${note.display_name}`}
          target="_blank" rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-semibold transition-colors">
          <MessageCircle size={13} /> Buy Full Notes
        </a>
        <button onClick={onClose}
          className="w-8 h-8 rounded-lg bg-white/10 hover:bg-red-500/70 flex items-center justify-center text-white transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* PDF preview */}
        <iframe
          src={`/api/premium/notes/${encodeURIComponent(note.filename)}/preview`}
          className="flex-1 w-full border-0 min-h-[60vh] lg:min-h-0"
          title={note.display_name}
        />

        {/* Lock panel */}
        <div className="lg:w-72 shrink-0 bg-gray-900 border-t lg:border-t-0 lg:border-l border-gray-700 flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-yellow-400/20 flex items-center justify-center">
              <Lock size={28} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-white font-bold text-lg">Unlock Full Notes</p>
              <p className="text-gray-400 text-sm mt-1">Get complete access to all {note.display_name}</p>
            </div>
            <div className="text-4xl font-black text-white">Rs 500</div>
            <p className="text-gray-400 text-xs">One-time payment · All notes included</p>
          </div>

          <div className="p-4 border-t border-gray-700 space-y-2">
            <a href={`https://wa.me/923332531119?text=I want to buy Premium Notes - CssBuddy.pk`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-semibold transition-colors">
              <MessageCircle size={15} /> WhatsApp to Order
            </a>
            <a href="mailto:cssbuddy.pk@gmail.com?subject=Premium Notes Order"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-gray-600 hover:bg-gray-800 text-gray-300 text-sm font-medium transition-colors">
              <Mail size={14} /> Email Us
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Note card ───────────────────────────────────────── */
function NoteCard({ note, onPreview }: { note: NoteFile; onPreview: (n: NoteFile) => void }) {
  const cat = getCategory(note.display_name)
  return (
    <div className="card group hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      <div className="p-5 flex items-start gap-4">
        {/* Icon */}
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
          style={{ background: `linear-gradient(135deg, ${TEAL}, #2D9E95)` }}>
          <FileText size={20} className="text-white" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight">{note.display_name}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', cat.color)}>{cat.label}</span>
                <span className="text-[10px] text-gray-400">{fmtSize(note.size)}</span>
                <span className="text-[10px] text-gray-400">PDF</span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Star size={12} className="text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400">Premium</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pb-4 flex items-center gap-2 border-t border-gray-50 dark:border-gray-800 pt-3">
        <button onClick={() => onPreview(note)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all border-2 border-[#1D6660]/30 text-[#1D6660] dark:text-teal-400 hover:bg-[#1D6660] hover:text-white hover:border-[#1D6660]">
          <Eye size={14} /> Free Preview
        </button>
        <a href="https://wa.me/923332531119?text=I want to buy Premium Notes - CssBuddy.pk"
          target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${ORANGE}, #ef8c3a)` }}>
          <Lock size={13} /> Buy
        </a>
      </div>
    </div>
  )
}

/* ── Main page ───────────────────────────────────────── */
export function PremiumNotes() {
  const [previewNote, setPreviewNote] = useState<NoteFile | null>(null)

  const { data: notes = [], isLoading } = useQuery<NoteFile[]>({
    queryKey: ['premium-notes'],
    queryFn: () => apiClient.get('/api/premium/notes').then((r) => r.data),
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Star size={26} className="text-yellow-500 fill-yellow-500" /> Premium Notes
        </h1>
        <p className="page-sub">Curated CSS/PMS screening & MPT preparation material — free preview, instant delivery after purchase</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Notes grid ── */}
        <div className="xl:col-span-2 space-y-4">
          {/* Stats bar */}
          {notes.length > 0 && (
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-[#1D6660]/10 to-teal-50 dark:from-[#1D6660]/20 dark:to-teal-900/10 border border-[#1D6660]/20">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                style={{ background: `linear-gradient(135deg, ${TEAL}, #2D9E95)` }}>
                <FileText size={18} />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">{notes.length} Premium Study Materials</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Click "Free Preview" on any note to read the first 3 pages</p>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="h-40 skeleton rounded-2xl" />)}
            </div>
          ) : notes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Star size={28} /></div>
              <p className="empty-title">Premium notes coming soon</p>
              <p className="empty-sub">Contact us via WhatsApp to get early access</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {notes.map((n) => (
                <NoteCard key={n.filename} note={n} onPreview={setPreviewNote} />
              ))}
            </div>
          )}
        </div>

        {/* ── Purchase sidebar ── */}
        <div className="space-y-4">
          {/* Pricing card */}
          <div className="card overflow-hidden shadow-md">
            <div className="p-6 text-white" style={{ background: `linear-gradient(135deg, ${TEAL}, #2D9E95)` }}>
              <div className="flex items-center gap-2 mb-3">
                <Star size={16} className="fill-white" />
                <span className="font-bold text-sm">Premium Bundle</span>
              </div>
              <div className="text-5xl font-black mb-1">Rs 500</div>
              <p className="text-white/80 text-sm">One-time · All {notes.length} notes included</p>
            </div>

            <div className="p-5 space-y-5">
              <ul className="space-y-2.5">
                {[
                  'All screening test notes',
                  'MCQ banks with answers',
                  'Topic-wise summaries',
                  'Pakistan Studies material',
                  'Current Affairs coverage',
                  'Instant delivery via email',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-200">
                    <CheckCircle size={15} className="text-teal-500 shrink-0" /> {f}
                  </li>
                ))}
              </ul>

              {/* Payment methods */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Payment Methods</p>
                <div className="space-y-2">
                  {['JazzCash', 'EasyPaisa', 'NayaPay'].map((m) => (
                    <div key={m} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">{m}</span>
                      <span className="font-mono font-bold text-sm" style={{ color: TEAL }}>03332531119</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2 border-t border-gray-200 dark:border-gray-700 pt-2">Account: Abdul Wahab</p>
              </div>

              <div className="space-y-2.5">
                <a href="https://wa.me/923332531119?text=I want to buy Premium Notes - CssBuddy.pk"
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-bold transition-colors shadow-sm">
                  <MessageCircle size={16} /> Order on WhatsApp
                </a>
                <a href="mailto:cssbuddy.pk@gmail.com?subject=Premium Notes Order - CssBuddy.pk"
                  className="flex items-center justify-center gap-2 w-full py-2.5 btn-outline text-sm">
                  <Mail size={14} /> Send Email
                </a>
              </div>

              <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
                <Shield size={12} /> Secure · Notes delivered within 24 hours
              </p>
            </div>
          </div>

          {/* What you get */}
          <div className="card p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">How it works</p>
            <ol className="space-y-3">
              {[
                { step: '1', text: 'Preview any note free (first 3 pages)' },
                { step: '2', text: 'Send Rs 500 via JazzCash/EasyPaisa' },
                { step: '3', text: 'WhatsApp your payment screenshot' },
                { step: '4', text: 'Receive all notes instantly via email' },
              ].map(({ step, text }) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: TEAL }}>{step}</span>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* Preview modal */}
      {previewNote && (
        <PreviewModal note={previewNote} onClose={() => setPreviewNote(null)} />
      )}
    </div>
  )
}
