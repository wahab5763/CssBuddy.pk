export function Footer() {
  return (
    <footer className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 py-5 px-6 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-brand flex items-center justify-center">
            <span className="text-white font-black text-[10px]">CB</span>
          </div>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">CssBuddy.pk</span>
        </div>
        <p className="text-xs text-gray-400">Made with ❤️ for CSS/PMS aspirants · © {new Date().getFullYear()}</p>
        <div className="flex gap-4 text-xs text-gray-400">
          <a href="mailto:cssbuddy.pk@gmail.com" className="hover:text-primary transition-colors">Contact</a>
          <span>cssbuddy.pk</span>
        </div>
      </div>
    </footer>
  )
}
