import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Trophy,
  Medal,
  Crown,
  Search,
  Minus,
  Zap,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { useUsers, useCurrentUser } from '@/context/UsersContext';
import { Skeleton } from '../ui/skeleton';

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'
  );
}

export function Leaderboard() {
  const [timeFilter, setTimeFilter] = useState<'weekly' | 'monthly' | 'alltime'>('alltime');
  const [searchQuery, setSearchQuery] = useState('');
  const { leaderboard, loading, error } = useUsers();
  const { currentUser } = useCurrentUser();

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return leaderboard;
    return leaderboard.filter(
      (u) =>
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q),
    );
  }, [leaderboard, searchQuery]);

  const top3 = filtered.slice(0, 3);
  const rest = filtered.slice(0, 50);

  const currentUserRank =
    currentUser != null
      ? leaderboard.findIndex((u) => u.id === currentUser.id) + 1 || null
      : null;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-slate-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-orange-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-500" />
          Leaderboard
        </h1>
        <p className="text-slate-200 text-lg">
          Live rankings from the users API (points field when available)
        </p>
      </motion.div>

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-blue-500/50 glass glow-blue">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white">
                  {currentUserRank != null ? `#${currentUserRank}` : '—'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Your rank</h3>
                  <p className="text-slate-200">
                    {currentUser?.full_name ?? 'Signed-in user'} —{' '}
                    {currentUser?.total_points ?? 0} pts
                  </p>
                </div>
              </div>
              <Button
                type="button"
                className="bg-blue-600 hover:bg-blue-700"
                disabled
                title="Requires XP API"
              >
                <Zap className="h-4 w-4 mr-2" />
                Boost XP
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col md:flex-row gap-4"
      >
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white"
          />
        </div>

        <Tabs value={timeFilter} onValueChange={(v) => setTimeFilter(v as typeof timeFilter)} className="w-full md:w-auto">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800">
            <TabsTrigger value="weekly" className="data-[state=active]:bg-blue-600" disabled title="No time-series API">
              Weekly
            </TabsTrigger>
            <TabsTrigger value="monthly" className="data-[state=active]:bg-blue-600" disabled title="No time-series API">
              Monthly
            </TabsTrigger>
            <TabsTrigger value="alltime" className="data-[state=active]:bg-blue-600">
              All time
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-xl bg-slate-800" />
          <Skeleton className="h-64 rounded-xl bg-slate-800" />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <Card className="border-slate-700 glass">
          <CardContent className="py-10 text-center text-slate-300">
            No users match your search, or the list is empty.
          </CardContent>
        </Card>
      )}

      {!loading && top3.length >= 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid md:grid-cols-3 gap-4"
        >
          {[
            { idx: 1, rank: 2 },
            { idx: 0, rank: 1 },
            { idx: 2, rank: 3 },
          ].map(({ idx, rank }) => {
            const leader = top3[idx];
            if (!leader) {
              return (
                <Card key={idx} className="border-slate-700/50 glass opacity-50 md:mt-8">
                  <CardContent className="pt-8 pb-6 text-center text-slate-400">
                    —
                  </CardContent>
                </Card>
              );
            }
            const border =
              rank === 1
                ? 'border-yellow-500/50'
                : rank === 2
                  ? 'border-slate-400/50'
                  : 'border-orange-500/50';
            return (
              <Card
                key={`${leader.id}-${rank}`}
                className={`${border} glass card-hover glow-blue-hover ${rank === 1 ? '' : 'md:mt-8'}`}
              >
                <CardContent className="pt-8 pb-6 text-center">
                  {rank === 1 && (
                    <Crown className="h-12 w-12 text-yellow-500 mx-auto mb-4 animate-pulse" />
                  )}
                  {rank === 2 && (
                    <Medal className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  )}
                  {rank === 3 && (
                    <Medal className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                  )}
                  <div className="relative inline-block mb-4">
                    <Avatar className={`h-20 w-20 border-4 ${rank === 1 ? 'border-yellow-500' : rank === 2 ? 'border-slate-400' : 'border-orange-500'}`}>
                      <AvatarFallback className="bg-slate-700 text-white">
                        {initials(leader.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold ${
                        rank === 1
                          ? 'bg-yellow-500 text-slate-900'
                          : rank === 2
                            ? 'bg-slate-400 text-slate-900'
                            : 'bg-orange-500 text-slate-900'
                      }`}
                    >
                      #{rank}
                    </div>
                  </div>
                  <h3 className={`${rank === 1 ? 'text-2xl' : 'text-xl'} font-bold text-white mb-1`}>
                    {leader.full_name}
                  </h3>
                  <p className="text-sm text-slate-300 mb-3 truncate">{leader.email}</p>
                  <div
                    className={`${rank === 1 ? 'text-4xl text-yellow-500' : rank === 2 ? 'text-3xl text-slate-400' : 'text-3xl text-orange-500'} font-bold mb-2`}
                  >
                    {leader.total_points}
                  </div>
                  <p className="text-sm text-slate-300">points</p>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>
      )}

      {!loading && rest.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-slate-700/50 glass">
            <CardHeader>
              <CardTitle className="text-white">Full rankings</CardTitle>
              <CardDescription className="text-slate-300">
                All users from the API (same order as all-time)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {rest.map((leader, index) => {
                  const rank = index + 1;
                  const RankChangeIcon = Minus;
                  return (
                    <motion.div
                      key={leader.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(0.4 + index * 0.02, 0.9) }}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                        leader.id === currentUser?.id
                          ? 'border-blue-500/50 bg-blue-900/20'
                          : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 w-20">
                        <div className="text-center">
                          {getRankIcon(rank) || (
                            <div className="text-2xl font-bold text-slate-300">#{rank}</div>
                          )}
                        </div>
                      </div>
                      <div className="w-16 flex items-center justify-center text-slate-400">
                        <RankChangeIcon className="h-4 w-4" aria-hidden title="No history API" />
                      </div>
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-slate-700 text-white">
                          {initials(leader.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-white truncate">{leader.full_name}</h4>
                        <p className="text-sm text-slate-300 truncate">{leader.email}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">
                          {leader.total_points.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-300">points</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
