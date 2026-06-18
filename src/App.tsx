import { Route, Routes } from 'react-router-dom'
import { LoginPage } from '@/routes/login'
import { AuthCallback } from '@/routes/auth-callback'
import { OnboardingPage } from '@/routes/onboarding'
import { HomePage } from '@/routes/home'
import { MatchesPage } from '@/routes/matches'
import { MatchDetailPage } from '@/routes/match-detail'
import { RankingPage } from '@/routes/ranking'
import { InvitesPage } from '@/routes/invites'
import { ProfilePage } from '@/routes/profile'
import { QuickPredictPage } from '@/routes/quick-predict'
import { RulesPage } from '@/routes/rules'
import { StandingsPage } from '@/routes/standings'
import { TournamentPredictionPage } from '@/routes/predictions/tournament'
import { GroupsIndexPage } from '@/routes/predictions/groups'
import { GroupDetailPage } from '@/routes/predictions/group-detail'
import {
  MyPredictionsPage,
  PublicPredictionsPage,
} from '@/routes/me/predictions'
import { ProtectedLayout } from '@/components/ProtectedLayout'
import { PWAUpdatePrompt } from '@/components/PWAUpdatePrompt'

export default function App() {
  return (
    <>
      <PWAUpdatePrompt />
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/matches" element={<MatchesPage />} />
        <Route path="/matches/:id" element={<MatchDetailPage />} />
        <Route path="/ranking" element={<RankingPage />} />
        <Route path="/standings" element={<StandingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/regras" element={<RulesPage />} />
        <Route path="/invites" element={<InvitesPage />} />
        <Route path="/palpitar" element={<QuickPredictPage />} />
        <Route
          path="/predictions/tournament"
          element={<TournamentPredictionPage />}
        />
        <Route path="/me/predictions" element={<MyPredictionsPage />} />
        <Route
          path="/u/:userId/predictions"
          element={<PublicPredictionsPage />}
        />
        <Route path="/predictions/groups" element={<GroupsIndexPage />} />
        <Route
          path="/predictions/groups/:letter"
          element={<GroupDetailPage />}
        />
      </Route>
    </Routes>
    </>
  )
}
