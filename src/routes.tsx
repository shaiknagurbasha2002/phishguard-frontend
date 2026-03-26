import { createBrowserRouter, Outlet } from 'react-router';
import { AuthLayout } from './components/layouts/AuthLayout';
import { DashboardLayout } from './components/layouts/DashboardLayout';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';
import { UserDashboard } from './components/dashboard/UserDashboard';
import { TrainingModules } from './components/training/TrainingModules';
import { QuizInterface } from './components/quiz/QuizInterface';
import { EmailScanner } from './components/scanner/EmailScanner';
import { Leaderboard } from './components/gamification/Leaderboard';
import { PhishingSimulation } from './components/simulation/PhishingSimulation';
import { KnowledgeHub } from './components/knowledge/KnowledgeHub';
import { KnowledgeArticleDetail } from './components/knowledge/KnowledgeArticleDetail';
import { IncidentReporting } from './components/reporting/IncidentReporting';
import { SecurityTools } from './components/tools/SecurityTools';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { UserProfilePage } from './components/profile/UserProfilePage';
import { NotFoundPage } from './components/NotFoundPage';
import { UsersProvider } from './hooks/useUsers';

function RootProviders() {
  return (
    <UsersProvider>
      <Outlet />
    </UsersProvider>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootProviders />,
    children: [
      {
        path: '/',
        element: <AuthLayout />,
        children: [
          { index: true, element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
          { path: 'forgot-password', element: <ForgotPasswordPage /> },
        ],
      },
      {
        path: '/dashboard',
        element: <DashboardLayout />,
        children: [
          { index: true, element: <UserDashboard /> },
          { path: 'training', element: <TrainingModules /> },
          { path: 'quiz', element: <QuizInterface /> },
          { path: 'scanner', element: <EmailScanner /> },
          { path: 'leaderboard', element: <Leaderboard /> },
          { path: 'simulation', element: <PhishingSimulation /> },
          { path: 'knowledge', element: <KnowledgeHub /> },
          { path: 'knowledge/:articleId', element: <KnowledgeArticleDetail /> },
          { path: 'report', element: <IncidentReporting /> },
          { path: 'tools', element: <SecurityTools /> },
          { path: 'admin', element: <AdminDashboard /> },
          { path: 'profile', element: <UserProfilePage /> },
          { path: 'profile/:userId', element: <UserProfilePage /> },
        ],
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
