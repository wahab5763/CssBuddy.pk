import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { booksApi } from '@/api/books'
import { apiClient } from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import type { Book } from '@/types'
import {
  ShoppingBag, BookMarked, FileText, Star, Plus, X, Package,
  Mail, MessageCircle, CheckCircle, Trash2, Eye, Lock,
} from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { useForm } from 'react-hook-form'
import { cn } from '@/lib/utils'

// ── Constants ──────────────────────────────────────────────────────────────
const BOOK_CATS = [
  'English', 'Pakistan Affairs', 'Current Affairs',
  'Islamic Studies', 'GSA', 'Essay', 'Optional', 'Other',
]
const EMAIL       = 'cssbuddy.pk@gmail.com'
const WA_NUMBER   = '923332531119'
const PAY_NUMBER  = '03332531119'
const NOTES_PRICE = 500

// ── Note file type ─────────────────────────────────────────────────────────
interface NoteFile { filename: string; display_name: string; size: number; pages?: number }

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtSize(bytes: number) {
  return bytes > 1_048_576
    ? `${(bytes / 1_048_576).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`
}

function noteCategory(name: string): { label: string; color: string } {
  const n = name.toLowerCase()
  if (n.includes('pakistan') || n.includes('pak'))
    return { label: 'Pakistan Studies', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' }
  if (n.includes('current'))
    return { label: 'Current Affairs', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' }
  if (n.includes('islamic') || n.includes('islam'))
    return { label: 'Islamic Studies', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' }
  if (n.includes('science') || n.includes('everyday'))
    return { label: 'Science', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' }
  if (n.includes('cce') || n.includes('spsc') || n.includes('screening') || n.includes('mpt'))
    return { label: 'Screening / MPT', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' }
  return { label: 'General', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' }
}

// ── Buy Modal ──────────────────────────────────────────────────────────────
interface BuyItem { name: string; price: number; type: 'book' | 'note' }

function BuyModal({ item, onClose }: { item: BuyItem; onClose: () => void }) {
  const subj = encodeURIComponent(`Purchase: ${item.name} — CssBuddy.pk`)
  const body = encodeURIComponent(
    `Hi CssBuddy.pk,\n\nI want to purchase "${item.name}" (Rs ${item.price}).\n\nPayment screenshot attached.\n\nMy email to receive the link: [your email here]\n\nThank you.`
  )
  const waMsg = encodeURIComponent(`Hi! I want to buy: "${item.name}" (Rs ${item.price}) from CssBuddy.pk`)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-up">

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white text-lg">How to Purchase</h2>
            <p className="text-sm text-gray-400 mt-0.5 line-clamp-1">{item.name}</p>
          </div>
          <button onClick={onClose} className="btn-ghost btn-sm p-2 shrink-0 ml-2"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-5">

          {/* Price */}
          <div className="rounded-2xl bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 p-4 text-center">
            <p className="text-4xl font-black text-[#1D6660]">Rs {item.price.toLocaleString()}</p>
            {item.type === 'note' && (
              <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">Bundle — all notes included</p>
            )}
          </div>

          {/* Step 1 */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2.5">
              Step 1 — Transfer payment to any account
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2.5">
              {(['JazzCash', 'EasyPaisa', 'NayaPay'] as const).map((m) => (
                <div key={m} className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{m}</span>
                  <span className="font-mono font-bold text-sm text-[#1D6660]">{PAY_NUMBER}</span>
                </div>
              ))}
              <div className="pt-2 mt-1 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-400">
                  Account Name: <span className="font-semibold text-gray-600 dark:text-gray-300">Abdul Wahab</span>
                </p>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2.5">
              Step 2 — Send payment proof &amp; receive your link
            </p>
            <ol className="space-y-2.5">
              {[
                'Screenshot your payment receipt',
                `Email it to ${EMAIL}`,
                `Subject: "Purchase: ${item.name}"`,
                'Include your email address in the message body',
                'Receive Google Drive link within 24 hours',
              ].map((s, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#1D6660] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-snug">{s}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* CTA */}
          <div className="space-y-2">
            <a
              href={`mailto:${EMAIL}?subject=${subj}&body=${body}`}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold text-white transition-colors"
              style={{ background: 'linear-gradient(135deg, #1D6660, #2D9E95)' }}
            >
              <Mail size={15} /> Email Payment Screenshot
            </a>
            <a
              href={`https://wa.me/${WA_NUMBER}?text=${waMsg}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              <MessageCircle size={14} /> WhatsApp Us Instead
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Book image component ────────────────────────────────────────────────────
function BookImages({ paths, apiBase, height }: { paths: string[]; apiBase: string; height: string }) {
  const [idx, setIdx] = useState(0)
  const imgs = paths.filter(Boolean)

  if (!imgs.length) return (
    <div className={cn('w-full bg-gradient-to-br from-[#1D6660]/10 to-teal-200/20 flex items-center justify-center', height)}>
      <BookMarked size={36} className="text-[#1D6660]/25" />
    </div>
  )

  if (imgs.length === 1) return (
    <img src={`${apiBase}/static/${imgs[0]}`} alt="book" className={cn('w-full object-cover', height)} />
  )

  return (
    <div className={cn('relative flex gap-0.5 overflow-hidden', height)}>
      {imgs.slice(0, 2).map((p, i) => (
        <div key={i} className="relative flex-1 overflow-hidden cursor-pointer"
          onClick={e => { e.stopPropagation(); setIdx(i) }}>
          <img
            src={`${apiBase}/static/${p}`} alt={`photo ${i + 1}`}
            className={cn('w-full h-full object-cover transition-all duration-200',
              idx === i ? 'brightness-100' : 'brightness-[0.7] hover:brightness-90')}
          />
          <span className={cn(
            'absolute top-1.5 left-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md',
            idx === i ? 'bg-white text-gray-800 opacity-90' : 'bg-black/40 text-white opacity-70',
          )}>
            {i + 1}/{imgs.length}
          </span>
        </div>
      ))}
      <div className="absolute inset-y-0 left-1/2 w-px bg-white/40 pointer-events-none" />
    </div>
  )
}

// ── Book card ───────────────────────────────────────────────────────────────
function BookCard({ book, onBuy, onDelete, isAdmin }: {
  book: Book; onBuy: () => void; onDelete: () => void; isAdmin: boolean
}) {
  const apiBase = import.meta.env.VITE_API_URL || ''

  return (
    <div className="card overflow-hidden flex flex-col">
      <BookImages paths={book.image_paths} apiBase={apiBase} height="h-44" />
      <div className="p-4 flex flex-col flex-1">
        <span className="badge-primary text-[10px] self-start mb-2">{book.category}</span>
        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 line-clamp-2 flex-1 leading-snug">
          {book.title}
        </h3>
        {book.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">
            {book.description}
          </p>
        )}
        <p className="text-xl font-black text-[#1D6660] mt-2">Rs {book.price.toLocaleString()}</p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={onBuy}
            className="flex-1 py-2 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #1D6660, #2D9E95)' }}
          >
            Buy Now
          </button>
          {isAdmin && (
            <button
              onClick={onDelete}
              className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center justify-center transition-colors shrink-0"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Admin: Add Book modal ───────────────────────────────────────────────────
function AddBookModal({ onClose }: { onClose: () => void }) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<{
    title: string; category: string; price: number; description: string
  }>({ defaultValues: { category: BOOK_CATS[0] } })
  const [images, setImages] = useState<File[]>([])
  const qc = useQueryClient()

  const onSubmit = async (data: Record<string, unknown>) => {
    const form = new FormData()
    Object.entries(data).forEach(([k, v]) => form.append(k, String(v)))
    form.append('condition', 'New')
    form.append('contact_details', EMAIL)
    images.forEach((img) => form.append('images', img))
    await booksApi.create(form)
    qc.invalidateQueries({ queryKey: ['shop-books'] })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-bold text-gray-900 dark:text-white">Add Book to Shop</h2>
          <button onClick={onClose} className="btn-ghost btn-sm p-2"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div>
            <label className="label">Book Title</label>
            <input
              {...register('title', { required: true })}
              placeholder="CSS MCQs by Dogar Brothers"
              className="input"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select {...register('category')} className="select">
                {BOOK_CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Price (PKR)</label>
              <input
                {...register('price', { required: true })}
                type="number" placeholder="500" className="input"
              />
            </div>
          </div>
          <div>
            <label className="label">Description (optional)</label>
            <textarea
              {...register('description')}
              rows={2}
              placeholder="Brief description of the book…"
              className="input resize-none"
            />
          </div>
          <div>
            <label className="label">Cover Photos (up to 2)</label>
            <label className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
              <Package size={20} className="text-gray-400 shrink-0" />
              <span className="text-sm text-gray-500">
                {images.length > 0 ? `${images.length} photo(s) selected` : 'Click to add cover photos'}
              </span>
              <input
                type="file" accept="image/*" multiple className="hidden"
                onChange={e => setImages(Array.from(e.target.files || []).slice(0, 2))}
              />
            </label>
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3">
            {isSubmitting ? 'Adding…' : 'Add to Shop'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Books section ───────────────────────────────────────────────────────────
function BooksSection() {
  const user   = useAuthStore(s => s.user)
  const qc     = useQueryClient()
  const [buyItem, setBuyItem] = useState<BuyItem | null>(null)
  const [adding, setAdding]   = useState(false)
  const [page, setPage]       = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['shop-books', page],
    queryFn: () => booksApi.list({ page, per_page: 12 }).then(r => r.data),
  })

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this book from the shop?')) return
    await booksApi.delete(id)
    qc.invalidateQueries({ queryKey: ['shop-books'] })
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-5 gap-3">
        <div>
          <h2 className="font-bold text-gray-900 dark:text-white">CSS/PMS Preparation Books</h2>
          <p className="text-sm text-gray-500 mt-0.5">Recommended books curated and sold by CssBuddy.pk</p>
        </div>
        {user?.is_admin && (
          <button onClick={() => setAdding(true)} className="btn-primary shrink-0 gap-2">
            <Plus size={15} /> Add Book
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-72 skeleton rounded-2xl" />)}
        </div>
      ) : data?.items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><BookMarked size={28} /></div>
          <p className="empty-title">No books listed yet</p>
          <p className="empty-sub">New books coming soon — check back shortly!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {(data?.items || []).map((b: Book) => (
              <BookCard
                key={b.id} book={b}
                onBuy={() => setBuyItem({ name: b.title, price: b.price, type: 'book' })}
                onDelete={() => handleDelete(b.id)}
                isAdmin={!!user?.is_admin}
              />
            ))}
          </div>

          {data && data.total > 12 && (
            <div className="flex justify-center gap-3 mt-6">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="btn-outline btn-sm disabled:opacity-40">Prev</button>
              <span className="px-4 py-2 text-sm font-medium bg-primary/10 text-primary rounded-xl">
                Page {page}
              </span>
              <button onClick={() => setPage(p => p + 1)} disabled={(data.total / 12) <= page}
                className="btn-outline btn-sm disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      )}

      {buyItem && <BuyModal item={buyItem} onClose={() => setBuyItem(null)} />}
      {adding  && <AddBookModal onClose={() => setAdding(false)} />}
    </div>
  )
}

// ── Note Preview Modal ──────────────────────────────────────────────────────
function PreviewModal({ note, onClose, onBuy }: {
  note: NoteFile; onClose: () => void; onBuy: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 animate-fade-in">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-900 border-b border-gray-700 shrink-0">
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-bold truncate">{note.display_name}</p>
          <p className="text-indigo-400 text-xs font-medium flex items-center gap-1">
            <Eye size={10} /> Free Preview · First 3 pages
          </p>
        </div>
        <button
          onClick={onBuy}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition-colors"
          style={{ background: 'linear-gradient(135deg, #312e81, #4f46e5)' }}
        >
          <Lock size={12} /> Buy Full Notes
        </button>
        <button onClick={onClose}
          className="w-8 h-8 rounded-lg bg-white/10 hover:bg-red-500/70 flex items-center justify-center text-white transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* PDF iframe */}
        <iframe
          src={`/api/premium/notes/${encodeURIComponent(note.filename)}/preview`}
          className="flex-1 w-full border-0 min-h-[60vh] lg:min-h-0"
          title={note.display_name}
        />

        {/* Lock panel */}
        <div className="lg:w-72 shrink-0 bg-gray-900 border-t lg:border-t-0 lg:border-l border-gray-700 flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-indigo-400/20 flex items-center justify-center">
              <Lock size={28} className="text-indigo-400" />
            </div>
            <div>
              <p className="text-white font-bold text-lg">Unlock Full Notes</p>
              <p className="text-gray-400 text-sm mt-1">Get complete access — all notes, one payment</p>
            </div>
            <div className="text-4xl font-black text-white">Rs {NOTES_PRICE}</div>
            <p className="text-gray-400 text-xs">One-time · All notes included · Drive link by email</p>
          </div>
          <div className="p-4 border-t border-gray-700 space-y-2">
            <button
              onClick={onBuy}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold text-white transition-colors"
              style={{ background: 'linear-gradient(135deg, #312e81, #4f46e5)' }}
            >
              <Lock size={14} /> Buy All Notes — Rs {NOTES_PRICE}
            </button>
            <a href={`https://wa.me/${WA_NUMBER}?text=I want to buy Premium Notes from CssBuddy.pk`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-gray-600 hover:bg-gray-800 text-gray-300 text-sm font-medium transition-colors">
              <MessageCircle size={14} /> WhatsApp to Order
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Notes section ───────────────────────────────────────────────────────────
const NOTE_FEATURES = [
  'MPT / CCE Preparation', 'Screening Tests', 'One Paper Jobs',
  'Pakistan Studies', 'Current Affairs', 'General Science',
]

function NotesSection() {
  const [buyItem, setBuyItem]       = useState<BuyItem | null>(null)
  const [previewNote, setPreviewNote] = useState<NoteFile | null>(null)

  const { data: notes = [], isLoading } = useQuery<NoteFile[]>({
    queryKey: ['shop-notes'],
    queryFn: () => apiClient.get('/api/premium/notes').then(r => r.data),
  })

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-bold text-gray-900 dark:text-white">Premium Notes</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Screening test, MPT and CCE preparation notes — curated by CssBuddy.pk
        </p>
      </div>

      {/* Bundle pricing card */}
      <div
        className="rounded-2xl p-5 sm:p-6 text-white mb-6"
        style={{ background: 'linear-gradient(135deg, #312e81 0%, #4f46e5 60%, #1e1b4b 100%)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Star size={14} className="fill-yellow-300 text-yellow-300" />
              <span className="text-sm font-bold text-white/90">Premium Bundle</span>
            </div>
            <p className="text-4xl font-black">Rs {NOTES_PRICE}</p>
            <p className="text-white/65 text-sm mt-1">
              All {notes.length > 0 ? `${notes.length} notes` : 'notes'} included · One-time payment · Drive link delivered by email
            </p>
          </div>
          <button
            onClick={() => setBuyItem({ name: 'Premium Notes Bundle — All Notes', price: NOTES_PRICE, type: 'note' })}
            className="shrink-0 px-5 py-2.5 rounded-xl bg-white text-indigo-700 font-bold text-sm hover:bg-indigo-50 transition-colors self-start sm:self-auto"
          >
            Buy All Notes
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-white/15 grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-3">
          {NOTE_FEATURES.map(f => (
            <div key={f} className="flex items-center gap-1.5 text-xs text-white/75">
              <CheckCircle size={11} className="shrink-0 text-white/50" /> {f}
            </div>
          ))}
        </div>
      </div>

      {/* Individual notes list */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-20 skeleton rounded-2xl" />)}
        </div>
      ) : notes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><FileText size={28} /></div>
          <p className="empty-title">Notes coming soon</p>
          <p className="empty-sub">Premium notes are being prepared — check back shortly!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {notes.map((n) => {
            const cat = noteCategory(n.display_name)
            return (
              <div key={n.filename}
                className="card p-4 hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #312e81, #4f46e5)' }}
                  >
                    <FileText size={20} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">
                      {n.display_name}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', cat.color)}>
                        {cat.label}
                      </span>
                      <span className="text-[10px] text-gray-400">{fmtSize(n.size)}</span>
                      <span className="text-[10px] text-gray-400">PDF</span>
                      {n.pages != null && (
                        <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                          {n.pages} pages
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
                  <button
                    onClick={() => setPreviewNote(n)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all border-2 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-700 hover:text-white hover:border-indigo-700"
                  >
                    <Eye size={13} /> Free Preview
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {previewNote && (
        <PreviewModal
          note={previewNote}
          onClose={() => setPreviewNote(null)}
          onBuy={() => {
            setPreviewNote(null)
            setBuyItem({ name: previewNote.display_name, price: NOTES_PRICE, type: 'note' })
          }}
        />
      )}
      {buyItem && <BuyModal item={buyItem} onClose={() => setBuyItem(null)} />}
    </div>
  )
}

// ── How it works sidebar card ───────────────────────────────────────────────
function HowItWorksCard() {
  return (
    <div className="card p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">How to Purchase</p>
      <ol className="space-y-4">
        {[
          { step: '1', title: 'Choose an item', desc: 'Browse books or notes and click "Buy Now"' },
          { step: '2', title: 'Transfer payment', desc: `JazzCash / EasyPaisa / NayaPay — ${PAY_NUMBER}` },
          { step: '3', title: 'Email your receipt', desc: `Send screenshot to ${EMAIL} with your email` },
          { step: '4', title: 'Get your link', desc: 'Receive the Google Drive link within 24 hours' },
        ].map(({ step, title, desc }) => (
          <li key={step} className="flex items-start gap-3">
            <span
              className="w-7 h-7 rounded-full text-white text-xs font-black flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #1D6660, #2D9E95)' }}
            >
              {step}
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{title}</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

// ── Payment accounts card ───────────────────────────────────────────────────
function PaymentCard() {
  return (
    <div className="card p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Payment Accounts</p>
      <div className="space-y-3">
        {(['JazzCash', 'EasyPaisa', 'NayaPay'] as const).map((m) => (
          <div key={m} className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{m}</span>
            <span className="font-mono font-bold text-sm text-[#1D6660]">{PAY_NUMBER}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
        <p className="text-xs text-gray-400">
          Account: <span className="font-semibold text-gray-600 dark:text-gray-300">Abdul Wahab</span>
        </p>
      </div>
      <div className="mt-4 space-y-2">
        <a
          href={`mailto:${EMAIL}`}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
          style={{ background: 'linear-gradient(135deg, #1D6660, #2D9E95)' }}
        >
          <Mail size={14} /> {EMAIL}
        </a>
        <a
          href={`https://wa.me/${WA_NUMBER}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <MessageCircle size={14} /> WhatsApp Us
        </a>
      </div>
    </div>
  )
}

// ── Main Shop page ──────────────────────────────────────────────────────────
type ShopTab = 'books' | 'notes'

export function Shop() {
  const [tab, setTab] = useState<ShopTab>('books')

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        icon={<ShoppingBag size={22} className="text-white" />}
        title="CssBuddy Shop"
        subtitle="Official CSS/PMS preparation books and premium screening notes — sold by CssBuddy.pk"
        badge="Official Store"
      />

      <div className="flex flex-col xl:flex-row gap-6">

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0">

          {/* Tab switcher */}
          <div className="tabs w-fit mb-6">
            <button onClick={() => setTab('books')} className={tab === 'books' ? 'tab-active' : 'tab'}>
              <BookMarked size={14} className="inline mr-1.5 align-[-2px]" />
              Books
            </button>
            <button onClick={() => setTab('notes')} className={tab === 'notes' ? 'tab-active' : 'tab'}>
              <FileText size={14} className="inline mr-1.5 align-[-2px]" />
              Premium Notes
            </button>
          </div>

          {tab === 'books' && <BooksSection />}
          {tab === 'notes' && <NotesSection />}
        </div>

        {/* ── Sidebar ── */}
        <aside className="xl:w-72 shrink-0 space-y-4">
          <HowItWorksCard />
          <PaymentCard />
        </aside>
      </div>
    </div>
  )
}
