import { GraduationCap } from 'lucide-react'

const TEAL   = '#1D6660'
const ORANGE = '#F97316'
const NAVY   = '#0f172a'

const SocialIcons = {
  Facebook: () => (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  ),
  Twitter: () => (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
  ),
  Instagram: () => (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  ),
  Youtube: () => (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white" />
    </svg>
  ),
}

export function Footer() {
  return (
    <footer style={{ background: NAVY }} className="text-slate-400 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">

          {/* Brand column */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                style={{ background: `linear-gradient(135deg, ${TEAL}, #2D9E95)` }}>
                <GraduationCap size={18} />
              </div>
              <span className="font-black text-white text-base">
                CssBuddy<span style={{ color: ORANGE }}>.pk</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Pakistan's most comprehensive CSS/PMS exam preparation platform. Built by aspirants, for aspirants.
            </p>
            <div className="flex gap-3 mt-4">
              {[SocialIcons.Facebook, SocialIcons.Twitter, SocialIcons.Instagram, SocialIcons.Youtube].map((Icon, i) => (
                <a key={i} href="#"
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center transition-colors">
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {[
            { t: 'Modules',   ls: ['MCQ Practice', 'Past Papers', 'CssBuddy Shop', 'Study Plan'] },
            { t: 'Community', ls: ['Study Partner', 'Study Plan', 'News & Affairs', 'Practice']     },
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

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <p>© {new Date().getFullYear()} CssBuddy.pk — Made with ❤️ for CSS/PMS aspirants</p>
          <div className="flex gap-5">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Use</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
