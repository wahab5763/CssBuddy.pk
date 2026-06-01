import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { X, User, MapPin, GraduationCap, BookOpen, Save } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/auth'
import { apiClient } from '@/api/client'
import { subjectsApi } from '@/api/subjects'
import { cn } from '@/lib/utils'

interface ProfileFormData {
  name: string
  city: string
  mobile: string
  gender: string
  exam_type: 'CSS' | 'PMS'
  prep_level: string
  exam_year: number | ''
}

const PREP_LEVELS = ['Beginner', 'Intermediate', 'Advanced']
const GENDERS = ['Male', 'Female', 'Prefer not to say']
const CURRENT_YEAR = new Date().getFullYear()
const EXAM_YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR + i)

interface EditProfileModalProps {
  onClose: () => void
}

export function EditProfileModal({ onClose }: EditProfileModalProps) {
  const user = useAuthStore((s) => s.user)
  const setAuth = useAuthStore((s) => s.setAuth)
  const accessToken = useAuthStore((s) => s.accessToken)
  const qc = useQueryClient()

  const [selectedOptionals, setSelectedOptionals] = useState<string[]>(
    user?.optional_subjects ?? []
  )
  const [subjectSearch, setSubjectSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [activeSection, setActiveSection] = useState<'basic' | 'optionals'>('basic')

  const { data: subjectList } = useQuery({
    queryKey: ['all-subjects'],
    queryFn: () => subjectsApi.all().then((r) => r.data),
    staleTime: Infinity,
  })

  const optionals = subjectList?.optional ?? []
  const filtered = subjectSearch
    ? optionals.filter((s) => s.toLowerCase().includes(subjectSearch.toLowerCase()))
    : optionals

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormData>({
    defaultValues: {
      name: user?.name ?? '',
      city: user?.profile?.city ?? '',
      mobile: user?.profile?.mobile ?? '',
      gender: user?.profile?.gender ?? '',
      exam_type: (user?.profile?.exam_type as 'CSS' | 'PMS') ?? 'CSS',
      prep_level: user?.profile?.prep_level ?? '',
      exam_year: user?.profile?.exam_year ?? '',
    },
  })

  const toggleOptional = (subject: string) => {
    setSelectedOptionals((prev) => {
      if (prev.includes(subject)) return prev.filter((s) => s !== subject)
      if (prev.length >= 6) return prev // max 6
      return [...prev, subject]
    })
  }

  const onSubmit = async (data: ProfileFormData) => {
    setSaving(true)
    setSaveMsg('')
    try {
      // Update name + mobile
      await authApi.updateMe({ name: data.name, mobile: data.mobile || undefined })

      // Update profile fields
      await authApi.updateProfile({
        exam_type: data.exam_type,
        exam_year: data.exam_year || undefined,
        prep_level: data.prep_level || undefined,
        city: data.city || undefined,
        gender: data.gender || undefined,
      })

      // Update optionals
      await authApi.updateOptionals(selectedOptionals)

      // Refresh user state
      const res = await apiClient.get('/api/auth/me')
      if (accessToken) setAuth(res.data, accessToken)

      setSaveMsg('Profile saved successfully!')
      qc.invalidateQueries({ queryKey: ['dashboard-summary'] })
      setTimeout(() => onClose(), 1200)
    } catch {
      setSaveMsg('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-card-lg w-full max-w-2xl max-h-[90vh] flex flex-col animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit Profile</h2>
            <p className="text-xs text-gray-400 mt-0.5">Keep your profile up to date for better partner matching</p>
          </div>
          <button onClick={onClose} className="btn-ghost btn-sm p-2"><X size={18} /></button>
        </div>

        {/* Section tabs */}
        <div className="flex border-b border-gray-100 dark:border-gray-800 px-6 shrink-0">
          <button
            onClick={() => setActiveSection('basic')}
            className={cn('py-3 px-4 text-sm font-semibold border-b-2 transition-colors', activeSection === 'basic' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600')}>
            <User size={14} className="inline mr-1.5" />Basic Info
          </button>
          <button
            onClick={() => setActiveSection('optionals')}
            className={cn('py-3 px-4 text-sm font-semibold border-b-2 transition-colors', activeSection === 'optionals' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600')}>
            <BookOpen size={14} className="inline mr-1.5" />Optional Subjects
            <span className={cn('ml-2 w-5 h-5 inline-flex items-center justify-center rounded-full text-[10px] font-bold', selectedOptionals.length > 0 ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500')}>{selectedOptionals.length}</span>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
          {/* ── Basic Info ── */}
          {activeSection === 'basic' && (
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div className="sm:col-span-2">
                  <label className="label"><User size={13} className="inline mr-1" />Full Name</label>
                  <input {...register('name', { required: 'Name is required' })} className="input" placeholder="Ahmed Khan" />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>

                {/* Exam type */}
                <div>
                  <label className="label"><GraduationCap size={13} className="inline mr-1" />Exam Type</label>
                  <select {...register('exam_type')} className="select">
                    <option value="CSS">CSS</option>
                    <option value="PMS">PMS</option>
                  </select>
                </div>

                {/* Exam year */}
                <div>
                  <label className="label">Target Exam Year</label>
                  <select {...register('exam_year')} className="select">
                    <option value="">Select year</option>
                    {EXAM_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                {/* Prep level */}
                <div>
                  <label className="label">Preparation Level</label>
                  <select {...register('prep_level')} className="select">
                    <option value="">Select level</option>
                    {PREP_LEVELS.map((l) => <option key={l}>{l}</option>)}
                  </select>
                </div>

                {/* Gender */}
                <div>
                  <label className="label">Gender</label>
                  <select {...register('gender')} className="select">
                    <option value="">Prefer not to say</option>
                    {GENDERS.map((g) => <option key={g}>{g}</option>)}
                  </select>
                </div>

                {/* City */}
                <div>
                  <label className="label"><MapPin size={13} className="inline mr-1" />City</label>
                  <input {...register('city')} className="input" placeholder="Karachi" />
                </div>

                {/* Mobile */}
                <div>
                  <label className="label">Mobile / WhatsApp</label>
                  <input {...register('mobile')} className="input" placeholder="03xx-xxxxxxx" />
                </div>
              </div>

              {/* Compulsory subjects (display only) */}
              <div>
                <label className="label text-gray-500 flex items-center gap-1">
                  <BookOpen size={13} />Compulsory Subjects (all CSS/PMS candidates)
                </label>
                <div className="flex flex-wrap gap-2">
                  {(subjectList?.compulsory ?? ['Essay', 'English (Precis & Composition)', 'General Science & Ability', 'Current Affairs', 'Pakistan Affairs', 'Islamic Studies']).map((s) => (
                    <span key={s} className="badge bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Optional Subjects ── */}
          {activeSection === 'optionals' && (
            <div className="p-6 space-y-4">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <BookOpen size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Choose up to 6 Optional Subjects</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Your selection determines which study groups you appear in and helps match you with aspirants preparing the same optionals.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                      <div className="bg-gradient-brand h-2 rounded-full transition-all" style={{ width: `${(selectedOptionals.length / 6) * 100}%` }} />
                    </div>
                    <span className={cn('text-xs font-bold', selectedOptionals.length >= 6 ? 'text-primary' : 'text-gray-500')}>
                      {selectedOptionals.length}/6
                    </span>
                  </div>
                </div>
              </div>

              {/* Selected */}
              {selectedOptionals.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Selected</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedOptionals.map((s) => (
                      <button key={s} type="button" onClick={() => toggleOptional(s)}
                        className="badge bg-primary text-white pr-1.5 gap-1 hover:bg-primary-600">
                        {s}
                        <X size={11} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search */}
              <input
                value={subjectSearch}
                onChange={(e) => setSubjectSearch(e.target.value)}
                placeholder="Search subjects…"
                className="input" />

              {/* Subject grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                {filtered.map((s) => {
                  const chosen = selectedOptionals.includes(s)
                  const disabled = !chosen && selectedOptionals.length >= 6
                  return (
                    <button key={s} type="button" onClick={() => !disabled && toggleOptional(s)}
                      className={cn(
                        'text-left px-3.5 py-2.5 rounded-xl border-2 text-sm font-medium transition-all duration-150',
                        chosen
                          ? 'border-primary bg-primary/10 text-primary dark:bg-primary/20'
                          : disabled
                          ? 'border-gray-100 dark:border-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                          : 'border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-200 hover:border-primary/40 hover:bg-primary/5'
                      )}>
                      {s}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 shrink-0 flex items-center justify-between gap-3">
          {saveMsg && (
            <p className={cn('text-sm font-medium', saveMsg.includes('success') ? 'text-green-600 dark:text-green-400' : 'text-red-500')}>
              {saveMsg}
            </p>
          )}
          <div className="flex gap-3 ml-auto">
            <button type="button" onClick={onClose} className="btn-outline btn-md">Cancel</button>
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={saving}
              className="btn-primary gap-2">
              <Save size={15} />
              {saving ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
