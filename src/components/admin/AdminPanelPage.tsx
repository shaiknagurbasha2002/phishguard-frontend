import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  AlertTriangle,
  BookOpen,
  LayoutDashboard,
  Library,
  LogOut,
  Megaphone,
  RefreshCw,
  Shield,
  Target,
  Trash2,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { API_ORIGIN, clearAuthToken, getAuthToken, type SimulationRow, type UserRow } from "@/lib/api";
import { useCurrentUser } from "@/context/UsersContext";

type AdminSection =
  | "dashboard"
  | "users"
  | "trainings"
  | "quizzes"
  | "incidents"
  | "simulations"
  | "knowledge"
  | "announcements";

type DashboardStats = {
  totalUsers: number;
  totalQuizzes: number;
  totalTrainings: number;
  totalIncidents: number;
};

type RawUser = {
  id?: number | string;
  full_name?: string;
  name?: string;
  fullName?: string;
  email?: string;
  role?: string;
  authority?: string;
  userRole?: string;
  email_verified?: boolean | string | number;
  emailVerified?: boolean | string | number;
  verified?: boolean | string | number;
};

type QuizRow = { id: number; title: string; description: string | null };

type QuizQuestionRow = {
  id: number;
  quizId: number | null;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
};

function normalizeQuizQuestion(raw: Record<string, unknown>): QuizQuestionRow {
  return {
    id: Number(raw.id),
    quizId:
      raw.quizId != null
        ? Number(raw.quizId)
        : raw.quiz_id != null
          ? Number(raw.quiz_id)
          : null,
    question: String(raw.question ?? ""),
    optionA: String(raw.optionA ?? raw.option_a ?? ""),
    optionB: String(raw.optionB ?? raw.option_b ?? ""),
    optionC: String(raw.optionC ?? raw.option_c ?? ""),
    optionD: String(raw.optionD ?? raw.option_d ?? ""),
    correctAnswer: String(raw.correctAnswer ?? raw.correct_answer ?? ""),
  };
}
type TrainingRow = {
  id: number;
  title: string;
  description: string | null;
  content: string | null;
  fileName?: string | null;
  originalFileName?: string | null;
};
type IncidentRow = { id: number; title: string; severity?: string | null; description?: string | null };
type KnowledgeRow = { id: number; title: string; content: string | null; fileName?: string | null; originalFileName?: string | null };
type AnnouncementRow = { id: number; title: string; message: string };

const bgRoot = "bg-[#0a0a1a]";
const bgSidebar = "bg-[#0d1117]";
const bgCard = "bg-[#161b22] border-[#30363d]";
const textWhite = "text-[#ffffff]";
const textCyan = "text-[#00d4ff]";
const textCell = "text-[#e0e0e0]";
const inputClasses =
  "bg-[#21262d] border border-[#00d4ff] text-[#ffffff] px-[10px] py-[10px] placeholder:text-[#888888]";
const labelClasses = "text-[#00d4ff] font-bold text-[14px]";
const addButton =
  "bg-[#2ea043] hover:bg-[#2a8f3d] text-white text-[16px] font-bold px-[30px] py-[12px] rounded-[8px] w-[200px] mt-[15px]";
const deleteButton = "bg-[#da3633] hover:bg-[#bb2d2b] text-white font-bold";
const editButton = "bg-[#1f6feb] hover:bg-[#1a5dcc] text-white font-bold";
const quizAddFormButton =
  "bg-[#2ea043] hover:bg-[#2a8f3d] text-white font-bold px-[20px] py-[10px] rounded-[8px]";
const correctBadge = "bg-[#2ea043] text-white px-2 py-1 rounded text-xs font-bold";

export function AdminPanelPage() {
  const navigate = useNavigate();
  const { setCurrentUserId, currentUserId } = useCurrentUser();

  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalQuizzes: 0,
    totalTrainings: 0,
    totalIncidents: 0,
  });

  const [users, setUsers] = useState<UserRow[]>([]);
  const [trainings, setTrainings] = useState<TrainingRow[]>([]);
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [knowledgeArticles, setKnowledgeArticles] = useState<KnowledgeRow[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);

  const [trainingTitle, setTrainingTitle] = useState("");
  const [trainingDescription, setTrainingDescription] = useState("");
  const [trainingContent, setTrainingContent] = useState("");
  const [trainingFile, setTrainingFile] = useState<File | null>(null);

  const [quizTitle, setQuizTitle] = useState("");
  const [quizDescription, setQuizDescription] = useState("");

  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
  const [selectedQuizTitle, setSelectedQuizTitle] = useState("");
  const [questions, setQuestions] = useState<QuizQuestionRow[]>([]);
  const [questionText, setQuestionText] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [busyQuestionId, setBusyQuestionId] = useState<number | null>(null);
  const [questionError, setQuestionError] = useState("");
  const [questionSuccess, setQuestionSuccess] = useState("");
  const [addingQuestion, setAddingQuestion] = useState(false);

  const [incidentTitle, setIncidentTitle] = useState("");
  const [incidentSeverity, setIncidentSeverity] = useState("LOW");
  const [incidentDescription, setIncidentDescription] = useState("");

  const [articleTitle, setArticleTitle] = useState("");
  const [articleContent, setArticleContent] = useState("");
  const [knowledgeFile, setKnowledgeFile] = useState<File | null>(null);

  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");

  const [simulations, setSimulations] = useState<SimulationRow[]>([]);
  const [simTitle, setSimTitle] = useState("");
  const [simDescription, setSimDescription] = useState("");
  const [simType, setSimType] = useState<"EMAIL" | "SMS" | "PHONE" | "SOCIAL">("EMAIL");

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(""), 3000);
    return () => window.clearTimeout(timer);
  }, [success]);

  function clearSessionAndRedirectToLogin() {
    clearAuthToken();
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    setCurrentUserId(null);
    navigate("/login", { replace: true });
  }

  function normalizeUser(raw: RawUser): UserRow {
    return {
      id: Number(raw.id ?? 0),
      full_name: String(raw.full_name ?? raw.name ?? raw.fullName ?? ""),
      email: String(raw.email ?? ""),
      role: raw.role ?? raw.authority ?? raw.userRole ?? null,
      email_verified: Boolean(raw.email_verified ?? raw.emailVerified ?? raw.verified),
      total_points: 0,
    };
  }

  async function authJson<T>(url: string, init?: RequestInit): Promise<T> {
    const token = getAuthToken();
    if (!token) {
      clearSessionAndRedirectToLogin();
      throw new Error("Not logged in.");
    }

    const headers = new Headers(init?.headers ?? {});
    headers.set("Authorization", `Bearer ${token}`);
    if (!headers.has("Accept")) headers.set("Accept", "application/json");

    const res = await fetch(url, { ...init, headers });

    if (res.status === 401 || res.status === 403) {
      clearSessionAndRedirectToLogin();
      throw new Error("Session expired. Please login again.");
    }

    const data = (await res.json().catch(() => ({}))) as T | { message?: string; error?: string };
    if (!res.ok) {
      const err = data as { message?: string; error?: string };
      throw new Error(err.message ?? err.error ?? `HTTP ${res.status}`);
    }
    return data as T;
  }

  async function authNoContent(url: string, init?: RequestInit): Promise<void> {
    const token = getAuthToken();
    if (!token) {
      clearSessionAndRedirectToLogin();
      throw new Error("Not logged in.");
    }

    const headers = new Headers(init?.headers ?? {});
    headers.set("Authorization", `Bearer ${token}`);
    if (!headers.has("Accept")) headers.set("Accept", "application/json");

    const res = await fetch(url, { ...init, headers });
    if (res.status === 401 || res.status === 403) {
      clearSessionAndRedirectToLogin();
      throw new Error("Session expired. Please login again.");
    }
    if (res.ok || res.status === 204) return;

    const body = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
    throw new Error(body.message ?? body.error ?? `HTTP ${res.status}`);
  }

  async function authMultipartJson<T>(url: string, formData: FormData): Promise<T> {
    const token = getAuthToken();
    if (!token) {
      clearSessionAndRedirectToLogin();
      throw new Error("Not logged in.");
    }
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (res.status === 401 || res.status === 403) {
      clearSessionAndRedirectToLogin();
      throw new Error("Session expired. Please login again.");
    }
    const data = (await res.json().catch(() => ({}))) as T | { message?: string; error?: string };
    if (!res.ok) {
      const err = data as { message?: string; error?: string };
      throw new Error(err.message ?? err.error ?? `HTTP ${res.status}`);
    }
    return data as T;
  }

  async function loadDashboard() {
    const data = await authJson<Partial<DashboardStats>>(`${API_ORIGIN}/admin/stats`);
    setStats({
      totalUsers: Number(data.totalUsers ?? 0),
      totalTrainings: Number(data.totalTrainings ?? 0),
      totalQuizzes: Number(data.totalQuizzes ?? 0),
      totalIncidents: Number(data.totalIncidents ?? 0),
    });
  }

  async function loadUsers() {
    const data = await authJson<RawUser[]>(`${API_ORIGIN}/users`);
    setUsers(Array.isArray(data) ? data.map(normalizeUser) : []);
  }

  async function loadTrainings() {
    const data = await authJson<TrainingRow[]>(`${API_ORIGIN}/api/trainings`);
    setTrainings(Array.isArray(data) ? data : []);
  }

  async function loadQuizzes() {
    const data = await authJson<QuizRow[]>(`${API_ORIGIN}/api/quizzes`);
    setQuizzes(Array.isArray(data) ? data : []);
  }

  async function loadQuestions(quizId: number) {
    const data = await authJson<unknown>(`${API_ORIGIN}/api/quizzes/${quizId}/questions`);
    const arr = Array.isArray(data) ? data : [];
    setQuestions(arr.map((row) => normalizeQuizQuestion(row as Record<string, unknown>)));
  }

  async function handleSelectQuiz(quiz: QuizRow) {
    setSelectedQuizId(quiz.id);
    setSelectedQuizTitle(quiz.title);
    setLoading(true);
    try {
      await loadQuestions(quiz.id);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedQuizId) return;
    if (!questionText.trim()) {
      setQuestionError("Please enter the question text.");
      return;
    }
    if (!optionA.trim() || !optionB.trim() || !optionC.trim() || !optionD.trim()) {
      setQuestionError("Please fill in all four options (A, B, C, D).");
      return;
    }
    if (!correctAnswer || !["A", "B", "C", "D"].includes(correctAnswer)) {
      setQuestionError("Please select a correct answer (A, B, C, or D) from the dropdown.");
      return;
    }
    setQuestionError("");
    setQuestionSuccess("");
    setAddingQuestion(true);
    try {
      await authJson(`${API_ORIGIN}/api/quizzes/${selectedQuizId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: questionText.trim(),
          optionA: optionA.trim(),
          optionB: optionB.trim(),
          optionC: optionC.trim(),
          optionD: optionD.trim(),
          correctAnswer,
        }),
      });
      setQuestionText("");
      setOptionA("");
      setOptionB("");
      setOptionC("");
      setOptionD("");
      setCorrectAnswer("");
      await loadQuestions(selectedQuizId);
      setQuestionSuccess("✅ Question added successfully!");
    } catch (err) {
      setQuestionError(err instanceof Error ? err.message : "Failed to add question.");
    } finally {
      setAddingQuestion(false);
    }
  }

  async function handleDeleteQuestion(questionId: number) {
    setBusyQuestionId(questionId);
    await withAction(async () => {
      await authNoContent(`${API_ORIGIN}/api/quiz-questions/${questionId}`, { method: "DELETE" });
      if (selectedQuizId) await loadQuestions(selectedQuizId);
    });
    setBusyQuestionId(null);
  }

  function clearQuizSelection() {
    setSelectedQuizId(null);
    setSelectedQuizTitle("");
    setQuestions([]);
    setQuestionText("");
    setOptionA("");
    setOptionB("");
    setOptionC("");
    setOptionD("");
    setCorrectAnswer("");
    setQuestionError("");
    setQuestionSuccess("");
  }

  async function loadIncidents() {
    const data = await authJson<IncidentRow[]>(`${API_ORIGIN}/api/incidents`);
    setIncidents(Array.isArray(data) ? data : []);
  }

  async function loadKnowledge() {
    const data = await authJson<KnowledgeRow[]>(`${API_ORIGIN}/api/knowledge`);
    setKnowledgeArticles(Array.isArray(data) ? data : []);
  }

  async function loadAnnouncements() {
    const data = await authJson<AnnouncementRow[]>(`${API_ORIGIN}/api/announcements`);
    setAnnouncements(Array.isArray(data) ? data : []);
  }

  async function loadSimulations() {
    const data = await authJson<unknown>(`${API_ORIGIN}/api/simulations`);
    const arr = Array.isArray(data) ? data : [];
    setSimulations(
      arr.map((raw) => {
        const r = raw as Record<string, unknown>;
        const createdRaw = r.createdAt ?? r.created_at;
        const createdAt =
          createdRaw == null || createdRaw === ""
            ? ""
            : typeof createdRaw === "string"
              ? createdRaw
              : new Date(createdRaw as string | number).toISOString();
        return {
          id: Number(r.id),
          title: String(r.title ?? ""),
          description: r.description != null ? String(r.description) : null,
          type: r.type != null ? String(r.type) : null,
          status: r.status != null ? String(r.status) : null,
          createdAt,
        };
      }),
    );
  }

  async function reloadCurrentSection() {
    setLoading(true);
    setError("");
    try {
      if (activeSection === "dashboard") await loadDashboard();
      if (activeSection === "users") await loadUsers();
      if (activeSection === "trainings") await loadTrainings();
      if (activeSection === "quizzes") await loadQuizzes();
      if (activeSection === "incidents") await loadIncidents();
      if (activeSection === "simulations") await loadSimulations();
      if (activeSection === "knowledge") await loadKnowledge();
      if (activeSection === "announcements") await loadAnnouncements();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load section.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reloadCurrentSection();
  }, [activeSection]);

  const orderedUsers = useMemo(() => [...users].sort((a, b) => a.id - b.id), [users]);

  async function withAction(action: () => Promise<void>) {
    setError("");
    setSuccess("");
    try {
      await action();
      await reloadCurrentSection();
      if (activeSection !== "dashboard") {
        await loadDashboard().catch(() => undefined);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
    }
  }

  async function handleDeleteUser(id: number) {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    setBusyId(id);
    await withAction(async () => {
      await authNoContent(`${API_ORIGIN}/users/${id}`, { method: "DELETE" });
    });
    setBusyId(null);
  }

  async function handleMakeAdmin(id: number) {
    setBusyId(id);
    await withAction(async () => {
      await authJson(`${API_ORIGIN}/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "ROLE_ADMIN" }),
      });
    });
    setBusyId(null);
  }

  async function handleAddTraining(e: React.FormEvent) {
    e.preventDefault();
    await withAction(async () => {
      if (!trainingFile) throw new Error("Please choose a training file to upload.");
      const formData = new FormData();
      formData.append("title", trainingTitle.trim());
      formData.append("description", trainingDescription.trim());
      formData.append("content", trainingContent.trim());
      formData.append("file", trainingFile);
      await authMultipartJson(`${API_ORIGIN}/api/trainings/upload`, formData);
      setTrainingTitle("");
      setTrainingDescription("");
      setTrainingContent("");
      setTrainingFile(null);
      setSuccess("✅ Added successfully! All users notified via email!");
    });
  }

  async function handleDeleteTraining(id: number) {
    setBusyId(id);
    await withAction(async () => {
      await authNoContent(`${API_ORIGIN}/api/trainings/${id}`, { method: "DELETE" });
    });
    setBusyId(null);
  }

  async function handleAddQuiz(e: React.FormEvent) {
    e.preventDefault();
    await withAction(async () => {
      await authJson(`${API_ORIGIN}/api/quizzes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: quizTitle.trim(), description: quizDescription.trim() }),
      });
      setQuizTitle("");
      setQuizDescription("");
      setSuccess("✅ Added successfully! All users notified via email!");
    });
  }

  async function handleDeleteQuiz(id: number) {
    setBusyId(id);
    await withAction(async () => {
      await authNoContent(`${API_ORIGIN}/api/quizzes/${id}`, { method: "DELETE" });
    });
    setBusyId(null);
    if (selectedQuizId === id) clearQuizSelection();
  }

  async function handleAddIncident(e: React.FormEvent) {
    e.preventDefault();
    await withAction(async () => {
      await authJson(`${API_ORIGIN}/api/incidents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: incidentTitle.trim(),
          severity: incidentSeverity,
          description: incidentDescription.trim(),
        }),
      });
      setIncidentTitle("");
      setIncidentSeverity("LOW");
      setIncidentDescription("");
      setSuccess("✅ Added successfully! All users notified via email!");
    });
  }

  async function handleDeleteIncident(id: number) {
    setBusyId(id);
    await withAction(async () => {
      await authNoContent(`${API_ORIGIN}/api/incidents/${id}`, { method: "DELETE" });
    });
    setBusyId(null);
  }

  async function handleAddArticle(e: React.FormEvent) {
    e.preventDefault();
    await withAction(async () => {
      if (!knowledgeFile) throw new Error("Please choose a knowledge file to upload.");
      const formData = new FormData();
      formData.append("title", articleTitle.trim());
      formData.append("content", articleContent.trim());
      formData.append("file", knowledgeFile);
      await authMultipartJson(`${API_ORIGIN}/api/knowledge/upload`, formData);
      setArticleTitle("");
      setArticleContent("");
      setKnowledgeFile(null);
      setSuccess("✅ Added successfully! All users notified via email!");
    });
  }

  async function handleDeleteArticle(id: number) {
    setBusyId(id);
    await withAction(async () => {
      await authNoContent(`${API_ORIGIN}/api/knowledge/${id}`, { method: "DELETE" });
    });
    setBusyId(null);
  }

  async function handleAddAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    await withAction(async () => {
      await authJson(`${API_ORIGIN}/api/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: announcementTitle.trim(),
          message: announcementMessage.trim(),
        }),
      });
      setAnnouncementTitle("");
      setAnnouncementMessage("");
      setSuccess("✅ Added successfully! All users notified via email!");
    });
  }

  async function handleDeleteAnnouncement(id: number) {
    setBusyId(id);
    await withAction(async () => {
      await authNoContent(`${API_ORIGIN}/api/announcements/${id}`, { method: "DELETE" });
    });
    setBusyId(null);
  }

  async function handleAddSimulation(e: React.FormEvent) {
    e.preventDefault();
    const title = simTitle.trim();
    if (!title) return;
    await withAction(async () => {
      await authJson(`${API_ORIGIN}/api/simulations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: simDescription.trim(),
          type: simType,
        }),
      });
      setSimTitle("");
      setSimDescription("");
      setSimType("EMAIL");
      setSuccess("✅ Simulation added!");
    });
  }

  async function handleDeleteSimulation(id: number) {
    if (!window.confirm("Delete this simulation?")) return;
    setBusyId(id);
    await withAction(async () => {
      await authNoContent(`${API_ORIGIN}/api/simulations/${id}`, { method: "DELETE" });
    });
    setBusyId(null);
  }

  function logoutAndRedirect() {
    clearSessionAndRedirectToLogin();
  }

  const navItems: Array<{ key: AdminSection; label: string; icon: typeof LayoutDashboard }> = [
    { key: "dashboard", label: "🏠 Dashboard", icon: LayoutDashboard },
    { key: "users", label: "👥 Users Management", icon: Users },
    { key: "trainings", label: "📚 Training Management", icon: Library },
    { key: "quizzes", label: "❓ Quiz Management", icon: BookOpen },
    { key: "incidents", label: "🚨 Incidents Management", icon: AlertTriangle },
    { key: "simulations", label: "🎯 Simulations", icon: Target },
    { key: "knowledge", label: "📖 Knowledge Base", icon: BookOpen },
    { key: "announcements", label: "🔔 Announcements", icon: Megaphone },
  ];

  return (
    <div className={`min-h-screen ${bgRoot} overflow-x-hidden`}>
      <div className="mx-auto flex w-full max-w-[1500px] gap-4 p-4 xl:gap-6 xl:p-6">
        <aside className={`hidden md:block w-56 xl:w-72 shrink-0 rounded-xl p-3 xl:p-4 ${bgSidebar} border border-[#30363d]`}>
          <div className="mb-6 flex items-center gap-2">
            <Shield className={`h-6 w-6 ${textWhite}`} />
            <span className={`${textWhite} text-lg font-bold`}>PhishGuard Admin</span>
          </div>
          <nav className="space-y-2">
            {/* Back to user dashboard */}
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-bold text-[#00d4ff] bg-[#0d2137] hover:bg-[#1a3a5c] border border-[#00d4ff]/30 mb-2`}
            >
              ← User Dashboard
            </button>
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveSection(item.key)}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-bold ${textWhite} ${
                  activeSection === item.key ? "bg-[#1f6feb]" : "hover:bg-[#161b22]"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={logoutAndRedirect}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-bold ${textWhite} hover:bg-[#161b22]`}
            >
              <LogOut className="h-4 w-4" />
              🚪 Logout
            </button>
          </nav>
        </aside>

        <main className="min-w-0 flex-1 space-y-4 overflow-x-hidden">
          <Button
            type="button"
            variant="outline"
            className="border-[#30363d] bg-transparent text-[#e0e0e0] hover:bg-[#21262d] hover:text-white"
            onClick={() => navigate("/dashboard")}
          >
            ← Back to Dashboard
          </Button>

          {/* Mobile nav — visible on small screens only */}
          <div className={`md:hidden rounded-xl p-3 ${bgSidebar} border border-[#30363d]`}>
            <div className="flex flex-wrap gap-1">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveSection(item.key)}
                  className={`rounded px-2 py-1 text-xs font-bold ${textWhite} ${
                    activeSection === item.key ? "bg-[#1f6feb]" : "bg-[#21262d] hover:bg-[#161b22]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <button
                type="button"
                onClick={logoutAndRedirect}
                className={`rounded px-2 py-1 text-xs font-bold ${textWhite} bg-[#da3633] hover:bg-[#bb2d2b]`}
              >
                🚪 Logout
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className={`text-xl font-bold ${textWhite} xl:text-3xl`}>PhishGuard Admin Panel</h1>
            <Button onClick={() => void reloadCurrentSection()} className={`${editButton}`}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          {error && (
            <Alert className="border-[#da3633] bg-[#2a1111]">
              <AlertDescription className={textWhite}>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="border-[#2ea043] bg-[#132019]">
              <AlertDescription className={textWhite}>{success}</AlertDescription>
            </Alert>
          )}

          {activeSection === "dashboard" && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Total Users", value: stats.totalUsers },
                { label: "Total Trainings", value: stats.totalTrainings },
                { label: "Total Quizzes", value: stats.totalQuizzes },
                { label: "Total Incidents", value: stats.totalIncidents },
              ].map((item) => (
                <Card key={item.label} className={bgCard}>
                  <CardHeader className="pb-1">
                    <CardTitle className={`text-sm font-bold ${textCyan}`}>{item.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-4xl font-bold ${textWhite}`}>{loading ? "..." : item.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeSection === "users" && (
            <Card className={bgCard}>
              <CardHeader>
                <CardTitle className={`text-2xl font-bold ${textWhite}`}>Users Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#30363d] hover:bg-transparent">
                      <TableHead className={`${textCyan} font-bold`}>ID</TableHead>
                      <TableHead className={`${textCyan} font-bold`}>Name</TableHead>
                      <TableHead className={`${textCyan} font-bold`}>Email</TableHead>
                      <TableHead className={`${textCyan} font-bold`}>Role</TableHead>
                      <TableHead className={`${textCyan} font-bold`}>Verified</TableHead>
                      <TableHead className={`${textCyan} font-bold text-right`}>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderedUsers.map((user) => (
                      <TableRow key={user.id} className="border-[#30363d]">
                        <TableCell className={textCell}>{user.id}</TableCell>
                        <TableCell className={textCell}>{user.full_name || "—"}</TableCell>
                        <TableCell className={textCell}>{user.email}</TableCell>
                        <TableCell className={textCell}>{user.role ?? "ROLE_USER"}</TableCell>
                        <TableCell className={textCell}>{user.email_verified ? "Yes" : "No"}</TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => void handleMakeAdmin(user.id)}
                              disabled={busyId === user.id || user.role === "ROLE_ADMIN"}
                              className={editButton}
                            >
                              <UserCog className="mr-1 h-4 w-4" />
                              Make Admin
                            </Button>
                            {user.id !== currentUserId && (
                              <Button
                                size="sm"
                                onClick={() => void handleDeleteUser(user.id)}
                                disabled={busyId === user.id}
                                className={deleteButton}
                              >
                                <Trash2 className="mr-1 h-4 w-4" />
                                Delete
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === "trainings" && (
            <Card className={bgCard}>
              <CardHeader>
                <CardTitle className={`text-2xl font-bold ${textWhite}`}>Training Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleAddTraining} className="space-y-3">
                  <div className="space-y-1">
                    <Label className={labelClasses}>Title</Label>
                    <Input required value={trainingTitle} onChange={(e) => setTrainingTitle(e.target.value)} className={inputClasses} placeholder="Enter training title" />
                  </div>
                  <div className="space-y-1">
                    <Label className={labelClasses}>Description</Label>
                    <Textarea required value={trainingDescription} onChange={(e) => setTrainingDescription(e.target.value)} className={inputClasses} placeholder="Enter training description" />
                  </div>
                  <div className="space-y-1">
                    <Label className={labelClasses}>Content</Label>
                    <Textarea required value={trainingContent} onChange={(e) => setTrainingContent(e.target.value)} className={inputClasses} placeholder="Enter training content" />
                  </div>
                  <div className="space-y-1">
                    <Label className={labelClasses}>Upload Training File (PDF/Video/Doc)</Label>
                    <Input
                      type="file"
                      accept=".pdf,.mp4,.doc,.docx,.ppt,.pptx"
                      className={inputClasses}
                      onChange={(e) => setTrainingFile(e.target.files?.[0] ?? null)}
                    />
                  </div>
                  <Button type="submit" className={addButton}>➕ Add Training</Button>
                </form>

                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#30363d] hover:bg-transparent">
                      <TableHead className={`${textCyan} font-bold w-10`}>ID</TableHead>
                      <TableHead className={`${textCyan} font-bold`}>Title</TableHead>
                      <TableHead className={`${textCyan} font-bold`}>Description</TableHead>
                      <TableHead className={`${textCyan} font-bold`}>File</TableHead>
                      <TableHead className={`${textCyan} font-bold text-right`}>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trainings.map((t) => (
                      <TableRow key={t.id} className="border-[#30363d]">
                        <TableCell className={textCell}>{t.id}</TableCell>
                        <TableCell className={`${textCell} max-w-[160px] truncate`} title={t.title}>{t.title}</TableCell>
                        <TableCell className={`${textCell} max-w-[200px] truncate`} title={t.description ?? ""}>{t.description ?? "—"}</TableCell>
                        <TableCell className={`${textCell} max-w-[120px] truncate`} title={t.fileName ?? t.originalFileName ?? ""}>{t.fileName ?? t.originalFileName ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            className={deleteButton}
                            onClick={() => void handleDeleteTraining(t.id)}
                            disabled={busyId === t.id}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === "quizzes" && (
            <Card className={bgCard}>
              <CardHeader>
                <CardTitle className={`text-2xl font-bold ${textWhite}`}>Quiz Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:gap-6">
                  {/* LEFT — Quizzes */}
                  <div className="w-full min-w-0 shrink-0 xl:w-[45%] space-y-4">
                    <form onSubmit={handleAddQuiz} className="space-y-3">
                      <div className="space-y-1">
                        <Label className={labelClasses}>Quiz Title</Label>
                        <Input
                          required
                          value={quizTitle}
                          onChange={(e) => setQuizTitle(e.target.value)}
                          className={inputClasses}
                          placeholder="Enter quiz title"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className={labelClasses}>Description</Label>
                        <Textarea
                          required
                          value={quizDescription}
                          onChange={(e) => setQuizDescription(e.target.value)}
                          className={inputClasses}
                          placeholder="Enter quiz description"
                        />
                      </div>
                      <Button type="submit" className={quizAddFormButton}>
                        ➕ Add Quiz
                      </Button>
                    </form>

                    <div>
                      <h3 className={`mb-2 text-lg font-bold ${textCyan}`}>Quizzes</h3>
                      <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-[#30363d] hover:bg-transparent">
                            <TableHead className={`${textCyan} font-bold w-10`}>ID</TableHead>
                            <TableHead className={`${textCyan} font-bold`}>Title</TableHead>
                            <TableHead className={`${textCyan} font-bold w-16 text-center`}>Qs</TableHead>
                            <TableHead className={`${textCyan} font-bold text-right`}>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {quizzes.map((q) => {
                            const isSelected = selectedQuizId === q.id;
                            const countDisplay =
                              isSelected ? String(questions.length) : "—";
                            return (
                              <TableRow
                                key={q.id}
                                className={`border-[#30363d] ${isSelected ? "bg-[#1f6feb]/20" : ""}`}
                              >
                                <TableCell className={textCell}>{q.id}</TableCell>
                                <TableCell className={`${textCell} max-w-[120px] truncate`} title={q.title}>{q.title || "—"}</TableCell>
                                <TableCell className={`${textCell} text-center`}>{countDisplay}</TableCell>
                                <TableCell className="text-right">
                                  <div className="inline-flex flex-wrap justify-end gap-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      className={editButton}
                                      onClick={() => void handleSelectQuiz(q)}
                                      disabled={loading && isSelected}
                                    >
                                      📝 Manage Questions
                                    </Button>
                                    <Button
                                      size="sm"
                                      className={deleteButton}
                                      onClick={() => void handleDeleteQuiz(q.id)}
                                      disabled={busyId === q.id}
                                    >
                                      🗑 Delete
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT — Questions */}
                  <div className="w-full min-w-0 flex-1 xl:w-[55%]">
                    {selectedQuizId != null ? (
                      <div className={`rounded-lg border border-[#30363d] ${bgCard} p-4`}>
                        <div className="mb-4 flex items-start justify-between gap-2">
                          <div>
                            <p className={`text-sm font-bold ${textCyan}`}>
                              Questions for: {selectedQuizTitle}
                            </p>
                            <h3 className={`mt-1 text-lg font-bold ${textWhite}`}>
                              Managing: {selectedQuizTitle}
                            </h3>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0 text-white hover:bg-[#30363d]"
                            onClick={clearQuizSelection}
                            aria-label="Close question panel"
                          >
                            <X className="h-5 w-5" />
                          </Button>
                        </div>

                        <form onSubmit={handleAddQuestion} className="mb-6 space-y-3">
                          {questionError && (
                            <div className="rounded-md border border-[#da3633] bg-[#2a1111] px-3 py-2 text-sm text-red-300">
                              ⚠️ {questionError}
                            </div>
                          )}
                          {questionSuccess && (
                            <div className="rounded-md border border-[#2ea043] bg-[#132019] px-3 py-2 text-sm text-green-300">
                              {questionSuccess}
                            </div>
                          )}
                          <div className="space-y-1">
                            <Label className={labelClasses}>Question *</Label>
                            <Textarea
                              value={questionText}
                              onChange={(e) => setQuestionText(e.target.value)}
                              className={inputClasses}
                              placeholder="Enter the question text"
                            />
                          </div>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                              <Label className={labelClasses}>Option A *</Label>
                              <Input
                                value={optionA}
                                onChange={(e) => setOptionA(e.target.value)}
                                className={inputClasses}
                                placeholder="Option A"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className={labelClasses}>Option B *</Label>
                              <Input
                                value={optionB}
                                onChange={(e) => setOptionB(e.target.value)}
                                className={inputClasses}
                                placeholder="Option B"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className={labelClasses}>Option C *</Label>
                              <Input
                                value={optionC}
                                onChange={(e) => setOptionC(e.target.value)}
                                className={inputClasses}
                                placeholder="Option C"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className={labelClasses}>Option D *</Label>
                              <Input
                                value={optionD}
                                onChange={(e) => setOptionD(e.target.value)}
                                className={inputClasses}
                                placeholder="Option D"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className={labelClasses}>Correct Answer * (which option is correct?)</Label>
                            <Select value={correctAnswer} onValueChange={(val) => { setCorrectAnswer(val); setQuestionError(""); }}>
                              <SelectTrigger className={`${inputClasses} ${!correctAnswer ? "border-yellow-500" : "border-[#00d4ff]"}`}>
                                <SelectValue placeholder="⚠️ Must select: A, B, C, or D" />
                              </SelectTrigger>
                              <SelectContent className="bg-[#21262d] border-[#30363d] text-[#ffffff]">
                                <SelectItem value="A">A — {optionA || "(Option A)"}</SelectItem>
                                <SelectItem value="B">B — {optionB || "(Option B)"}</SelectItem>
                                <SelectItem value="C">C — {optionC || "(Option C)"}</SelectItem>
                                <SelectItem value="D">D — {optionD || "(Option D)"}</SelectItem>
                              </SelectContent>
                            </Select>
                            {!correctAnswer && (
                              <p className="text-xs text-yellow-400">⚠️ You must select which option (A/B/C/D) is the correct answer!</p>
                            )}
                          </div>
                          <Button type="submit" className={quizAddFormButton} disabled={addingQuestion}>
                            {addingQuestion ? "Adding..." : "➕ Add Question"}
                          </Button>
                        </form>

                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="border-[#30363d] hover:bg-transparent">
                                <TableHead className={`${textCyan} font-bold`}>#</TableHead>
                                <TableHead className={`${textCyan} font-bold`}>Question</TableHead>
                                <TableHead className={`${textCyan} font-bold`}>A</TableHead>
                                <TableHead className={`${textCyan} font-bold`}>B</TableHead>
                                <TableHead className={`${textCyan} font-bold`}>C</TableHead>
                                <TableHead className={`${textCyan} font-bold`}>D</TableHead>
                                <TableHead className={`${textCyan} font-bold`}>Correct</TableHead>
                                <TableHead className={`${textCyan} font-bold text-right`}>Delete</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {questions.map((row, idx) => (
                                <TableRow key={row.id} className="border-[#30363d]">
                                  <TableCell className={textCell}>{idx + 1}</TableCell>
                                  <TableCell className={`${textCell} max-w-[200px] truncate`} title={row.question}>
                                    {row.question}
                                  </TableCell>
                                  <TableCell className={`${textCell} max-w-[100px] truncate`}>{row.optionA}</TableCell>
                                  <TableCell className={`${textCell} max-w-[100px] truncate`}>{row.optionB}</TableCell>
                                  <TableCell className={`${textCell} max-w-[100px] truncate`}>{row.optionC}</TableCell>
                                  <TableCell className={`${textCell} max-w-[100px] truncate`}>{row.optionD}</TableCell>
                                  <TableCell className={textCell}>
                                    <span className={correctBadge}>{row.correctAnswer || "—"}</span>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      size="sm"
                                      className={deleteButton}
                                      onClick={() => void handleDeleteQuestion(row.id)}
                                      disabled={busyQuestionId === row.id}
                                    >
                                      Delete
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`flex min-h-[280px] items-center justify-center rounded-lg border border-dashed border-[#30363d] p-8 ${bgCard}`}
                      >
                        <p className={`text-center text-sm ${textCell}`}>
                          Select a quiz and click <strong className={textWhite}>📝 Manage Questions</strong> to add
                          questions.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === "incidents" && (
            <Card className={bgCard}>
              <CardHeader>
                <CardTitle className={`text-2xl font-bold ${textWhite}`}>Incidents Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleAddIncident} className="space-y-3">
                  <div className="space-y-1">
                    <Label className={labelClasses}>Title</Label>
                    <Input required value={incidentTitle} onChange={(e) => setIncidentTitle(e.target.value)} className={inputClasses} placeholder="Enter incident title" />
                  </div>
                  <div className="space-y-1">
                    <Label className={labelClasses}>Severity</Label>
                    <Select value={incidentSeverity} onValueChange={setIncidentSeverity}>
                      <SelectTrigger className={inputClasses}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#21262d] border-[#30363d] text-[#ffffff]">
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="CRITICAL">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className={labelClasses}>Description</Label>
                    <Textarea required value={incidentDescription} onChange={(e) => setIncidentDescription(e.target.value)} className={inputClasses} placeholder="Enter incident description" />
                  </div>
                  <Button type="submit" className={addButton}>➕ Add Incident</Button>
                </form>

                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#30363d] hover:bg-transparent">
                      <TableHead className={`${textCyan} font-bold w-10`}>ID</TableHead>
                      <TableHead className={`${textCyan} font-bold`}>Title</TableHead>
                      <TableHead className={`${textCyan} font-bold w-24`}>Severity</TableHead>
                      <TableHead className={`${textCyan} font-bold`}>Description</TableHead>
                      <TableHead className={`${textCyan} font-bold text-right`}>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incidents.map((incident) => (
                      <TableRow key={incident.id} className="border-[#30363d]">
                        <TableCell className={textCell}>{incident.id}</TableCell>
                        <TableCell className={`${textCell} max-w-[160px] truncate`} title={incident.title}>{incident.title}</TableCell>
                        <TableCell className={textCell}>{incident.severity ?? "—"}</TableCell>
                        <TableCell className={`${textCell} max-w-[200px] truncate`} title={incident.description ?? ""}>{incident.description ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            className={deleteButton}
                            onClick={() => void handleDeleteIncident(incident.id)}
                            disabled={busyId === incident.id}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === "simulations" && (
            <Card className={bgCard}>
              <CardHeader>
                <CardTitle className={`text-2xl font-bold ${textWhite}`}>Simulations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={(e) => void handleAddSimulation(e)} className="space-y-3">
                  <div className="space-y-1">
                    <Label className={labelClasses}>Title</Label>
                    <Input
                      required
                      value={simTitle}
                      onChange={(e) => setSimTitle(e.target.value)}
                      className={inputClasses}
                      placeholder="Simulation title"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className={labelClasses}>Description</Label>
                    <Textarea
                      value={simDescription}
                      onChange={(e) => setSimDescription(e.target.value)}
                      className={inputClasses}
                      placeholder="Optional description"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className={labelClasses}>Type</Label>
                    <Select value={simType} onValueChange={(v) => setSimType(v as typeof simType)}>
                      <SelectTrigger className={inputClasses}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#21262d] border-[#30363d] text-[#ffffff]">
                        <SelectItem value="EMAIL">EMAIL</SelectItem>
                        <SelectItem value="SMS">SMS</SelectItem>
                        <SelectItem value="PHONE">PHONE</SelectItem>
                        <SelectItem value="SOCIAL">SOCIAL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className={addButton}>
                    Add Simulation
                  </Button>
                </form>

                <div className="space-y-4">
                  <p className={`text-sm font-bold ${textCyan}`}>Existing simulations</p>
                  {simulations.length === 0 ? (
                    <p className={`text-sm ${textCell}`}>No simulations yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {simulations.map((sim) => (
                        <Card key={sim.id} className={`${bgCard} border-[#30363d]`}>
                          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
                            <CardTitle className={`text-lg font-bold ${textWhite} leading-tight`}>{sim.title}</CardTitle>
                            <span
                              className="shrink-0 rounded-md bg-[#1f6feb] px-2 py-1 text-xs font-bold uppercase text-white"
                              title="Type"
                            >
                              {sim.type ?? "—"}
                            </span>
                          </CardHeader>
                          <CardContent className="space-y-3 pt-0">
                            <p className={`text-sm ${textCell} whitespace-pre-wrap break-words`}>
                              {sim.description?.trim() ? sim.description : "—"}
                            </p>
                            <Button
                              type="button"
                              size="sm"
                              className={deleteButton}
                              onClick={() => void handleDeleteSimulation(sim.id)}
                              disabled={busyId === sim.id}
                            >
                              <Trash2 className="mr-1.5 h-4 w-4" />
                              Delete
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === "knowledge" && (
            <Card className={bgCard}>
              <CardHeader>
                <CardTitle className={`text-2xl font-bold ${textWhite}`}>Knowledge Base</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleAddArticle} className="space-y-3">
                  <div className="space-y-1">
                    <Label className={labelClasses}>Title</Label>
                    <Input required value={articleTitle} onChange={(e) => setArticleTitle(e.target.value)} className={inputClasses} placeholder="Enter article title" />
                  </div>
                  <div className="space-y-1">
                    <Label className={labelClasses}>Content</Label>
                    <Textarea required value={articleContent} onChange={(e) => setArticleContent(e.target.value)} className={inputClasses} placeholder="Enter article content" />
                  </div>
                  <div className="space-y-1">
                    <Label className={labelClasses}>Upload Knowledge File (PDF/Doc)</Label>
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className={inputClasses}
                      onChange={(e) => setKnowledgeFile(e.target.files?.[0] ?? null)}
                    />
                  </div>
                  <Button type="submit" className={addButton}>➕ Add Article</Button>
                </form>

                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#30363d] hover:bg-transparent">
                      <TableHead className={`${textCyan} font-bold w-10`}>ID</TableHead>
                      <TableHead className={`${textCyan} font-bold`}>Title</TableHead>
                      <TableHead className={`${textCyan} font-bold`}>Content</TableHead>
                      <TableHead className={`${textCyan} font-bold`}>File</TableHead>
                      <TableHead className={`${textCyan} font-bold text-right`}>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {knowledgeArticles.map((article) => (
                      <TableRow key={article.id} className="border-[#30363d]">
                        <TableCell className={textCell}>{article.id}</TableCell>
                        <TableCell className={`${textCell} max-w-[160px] truncate`} title={article.title}>{article.title}</TableCell>
                        <TableCell className={`${textCell} max-w-[200px] truncate`} title={article.content ?? ""}>{article.content ?? "—"}</TableCell>
                        <TableCell className={`${textCell} max-w-[120px] truncate`} title={article.fileName ?? article.originalFileName ?? ""}>{article.fileName ?? article.originalFileName ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            className={deleteButton}
                            onClick={() => void handleDeleteArticle(article.id)}
                            disabled={busyId === article.id}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === "announcements" && (
            <Card className={bgCard}>
              <CardHeader>
                <CardTitle className={`text-2xl font-bold ${textWhite}`}>Announcements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleAddAnnouncement} className="space-y-3">
                  <div className="space-y-1">
                    <Label className={labelClasses}>Title</Label>
                    <Input
                      required
                      value={announcementTitle}
                      onChange={(e) => setAnnouncementTitle(e.target.value)}
                      className={inputClasses}
                      placeholder="Enter announcement title"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className={labelClasses}>Message</Label>
                    <Textarea
                      required
                      value={announcementMessage}
                      onChange={(e) => setAnnouncementMessage(e.target.value)}
                      className={inputClasses}
                      placeholder="Enter announcement message"
                    />
                  </div>
                  <Button type="submit" className={addButton}>➕ Add Announcement</Button>
                </form>

                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#30363d] hover:bg-transparent">
                      <TableHead className={`${textCyan} font-bold w-10`}>ID</TableHead>
                      <TableHead className={`${textCyan} font-bold`}>Title</TableHead>
                      <TableHead className={`${textCyan} font-bold`}>Message</TableHead>
                      <TableHead className={`${textCyan} font-bold text-right`}>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {announcements.map((a) => (
                      <TableRow key={a.id} className="border-[#30363d]">
                        <TableCell className={textCell}>{a.id}</TableCell>
                        <TableCell className={`${textCell} max-w-[160px] truncate`} title={a.title}>{a.title}</TableCell>
                        <TableCell className={`${textCell} max-w-[300px] truncate`} title={a.message}>{a.message}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            className={deleteButton}
                            onClick={() => void handleDeleteAnnouncement(a.id)}
                            disabled={busyId === a.id}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
