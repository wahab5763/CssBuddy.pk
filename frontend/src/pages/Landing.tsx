import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { AuthModal } from '@/components/auth/AuthModal'
import {
  BookOpen, FileText, Star, Users, GraduationCap, Trophy,
  CheckCircle, ArrowRight, Phone, Mail, MapPin,
  Search,
  BookMarked, PenLine, Calendar, Newspaper, Clock, Award,
} from 'lucide-react'

const SocialIcons = {
  Facebook: () => (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  ),
  Twitter: () => (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
    </svg>
  ),
  Instagram: () => (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  ),
  Youtube: () => (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/>
    </svg>
  ),
}

/* ── Exact colour tokens from the reference ─────────────── */
const TEAL   = '#1D6660'  // top bar, stats banner, footer
const ORANGE = '#F97316'  // all orange accents, buttons, labels
const ORANGE_LIGHT = '#FFF7ED'

/* ── Data ────────────────────────────────────────────────── */
const FEATURES = [
  { num: '01', icon: FileText,    title: 'Past Papers',      desc: '2016–2023 official CSS/PMS papers organised by subject, viewable directly in the app.' },
  { num: '02', icon: BookOpen,    title: 'Expert MCQs',      desc: 'Thousands of subject-wise MCQs with instant scoring, answer keys, and PDF export.' },
  { num: '03', icon: Users,       title: 'Study Partner',    desc: 'Match with aspirants preparing the same optional subjects and study together.' },
  { num: '04', icon: Star,        title: 'Premium Notes',    desc: 'Screening Test and MPT preparation notes reviewed by top CSS qualifiers.' },
]

const STATS = [
  { value: '5000+', label: 'MCQ Questions',    icon: BookOpen   },
  { value: '10K+',  label: 'Active Users',     icon: Users      },
  { value: '11',    label: 'Study Modules',    icon: GraduationCap },
  { value: '98%',   label: 'Satisfaction Rate', icon: Trophy    },
]

const MODULES = [
  {
    title: 'MCQ Practice & Quiz',
    tag: 'Practice',
    lessons: 5000,
    img: null,
    grad: 'linear-gradient(135deg,#1D6660,#2D9E95)',
    icon: BookOpen,
    route: '/practice',
  },
  {
    title: 'Past Papers 2016–2023',
    tag: 'Resources',
    lessons: 150,
    img: null,
    grad: 'linear-gradient(135deg,#0369A1,#38BDF8)',
    icon: FileText,
    route: '/past-papers',
  },
  {
    title: 'Study Partner Match',
    tag: 'Community',
    lessons: null,
    img: null,
    grad: 'linear-gradient(135deg,#9333EA,#C084FC)',
    icon: Users,
    route: '/partner',
  },
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

/* ══════════════════════════════════════════════════════════
   TOP INFO BAR
══════════════════════════════════════════════════════════ */
function TopBar() {
  return (
    <div style={{ background: TEAL }} className="text-white text-xs hidden lg:block">
      <div className="max-w-7xl mx-auto px-6 h-9 flex items-center justify-between">
        {/* Left — social icons */}
        <div className="flex items-center gap-4">
          <span className="font-semibold opacity-80">Follow Us</span>
          {[SocialIcons.Facebook, SocialIcons.Twitter, SocialIcons.Instagram, SocialIcons.Youtube].map((Icon, i) => (
            <a key={i} href="#" className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors">
              <Icon />
            </a>
          ))}
        </div>

        {/* Right — contact info */}
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
   NAVBAR
══════════════════════════════════════════════════════════ */
function Navbar({ onOpen }: { onOpen: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  const NAV = ['Home', 'Modules', 'Subjects', 'Resources', 'Study Plan', 'Blog', 'Contact']

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-[70px] gap-6">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: TEAL }}>
            <GraduationCap size={20} className="text-white" />
          </div>
          <div className="leading-tight">
            <span className="font-black text-xl tracking-tight" style={{ color: TEAL }}>✦eduka</span>
            <span className="font-black text-xl tracking-tight text-gray-800">&nbsp;</span>
          </div>
          <div className="hidden sm:block border-l border-gray-200 pl-3">
            <p className="font-black text-base text-gray-800 leading-tight">CssBuddy<span style={{ color: ORANGE }}>.pk</span></p>
            <p className="text-[10px] text-gray-400">CSS/PMS Prep Platform</p>
          </div>
        </a>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-5 flex-1 justify-center">
          {NAV.map((l, i) => (
            <a key={l} href={`#${l.toLowerCase().replace(' ', '-')}`}
              className={`text-sm font-semibold transition-colors flex items-center gap-0.5 ${i === 0 ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}>
              {l} {i > 0 && i < 5 && <span className="text-gray-400 text-xs">▾</span>}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="hidden lg:flex items-center gap-3 ml-auto">
          <button className="text-gray-600 hover:text-gray-900 p-1"><Search size={18} /></button>
          {user ? (
            <button onClick={() => navigate('/dashboard')}
              className="px-5 py-2.5 rounded text-white text-sm font-bold hover:opacity-90 transition-opacity"
              style={{ background: ORANGE }}>
              Dashboard →
            </button>
          ) : (
            <button onClick={onOpen}
              className="px-5 py-2.5 rounded text-white text-sm font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5"
              style={{ background: ORANGE }}>
              <span className="text-base leading-none">✦</span> APPLY NOW
            </button>
          )}
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setMobileOpen((o) => !o)} className="lg:hidden ml-auto text-gray-600 p-1">
          {mobileOpen
            ? <span className="font-bold text-xl">✕</span>
            : <span className="text-2xl leading-none">☰</span>}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-white border-t px-4 py-4 space-y-3">
          {NAV.map((l) => (
            <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setMobileOpen(false)}
              className="block text-sm font-semibold text-gray-700 py-1 border-b border-gray-100">{l}</a>
          ))}
          <button onClick={() => { onOpen(); setMobileOpen(false) }}
            className="w-full mt-2 py-3 rounded text-white font-bold" style={{ background: ORANGE }}>
            APPLY NOW
          </button>
        </div>
      )}
    </header>
  )
}

/* ══════════════════════════════════════════════════════════
   HERO
══════════════════════════════════════════════════════════ */
function Hero({ onOpen }: { onOpen: () => void }) {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  return (
    <section className="relative overflow-hidden" style={{ minHeight: 520 }}>
      {/* Dark overlay background */}
      <div className="absolute inset-0 z-0"
        style={{ background: 'linear-gradient(105deg,rgba(10,30,30,0.88) 45%,rgba(29,102,96,0.55) 100%)' }} />
      {/* Background teal pattern */}
      <div className="absolute inset-0 z-0" style={{ background: `${TEAL}`, opacity: 0.25 }} />
      {/* Students bg illustration */}
      <div className="absolute right-0 top-0 bottom-0 w-[55%] z-0 overflow-hidden hidden lg:block">
        <div style={{ background: 'linear-gradient(135deg,#2D9E95 0%,#1D6660 50%,#0D3A36 100%)', opacity: 0.7 }} className="absolute inset-0" />
        {/* Decorative students silhouette using CSS */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex gap-4 items-end opacity-40">
            {[80, 110, 95, 105, 85].map((h, i) => (
              <div key={i} className="w-14 rounded-t-full bg-white/30" style={{ height: h }} />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        {/* Prev / Next arrows */}
        <button className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 border border-white/20 rounded-full items-center justify-center text-white hover:bg-white/20">‹</button>
        <button className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 border border-white/20 rounded-full items-center justify-center text-white hover:bg-white/20">›</button>

        <div className="max-w-xl">
          {/* Badge */}
          <div className="flex items-center gap-2 mb-5">
            <span className="text-sm font-bold uppercase tracking-widest" style={{ color: ORANGE }}>
              ✦ WELCOME TO CSSBUDDY.PK!
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black text-white leading-[1.1] mb-6">
            Start Your <br className="hidden sm:block" />
            Beautiful<br />
            And <span style={{ color: ORANGE }}>Bright</span> Future
          </h1>

          <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-8 max-w-md">
            Pakistan's most comprehensive CSS/PMS preparation platform. Practice MCQs, browse past papers, find study partners, and get expert essay feedback — all in one place.
          </p>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => user ? navigate('/dashboard') : onOpen()}
              className="flex items-center gap-2 px-6 py-3 rounded text-white text-sm font-bold hover:opacity-90 transition-opacity"
              style={{ background: ORANGE }}>
              ABOUT MORE <ArrowRight size={15} />
            </button>
            <button
              onClick={() => document.getElementById('modules')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-2 px-6 py-3 rounded border-2 border-white/40 text-white text-sm font-bold hover:bg-white/10 transition-colors">
              LEARN MORE <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Floating feature cards (overlap) ── */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 pb-0">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(({ num, icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-lg shadow-lg p-5 border border-gray-100 hover:shadow-xl transition-shadow">
              {/* Icon circle + number */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 shrink-0"
                  style={{ borderColor: TEAL }}>
                  <Icon size={20} style={{ color: TEAL }} />
                </div>
                <span className="text-3xl font-black text-gray-100">{num}</span>
              </div>
              <h3 className="font-bold text-gray-900 text-sm mb-1.5">{title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════
   ABOUT SECTION
══════════════════════════════════════════════════════════ */
function About({ onOpen }: { onOpen: () => void }) {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  return (
    <section id="resources" className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left — image collage */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-3">
              {[
                { emoji: '📝', label: 'MCQ Practice',  bg: '#EFF6FF' },
                { emoji: '📄', label: 'Past Papers',   bg: '#F0FDF4' },
                { emoji: '👥', label: 'Study Groups',  bg: '#FFF7ED' },
                { emoji: '⭐', label: 'Premium Notes', bg: '#F5F3FF' },
              ].map(({ emoji, label, bg }) => (
                <div key={label} className="rounded-lg aspect-[4/3] flex flex-col items-center justify-center gap-2 border border-gray-100 shadow-sm"
                  style={{ background: bg }}>
                  <span className="text-4xl">{emoji}</span>
                  <p className="text-xs font-bold text-gray-700">{label}</p>
                </div>
              ))}
            </div>
            {/* Floating badge */}
            <div className="absolute bottom-[-20px] left-6 rounded-xl shadow-xl px-5 py-4 flex items-center gap-3 border border-gray-100 bg-white">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white shrink-0" style={{ background: ORANGE }}>
                <Trophy size={22} />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900 leading-none">10+</p>
                <p className="text-xs text-gray-500 font-semibold mt-0.5">Years Of Quality Service</p>
              </div>
            </div>
          </div>

          {/* Right — about content */}
          <div className="lg:pl-4">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap size={16} style={{ color: ORANGE }} />
              <span className="text-sm font-bold uppercase tracking-widest" style={{ color: ORANGE }}>ABOUT US</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-5">
              Our Preparation System<br />
              <span style={{ color: ORANGE }}>Inspires</span> You More.
            </h2>

            <p className="text-gray-600 text-sm leading-relaxed mb-8">
              CssBuddy.pk is Pakistan's most comprehensive CSS/PMS exam preparation platform. We provide everything an aspirant needs — subject-wise MCQ practice, 8 years of past papers, study partner matching, premium notes, and expert essay feedback — all in one place.
            </p>

            <div className="space-y-5 mb-8">
              {[
                { icon: BookOpen, title: 'MCQ Practice',    desc: 'Thousands of subject-wise MCQs across all compulsory and optional subjects with instant grading and PDF export.' },
                { icon: Users,    title: 'Study Partner Network', desc: 'Match with fellow aspirants preparing the same optional subjects and build productive study groups.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0" style={{ background: ORANGE }}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm mb-1">{title}</p>
                    <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA row */}
            <div className="flex flex-wrap items-center gap-6 pt-2">
              <button
                onClick={() => user ? navigate('/dashboard') : onOpen()}
                className="flex items-center gap-2 px-6 py-3 rounded text-white text-sm font-bold hover:opacity-90 transition-opacity"
                style={{ background: ORANGE }}>
                DISCOVER MORE <ArrowRight size={15} />
              </button>
              <a href="tel:+923332531119" className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-gray-900">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white" style={{ background: TEAL }}>
                  <Phone size={15} />
                </div>
                +92 333 2531119
              </a>
            </div>

            {/* Counter */}
            <div className="mt-6 pl-0">
              <span className="text-5xl font-black" style={{ color: TEAL }}>99</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════
   STATS BANNER
══════════════════════════════════════════════════════════ */
function StatsBanner() {
  return (
    <section style={{ background: TEAL }} className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map(({ value, label, icon: Icon }) => (
            <div key={label} className="text-center text-white">
              {/* Icon in orange circle */}
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-white mx-auto mb-4 border-4 border-white/20"
                style={{ background: ORANGE }}>
                <Icon size={28} />
              </div>
              <p className="text-4xl font-black mb-1">{value}</p>
              <p className="text-sm font-semibold opacity-80">+ {label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════
   COURSES / MODULES SECTION
══════════════════════════════════════════════════════════ */
function CoursesSection() {
  const navigate = useNavigate()

  const ALL_MODULES = [
    { title: 'MCQ Practice',      tag: 'Practice',    icon: BookOpen,  grad: `linear-gradient(135deg,${TEAL},#2D9E95)`, lessons: '5000+ MCQs',   route: '/practice'   },
    { title: 'Past Papers',       tag: 'Resources',   icon: FileText,  grad: 'linear-gradient(135deg,#0369A1,#38BDF8)', lessons: '150+ Papers', route: '/past-papers' },
    { title: 'Premium Notes',     tag: 'Premium',     icon: Star,      grad: 'linear-gradient(135deg,#92400E,#F59E0B)', lessons: 'Expert Notes', route: '/premium'    },
    { title: 'Study Partner',     tag: 'Community',   icon: Users,     grad: 'linear-gradient(135deg,#5B21B6,#A855F7)', lessons: '2K+ Users',   route: '/partner'    },
    { title: 'Essay Writing',     tag: 'Practice',    icon: PenLine,   grad: 'linear-gradient(135deg,#9D174D,#F472B6)', lessons: 'PDF Upload',  route: '/essay'      },
    { title: 'News & Affairs',    tag: 'Current',     icon: Newspaper, grad: 'linear-gradient(135deg,#065F46,#34D399)', lessons: 'Daily Feed',  route: '/news'       },
    { title: 'Books Marketplace', tag: 'Market',      icon: BookMarked,grad: 'linear-gradient(135deg,#78350F,#FBBF24)', lessons: 'Buy & Sell',  route: '/books'      },
    { title: 'Study Plan',        tag: 'Planning',    icon: Calendar,  grad: 'linear-gradient(135deg,#1E3A5F,#60A5FA)', lessons: '12 Months',   route: '/study-plan' },
    { title: 'News & Resources',  tag: 'Resources',   icon: Award,     grad: 'linear-gradient(135deg,#1D4ED8,#818CF8)', lessons: 'All Topics',  route: '/news'       },
  ]

  return (
    <section id="modules" className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-3">
            <GraduationCap size={16} style={{ color: ORANGE }} />
            <span className="text-sm font-bold uppercase tracking-widest" style={{ color: ORANGE }}>OUR MODULES</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900">
            Let's Check Our <span style={{ color: ORANGE }}>Modules</span>
          </h2>
          <p className="text-gray-500 text-sm mt-4 max-w-xl mx-auto leading-relaxed">
            Everything a CSS/PMS aspirant needs — organised into focused, easy-to-use preparation modules. Access all of them for free.
          </p>
        </div>

        {/* 3-column course cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {ALL_MODULES.slice(0, 6).map(({ title, tag, icon: Icon, grad, lessons, route }) => (
            <div key={title}
              onClick={() => navigate(route)}
              className="rounded-xl overflow-hidden border border-gray-100 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer bg-white">

              {/* Image area with gradient */}
              <div className="relative h-44 flex items-center justify-center" style={{ background: grad }}>
                <Icon size={56} className="text-white/90 drop-shadow" />

                {/* Top-left tag */}
                <span className="absolute top-4 left-4 text-white text-[10px] font-bold uppercase px-3 py-1 rounded"
                  style={{ background: ORANGE }}>
                  {tag}
                </span>

                {/* Bottom-left lessons */}
                <div className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm rounded px-2.5 py-1">
                  <Clock size={11} className="text-white" />
                  <span className="text-white text-[11px] font-semibold">{lessons}</span>
                </div>
              </div>

              {/* Card body */}
              <div className="p-5">
                {/* Rating */}
                <div className="flex items-center gap-2 mb-2">
                  <Stars5 />
                  <span className="text-gray-400 text-xs">(4.8)</span>
                </div>

                <h3 className="font-black text-gray-900 text-base mb-3 leading-tight">{title}</h3>

                {/* Bottom row */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: TEAL }}>
                      C
                    </div>
                    <span className="text-xs text-gray-500">CssBuddy Expert</span>
                  </div>
                  <span className="font-black text-base" style={{ color: ORANGE }}>Free</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View all button */}
        <div className="text-center mt-10">
          <button onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded text-white font-bold text-sm hover:opacity-90 transition-opacity"
            style={{ background: ORANGE }}>
            View All Modules <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════════════════════════════════════
   CTA / JOIN SECTION
══════════════════════════════════════════════════════════ */
function JoinSection({ onOpen }: { onOpen: () => void }) {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap size={16} style={{ color: ORANGE }} />
              <span className="text-sm font-bold uppercase tracking-widest" style={{ color: ORANGE }}>JOIN FREE</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-4">
              If You Are a Serious<br />
              CSS/PMS Aspirant<br />
              <span style={{ color: ORANGE }}>Then Enroll For Free</span>
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-7">
              Sign up today and get instant access to our complete suite of CSS/PMS preparation tools — no credit card required.
            </p>
            <p className="font-bold text-gray-800 text-sm mb-4">Enjoy Many Perks</p>
            <ul className="space-y-3 mb-8">
              {[
                'Unlimited MCQ practice for all subjects',
                'Access to 8 years of past papers',
                'Study partner matching by optional subjects',
                'Essay submission with expert feedback',
                'Daily current affairs news feed',
                'Progress tracking and milestone planner',
              ].map((p) => (
                <li key={p} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <CheckCircle size={16} style={{ color: ORANGE }} className="shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
            <button
              onClick={() => user ? navigate('/dashboard') : onOpen()}
              className="flex items-center gap-2 px-7 py-3.5 rounded text-white font-bold text-sm hover:opacity-90 transition-opacity"
              style={{ background: ORANGE }}>
              {user ? 'Open Dashboard' : 'Become an Aspirant'} <ArrowRight size={15} />
            </button>
          </div>

          {/* Right — feature tiles */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: BookOpen,  t: 'MCQ Practice',  s: '5000+ Questions',  bg: '#EFF6FF' },
              { icon: Trophy,    t: 'Instant Score',  s: 'Live Grading',     bg: '#FFF7ED' },
              { icon: FileText,  t: 'Past Papers',    s: '2016 – 2023',      bg: '#F0FDF4' },
              { icon: Star,      t: 'Expert Notes',   s: 'Screening & MPT',  bg: '#F5F3FF' },
            ].map(({ icon: Icon, t, s, bg }) => (
              <div key={t} className="rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col gap-3" style={{ background: bg }}>
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-white shrink-0" style={{ background: TEAL }}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{t}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{s}</p>
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
  const T = [
    { name: 'Ayesha Noor',  role: 'CSS 2024 · Islamabad', stars: 5, text: 'CssBuddy completely transformed my preparation. The MCQ bank is vast and the instant feedback helped me identify my weak areas quickly. Highly recommended!' },
    { name: 'Hamza Sheikh', role: 'PMS 2023 · Karachi',    stars: 5, text: 'The study partner feature is a game-changer. I found three friends preparing the same optionals. We studied together and it made the journey much easier.' },
    { name: 'Sana Mirza',   role: 'CSS 2024 · Lahore',    stars: 5, text: 'Premium notes are top-notch, and the essay feedback I received was very constructive. My writing scores improved significantly in the actual exam.' },
  ]
  return (
    <section id="blog" className="py-20" style={{ background: '#F9FAFB' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-3">
            <GraduationCap size={16} style={{ color: ORANGE }} />
            <span className="text-sm font-bold uppercase tracking-widest" style={{ color: ORANGE }}>TESTIMONIALS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900">
            What Our <span style={{ color: ORANGE }}>Students</span> Say
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {T.map(({ name, role, stars: _s, text }, i) => (
            <div key={name} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 flex flex-col gap-4 border border-gray-100">
              <Stars5 />
              <p className="text-gray-600 text-sm leading-relaxed flex-1">"{text}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base"
                  style={{ background: [TEAL, ORANGE, TEAL][i] }}>
                  {name[0]}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{name}</p>
                  <p className="text-gray-400 text-xs">{role}</p>
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
      <div style={{ background: TEAL }} className="py-12 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h3 className="text-2xl sm:text-3xl font-black mb-3">
            Ready to Start Your <span style={{ color: ORANGE }}>CSS/PMS</span> Journey?
          </h3>
          <p className="text-sm opacity-80 mb-7">Join thousands of aspirants already preparing smarter with CssBuddy.pk</p>
          <button onClick={() => user ? navigate('/dashboard') : onOpen()}
            className="inline-flex items-center gap-2 font-bold px-8 py-3.5 rounded text-white text-sm hover:opacity-90 transition-opacity shadow-lg"
            style={{ background: ORANGE }}>
            {user ? 'Open Dashboard' : "Get Started Free"} <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* Footer links */}
      <div className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-black" style={{ background: TEAL }}>
                  <GraduationCap size={16} />
                </div>
                <span className="font-black text-white">CssBuddy.pk</span>
              </div>
              <p className="text-xs leading-relaxed">Pakistan's most comprehensive CSS/PMS exam preparation platform. Built by aspirants, for aspirants.</p>
              <div className="flex gap-3 mt-4">
                {[SocialIcons.Facebook, SocialIcons.Twitter, SocialIcons.Instagram, SocialIcons.Youtube].map((Icon, i) => (
                  <a key={i} href="#" className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
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
                <ul className="space-y-2">
                  {ls.map((l) => <li key={l}><a href="#" className="text-xs hover:text-white transition-colors">{l}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <p>© {new Date().getFullYear()} CssBuddy.pk — Made with ❤️ for CSS/PMS aspirants</p>
            <div className="flex gap-5">
              <a href="#" className="hover:text-white">Privacy Policy</a>
              <a href="#" className="hover:text-white">Terms of Use</a>
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
      <Navbar   onOpen={open} />
      <Hero     onOpen={open} />
      <About    onOpen={open} />
      <StatsBanner />
      <CoursesSection />
      <JoinSection  onOpen={open} />
      <Testimonials />
      <Footer   onOpen={open} />

      {authOpen && <AuthModal defaultOpen onClose={() => setAuthOpen(false)} />}
    </div>
  )
}
