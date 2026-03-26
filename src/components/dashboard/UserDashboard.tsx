import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  BookOpen,
  ClipboardCheck,
  ScanSearch,
  Wrench,
  BookMarked,
  Trophy,
  Zap,
  Users,
  Megaphone,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { useCurrentUser, useUsers } from '@/context/UsersContext';
import { Skeleton } from '../ui/skeleton';
import {
  getDashboardSummary,
  type DashboardSummaryView,
  API_ORIGIN,
} from '@/lib/api';

const quickActions = [
  { name: 'Start Training', href: '/dashboard/training', icon: BookOpen, color: 'from-blue-500 to-cyan-500', glow: 'glow-blue-hover' },
  { name: 'Take Quiz', href: '/dashboard/quiz', icon: ClipboardCheck, color: 'from-purple-500 to-pink-500', glow: 'glow-blue-hover' },
  { name: 'Scan Email', href: '/dashboard/scanner', icon: ScanSearch, color: 'from-orange-500 to-red-500', glow: 'glow-blue-hover' },
  { name: 'Security Tools', href: '/dashboard/tools', icon: Wrench, color: 'from-green-500 to-emerald-500', glow: 'glow-blue-hover' },
  { name: 'Knowledge Hub', href: '/dashboard/knowledge', icon: BookMarked, color: 'from-indigo-500 to-purple-500', glow: 'glow-blue-hover' },
];

function safeStat(n: number | null | undefined): string {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return String(n);
}

type Announcement = { id: number; title: string; message: string; createdAt: string };

export function UserDashboard() {
  const navigate = useNavigate();
  const { currentUser, loading: userLoading } = useCurrentUser();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const { leaderboard, loading: listLoading } = useUsers();

  const [summary, setSummary] = useState<DashboardSummaryView | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser == null) {
      setSummary(null);
      setSummaryError(null);
      setSummaryLoading(false);
      return;
    }

    let cancelled = false;
    setSummaryLoading(true);
    setSummaryError(null);

    void getDashboardSummary(currentUser.id)
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch((e) => {
        if (!cancelled) {
          setSummary(null);
          setSummaryError(e instanceof Error ? e.message : 'Failed to load dashboard summary');
        }
      })
      .finally(() => {
        if (!cancelled) setSummaryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id]);

  useEffect(() => {
    fetch(`${API_ORIGIN}/api/announcements`, { headers: { Accept: 'application/json' } })
      .then(r => r.ok ? r.json() : [])
      .then((data: Announcement[]) => setAnnouncements(data.slice(0, 5)))
      .catch(() => {});
  }, []);

  const topLearners = leaderboard.slice(0, 5);

  // Compute rank from leaderboard sorted by points (fallback from summary API)
  const leaderboardRankComputed = useMemo(() => {
    if (!currentUser || leaderboard.length === 0) return null;
    const idx = leaderboard.findIndex(u => u.id === currentUser.id);
    return idx >= 0 ? idx + 1 : null;
  }, [currentUser, leaderboard]);

  const displayRank = summary?.leaderboardRank ?? leaderboardRankComputed;
  const displayPoints = summary?.totalPoints ?? currentUser?.total_points ?? 0;
  const platformUserCount = summary?.totalUsers ?? 0;

  const levelProgress = useMemo(() => {
    if (!currentUser || platformUserCount <= 0 || displayRank == null) return 0;
    return Math.min(100, Math.round((1 - (displayRank - 1) / platformUserCount) * 100));
  }, [currentUser, platformUserCount, displayRank]);

  const displayName =
    (summary?.fullName?.trim() && summary.fullName) ||
    currentUser?.full_name ||
    '';
  const displayEmail =
    (summary?.email?.trim() && summary.email) || currentUser?.email || '';

  return (
    <div className="space-y-8">
      {userLoading || !currentUser ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl bg-slate-800" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl bg-slate-800" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {summaryError ? (
            <p className="text-red-400 text-sm" role="alert">
              {summaryError}
            </p>
          ) : null}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass rounded-2xl p-8 border border-slate-700/50"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                  Welcome back, {displayName || 'there'}!
                  <span className="text-3xl">👋</span>
                </h1>
                <p className="text-gray-200 text-lg">{displayEmail}</p>
                <p className="text-sm text-gray-200 mt-1">
                  Points: {safeStat(displayPoints)}
                  {' · '}
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard/profile')}
                    className="text-blue-400 hover:text-blue-300 underline-offset-2 hover:underline"
                  >
                    Edit profile
                  </button>
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-gray-200 font-semibold">Leaderboard rank</div>
                  <div className="text-3xl font-bold text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text">
                    {displayRank != null ? `#${displayRank}` : '—'}
                  </div>
                </div>
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white glow-blue">
                  {displayRank != null ? displayRank : '—'}
                </div>
              </div>
            </div>
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-200">Platform standing</span>
                <span className="text-white font-bold">{levelProgress}%</span>
              </div>
              <Progress value={levelProgress} className="h-3" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
          >
            {summaryLoading ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="border-slate-700/50 glass card-hover glow-blue-hover">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <Skeleton className="h-4 w-24 bg-slate-800" />
                      <Skeleton className="h-5 w-5 rounded bg-slate-800" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-9 w-16 bg-slate-800 mb-2" />
                      <Skeleton className="h-3 w-full bg-slate-800" />
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              <>
                <Card className="border-slate-700/50 glass card-hover glow-blue-hover">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-semibold text-gray-200">Total users</CardTitle>
                    <Users className="h-5 w-5 text-blue-400" aria-hidden="true" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">
                      {summary ? safeStat(summary.totalUsers) : '—'}
                    </div>
                    <p className="text-xs text-gray-300 mt-1">Registered on platform</p>
                  </CardContent>
                </Card>

                <Card className="border-slate-700/50 glass card-hover glow-blue-hover">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-semibold text-gray-200">Total trainings</CardTitle>
                    <BookOpen className="h-5 w-5 text-cyan-500" aria-hidden="true" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">
                      {summary ? safeStat(summary.totalTrainings) : '—'}
                    </div>
                    <p className="text-xs text-gray-300 mt-1">Training modules available</p>
                  </CardContent>
                </Card>

                <Card className="border-slate-700/50 glass card-hover glow-blue-hover">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-semibold text-gray-200">Total quizzes</CardTitle>
                    <ClipboardCheck className="h-5 w-5 text-purple-500" aria-hidden="true" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">
                      {summary ? safeStat(summary.totalQuizzes) : '—'}
                    </div>
                    <p className="text-xs text-gray-300 mt-1">Your quiz attempts</p>
                  </CardContent>
                </Card>

                <Card className="border-slate-700/50 glass card-hover glow-blue-hover">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-semibold text-gray-200">Top score</CardTitle>
                    <Trophy className="h-5 w-5 text-yellow-500" aria-hidden="true" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">
                      {summary?.topScore != null ? `${summary.topScore}%` : '—'}
                    </div>
                    <p className="text-xs text-gray-300 mt-1">Best quiz score (percent)</p>
                  </CardContent>
                </Card>
              </>
            )}
          </motion.div>
        </>
      )}

      {announcements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="space-y-3"
        >
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-yellow-400" /> Announcements
          </h2>
          <div className="space-y-2">
            {announcements.map(a => (
              <div key={a.id}
                className="rounded-xl border border-yellow-400 bg-yellow-900/50 px-4 py-3 flex gap-3">
                <Megaphone className="h-4 w-4 text-yellow-300 shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-bold text-sm">{a.title}</p>
                  <p className="text-gray-200 text-xs mt-0.5 whitespace-pre-wrap">{a.message}</p>
                  <p className="text-gray-300 text-xs mt-1">
                    {new Date(a.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <Zap className="h-6 w-6 text-yellow-400" aria-hidden="true" />
          Quick Actions
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
            >
              <Button
                onClick={() => navigate(action.href)}
                className={`h-auto flex flex-col items-center justify-center p-6 w-full bg-gradient-to-br ${action.color} hover:opacity-90 transition-all ${action.glow} rounded-2xl`}
              >
                <action.icon className="h-8 w-8 mb-2" aria-hidden="true" />
                <span className="text-sm font-semibold text-center">{action.name}</span>
              </Button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-700/50 glass">
            <CardHeader>
              <CardTitle className="text-white text-xl">Training & activity</CardTitle>
              <CardDescription className="text-gray-300">
                Your learning activity summary
              </CardDescription>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full bg-slate-800" />
                  <Skeleton className="h-4 w-5/6 bg-slate-800" />
                </div>
              ) : summaryError ? (
                <p className="text-sm text-slate-500">Summary could not be loaded. Stats above may be incomplete.</p>
              ) : summary ? (
                <ul className="text-sm text-white space-y-2 list-disc list-inside">
                  <li>
                    <span className="text-gray-300">Total users:</span>{' '}
                    <span className="font-semibold">{safeStat(summary.totalUsers)}</span>
                  </li>
                  <li>
                    <span className="text-gray-300">Total trainings:</span>{' '}
                    <span className="font-semibold">{safeStat(summary.totalTrainings)}</span>
                  </li>
                  <li>
                    <span className="text-gray-300">Total quizzes (attempts):</span>{' '}
                    <span className="font-semibold">{safeStat(summary.totalQuizzes)}</span>
                  </li>
                  <li>
                    <span className="text-gray-300">Top score:</span>{' '}
                    <span className="font-semibold">{summary.topScore != null ? `${summary.topScore}%` : '—'}</span>
                  </li>
                </ul>
              ) : (
                <p className="text-sm text-gray-300">No summary data yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-slate-700/50 glass">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" aria-hidden="true" />
                Top learners
              </CardTitle>
              <CardDescription className="text-gray-300">
                Top performers on this platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {listLoading && (
                <div className="space-y-2">
                  <Skeleton className="h-12 bg-slate-800" />
                  <Skeleton className="h-12 bg-slate-800" />
                </div>
              )}
              {!listLoading && topLearners.length === 0 && (
                <p className="text-sm text-gray-300">No leaderboard entries yet.</p>
              )}
              <div className="space-y-3">
                {topLearners.map((learner, idx) => (
                  <div
                    key={learner.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      learner.id === currentUser?.id
                        ? 'bg-blue-900/30 border border-blue-500/50'
                        : 'border-slate-700 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-white font-medium">{learner.full_name}</span>
                      <p className="text-sm text-gray-200">{learner.total_points} points</p>
                    </div>
                    <Badge variant="outline" className="border-slate-400 text-white font-bold">
                      #{idx + 1}
                    </Badge>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                className="w-full mt-4 border-slate-500 text-white hover:bg-slate-700 font-semibold"
                onClick={() => navigate('/dashboard/leaderboard')}
              >
                View full leaderboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
