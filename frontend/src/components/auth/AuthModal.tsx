import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { apiClient } from '@/api/client'
import { subjectsApi } from '@/api/subjects'
import type { User } from '@/types'
import { X, LogIn, UserPlus, Eye, EyeOff, GraduationCap, BookOpen, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
})

const registerStep1Schema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
  exam_type: z.enum(['CSS', 'PMS']),
  prep_level: z.string().optional(),
  city: z.string().optional(),
})

type LoginForm = z.infer<typeof loginSchema>
type RegisterStep1Form = z.infer<typeof registerStep1Schema>

interface AuthModalProps { defaultOpen?: boolean; onClose?: () => void }

function PasswordInput({
  value, onChange, placeholder,
}: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || '••••••••'}
        className="input pr-10"
      />
      <button type="button" onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}

export function AuthModal({ defaultOpen = false, onClose }: AuthModalProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [registerStep, setRegisterStep] = useState<1 | 2>(1)
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')
  const [selectedOptionals, setSelectedOptionals] = useState<string[]>([])
  const [subjectSearch, setSubjectSearch] = useState('')
  const [registering, setRegistering] = useState(false)
  const setAuth = useAuthStore((s) => s.setAuth)

  const { data: subjectList } = useQuery({
    queryKey: ['all-subjects'],
    queryFn: () => subjectsApi.all().then((r) => r.data),
    staleTime: Infinity,
  })
  const allOptionals = subjectList?.optional ?? []
  const filteredOptionals = subjectSearch
    ? allOptionals.filter((s) => s.toLowerCase().includes(subjectSearch.toLowerCase()))
    : allOptionals

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })
  const registerForm = useForm<RegisterStep1Form>({
    resolver: zodResolver(registerStep1Schema),
    defaultValues: { exam_type: 'CSS' },
  })

  const close = () => { setIsOpen(false); onClose?.() }

  const toggleOptional = (s: string) => {
    setSelectedOptionals((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : prev.length < 6 ? [...prev, s] : prev
    )
  }

  const onLogin = async (data: LoginForm) => {
    setError('')
    try {
      const res = await apiClient.post<{ access_token: string; user: User }>('/api/auth/login', {
        email: data.email, password: data.password,
      })
      setAuth(res.data.user, res.data.access_token)
      close()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      setError(err.response?.data?.detail || 'Invalid email or password')
    }
  }

  const onRegisterStep1 = async () => {
    // Sync local password state into the form so Zod can validate it
    registerForm.setValue('password', password)
    const valid = await registerForm.trigger()
    if (!valid) return
    setError('')
    setRegisterStep(2)
  }

  const onRegisterFinish = async () => {
    setError('')
    setRegistering(true)
    const data = registerForm.getValues()
    try {
      const res = await apiClient.post<{ access_token: string; user: User }>('/api/auth/register', {
        name: data.name,
        email: data.email,
        password,
        exam_type: data.exam_type,
        prep_level: data.prep_level || undefined,
        city: data.city || undefined,
        optional_subjects: selectedOptionals,
      })
      setAuth(res.data.user, res.data.access_token)
      close()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      setError(err.response?.data?.detail || 'Registration failed. Try again.')
    } finally {
      setRegistering(false)
    }
  }

  if (!isOpen) return (
    <button onClick={() => setIsOpen(true)} className="btn-primary">
      <LogIn size={15} /> Sign In
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-card-lg w-full max-w-md overflow-hidden animate-slide-up">

        {/* Gradient header */}
        <div className="bg-gradient-brand px-6 pt-6 pb-8 relative">
          <button onClick={close}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors">
            <X size={16} />
          </button>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
              <GraduationCap size={20} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-lg">CssBuddy.pk</p>
              <p className="text-white/70 text-xs">CSS · PMS Exam Preparation</p>
            </div>
          </div>
          <h2 className="text-white text-xl font-bold">
            {tab === 'login'
              ? 'Welcome back! 👋'
              : registerStep === 1 ? 'Create your account' : 'Choose your optionals'}
          </h2>
          <p className="text-white/70 text-sm mt-1">
            {tab === 'login'
              ? 'Sign in to continue your preparation journey'
              : registerStep === 1
                ? 'Join thousands of CSS/PMS aspirants'
                : 'Pick up to 6 optional subjects (you can change later)'}
          </p>
        </div>

        {/* Tabs */}
        <div className="px-6 -mt-4">
          <div className="tabs shadow-card">
            <button onClick={() => { setTab('login'); setError(''); setRegisterStep(1) }}
              className={tab === 'login' ? 'tab-active flex-1 gap-1.5' : 'tab flex-1 gap-1.5'}>
              <LogIn size={13} /> Sign In
            </button>
            <button onClick={() => { setTab('register'); setError(''); setRegisterStep(1) }}
              className={tab === 'register' ? 'tab-active flex-1 gap-1.5' : 'tab flex-1 gap-1.5'}>
              <UserPlus size={13} /> Sign Up
            </button>
          </div>
        </div>

        <div className="px-6 py-5">
          {error && (
            <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* ── Login ── */}
          {tab === 'login' && (
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
              <div>
                <label className="label">Email address</label>
                <input {...loginForm.register('email')} type="email" placeholder="you@example.com" className="input" />
                {loginForm.formState.errors.email && (
                  <p className="text-red-500 text-xs mt-1">{loginForm.formState.errors.email.message}</p>
                )}
              </div>
              <div>
                <label className="label">Password</label>
                <PasswordInput value={loginForm.watch('password') || ''} onChange={(v) => loginForm.setValue('password', v)} />
              </div>
              <button type="submit" disabled={loginForm.formState.isSubmitting}
                className="btn-primary w-full py-3 text-base mt-1 gap-2">
                {loginForm.formState.isSubmitting
                  ? <><Loader2 size={18} className="animate-spin" /> Signing in…</>
                  : <><LogIn size={16} /> Sign In</>}
              </button>
            </form>
          )}

          {/* ── Register Step 1: Basic info ── */}
          {tab === 'register' && registerStep === 1 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="label">Full Name</label>
                  <input {...registerForm.register('name')} placeholder="Ahmed Khan" className="input" />
                  {registerForm.formState.errors.name && <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.name.message}</p>}
                </div>
                <div className="col-span-2">
                  <label className="label">Email</label>
                  <input {...registerForm.register('email')} type="email" placeholder="you@example.com" className="input" />
                  {registerForm.formState.errors.email && <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.email.message}</p>}
                </div>
                <div className="col-span-2">
                  <label className="label">Password</label>
                  <PasswordInput value={password} onChange={(v) => { setPassword(v); registerForm.setValue('password', v) }} />
                  {registerForm.formState.errors.password && <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.password.message}</p>}
                </div>
                <div>
                  <label className="label">Exam Type</label>
                  <select {...registerForm.register('exam_type')} className="select">
                    <option value="CSS">CSS</option>
                    <option value="PMS">PMS</option>
                  </select>
                </div>
                <div>
                  <label className="label">Prep Level</label>
                  <select {...registerForm.register('prep_level')} className="select">
                    <option value="">Select…</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label">City (optional)</label>
                  <input {...registerForm.register('city')} placeholder="Karachi" className="input" />
                </div>
              </div>
              <button type="button" onClick={onRegisterStep1}
                className="btn-primary w-full py-3 text-base gap-2 mt-1">
                Next: Choose Optionals <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* ── Register Step 2: Optional subjects ── */}
          {tab === 'register' && registerStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={cn('text-sm font-bold', selectedOptionals.length >= 6 ? 'text-primary' : 'text-gray-500')}>
                  {selectedOptionals.length}/6 selected
                </span>
                <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                  <div className="bg-gradient-brand h-2 rounded-full transition-all" style={{ width: `${(selectedOptionals.length / 6) * 100}%` }} />
                </div>
              </div>

              {selectedOptionals.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedOptionals.map((s) => (
                    <button key={s} type="button" onClick={() => toggleOptional(s)}
                      className="badge bg-primary text-white gap-1 pr-1.5 hover:bg-primary-600">
                      {s} <X size={10} />
                    </button>
                  ))}
                </div>
              )}

              <input value={subjectSearch} onChange={(e) => setSubjectSearch(e.target.value)}
                placeholder="Search subjects…" className="input" />

              <div className="grid grid-cols-1 gap-1.5 max-h-52 overflow-y-auto pr-0.5">
                {filteredOptionals.map((s) => {
                  const chosen = selectedOptionals.includes(s)
                  const disabled = !chosen && selectedOptionals.length >= 6
                  return (
                    <button key={s} type="button" onClick={() => !disabled && toggleOptional(s)}
                      className={cn(
                        'text-left px-3 py-2 rounded-xl border text-sm transition-all',
                        chosen ? 'border-primary bg-primary/10 text-primary' :
                        disabled ? 'border-gray-100 dark:border-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed' :
                        'border-gray-100 dark:border-gray-800 hover:border-primary/40 hover:bg-primary/5 text-gray-700 dark:text-gray-200'
                      )}>
                      {s}
                    </button>
                  )
                })}
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setRegisterStep(1)} className="btn-outline gap-1.5">
                  <ChevronLeft size={15} /> Back
                </button>
                <button type="button" onClick={onRegisterFinish} disabled={registering}
                  className="btn-primary flex-1 py-3 gap-2">
                  {registering
                    ? <><Loader2 size={16} className="animate-spin" /> Creating…</>
                    : <><BookOpen size={15} /> Create Account</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
