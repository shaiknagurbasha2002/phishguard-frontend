import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import {
  User, Mail, Save, ArrowLeft, AlertCircle,
  Shield, Trophy, BookOpen, ClipboardCheck, Star,
  Camera, Edit3, Award, Crown, GraduationCap,
  ShieldCheck, LogIn, UserX, Lock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import { useCurrentUser, useUpdateUser, useUserProfile } from "@/context/UsersContext";
import { getDashboardSummary, type DashboardSummaryView } from "@/lib/api";
import { toast } from "sonner";

function getPicKey(userId: number)        { return `phishguard_profile_pic_${userId}`; }
function loadProfilePic(userId: number)   { try { return localStorage.getItem(getPicKey(userId)); } catch { return null; } }
function saveProfilePic(userId: number, b64: string) { try { localStorage.setItem(getPicKey(userId), b64); } catch {} }
function removeProfilePic(userId: number) { try { localStorage.removeItem(getPicKey(userId)); } catch {} }

function getInitials(name: string) {
  return name.split(/\s+/).filter(Boolean).map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";
}

function getRankInfo(points: number) {
  if (points >= 500) return { label: "Expert",       color: "text-yellow-400", border: "border-yellow-500/60", bg: "bg-yellow-500/15", glow: "shadow-yellow-500/20" };
  if (points >= 200) return { label: "Advanced",     color: "text-blue-400",   border: "border-blue-500/60",   bg: "bg-blue-500/15",   glow: "shadow-blue-500/20"   };
  if (points >= 50)  return { label: "Intermediate", color: "text-green-400",  border: "border-green-500/60",  bg: "bg-green-500/15",  glow: "shadow-green-500/20"  };
  return                    { label: "Beginner",     color: "text-slate-400",  border: "border-slate-500/60",  bg: "bg-slate-500/15",  glow: "shadow-slate-500/20"  };
}

type BadgeInfo = {
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  iconBg: string;
  border: string;
  cardBg: string;
  earned: boolean;
};

function computeBadges(summary: DashboardSummaryView | null, points: number): BadgeInfo[] {
  const pts  = summary?.totalPoints    ?? points;
  const q    = summary?.totalQuizzes   ?? 0;
  const t    = summary?.totalTrainings ?? 0;
  const top  = summary?.topScore       ?? null;
  const rank = summary?.leaderboardRank ?? null;

  return [
    {
      label: "First Login",
      description: "Welcome to PhishGuard!",
      icon: LogIn,
      color: "text-blue-400",
      iconBg: "bg-blue-600",
      border: "border-blue-500/60",
      cardBg: "bg-slate-800/80",
      earned: true,
    },
    {
      label: "Quiz Taker",
      description: "Completed your first quiz",
      icon: ClipboardCheck,
      color: "text-purple-400",
      iconBg: "bg-purple-600",
      border: "border-purple-500/60",
      cardBg: "bg-slate-800/80",
      earned: q >= 1,
    },
    {
      label: "Knowledge Seeker",
      description: "Completed 3+ training modules",
      icon: BookOpen,
      color: "text-sky-400",
      iconBg: "bg-sky-600",
      border: "border-sky-500/60",
      cardBg: "bg-slate-800/80",
      earned: t >= 3,
    },
    {
      label: "Phishing Pro",
      description: "Completed all training modules",
      icon: ShieldCheck,
      color: "text-violet-400",
      iconBg: "bg-violet-600",
      border: "border-violet-500/60",
      cardBg: "bg-slate-800/80",
      earned: t >= 11,
    },
    {
      label: "Social Eng. Buster",
      description: "Earned 50+ points",
      icon: UserX,
      color: "text-emerald-400",
      iconBg: "bg-emerald-600",
      border: "border-emerald-500/60",
      cardBg: "bg-slate-800/80",
      earned: pts >= 50,
    },
    {
      label: "Quiz Master",
      description: "Scored 90%+ on a quiz",
      icon: GraduationCap,
      color: "text-yellow-400",
      iconBg: "bg-yellow-500",
      border: "border-yellow-500/60",
      cardBg: "bg-slate-800/80",
      earned: top != null && top >= 90,
    },
    {
      label: "Cyber Defender",
      description: "Earned 200+ points",
      icon: Shield,
      color: "text-orange-400",
      iconBg: "bg-orange-600",
      border: "border-orange-500/60",
      cardBg: "bg-slate-800/80",
      earned: pts >= 200,
    },
    {
      label: "Top Defender",
      description: "Ranked in the top 3",
      icon: Crown,
      color: "text-red-400",
      iconBg: "bg-red-600",
      border: "border-red-500/60",
      cardBg: "bg-slate-800/80",
      earned: rank != null && rank <= 3,
    },
  ];
}

export function UserProfilePage() {
  const { userId: paramRaw } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const { currentUserId } = useCurrentUser();

  const paramId     = paramRaw ? Number(paramRaw) : NaN;
  const effectiveId = Number.isFinite(paramId) && paramId > 0 ? paramId : currentUserId;

  const { user, loading, error, notFound, refreshUsers } = useUserProfile(effectiveId);
  const { updateUser, isLoading: saving }                = useUpdateUser();

  const [fullName, setFullName]   = useState("");
  const [email, setEmail]         = useState("");
  const [formError, setFormError] = useState("");

  const [summary, setSummary]               = useState<DashboardSummaryView | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [profilePic, setProfilePic] = useState<string | null>(null);
  const fileInputRef                = useRef<HTMLInputElement>(null);

  useEffect(() => { if (user) { setFullName(user.full_name); setEmail(user.email); } }, [user]);
  useEffect(() => { if (effectiveId) setProfilePic(loadProfilePic(effectiveId)); }, [effectiveId]);
  useEffect(() => { void refreshUsers(); }, [refreshUsers]);

  useEffect(() => {
    if (!effectiveId) return;
    setSummaryLoading(true);
    getDashboardSummary(effectiveId)
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setSummaryLoading(false));
  }, [effectiveId]);

  function handlePhotoClick() { fileInputRef.current?.click(); }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file."); return; }
    if (file.size > 2 * 1024 * 1024)    { toast.error("Image must be under 2 MB.");    return; }
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setProfilePic(b64);
      if (effectiveId) saveProfilePic(effectiveId, b64);
      toast.success("Profile photo updated!");
    };
    reader.readAsDataURL(file);
  }

  function handleRemovePhoto() {
    setProfilePic(null);
    if (effectiveId) removeProfilePic(effectiveId);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.success("Photo removed.");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const name = fullName.trim(), em = email.trim();
    if (!name || !em) { setFormError("Name and email are required."); return; }
    try {
      await updateUser(effectiveId!, { full_name: name, email: em });
      toast.success("Profile updated!");
      await refreshUsers();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Update failed";
      setFormError(msg);
      toast.error(msg);
    }
  };

  if (effectiveId == null) {
    return (
      <Card className="border-slate-700/50 bg-slate-900/50">
        <CardContent className="pt-6 text-slate-400">No user selected. Please sign in first.</CardContent>
      </Card>
    );
  }

  const points   = user?.total_points ?? 0;
  const rankInfo = getRankInfo(points);
  const initials = getInitials(user?.full_name ?? "");
  const badges   = computeBadges(summary, points);
  const earnedCount = badges.filter(b => b.earned).length;

  const stats = [
    { icon: Trophy,        label: "Points",    value: summaryLoading ? "…" : String(summary?.totalPoints ?? points),   color: "text-yellow-400", iconBg: "bg-yellow-500",  border: "border-slate-700" },
    { icon: ClipboardCheck,label: "Quizzes",   value: summaryLoading ? "…" : String(summary?.totalQuizzes ?? 0),       color: "text-purple-400", iconBg: "bg-purple-600",  border: "border-slate-700" },
    { icon: BookOpen,      label: "Trainings", value: summaryLoading ? "…" : String(summary?.totalTrainings ?? 0),     color: "text-sky-400",    iconBg: "bg-sky-600",     border: "border-slate-700" },
    { icon: Shield,        label: "Top Score", value: summaryLoading ? "…" : summary?.topScore != null ? `${summary.topScore}%` : "—", color: "text-emerald-400", iconBg: "bg-emerald-600", border: "border-slate-700" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Back button */}
      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white -ml-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>

      {/* ── Hero Profile Card ── */}
      <Card className="border-slate-700/50 bg-slate-900/60 overflow-hidden">
        {/* Animated banner */}
        <div className="h-36 relative overflow-hidden bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/30 via-transparent to-purple-600/20" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e3a8a15_1px,transparent_1px),linear-gradient(to_bottom,#1e3a8a15_1px,transparent_1px)] bg-[size:3rem_3rem]" />
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-900/80 to-transparent" />
        </div>

        <CardContent className="px-8 pb-8">
          <div className="flex flex-col lg:flex-row lg:items-end gap-6 -mt-16">
            {/* Avatar */}
            <div className="flex flex-col items-center lg:items-start">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              {loading ? (
                <Skeleton className="h-28 w-28 rounded-full bg-slate-700 border-4 border-slate-900" />
              ) : (
                <div className="relative group rounded-full overflow-hidden border-4 border-slate-900 shadow-2xl"
                  style={{ width: '7rem', height: '7rem', minWidth: '7rem', minHeight: '7rem', flexShrink: 0 }}>
                  {profilePic ? (
                    <img src={profilePic} alt="Profile"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div className="h-28 w-28 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-slate-900 shadow-2xl">
                      {initials}
                    </div>
                  )}
                </div>
              )}
              {/* Photo buttons */}
              {!loading && user && (
                <div className="flex gap-2 mt-3">
                  <Button type="button" size="sm" onClick={handlePhotoClick}
                    className="h-8 px-3 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600">
                    <Camera className="h-3 w-3 mr-1" />
                    {profilePic ? "Change" : "Upload Photo"}
                  </Button>
                  {profilePic && (
                    <Button type="button" size="sm" variant="ghost" onClick={handleRemovePhoto}
                      className="h-8 px-3 text-xs text-red-400 hover:bg-red-900/20 hover:text-red-300">
                      Remove
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Name / info */}
            <div className="flex-1 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 pb-1">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-48 bg-slate-800 rounded" />
                  <Skeleton className="h-4 w-64 bg-slate-800 rounded" />
                </div>
              ) : notFound ? (
                <Alert className="bg-red-900/20 border-red-900">
                  <AlertCircle className="h-4 w-4" /><AlertDescription>User not found.</AlertDescription>
                </Alert>
              ) : user ? (
                <>
                  <div>
                    <h2 className="text-3xl font-bold text-white">{user.full_name}</h2>
                    <p className="text-slate-400 mt-0.5 flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" /> {user.email}
                    </p>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${rankInfo.bg} ${rankInfo.color} ${rankInfo.border}`}>
                        <Star className="h-3.5 w-3.5" /> {rankInfo.label}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border bg-blue-500/10 text-blue-400 border-blue-500/40">
                        <Trophy className="h-3.5 w-3.5" /> {points} pts
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border bg-amber-500/10 text-amber-400 border-amber-500/40">
                        <Award className="h-3.5 w-3.5" /> {earnedCount}/{badges.length} badges
                      </span>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <motion.div key={s.label} whileHover={{ scale: 1.03 }} transition={{ duration: 0.15 }}>
            <Card className="border border-slate-700 bg-slate-800 text-center cursor-default">
              <CardContent className="py-6 flex flex-col items-center gap-3">
                <div className={`p-3 rounded-2xl ${s.iconBg}`}>
                  <s.icon className="h-6 w-6 text-white" />
                </div>
                <p className="text-3xl font-bold text-white">
                  {summaryLoading ? <span className="animate-pulse text-slate-400">…</span> : s.value}
                </p>
                <p className={`text-xs font-semibold uppercase tracking-wider ${s.color}`}>{s.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── Badges & Achievements ── */}
      {!loading && user && (
        <Card className="border-slate-700/50 bg-slate-900/60">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-400" />
                Badges & Achievements
              </CardTitle>
              <span className="text-sm text-slate-400">
                <span className="text-white font-semibold">{earnedCount}</span>
                <span className="text-slate-500"> / {badges.length} earned</span>
              </span>
            </div>
            {/* Progress bar */}
            <div className="mt-2 h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-700"
                style={{ width: `${(earnedCount / badges.length) * 100}%` }}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {badges.map((b) => (
                <motion.div
                  key={b.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.04, y: -2 }}
                  transition={{ duration: 0.18 }}
                  className={`rounded-xl border p-5 flex flex-col items-center text-center gap-2.5 cursor-default transition-all
                    ${b.earned
                      ? `bg-slate-800 ${b.border} shadow-md`
                      : 'bg-slate-800/40 border-slate-700/50'
                    }`}
                >
                  {/* Icon circle — solid color when earned, grey when locked */}
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg
                    ${b.earned ? b.iconBg : 'bg-slate-700'}`}>
                    <b.icon className="h-7 w-7 text-white" />
                  </div>

                  {/* Label */}
                  <p className={`text-sm font-bold leading-tight ${b.earned ? b.color : 'text-slate-400'}`}>
                    {b.label}
                  </p>

                  {/* Description */}
                  <p className="text-xs text-slate-500 leading-snug">{b.description}</p>

                  {/* Status pill */}
                  {b.earned ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-400 bg-green-500/15 border border-green-500/40 rounded-full px-2.5 py-0.5">
                      ✓ Earned
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-700/50 border border-slate-600/50 rounded-full px-2.5 py-0.5">
                      <Lock className="h-3 w-3" /> Locked
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Edit Profile ── */}
      <Card className="border-slate-700/50 bg-slate-900/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Edit3 className="h-4 w-4 text-blue-400" /> Edit Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full bg-slate-800" />
              <Skeleton className="h-10 w-full bg-slate-800" />
            </div>
          ) : error && !notFound ? (
            <Alert variant="destructive" className="bg-red-900/20 border-red-900">
              <AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : user ? (
            <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
              {formError && (
                <Alert variant="destructive" className="bg-red-900/20 border-red-900">
                  <AlertCircle className="h-4 w-4" /><AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="p-name" className="text-slate-300 text-sm flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400" /> Full Name
                </Label>
                <Input id="p-name" value={fullName} onChange={e => setFullName(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 h-11"
                  placeholder="Your full name" required disabled={saving} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-email" className="text-slate-300 text-sm flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" /> Email Address
                </Label>
                <Input id="p-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 h-11"
                  placeholder="your@email.com" required disabled={saving} />
              </div>
              <Button type="submit"
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-base"
                disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </form>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}
