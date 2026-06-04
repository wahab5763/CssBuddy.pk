import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { booksApi } from '@/api/books'
import { useAuthStore } from '@/store/authStore'
import type { Book } from '@/types'
import { Plus, X, BookMarked, Phone, Trash2, Package } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { cn } from '@/lib/utils'

const CATEGORIES = ['English', 'Pakistan Affairs', 'Current Affairs', 'Islamic Studies', 'GSA', 'Essay', 'Optional', 'Other']
const CONDITIONS = ['New', 'Good', 'Fair', 'Poor']

const CONDITION_COLORS: Record<string, string> = {
  New:  'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
  Good: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
  Fair: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
  Poor: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
}

function BookImages({ paths, apiBase, height, rounded }: {
  paths: string[]; apiBase: string; height: string; rounded?: string
}) {
  const [imgIdx, setImgIdx] = useState(0)
  const imgs = paths.filter(Boolean)

  if (!imgs.length) return (
    <div className={cn('w-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center', height, rounded)}>
      <BookMarked size={40} className="text-primary/30" />
    </div>
  )

  if (imgs.length === 1) return (
    <img src={`${apiBase}/static/${imgs[0]}`} alt="book"
      className={cn('w-full object-cover', height, rounded)} />
  )

  // Two images — side by side with a subtle divider + click to toggle active
  return (
    <div className={cn('relative flex gap-0.5 overflow-hidden', height, rounded)}>
      {imgs.slice(0, 2).map((p, i) => (
        <div key={i} className="relative flex-1 overflow-hidden group"
          onClick={e => { e.stopPropagation(); setImgIdx(i) }}>
          <img src={`${apiBase}/static/${p}`} alt={`book photo ${i + 1}`}
            className={cn('w-full h-full object-cover transition-all duration-200',
              imgIdx === i ? 'brightness-100' : 'brightness-75 hover:brightness-90')} />
          {/* Photo number badge */}
          <span className={cn(
            'absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded-md transition-opacity',
            imgIdx === i
              ? 'bg-white text-gray-800 opacity-90'
              : 'bg-black/40 text-white opacity-70 group-hover:opacity-90',
          )}>
            {i + 1}/{imgs.length}
          </span>
        </div>
      ))}
      {/* Divider line */}
      <div className="absolute inset-y-0 left-1/2 w-px bg-white/50 pointer-events-none" />
    </div>
  )
}

function BookCard({ book }: { book: Book }) {
  const [open, setOpen] = useState(false)
  const [modalImg, setModalImg] = useState(0)
  const user = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  const apiBase = import.meta.env.VITE_API_URL || ''
  const canDelete = user?.is_admin || user?.id === book.user_id
  const imgs = book.image_paths.filter(Boolean)

  const handleDelete = async () => {
    if (!confirm('Delete this listing?')) return
    await booksApi.delete(book.id)
    qc.invalidateQueries({ queryKey: ['books'] })
    setOpen(false)
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="card-interactive text-left overflow-hidden w-full">
        <BookImages paths={book.image_paths} apiBase={apiBase} height="h-44" />
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="badge-primary text-[10px]">{book.category}</span>
            <span className={cn('badge text-[10px]', CONDITION_COLORS[book.condition])}>{book.condition}</span>
          </div>
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 line-clamp-2 mb-1">{book.title}</h3>
          <p className="text-lg font-black text-primary">Rs {book.price.toLocaleString()}</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-400">by {book.seller_name}</p>
            {imgs.length > 1 && (
              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                <Package size={10} /> {imgs.length} photos
              </span>
            )}
          </div>
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-card-lg w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">

            {/* Modal image viewer */}
            {imgs.length > 0 && (
              <div className="relative rounded-t-3xl overflow-hidden">
                <img
                  src={`${apiBase}/static/${imgs[modalImg]}`}
                  alt={book.title}
                  className="w-full h-56 object-cover"
                />
                {/* Thumbnail strip if 2 images */}
                {imgs.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                    {imgs.map((p, i) => (
                      <button key={i} onClick={() => setModalImg(i)}
                        className={cn(
                          'w-14 h-10 rounded-lg overflow-hidden border-2 transition-all',
                          modalImg === i ? 'border-white shadow-lg' : 'border-white/40 opacity-70 hover:opacity-100',
                        )}>
                        <img src={`${apiBase}/static/${p}`} alt={`thumb ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white text-lg">{book.title}</h2>
                  <div className="flex gap-2 mt-1">
                    <span className="badge-primary">{book.category}</span>
                    <span className={cn('badge', CONDITION_COLORS[book.condition])}>{book.condition}</span>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="btn-ghost btn-sm p-2"><X size={18} /></button>
              </div>

              <p className="text-3xl font-black text-primary mb-4">Rs {book.price.toLocaleString()}</p>

              {book.description && <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{book.description}</p>}

              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Phone size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Contact Seller</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{book.contact_details}</p>
                </div>
              </div>

              {canDelete && (
                <button onClick={handleDelete} className="btn-danger w-full mt-4 gap-2">
                  <Trash2 size={15} /> Delete Listing
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function CreateBookModal({ onClose }: { onClose: () => void }) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<{
    title: string; category: string; condition: string; price: number; contact_details: string; description: string
  }>({ defaultValues: { category: CATEGORIES[0], condition: 'Good' } })
  const [images, setImages] = useState<File[]>([])
  const qc = useQueryClient()

  const onSubmit = async (data: Record<string, unknown>) => {
    const form = new FormData()
    Object.entries(data).forEach(([k, v]) => form.append(k, String(v)))
    images.forEach((img) => form.append('images', img))
    await booksApi.create(form)
    qc.invalidateQueries({ queryKey: ['books'] })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-card-lg w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-bold text-gray-900 dark:text-white">Create Book Listing</h2>
          <button onClick={onClose} className="btn-ghost btn-sm p-2"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div>
            <label className="label">Book Title</label>
            <input {...register('title', { required: true })} placeholder="CSS MCQs by Dogar Brothers" className="input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select {...register('category')} className="select">{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
            </div>
            <div>
              <label className="label">Condition</label>
              <select {...register('condition')} className="select">{CONDITIONS.map((c) => <option key={c}>{c}</option>)}</select>
            </div>
          </div>
          <div>
            <label className="label">Price (PKR)</label>
            <input {...register('price', { required: true })} type="number" placeholder="500" className="input" />
          </div>
          <div>
            <label className="label">Contact (WhatsApp/Phone)</label>
            <input {...register('contact_details', { required: true })} placeholder="03xx-xxxxxxx" className="input" />
          </div>
          <div>
            <label className="label">Description (optional)</label>
            <textarea {...register('description')} rows={2} placeholder="Briefly describe the book condition…" className="input resize-none" />
          </div>
          <div>
            <label className="label">Photos (up to 2)</label>
            <label className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
              <Package size={20} className="text-gray-400" />
              <span className="text-sm text-gray-500">{images.length > 0 ? `${images.length} photo(s) selected` : 'Click to add photos'}</span>
              <input type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => setImages(Array.from(e.target.files || []).slice(0, 2))} />
            </label>
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3">
            {isSubmitting ? 'Creating…' : 'Post Listing'}
          </button>
        </form>
      </div>
    </div>
  )
}

export function Books() {
  const user = useAuthStore((s) => s.user)
  const [creating, setCreating] = useState(false)
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['books', page],
    queryFn: () => booksApi.list({ page, per_page: 12 }).then((r) => r.data),
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title flex items-center gap-2"><BookMarked size={26} className="text-orange-500" /> Books Marketplace</h1>
          <p className="page-sub">Buy and sell CSS/PMS preparation books</p>
        </div>
        {user && (
          <button onClick={() => setCreating(true)} className="btn-primary shrink-0 gap-2">
            <Plus size={16} /> Sell a Book
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-72 skeleton" />)}
        </div>
      ) : data?.items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><BookMarked size={28} /></div>
          <p className="empty-title">No books listed yet</p>
          <p className="empty-sub">Be the first to list a book for sale!</p>
          {user && <button onClick={() => setCreating(true)} className="btn-primary mt-4"><Plus size={15} /> Sell a Book</button>}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {(data?.items || []).map((b: Book) => <BookCard key={b.id} book={b} />)}
        </div>
      )}

      {data && data.total > 12 && (
        <div className="flex justify-center gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-outline btn-sm disabled:opacity-40">Prev</button>
          <span className="px-4 py-2 text-sm font-medium bg-primary/10 text-primary rounded-xl">Page {page}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={(data.total / 12) <= page} className="btn-outline btn-sm disabled:opacity-40">Next</button>
        </div>
      )}

      {creating && <CreateBookModal onClose={() => setCreating(false)} />}
    </div>
  )
}
