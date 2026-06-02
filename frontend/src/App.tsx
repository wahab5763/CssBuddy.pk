import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { Landing } from '@/pages/Landing'
import { Dashboard } from '@/pages/Dashboard'
import { StudyPlan } from '@/pages/StudyPlan'
import { Practice } from '@/pages/Practice'
import { Books } from '@/pages/Books'
import { PastPapers } from '@/pages/PastPapers'
import { News } from '@/pages/News'
import { PremiumNotes } from '@/pages/PremiumNotes'
import { StudyPartner } from '@/pages/StudyPartner'
import { StudyGroups } from '@/pages/StudyGroups'
import { EssayWriting } from '@/pages/EssayWriting'
import { AdminPanel } from '@/pages/AdminPanel'
import { usePersistentSession } from '@/hooks/usePersistentSession'
import { applyStoredTheme } from '@/store/themeStore'

applyStoredTheme()

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 60_000 } },
})

function AppRoutes() {
  usePersistentSession()
  return (
    <Routes>
      {/* Public landing — no sidebar */}
      <Route path="/" element={<Landing />} />

      {/* App routes — inside AppShell with sidebar */}
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/study-plan" element={<StudyPlan />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/books" element={<Books />} />
        <Route path="/past-papers" element={<PastPapers />} />
        <Route path="/news" element={<News />} />
        <Route path="/premium" element={<PremiumNotes />} />
        <Route path="/partner" element={<StudyPartner />} />
        <Route path="/study-groups" element={<StudyGroups />} />
        <Route path="/essay" element={<EssayWriting />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
