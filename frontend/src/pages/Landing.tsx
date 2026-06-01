import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { AuthModal } from '@/components/auth/AuthModal'
import {
  BookOpen, FileText, Star, Users, GraduationCap, Trophy,
  CheckCircle, ArrowRight, Phone, Mail, MapPin, Search,
  BookMarked, PenLine, Calendar, Newspaper, Clock, Award,
  ChevronLeft, ChevronRight,
} from 'lucide-react'

/* ── Colour tokens ───────────────────────────────────────── */
const TEAL    = '#1D6660'
const ORANGE  = '#F97316'
const NAVY    = '#0f172a'   // footer
const HEAD    = '#0f172a'   // heading text on light bg
const BODY    = '#334155'   // body text on light bg
const MUTED   = '#64748b'   // muted text on light bg

/* ── Inline social SVGs ──────────────────────────────────── */
const SocialIcons = {
  Facebook: () => (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  ),
  Twitter: () => (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
    </svg>
  ),
  Instagram: () => (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  ),
  Youtube: () => (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/>
    </svg>
  ),
}

/* ── Scroll-reveal hook ──────────────────────────────────── */
function useInView(threshold = 0.05) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect() } },
      { threshold, rootMargin: '0px 0px -60px 0px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

/* ── Count-up hook ───────────────────────────────────────── */
function useCountUp(end: number, active: boolean, duration = 1800) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!active) return
    const startTs = performance.now()
    let raf: number
    const tick = (now: number) => {
      const p = Math.min((now - startTs) / duration, 1)
      setVal(Math.round(p * end))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [end, active, duration])
  return val
}

/* ── Hero slides data ────────────────────────────────────── */
const SLIDES = [
  {
    badge: '✦ WELCOME TO CSSBUDDY.PK!',
    line1: 'Start Your Beautiful',
    line2pre: 'And ', highlight: 'Bright', line2post: ' Future',
    sub: "Pakistan's most comprehensive CSS/PMS preparation platform. Practice MCQs, browse past papers, find study partners, and get expert essay feedback — all in one place.",
    img: '/slider/slide1.png',
    alt: 'CSS/PMS aspirant student',
    bgPos: '60% center',
    overlay: 'linear-gradient(95deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.50) 42%, rgba(0,0,0,0.10) 62%, transparent 78%)',
  },
  {
    badge: '✦ YOUR COMPLETE STUDY HUB',
    line1: 'All Your Resources,',
    line2pre: '', highlight: 'One Platform', line2post: '',
    sub: 'Past papers, MCQ banks, premium notes, essay writing and study partners — everything a CSS/PMS aspirant needs, completely free.',
    img: '/slider/slide2.png',
    alt: 'Student with books',
    bgPos: '55% center',
    overlay: 'linear-gradient(95deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.78) 42%, rgba(255,255,255,0.15) 62%, transparent 78%)',
    darkText: true,
  },
  {
    badge: '✦ PRACTICE MAKES PERFECT',
    line1: 'Master Every',
    line2pre: 'CSS/PMS ', highlight: 'Subject', line2post: '',
    sub: '5000+ MCQs, 8 years of past papers, and instant scoring to keep your CSS/PMS preparation sharp and on track.',
    img: '/slider/slide3.png',
    alt: 'Confident student ready for exams',
    bgPos: '58% center',
    overlay: 'linear-gradient(95deg, rgba(100,0,0,0.80) 0%, rgba(100,0,0,0.55) 42%, rgba(100,0,0,0.12) 62%, transparent 78%)',
  },
  {
    badge: '✦ STUDY SMART · ACHIEVE MORE',
    line1: 'Your CSS/PMS',
    line2pre: 'Success ', highlight: 'Starts Here', line2post: '',
    sub: 'Join thousands of aspirants preparing smarter with personalised study plans, partner matching, and expert essay feedback.',
    img: '/slider/slide4.png',
    alt: 'Student pointing to success',
    bgPos: '55% center',
    overlay: 'linear-gradient(95deg, rgba(0,50,30,0.78) 0%, rgba(0,50,30,0.52) 42%, rgba(0,50,30,0.10) 62%, transparent 78%)',
  },
]

/* ── Feature cards ───────────────────────────────────────── */
const FEATURES = [
  { num: '01', icon: FileText,  title: 'Past Papers',   desc: '2016–2023 official CSS/PMS papers organised by subject, viewable directly in the app.' },
  { num: '02', icon: BookOpen,  title: 'Expert MCQs',   desc: 'Thousands of subject-wise MCQs with instant scoring, answer keys, and PDF export.' },
  { num: '03', icon: Users,     title: 'Study Partner', desc: 'Match with aspirants preparing the same optional subjects and study together.' },
  { num: '04', icon: Star,      title: 'Premium Notes', desc: 'Screening Test and MPT preparation notes reviewed by top CSS qualifiers.' },
]

/* ── Stats ───────────────────────────────────────────────── */
const STATS = [
  { end: 5000,  suffix: '+', label: 'MCQ Questions',    icon: BookOpen      },
  { end: 10000, suffix: '+', label: 'Active Users',     icon: Users         },
  { end: 11,    suffix: '',  label: 'Study Modules',    icon: GraduationCap },
  { end: 98,    suffix: '%', label: 'Satisfaction Rate',icon: Trophy        },
]

/* ── About images ────────────────────────────────────────── */
const ABOUT_IMGS = [
  { src: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=500&q=80', label: 'MCQ Practice'   },
  { src: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=500&q=80', label: 'Past Papers'    },
  { src: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=500&q=80', label: 'Study Groups'  },
  { src: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=500&q=80', label: 'Premium Notes' },
]

/* ── Helpers ─────────────────────────────────────────────── */
function Stars5() {
  return (
    <span className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} size={12} style={{ fill: ORANGE, color: ORANGE }} />
      ))}
    </span>
  )
}

function StatItem({ end, suffix, label, icon: Icon, active }: {
  end: number; suffix: string; label: string; icon: React.FC<{ size: number }>; active: boolean
}) {
  const count = useCountUp(end, active)
  const display = end >= 1000 ? `${(count / 1000).toFixed(count >= end ? 0 : 0)}K` : String(count)
  return (
    <div className="text-center text-white">
      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 border-4 border-white/20"
        style={{ background: ORANGE }}>
        <Icon size={22} />
      </div>
      <p className="text-2xl sm:text-4xl font-black mb-1">
        {end >= 1000 ? display : count}{suffix}
      </p>
      <p className="text-xs sm:text-sm font-semibold opacity-80">+ {label}</p>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   TOP INFO BAR
══════════════════════════════════════════════════════════ */
function TopBar() {
  return (
    <div style={{ background: TEAL }} className="text-white text-xs hidden lg:block">
      <div className="max-w-7xl mx-auto px-6 h-9 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-semibold opacity-80">Follow Us</span>
          {[SocialIcons.Facebook, SocialIcons.Twitter, SocialIcons.Instagram, SocialIcons.Youtube].map((Icon, i) => (
            <a key={i} href="#" className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors">
              <Icon />
            </a>
          ))}
        </div>
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5 opacity-80"><MapPin size={11} /> Karachi, Pakistan</span>
          <span className="flex items-center gap-1.5 opacity-80"><Mail size={11} /> cssbuddy.pk@gmail.com</span>
          <span className="flex items-center gap-1.5 font-semibold" style={{ color: ORANGE }}>
            <Phone size={11} /> +92 333 2531119
          </span>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   NAVBAR  — clean CssBuddy.pk branding, no ✦eduka
══════════════════════════════════════════════════════════ */
function Navbar({ onOpen }: { onOpen: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const NAV = [
    { label: 'Home',          route: '/'            },
    { label: 'Study Plan',    route: '/study-plan'  },
    { label: 'Practice',      route: '/practice'    },
    { label: 'Books Market',  route: '/books'       },
    { label: 'Past Papers',   route: '/past-papers' },
    { label: 'News & Affairs',route: '/news'        },
    { label: 'Premium Notes', route: '/premium'     },
    { label: 'Study Partner', route: '/partner'     },
    { label: 'Essay Writing', route: '/essay'       },
  ]

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 flex items-center h-[66px] gap-4">

        {/* Logo */}
        <a href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
            style={{ background: `linear-gradient(135deg, ${TEAL} 0%, #2D9E95 100%)` }}>
            <GraduationCap size={20} className="text-white" />
          </div>
          <div className="leading-tight">
            <p className="font-black text-lg text-gray-900 leading-none tracking-tight">
              CssBuddy<span style={{ color: ORANGE }}>.pk</span>
            </p>
            <p className="text-[9px] text-gray-400 font-medium tracking-wide">CSS/PMS Prep</p>
          </div>
        </a>

        {/* Desktop nav */}
        <nav className="hidden xl:flex items-center gap-1 flex-1 justify-center">
          {NAV.map(({ label, route }) => (
            <button key={label}
              onClick={() => navigate(route)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-50 whitespace-nowrap">
              {label}
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className="hidden lg:flex items-center gap-3 ml-auto">
          <button className="text-gray-500 hover:text-gray-900 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <Search size={18} />
          </button>
          {user ? (
            <button onClick={() => navigate('/dashboard')}
              className="px-5 py-2.5 rounded-lg text-white text-sm font-bold hover:opacity-90 transition-opacity shadow-sm"
              style={{ background: ORANGE }}>
              Dashboard →
            </button>
          ) : (
            <button onClick={onOpen}
              className="px-5 py-2.5 rounded-lg text-white text-sm font-bold hover:opacity-90 transition-opacity shadow-sm"
              style={{ background: ORANGE }}>
              APPLY NOW
            </button>
          )}
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setMobileOpen(o => !o)} className="xl:hidden ml-auto text-gray-600 p-1.5">
          {mobileOpen
            ? <span className="font-bold text-xl leading-none">✕</span>
            : <span className="text-2xl leading-none">☰</span>}
        </button>
      </div>

      {mobileOpen && (
        <div className="xl:hidden bg-white border-t px-4 py-3 space-y-1">
          {NAV.map(({ label, route }) => (
            <button key={label}
              onClick={() => { navigate(route); setMobileOpen(false) }}
              className="block w-full text-left text-sm font-semibold text-gray-700 py-2 border-b border-gray-100 hover:text-gray-900">
              {label}
            </button>
          ))}
          <button onClick={() => { onOpen(); setMobileOpen(false) }}
            className="w-full mt-2 py-3 rounded-lg text-white font-bold text-sm" style={{ background: ORANGE }}>
            APPLY NOW
          </button>
        </div>
      )}
    </header>
  )
}

/* ══════════════════════════════════════════════════════════
   HERO — image slider (3 slides, auto-play, crossfade)
══════════════════════════════════════════════════════════ */
function Hero({ onOpen }: { onOpen: () => void }) {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [current, setCurrent] = useState(0)
  const [textVisible, setTextVisible] = useState(true)

  const goTo = (idx: number) => {
    setTextVisible(false)
    setTimeout(() => { setCurrent(idx); setTextVisible(true) }, 400)
  }
  const prev = () => goTo((current - 1 + SLIDES.length) % SLIDES.length)
  const next = () => goTo((current + 1) % SLIDES.length)

  /* auto-play */
  useEffect(() => {
    const t = setInterval(() => {
      setCurrent(c => {
        const next = (c + 1) % SLIDES.length
        setTextVisible(false)
        setTimeout(() => setTextVisible(true), 400)
        return next
      })
    }, 5500)
    return () => clearInterval(t)
  }, [])

  const slide = SLIDES[current]

  return (
    <section className="relative overflow-hidden min-h-[420px] sm:min-h-[500px] lg:min-h-[580px]">

      {/* ── Crossfading background images — full bleed ── */}
      {SLIDES.map((s, i) => (
        <div key={i} className="absolute inset-0 transition-opacity duration-700"
          style={{
            backgroundImage: `url(${s.img})`,
            backgroundSize: 'cover',
            backgroundPosition: s.bgPos ?? 'center center',
            opacity: i === current ? 1 : 0,
          }} />
      ))}

      {/* Per-slide left-side overlay — keeps text readable, fades to transparent so student shows */}
      {SLIDES.map((s, i) => (
        <div key={i} className="absolute inset-0 z-[1] transition-opacity duration-700"
          style={{ background: s.overlay, opacity: i === current ? 1 : 0 }} />
      ))}

      {/* Extra mobile overlay — ensures text is always readable on small screens */}
      <div className="lg:hidden absolute inset-0 z-[2]"
        style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.55) 100%)' }} />

      {/* Corner arrows — positioned on section, not inside max-w-7xl */}
      <button onClick={prev}
        className="hidden lg:flex absolute left-5 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full items-center justify-center text-white border-2 border-white/30 bg-black/25 hover:bg-black/45 transition-all">
        <ChevronLeft size={24} />
      </button>
      <button onClick={next}
        className="hidden lg:flex absolute right-5 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full items-center justify-center text-white border-2 border-white/30 bg-black/25 hover:bg-black/45 transition-all">
        <ChevronRight size={24} />
      </button>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-20 relative z-10">

        {/* Slide text — fade + lift transition */}
        <div className="max-w-lg lg:max-w-xl transition-all duration-400"
          style={{ opacity: textVisible ? 1 : 0, transform: textVisible ? 'translateY(0)' : 'translateY(10px)' }}>

          <span className="inline-block text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-3 sm:mb-5 px-3 py-1 rounded-full border"
            style={{ color: ORANGE, borderColor: 'rgba(249,115,22,0.4)' }}>
            {slide.badge}
          </span>

          <h1 className="text-3xl sm:text-4xl lg:text-[50px] font-black leading-[1.1] mb-3 sm:mb-5"
            style={{ color: '#ffffff' }}>
            {slide.line1}<br />
            {slide.line2pre}
            <span style={{ color: ORANGE }}>{slide.highlight}</span>
            {slide.line2post}
          </h1>

          <p className="text-xs sm:text-sm lg:text-base leading-relaxed mb-6 sm:mb-8 max-w-sm sm:max-w-md text-gray-200">
            {slide.sub}
          </p>

          <div className="flex flex-wrap gap-3">
            <button onClick={() => user ? navigate('/dashboard') : onOpen()}
              className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-white text-xs sm:text-sm font-bold hover:opacity-90 transition-opacity shadow-lg"
              style={{ background: ORANGE }}>
              GET STARTED <ArrowRight size={14} />
            </button>
            <button onClick={() => document.getElementById('modules')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg border-2 border-white/50 text-white text-xs sm:text-sm font-bold hover:bg-white/10 transition-colors">
              LEARN MORE <ArrowRight size={14} />
            </button>
          </div>

          {/* Slide dots */}
          <div className="flex gap-2 mt-6 sm:mt-10">
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => goTo(i)}
                className="h-1.5 sm:h-2 rounded-full transition-all duration-300"
                style={{ width: i === current ? 24 : 7, background: i === current ? ORANGE : 'rgba(255,255,255,0.45)' }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Floating feature cards ── */}
      <div className="relative z-20 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 -mt-6 pb-0">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {FEATURES.map(({ icon: Icon, title, desc }, idx) => (
            <div key={title}
              className="bg-white rounded-xl shadow-lg p-4 sm:p-5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-200"
              style={{
                transitionDelay: `${idx * 60}ms`,
                borderLeft: `4px solid ${TEAL}`,
                borderTop: '1px solid rgba(255,255,255,0.9)',
              }}>
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                  style={{ background: `linear-gradient(135deg, ${TEAL} 0%, #2D9E95 100%)` }}>
                  <Icon size={18} />
                </div>
                <h3 className="font-bold text-sm leading-snug" style={{ color: HEAD }}>{title}</h3>
              </div>
              <p className="text-[11px] sm:text-xs leading-relaxed" style={{ color: MUTED }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════
   ABOUT — real images, scroll-reveal animation
══════════════════════════════════════════════════════════ */
function About({ onOpen }: { onOpen: () => void }) {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const { ref, inView } = useInView()

  return (
    <section id="resources" className="py-14 sm:py-20 lg:py-24">
      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Left — real image collage */}
          <div className={`relative pb-8 sm:pb-10 lg:pb-0 transition-all duration-700 ${inView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {ABOUT_IMGS.map(({ src, label }) => (
                <div key={label} className="rounded-xl overflow-hidden aspect-[4/3] relative shadow-md group">
                  <img src={src} alt={label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 flex items-end"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }}>
                    <p className="text-white text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1.5 sm:py-2">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Floating badge */}
            <div className="absolute bottom-0 left-4 sm:left-6 rounded-xl shadow-2xl px-4 sm:px-5 py-3 sm:py-4 flex items-center gap-2 sm:gap-3 bg-white border border-gray-100">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm"
                style={{ background: ORANGE }}>
                <Trophy size={22} />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900 leading-none">10+</p>
                <p className="text-xs text-gray-500 font-semibold mt-0.5">Years Of Quality Service</p>
              </div>
            </div>
          </div>

          {/* Right — about content in white card */}
          <div className={`lg:pl-4 transition-all duration-700 delay-200 ${inView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
            <div className="bg-white rounded-2xl shadow-xl p-7 sm:p-9">
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap size={16} style={{ color: ORANGE }} />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: ORANGE }}>ABOUT US</span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight mb-5" style={{ color: HEAD }}>
                Our Preparation System<br />
                <span style={{ color: ORANGE }}>Inspires</span> You More.
              </h2>

              <p className="text-sm leading-relaxed mb-7" style={{ color: BODY }}>
                CssBuddy.pk is Pakistan's most comprehensive CSS/PMS exam preparation platform. We provide everything an aspirant needs — subject-wise MCQ practice, 8 years of past papers, study partner matching, premium notes, and expert essay feedback — all in one place.
              </p>

              <div className="space-y-4 mb-7">
                {[
                  { icon: BookOpen, title: 'MCQ Practice',         desc: 'Thousands of subject-wise MCQs across all compulsory and optional subjects with instant grading and PDF export.' },
                  { icon: Users,    title: 'Study Partner Network', desc: 'Match with fellow aspirants preparing the same optional subjects and build productive study groups.'             },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex gap-3 items-start p-3 rounded-xl" style={{ background: '#f8fafb' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                      style={{ background: `linear-gradient(135deg, ${ORANGE}, #fb923c)` }}>
                      <Icon size={17} />
                    </div>
                    <div>
                      <p className="font-bold text-sm mb-0.5" style={{ color: HEAD }}>{title}</p>
                      <p className="text-xs leading-relaxed" style={{ color: MUTED }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <button onClick={() => user ? navigate('/dashboard') : onOpen()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-bold hover:opacity-90 transition-opacity shadow-sm"
                  style={{ background: ORANGE }}>
                  DISCOVER MORE <ArrowRight size={14} />
                </button>
                <a href="tel:+923332531119" className="flex items-center gap-2 text-sm font-bold hover:opacity-80 transition-opacity" style={{ color: TEAL }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ background: TEAL }}>
                    <Phone size={14} />
                  </div>
                  +92 333 2531119
                </a>
              </div>

              <div className="mt-5 pt-5 border-t border-gray-100 flex items-baseline gap-2">
                <span className="text-4xl font-black" style={{ color: TEAL }}>99%</span>
                <span className="text-xs font-medium" style={{ color: MUTED }}>positive feedback from aspirants</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════
   STATS BANNER — animated count-up
══════════════════════════════════════════════════════════ */
function StatsBanner() {
  const { ref, inView } = useInView()

  return (
    <section style={{ background: TEAL }} className="py-10 sm:py-14 lg:py-16">
      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {STATS.map(s => <StatItem key={s.label} {...s} active={inView} />)}
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════
   COURSES / MODULES
══════════════════════════════════════════════════════════ */
function CoursesSection() {
  const navigate = useNavigate()
  const { ref, inView } = useInView()

  const ALL_MODULES = [
    { title: 'MCQ Practice',      tag: 'Practice',  icon: BookOpen,   grad: `linear-gradient(135deg,${TEAL},#2D9E95)`,  lessons: '5000+ MCQs',   route: '/practice'   },
    { title: 'Past Papers',       tag: 'Resources', icon: FileText,   grad: 'linear-gradient(135deg,#0369A1,#38BDF8)',  lessons: '150+ Papers',  route: '/past-papers' },
    { title: 'Premium Notes',     tag: 'Premium',   icon: Star,       grad: 'linear-gradient(135deg,#92400E,#F59E0B)',  lessons: 'Expert Notes', route: '/premium'    },
    { title: 'Study Partner',     tag: 'Community', icon: Users,      grad: 'linear-gradient(135deg,#5B21B6,#A855F7)',  lessons: '2K+ Users',    route: '/partner'    },
    { title: 'Essay Writing',     tag: 'Practice',  icon: PenLine,    grad: 'linear-gradient(135deg,#9D174D,#F472B6)',  lessons: 'PDF Upload',   route: '/essay'      },
    { title: 'News & Affairs',    tag: 'Current',   icon: Newspaper,  grad: 'linear-gradient(135deg,#065F46,#34D399)',  lessons: 'Daily Feed',   route: '/news'       },
    { title: 'Books Marketplace', tag: 'Market',    icon: BookMarked, grad: 'linear-gradient(135deg,#78350F,#FBBF24)',  lessons: 'Buy & Sell',   route: '/books'      },
    { title: 'Study Plan',        tag: 'Planning',  icon: Calendar,   grad: 'linear-gradient(135deg,#1E3A5F,#60A5FA)',  lessons: '12 Months',    route: '/study-plan' },
  ]

  return (
    <section id="modules" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-3">
            <GraduationCap size={16} style={{ color: ORANGE }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: ORANGE }}>OUR MODULES</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black" style={{ color: HEAD }}>
            Let's Check Our <span style={{ color: ORANGE }}>Modules</span>
          </h2>
          <p className="text-sm mt-4 max-w-xl mx-auto leading-relaxed" style={{ color: MUTED }}>
            Everything a CSS/PMS aspirant needs — organised into focused, easy-to-use preparation modules. All free.
          </p>
        </div>

        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {ALL_MODULES.map(({ title, tag, icon: Icon, grad, lessons, route }, idx) => (
            <div key={title} onClick={() => navigate(route)}
              className="rounded-xl overflow-hidden border border-gray-100 shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-250 cursor-pointer bg-white"
              style={{
                opacity: inView ? 1 : 0,
                transform: inView ? 'translateY(0)' : 'translateY(24px)',
                transition: `opacity 0.5s ease ${idx * 60}ms, transform 0.5s ease ${idx * 60}ms, box-shadow 0.2s, translate 0.2s`,
              }}>

              {/* Gradient image area */}
              <div className="relative h-36 flex items-center justify-center" style={{ background: grad }}>
                <Icon size={44} className="text-white/90 drop-shadow-lg" />
                <span className="absolute top-3 left-3 text-white text-[10px] font-bold uppercase px-2.5 py-1 rounded-md"
                  style={{ background: ORANGE }}>
                  {tag}
                </span>
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm rounded-md px-2 py-1">
                  <Clock size={10} className="text-white" />
                  <span className="text-white text-[10px] font-semibold">{lessons}</span>
                </div>
              </div>

              {/* Card body */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Stars5 />
                  <span className="text-gray-400 text-xs">(4.8)</span>
                </div>
                <h3 className="font-black text-sm mb-3 leading-snug" style={{ color: HEAD }}>{title}</h3>
                <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ background: TEAL }}>C</div>
                    <span className="text-[11px]" style={{ color: MUTED }}>CssBuddy Expert</span>
                  </div>
                  <span className="font-black text-sm" style={{ color: ORANGE }}>Free</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <button onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-white font-bold text-sm hover:opacity-90 transition-opacity shadow-sm"
            style={{ background: ORANGE }}>
            View All Modules <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════
   JOIN / ENROLL
══════════════════════════════════════════════════════════ */
function JoinSection({ onOpen }: { onOpen: () => void }) {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const { ref, inView } = useInView()

  return (
    <section className="py-20">
      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">

          <div className={`bg-white rounded-2xl shadow-xl p-7 sm:p-9 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap size={16} style={{ color: ORANGE }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: ORANGE }}>JOIN FREE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight mb-4" style={{ color: HEAD }}>
              If You Are a Serious<br />
              CSS/PMS Aspirant<br />
              <span style={{ color: ORANGE }}>Then Enroll For Free</span>
            </h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: BODY }}>
              Sign up today and get instant access to our complete suite of CSS/PMS preparation tools — no credit card required.
            </p>
            <p className="font-bold text-sm mb-3" style={{ color: HEAD }}>Enjoy Many Perks</p>
            <ul className="space-y-2.5 mb-7">
              {[
                'Unlimited MCQ practice for all subjects',
                'Access to 8 years of past papers',
                'Study partner matching by optional subjects',
                'Essay submission with expert feedback',
                'Daily current affairs news feed',
                'Progress tracking and milestone planner',
              ].map(p => (
                <li key={p} className="flex items-center gap-2.5 text-sm" style={{ color: BODY }}>
                  <CheckCircle size={15} style={{ color: TEAL }} className="shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
            <button onClick={() => user ? navigate('/dashboard') : onOpen()}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-white font-bold text-sm hover:opacity-90 transition-opacity shadow-sm"
              style={{ background: ORANGE }}>
              {user ? 'Open Dashboard' : 'Become an Aspirant'} <ArrowRight size={15} />
            </button>
          </div>

          {/* Feature tiles with images */}
          <div className={`grid grid-cols-2 gap-4 transition-all duration-700 delay-200 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {[
              {
                icon: BookOpen, t: 'MCQ Practice',  s: '5000+ Questions', bg: '#EFF6FF',
                img: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=300&q=70',
              },
              {
                icon: Trophy,   t: 'Instant Score',  s: 'Live Grading',    bg: '#FFF7ED',
                img: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=300&q=70',
              },
              {
                icon: FileText, t: 'Past Papers',    s: '2016 – 2023',     bg: '#F0FDF4',
                img: 'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=300&q=70',
              },
              {
                icon: Star,     t: 'Expert Notes',   s: 'Screening & MPT', bg: '#F5F3FF',
                img: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=300&q=70',
              },
            ].map(({ icon: Icon, t, s, bg, img }) => (
              <div key={t} className="rounded-xl overflow-hidden shadow-sm border border-gray-100 group cursor-pointer hover:-translate-y-1 transition-all duration-200">
                <div className="h-28 overflow-hidden relative">
                  <img src={img} alt={t} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.2)' }} />
                </div>
                <div className="p-4 flex gap-3 items-start" style={{ background: bg }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0"
                    style={{ background: TEAL }}>
                    <Icon size={17} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{t}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{s}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════
   TESTIMONIALS
══════════════════════════════════════════════════════════ */
function Testimonials() {
  const { ref, inView } = useInView()
  const T = [
    { name: 'Ayesha Noor',  role: 'CSS 2024 · Islamabad', text: 'CssBuddy completely transformed my preparation. The MCQ bank is vast and the instant feedback helped me identify weak areas quickly. Highly recommended!' },
    { name: 'Hamza Sheikh', role: 'PMS 2023 · Karachi',    text: 'The study partner feature is a game-changer. I found three friends preparing the same optionals and we studied together — it made the journey much easier.' },
    { name: 'Sana Mirza',   role: 'CSS 2024 · Lahore',    text: 'Premium notes are top-notch and the essay feedback I received was very constructive. My writing scores improved significantly in the actual exam.' },
  ]
  return (
    <section id="blog" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-3">
            <GraduationCap size={16} style={{ color: ORANGE }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: ORANGE }}>TESTIMONIALS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black" style={{ color: HEAD }}>
            What Our <span style={{ color: ORANGE }}>Students</span> Say
          </h2>
        </div>

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {T.map(({ name, role, text }, i) => (
            <div key={name}
              className="bg-white rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col gap-4"
              style={{
                opacity: inView ? 1 : 0,
                transform: inView ? 'translateY(0)' : 'translateY(20px)',
                transition: `opacity 0.5s ease ${i * 120}ms, transform 0.5s ease ${i * 120}ms`,
                borderTop: `4px solid ${i % 2 === 0 ? TEAL : ORANGE}`,
              }}>
              <Stars5 />
              <p className="text-sm leading-relaxed flex-1" style={{ color: BODY }}>"{text}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base"
                  style={{ background: i % 2 === 0 ? TEAL : ORANGE }}>
                  {name[0]}
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: HEAD }}>{name}</p>
                  <p className="text-xs" style={{ color: MUTED }}>{role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════
   FOOTER
══════════════════════════════════════════════════════════ */
function Footer({ onOpen }: { onOpen: () => void }) {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  return (
    <footer>
      {/* CTA strip */}
      <div style={{ background: TEAL }} className="py-12">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h3 className="text-2xl sm:text-3xl font-black mb-3">
            Ready to Start Your <span style={{ color: ORANGE }}>CSS/PMS</span> Journey?
          </h3>
          <p className="text-sm opacity-80 mb-7">Join thousands of aspirants already preparing smarter with CssBuddy.pk</p>
          <button onClick={() => user ? navigate('/dashboard') : onOpen()}
            className="inline-flex items-center gap-2 font-bold px-8 py-3.5 rounded-lg text-white text-sm hover:opacity-90 transition-opacity shadow-lg"
            style={{ background: ORANGE }}>
            {user ? 'Open Dashboard' : 'Get Started Free'} <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* Footer links */}
      <div style={{ background: NAVY }} className="text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                  style={{ background: `linear-gradient(135deg, ${TEAL}, #2D9E95)` }}>
                  <GraduationCap size={18} />
                </div>
                <span className="font-black text-white text-base">CssBuddy<span style={{ color: ORANGE }}>.pk</span></span>
              </div>
              <p className="text-xs leading-relaxed text-slate-400">Pakistan's most comprehensive CSS/PMS exam preparation platform. Built by aspirants, for aspirants.</p>
              <div className="flex gap-3 mt-4">
                {[SocialIcons.Facebook, SocialIcons.Twitter, SocialIcons.Instagram, SocialIcons.Youtube].map((Icon, i) => (
                  <a key={i} href="#" className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center transition-colors">
                    <Icon />
                  </a>
                ))}
              </div>
            </div>
            {[
              { t: 'Modules',   ls: ['MCQ Practice', 'Past Papers', 'Premium Notes', 'Essay Writing'] },
              { t: 'Community', ls: ['Study Partner', 'Books Market', 'News & Affairs', 'Study Plan']  },
              { t: 'Contact',   ls: ['cssbuddy.pk@gmail.com', '+92 333 2531119', 'Karachi, Pakistan', 'Mon–Sat 9am–6pm'] },
            ].map(({ t, ls }) => (
              <div key={t}>
                <p className="font-bold text-white text-sm mb-4">{t}</p>
                <ul className="space-y-2.5">
                  {ls.map(l => (
                    <li key={l}>
                      <a href="#" className="text-xs hover:text-white transition-colors">{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <p>© {new Date().getFullYear()} CssBuddy.pk — Made with ❤️ for CSS/PMS aspirants</p>
            <div className="flex gap-5">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Use</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ══════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════ */
export function Landing() {
  const [authOpen, setAuthOpen] = useState(false)
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  if (user) {
    navigate('/dashboard', { replace: true })
    return null
  }

  const open = () => setAuthOpen(true)

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <TopBar />
      <Navbar      onOpen={open} />
      <Hero        onOpen={open} />
      <About       onOpen={open} />
      <StatsBanner />
      <CoursesSection />
      <JoinSection onOpen={open} />
      <Testimonials />
      <Footer      onOpen={open} />
      {authOpen && <AuthModal defaultOpen onClose={() => setAuthOpen(false)} />}
    </div>
  )
}
