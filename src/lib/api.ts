/**
 * Spring Boot REST client — users resource at /users.
 */

export const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:8081";

export const BASE_URL = `${API_ORIGIN}/users`;
export const AUTH_TOKEN_KEY = "phishguard_auth_token";

/** Full absolute URL — list payload includes first question + options per quiz. */
export const QUIZZES_URL = `${API_ORIGIN}/api/quizzes`;

export type ApiError = { error: string; message?: string };

export type PingResponse = { ok: boolean; message: string };

export type UserRow = {
  id: number;
  full_name: string;
  email: string;
  role: string | null;
  email_verified: boolean;
  /** From backend points / total_points / totalPoints, else 0 */
  total_points: number;
};

export type LeaderboardRow = {
  id: number;
  full_name: string;
  email: string;
  total_points: number;
};

/** Fields used when creating or updating a user (no id). */
export type UserInput = Pick<UserRow, "full_name" | "email"> & {
  password?: string;
};

const JSON_HEADERS: HeadersInit = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

const ACCEPT_JSON: HeadersInit = {
  Accept: "application/json",
};

const CURRENT_USER_ID_KEY = "phishguard_current_user_id";
let authFetchInstalled = false;

export function getAuthToken(): string | null {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return null;
    const trimmed = token.trim();
    return trimmed === "" ? null : trimmed;
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    // ignore localStorage access errors
  }
}

export function clearAuthToken(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // ignore localStorage access errors
  }
}

export function installAuthFetchInterceptor(loginPath = "/"): void {
  if (authFetchInstalled || typeof window === "undefined") return;
  authFetchInstalled = true;
  const nativeFetch = window.fetch.bind(window);
  const apiOrigin = new URL(API_ORIGIN, window.location.origin).origin;
  const authBypassPaths = new Set([
    "/users/login",
    "/users/register",
    "/users/forgot-password",
    "/users/reset-password",
  ]);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const requestUrl =
      typeof input === "string"
        ? new URL(input, window.location.origin)
        : input instanceof URL
          ? input
          : new URL(input.url, window.location.origin);
    const isApiRequest = requestUrl.origin === apiOrigin;
    const isAuthBypassRequest = authBypassPaths.has(requestUrl.pathname);
    const headers = new Headers(
      init?.headers ?? (input instanceof Request ? input.headers : undefined),
    );
    const token = getAuthToken();
    const hadToken = Boolean(token);
    if (isApiRequest && !isAuthBypassRequest && token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    const response = await nativeFetch(input, { ...init, headers });

    // NOTE: Do NOT auto-redirect on 403 here — individual components (authJson,
    // authMultipartJson, etc.) handle session expiry with proper React navigation.
    // A hard window.location.replace() here caused redirect loops.

    return response;
  };
}

function readStoredCurrentUserId(): number | null {
  try {
    const v = localStorage.getItem(CURRENT_USER_ID_KEY);
    if (v == null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

export function withUserIdHeader(headers: HeadersInit): HeadersInit {
  try {
    const userId = localStorage.getItem(CURRENT_USER_ID_KEY);
    if (userId && userId.trim() !== "") {
      return {
        ...(headers as Record<string, string>),
        "X-User-Id": userId,
      };
    }
  } catch {
    // ignore localStorage access errors
  }
  return headers;
}

/**
 * Maps backend fields to frontend `UserRow`.
 * Supports: full_name, name (common Spring), fullName (Jackson camelCase).
 */
function normalizeUser(raw: Record<string, unknown>): UserRow {
  const tp = raw.total_points ?? raw.totalPoints ?? raw.points;
  const total_points =
    typeof tp === "number" && !Number.isNaN(tp) ? tp : Number(tp) || 0;
  const role = raw.role ?? raw.authority ?? raw.userRole;
  const emailVerifiedRaw = raw.email_verified ?? raw.emailVerified ?? raw.verified;
  return {
    id: Number(raw.id),
    full_name: String(
      raw.full_name ?? raw.name ?? raw.fullName ?? "",
    ),
    email: String(raw.email ?? ""),
    role: role != null && String(role).trim() !== "" ? String(role) : null,
    email_verified: Boolean(emailVerifiedRaw),
    total_points,
  };
}

function normalizeLeaderboardRow(raw: Record<string, unknown>): LeaderboardRow {
  // Backend LeaderboardDTO sends: userId, userName, totalScore
  // normalizeUser handles: id, full_name/name/fullName, total_points/totalPoints/points
  // So we remap the DTO fields to what normalizeUser expects before calling it.
  const remapped: Record<string, unknown> = {
    ...raw,
    id: raw.id ?? raw.userId,
    name: raw.name ?? raw.full_name ?? raw.fullName ?? raw.userName,
    total_points: raw.total_points ?? raw.totalPoints ?? raw.points ?? raw.totalScore,
  };
  const u = normalizeUser(remapped);
  return { ...u };
}

/**
 * Request body for create/update: backend uses `name` for display/full name;
 * frontend keeps `full_name` in `UserInput`.
 */
function userInputToJsonBody(body: UserInput): string {
  return JSON.stringify({
    name: body.full_name,
    email: body.email,
    password: body.password,
  });
}

async function readError(res: Response): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as ApiError;
  return data.message ?? data.error ?? `HTTP ${res.status}`;
}

async function handleJsonResponse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T | ApiError;
  if (!res.ok) {
    const err = data as ApiError;
    throw new Error(err.message ?? err.error ?? `HTTP ${res.status}`);
  }
  return data as T;
}

async function fetchUsersRaw(): Promise<Record<string, unknown>[]> {
  const res = await fetch(BASE_URL, {
    method: "GET",
    headers: ACCEPT_JSON,
  });
  const data = await handleJsonResponse<unknown>(res);
  return Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
}

/** GET — all users */
export async function getUsers(): Promise<UserRow[]> {
  const raw = await fetchUsersRaw();
  return raw.map(normalizeUser);
}

/** GET — single user by id */
export async function getUserById(id: number): Promise<UserRow> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "GET",
    headers: ACCEPT_JSON,
  });
  const data = await handleJsonResponse<Record<string, unknown>>(res);
  return normalizeUser(data);
}

/** POST — create user */
export async function createUser(body: UserInput): Promise<UserRow> {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: JSON_HEADERS,
    body: userInputToJsonBody(body),
  });
  const data = await handleJsonResponse<Record<string, unknown>>(res);
  return normalizeUser(data);
}

/** PUT — update user by id */
export async function updateUser(id: number, body: UserInput): Promise<UserRow> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: JSON_HEADERS,
    body: userInputToJsonBody(body),
  });
  const data = await handleJsonResponse<Record<string, unknown>>(res);
  return normalizeUser(data);
}

/** DELETE — user by id */
export async function deleteUser(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
    headers: ACCEPT_JSON,
  });
  if (res.ok || res.status === 204) return;
  throw new Error(await readError(res));
}

/** PATCH /users/{id}/role (fallback: PUT /users/{id}) */
export async function makeUserAdmin(id: number): Promise<UserRow> {
  const roleBody = JSON.stringify({ role: "ROLE_ADMIN" });
  const patchUrl = `${BASE_URL}/${id}/role`;
  try {
    const patchRes = await fetch(patchUrl, {
      method: "PATCH",
      headers: JSON_HEADERS,
      body: roleBody,
    });
    if (patchRes.ok) {
      const data = await handleJsonResponse<Record<string, unknown>>(patchRes);
      return normalizeUser(data);
    }
  } catch {
    // Fall through to PUT fallback below.
  }

  const current = await getUserById(id);
  const putRes = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: JSON_HEADERS,
    body: JSON.stringify({
      name: current.full_name,
      email: current.email,
      role: "ROLE_ADMIN",
    }),
  });
  const data = await handleJsonResponse<Record<string, unknown>>(putRes);
  return normalizeUser(data);
}

/** GET /api/users — connectivity check (same resource as list users). */
export async function ping(): Promise<PingResponse> {
  const res = await fetch(BASE_URL, {
    method: "GET",
    headers: ACCEPT_JSON,
  });
  if (!res.ok) {
    throw new Error(await readError(res));
  }
  return { ok: true, message: "Spring Boot users API reachable" };
}

// --- Quizzes (Spring Boot) ---

/** One row from GET http://localhost:8081/api/quizzes (quiz + first question fields). */
export type QuizListItem = {
  id: number;
  title: string;
  description: string | null;
  passing_score_percent: number;
  question: string | null;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
};

function normalizeQuizListItem(raw: Record<string, unknown>): QuizListItem {
  const pass = raw.passing_score_percent ?? raw.passingScorePercent;
  const p =
    typeof pass === "number" && !Number.isNaN(pass) ? pass : Number(pass);
  const qText = raw.question ?? raw.question_text ?? raw.questionText;
  const questionStr =
    qText != null && String(qText).trim() !== "" ? String(qText) : null;
  return {
    id: Number(raw.id),
    title: String(raw.title ?? ""),
    description: raw.description != null ? String(raw.description) : null,
    passing_score_percent: Number.isFinite(p) && !Number.isNaN(p) ? p : 70,
    question: questionStr,
    optionA: String(raw.option_a ?? raw.optionA ?? ""),
    optionB: String(raw.option_b ?? raw.optionB ?? ""),
    optionC: String(raw.option_c ?? raw.optionC ?? ""),
    optionD: String(raw.option_d ?? raw.optionD ?? ""),
  };
}

function wrapApiNetworkError(url: string, err: unknown): Error {
  if (err instanceof TypeError) {
    return new Error(
      `Could not reach ${url} (${err.message}). Is Spring Boot running on port 8081? If the app loads but this fails, check the browser console for CORS errors.`,
    );
  }
  if (err instanceof Error) return err;
  return new Error(`Request to ${url} failed`);
}

const LEADERBOARD_URL = `${API_ORIGIN}/api/leaderboard`;

/**
 * GET http://localhost:8081/api/leaderboard — Spring returns `{ generated_at, entries: [...] }`.
 */
export async function getLeaderboard(limit = 50): Promise<LeaderboardRow[]> {
  const url =
    limit > 0
      ? `${LEADERBOARD_URL}?limit=${encodeURIComponent(String(limit))}`
      : LEADERBOARD_URL;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: ACCEPT_JSON,
      mode: "cors",
    });
  } catch (e) {
    throw wrapApiNetworkError(url, e);
  }
  const data = await handleJsonResponse<unknown>(res);
  // Backend returns a plain array; guard against both array and wrapped { entries: [...] }
  const entries = Array.isArray(data)
    ? data
    : Array.isArray((data as Record<string, unknown>)?.entries)
      ? (data as Record<string, unknown>).entries as unknown[]
      : [];
  return (entries as Record<string, unknown>[]).map(normalizeLeaderboardRow);
}

async function fetchQuizzesRaw(): Promise<Record<string, unknown>[]> {
  const url = QUIZZES_URL;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: ACCEPT_JSON,
      mode: "cors",
    });
  } catch (e) {
    throw wrapApiNetworkError(url, e);
  }
  const data = await handleJsonResponse<unknown>(res);
  return Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
}

/** GET http://localhost:8081/api/quizzes */
export async function getQuizzes(): Promise<QuizListItem[]> {
  const raw = await fetchQuizzesRaw();
  return raw.map(normalizeQuizListItem);
}

// --- Dashboard summary ---

function numField(v: unknown, fallback = 0): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function numFieldOrNull(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Normalized view for dashboard widgets (snake_case + camelCase from backend). */
export type DashboardSummaryView = {
  userId: number;
  fullName: string;
  email: string;
  totalPoints: number;
  leaderboardRank: number | null;
  totalUsers: number;
  totalTrainings: number;
  totalQuizzes: number;
  topScore: number | null;
};

export function normalizeDashboardSummary(raw: Record<string, unknown>): DashboardSummaryView {
  return {
    userId: numField(raw.user_id ?? raw.userId),
    fullName: String(raw.full_name ?? raw.fullName ?? ""),
    email: String(raw.email ?? ""),
    totalPoints: numField(raw.total_points ?? raw.totalPoints),
    leaderboardRank: numFieldOrNull(raw.leaderboard_rank ?? raw.leaderboardRank),
    totalUsers: numField(raw.total_users ?? raw.totalUsers),
    totalTrainings: numField(
      raw.training_modules_total ?? raw.totalTrainings ?? raw.trainingModulesTotal,
    ),
    totalQuizzes: numField(raw.quiz_attempts ?? raw.totalQuizzes ?? raw.quizAttempts),
    topScore: numFieldOrNull(
      raw.quiz_best_score_percent ?? raw.topScore ?? raw.quizBestScorePercent,
    ),
  };
}

/** GET http://localhost:8081/api/dashboard/summary?userId= */
export async function getDashboardSummary(userId: number): Promise<DashboardSummaryView> {
  const url = `${API_ORIGIN}/api/dashboard/summary?userId=${encodeURIComponent(String(userId))}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: ACCEPT_JSON,
      mode: "cors",
    });
  } catch (e) {
    throw wrapApiNetworkError(url, e);
  }
  const data = await handleJsonResponse<Record<string, unknown>>(res);
  return normalizeDashboardSummary(data);
}

// --- Incidents (Report Incident) ---

export const INCIDENTS_URL = `${API_ORIGIN}/api/incidents`;

export type IncidentRow = {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  reportedAt: string;
};

export type IncidentCreateInput = {
  userId: number;
  title: string;
  description: string;
  severity: string;
};

function normalizeIncident(raw: Record<string, unknown>): IncidentRow {
  const ra = raw.reportedAt ?? raw.reported_at;
  let reportedAt = "";
  if (typeof ra === "string") reportedAt = ra;
  else if (ra != null) {
    try {
      reportedAt = new Date(ra as string | number).toISOString();
    } catch {
      reportedAt = String(ra);
    }
  }
  return {
    id: Number(raw.id),
    userId: Number(raw.userId ?? raw.user_id),
    title: String(raw.title ?? ""),
    description: raw.description != null ? String(raw.description) : null,
    severity: String(raw.severity ?? ""),
    status: String(raw.status ?? ""),
    reportedAt,
  };
}

async function fetchIncidentsFromUrl(url: string, includeUserHeader = false): Promise<IncidentRow[]> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: includeUserHeader ? withUserIdHeader(ACCEPT_JSON) : ACCEPT_JSON,
      mode: "cors",
    });
  } catch (e) {
    throw wrapApiNetworkError(url, e);
  }
  const data = await handleJsonResponse<unknown>(res);
  if (!Array.isArray(data)) return [];
  return (data as Record<string, unknown>[]).map(normalizeIncident);
}

/** GET /api/incidents/user/{userId} */
export async function getIncidentsForUser(userId: number): Promise<IncidentRow[]> {
  const url = `${INCIDENTS_URL}/user/${encodeURIComponent(String(userId))}`;
  return fetchIncidentsFromUrl(url);
}

/** GET /api/incidents (admin-style: all incidents) */
export async function getAllIncidents(): Promise<IncidentRow[]> {
  return fetchIncidentsFromUrl(INCIDENTS_URL, true);
}

/** POST /api/incidents */
export async function createIncident(body: IncidentCreateInput): Promise<IncidentRow> {
  const url = INCIDENTS_URL;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: JSON_HEADERS,
      mode: "cors",
      body: JSON.stringify({
        userId: body.userId,
        title: body.title,
        description: body.description,
        severity: body.severity,
      }),
    });
  } catch (e) {
    throw wrapApiNetworkError(url, e);
  }
  const data = await handleJsonResponse<Record<string, unknown>>(res);
  return normalizeIncident(data);
}

// --- Knowledge Hub (published articles) ---

export const KNOWLEDGE_URL = `${API_ORIGIN}/api/knowledge`;

export type KnowledgeArticle = {
  id: number;
  title: string;
  category: string | null;
  content: string | null;
  author: string | null;
  /** ISO string from backend Instant / publishedAt */
  publishedAt: string | null;
  fileUrl: string | null;
};

function normalizePublishedAt(raw: Record<string, unknown>): string | null {
  const v = raw.publishedAt ?? raw.published_at;
  if (v == null || v === "") return null;
  if (typeof v === "string") return v;
  try {
    return new Date(v as string | number).toISOString();
  } catch {
    return String(v);
  }
}

function normalizeKnowledgeArticle(raw: Record<string, unknown>): KnowledgeArticle {
  return {
    id: Number(raw.id),
    title: String(raw.title ?? ""),
    category: raw.category != null ? String(raw.category) : null,
    content: raw.content != null ? String(raw.content) : null,
    author: raw.author != null ? String(raw.author) : null,
    publishedAt: normalizePublishedAt(raw),
    fileUrl: raw.fileUrl != null ? String(raw.fileUrl) : null,
  };
}

/** GET http://localhost:8081/api/knowledge — published articles only */
export async function getKnowledgeArticles(): Promise<KnowledgeArticle[]> {
  const url = KNOWLEDGE_URL;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: ACCEPT_JSON,
      mode: "cors",
    });
  } catch (e) {
    throw wrapApiNetworkError(url, e);
  }
  const data = await handleJsonResponse<unknown>(res);
  if (!Array.isArray(data)) return [];
  return (data as Record<string, unknown>[]).map(normalizeKnowledgeArticle);
}

/** GET http://localhost:8081/api/knowledge/{id} */
export async function getKnowledgeArticle(id: number): Promise<KnowledgeArticle> {
  const url = `${KNOWLEDGE_URL}/${encodeURIComponent(String(id))}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: ACCEPT_JSON,
      mode: "cors",
    });
  } catch (e) {
    throw wrapApiNetworkError(url, e);
  }
  const data = await handleJsonResponse<Record<string, unknown>>(res);
  return normalizeKnowledgeArticle(data);
}

// --- Email scans (Spring Boot) ---

export const EMAIL_SCANS_URL = `${API_ORIGIN}/api/email-scans`;

export type EmailScanRow = {
  id: number;
  userId: number | null;
  sender: string | null;
  subject: string | null;
  content: string | null;
  riskScore: number;
  riskLevel: string;
  status: string;
  scannedAt: string;
  aiSummary: string | null;
  findingsJson: string | null;
  suspiciousElementsJson: string | null;
};

export type EmailScanCreateInput = {
  userId: number;
  sender: string;
  subject: string;
  content: string;
  scanType?: string;
};

function normalizeScannedAt(raw: Record<string, unknown>): string {
  const v = raw.scannedAt ?? raw.scanned_at ?? raw.createdAt ?? raw.created_at;
  if (v == null || v === "") return "";
  if (typeof v === "string") return v;
  try {
    return new Date(v as string | number).toISOString();
  } catch {
    return String(v);
  }
}

export function normalizeEmailScan(raw: Record<string, unknown>): EmailScanRow {
  const rs = raw.riskScore ?? raw.risk_score;
  const score =
    typeof rs === "number" && !Number.isNaN(rs) ? rs : Number(rs) || 0;
  const rl = raw.riskLevel ?? raw.risk_level;
  return {
    id: Number(raw.id),
    userId:
      raw.userId != null || raw.user_id != null
        ? Number(raw.userId ?? raw.user_id)
        : null,
    sender: raw.sender != null ? String(raw.sender) : null,
    subject: raw.subject != null ? String(raw.subject) : null,
    content:
      raw.content != null
        ? String(raw.content)
        : raw.rawContent != null
          ? String(raw.rawContent)
          : raw.raw_content != null
            ? String(raw.raw_content)
            : null,
    riskScore: score,
    riskLevel:
      rl != null && String(rl).trim() !== ""
        ? String(rl)
        : score >= 70
          ? "high"
          : score >= 40
            ? "medium"
            : "low",
    status: String(raw.status ?? ""),
    scannedAt: normalizeScannedAt(raw),
    aiSummary:
      raw.aiSummary != null
        ? String(raw.aiSummary)
        : raw.ai_summary != null
          ? String(raw.ai_summary)
          : null,
    findingsJson:
      raw.findingsJson != null
        ? String(raw.findingsJson)
        : raw.findings_json != null
          ? String(raw.findings_json)
          : null,
    suspiciousElementsJson:
      raw.suspiciousElementsJson != null
        ? String(raw.suspiciousElementsJson)
        : raw.suspicious_elements_json != null
          ? String(raw.suspicious_elements_json)
          : null,
  };
}

async function fetchEmailScansFromUrl(url: string): Promise<EmailScanRow[]> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: ACCEPT_JSON,
      mode: "cors",
    });
  } catch (e) {
    throw wrapApiNetworkError(url, e);
  }
  const data = await handleJsonResponse<unknown>(res);
  if (!Array.isArray(data)) return [];
  return (data as Record<string, unknown>[]).map(normalizeEmailScan);
}

/** GET http://localhost:8081/api/email-scans/user/{userId} */
export async function getEmailScansForUser(userId: number): Promise<EmailScanRow[]> {
  const url = `${EMAIL_SCANS_URL}/user/${encodeURIComponent(String(userId))}`;
  return fetchEmailScansFromUrl(url);
}

/** GET http://localhost:8081/api/email-scans — all scans (e.g. admin) */
export async function getAllEmailScans(): Promise<EmailScanRow[]> {
  return fetchEmailScansFromUrl(EMAIL_SCANS_URL);
}

/** POST http://localhost:8081/api/email-scans */
export async function createEmailScan(
  body: EmailScanCreateInput,
): Promise<EmailScanRow> {
  const url = EMAIL_SCANS_URL;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: JSON_HEADERS,
      mode: "cors",
      body: JSON.stringify({
        userId: body.userId,
        sender: body.sender,
        subject: body.subject,
        content: body.content,
        scanType: body.scanType ?? "EMAIL",
      }),
    });
  } catch (e) {
    throw wrapApiNetworkError(url, e);
  }
  const data = await handleJsonResponse<Record<string, unknown>>(res);
  return normalizeEmailScan(data);
}

// --- Simulations (Spring Boot) ---

export const SIMULATIONS_URL = `${API_ORIGIN}/api/simulations`;

export type SimulationRow = {
  id: number;
  title: string;
  description: string | null;
  type: string | null;
  status: string | null;
  createdAt: string;
};

function normalizeSimulationCreatedAt(raw: Record<string, unknown>): string {
  const v = raw.createdAt ?? raw.created_at;
  if (v == null || v === "") return "";
  if (typeof v === "string") return v;
  try {
    return new Date(v as string | number).toISOString();
  } catch {
    return String(v);
  }
}

function normalizeSimulation(raw: Record<string, unknown>): SimulationRow {
  return {
    id: Number(raw.id),
    title: String(raw.title ?? ""),
    description: raw.description != null ? String(raw.description) : null,
    type: raw.type != null ? String(raw.type) : null,
    status: raw.status != null ? String(raw.status) : null,
    createdAt: normalizeSimulationCreatedAt(raw),
  };
}

/** GET http://localhost:8081/api/simulations */
export async function getSimulations(): Promise<SimulationRow[]> {
  const url = SIMULATIONS_URL;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: ACCEPT_JSON,
      mode: "cors",
    });
  } catch (e) {
    throw wrapApiNetworkError(url, e);
  }
  const data = await handleJsonResponse<unknown>(res);
  if (!Array.isArray(data)) return [];
  return (data as Record<string, unknown>[]).map(normalizeSimulation);
}

/** GET http://localhost:8081/api/simulations/{id} */
export async function getSimulationById(id: number): Promise<SimulationRow> {
  const url = `${SIMULATIONS_URL}/${encodeURIComponent(String(id))}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: ACCEPT_JSON,
      mode: "cors",
    });
  } catch (e) {
    throw wrapApiNetworkError(url, e);
  }
  const data = await handleJsonResponse<Record<string, unknown>>(res);
  return normalizeSimulation(data);
}

export type SimulationCreateInput = {
  title: string;
  description: string;
  type: string;
};

/** POST http://localhost:8081/api/simulations */
export async function createSimulation(body: SimulationCreateInput): Promise<SimulationRow> {
  const url = SIMULATIONS_URL;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: withUserIdHeader(JSON_HEADERS),
      mode: "cors",
      body: JSON.stringify({ title: body.title, description: body.description, type: body.type }),
    });
  } catch (e) {
    throw wrapApiNetworkError(url, e);
  }
  const data = await handleJsonResponse<Record<string, unknown>>(res);
  return normalizeSimulation(data);
}

/** DELETE http://localhost:8081/api/simulations/{id} */
export async function deleteSimulation(id: number): Promise<void> {
  const url = `${SIMULATIONS_URL}/${encodeURIComponent(String(id))}`;
  let res: Response;
  try {
    res = await fetch(url, { method: "DELETE", headers: withUserIdHeader(ACCEPT_JSON), mode: "cors" });
  } catch (e) {
    throw wrapApiNetworkError(url, e);
  }
  if (res.ok || res.status === 204) return;
  throw new Error(await readError(res));
}

// --- Knowledge admin ---

export type KnowledgeArticleInput = {
  title: string;
  category: string;
  content: string;
  author: string;
};

/** POST http://localhost:8081/api/knowledge */
export async function createKnowledgeArticle(body: KnowledgeArticleInput): Promise<KnowledgeArticle> {
  const url = KNOWLEDGE_URL;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: withUserIdHeader(JSON_HEADERS),
      mode: "cors",
      body: JSON.stringify({ title: body.title, category: body.category, content: body.content, author: body.author }),
    });
  } catch (e) {
    throw wrapApiNetworkError(url, e);
  }
  const data = await handleJsonResponse<Record<string, unknown>>(res);
  return normalizeKnowledgeArticle(data);
}

/** DELETE http://localhost:8081/api/knowledge/{id} */
export async function deleteKnowledgeArticle(id: number): Promise<void> {
  const url = `${KNOWLEDGE_URL}/${encodeURIComponent(String(id))}`;
  let res: Response;
  try {
    res = await fetch(url, { method: "DELETE", headers: withUserIdHeader(ACCEPT_JSON), mode: "cors" });
  } catch (e) {
    throw wrapApiNetworkError(url, e);
  }
  if (res.ok || res.status === 204) return;
  throw new Error(await readError(res));
}

// --- Incident admin ---

/** PUT http://localhost:8081/api/incidents/{id}/status */
export async function updateIncidentStatus(id: number, status: string): Promise<IncidentRow> {
  const url = `${INCIDENTS_URL}/${encodeURIComponent(String(id))}/status`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "PUT",
      headers: withUserIdHeader(JSON_HEADERS),
      mode: "cors",
      body: JSON.stringify({ status }),
    });
  } catch (e) {
    throw wrapApiNetworkError(url, e);
  }
  const data = await handleJsonResponse<Record<string, unknown>>(res);
  return normalizeIncident(data);
}

/** DELETE http://localhost:8081/api/incidents/{id} */
export async function deleteIncident(id: number): Promise<void> {
  const url = `${INCIDENTS_URL}/${encodeURIComponent(String(id))}`;
  let res: Response;
  try {
    res = await fetch(url, { method: "DELETE", headers: withUserIdHeader(ACCEPT_JSON), mode: "cors" });
  } catch (e) {
    throw wrapApiNetworkError(url, e);
  }
  if (res.ok || res.status === 204) return;
  throw new Error(await readError(res));
}

// --- File Upload ---

export const FILE_UPLOAD_URL = `${API_ORIGIN}/api/files/upload`;

export type UploadResult = { fileUrl: string; fileName: string; fileSize: string };

/** POST /api/files/upload — upload a file and get back its URL (ADMIN ONLY — sends X-User-Id) */
export async function uploadFile(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  // NOTE: Do NOT set Content-Type manually — browser sets it automatically with the
  // multipart boundary. Only inject X-User-Id for the admin check on the backend.
  let res: Response;
  try {
    res = await fetch(FILE_UPLOAD_URL, {
      method: "POST",
      body: formData,
      mode: "cors",
      headers: withUserIdHeader({}),   // adds X-User-Id from localStorage
    });
  } catch (e) {
    throw wrapApiNetworkError(FILE_UPLOAD_URL, e);
  }
  return handleJsonResponse<UploadResult>(res);
}

/** PATCH /api/training/{id}/file — attach uploaded file URL to training module */
export async function attachFileToTraining(id: number, fileUrl: string): Promise<TrainingRow> {
  const url = `${TRAINING_URL}/${encodeURIComponent(String(id))}/file`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "PATCH",
      headers: withUserIdHeader(JSON_HEADERS),
      mode: "cors",
      body: JSON.stringify({ fileUrl }),
    });
  } catch (e) {
    throw wrapApiNetworkError(url, e);
  }
  const data = await handleJsonResponse<Record<string, unknown>>(res);
  return normalizeTraining(data);
}

/** PATCH /api/knowledge/{id}/file — attach uploaded file URL to knowledge article */
export async function attachFileToArticle(id: number, fileUrl: string): Promise<KnowledgeArticle> {
  const url = `${KNOWLEDGE_URL}/${encodeURIComponent(String(id))}/file`;
  let res: Response;
  try {
    res = await fetch(url, { method: "PATCH", headers: JSON_HEADERS, mode: "cors", body: JSON.stringify({ fileUrl }) });
  } catch (e) {
    throw wrapApiNetworkError(url, e);
  }
  const data = await handleJsonResponse<Record<string, unknown>>(res);
  return normalizeKnowledgeArticle(data);
}

// --- Training Modules ---

export const TRAINING_URL = `${API_ORIGIN}/api/trainings`;

export type TrainingAttachment = {
  id: number;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  uploadedAt: string | null;
};

export type TrainingRow = {
  id: number;
  title: string;
  description: string | null;
  progress: number;
  fileUrl: string | null;
  attachments: TrainingAttachment[];
};

function normalizeAttachment(raw: Record<string, unknown>): TrainingAttachment {
  return {
    id: Number(raw.id ?? 0),
    fileName: String(raw.fileName ?? raw.filename ?? raw.name ?? ""),
    fileUrl: String(raw.fileUrl ?? raw.url ?? ""),
    fileSize: raw.fileSize != null ? Number(raw.fileSize) : (raw.size != null ? Number(raw.size) : null),
    uploadedAt:
      raw.uploadedAt != null
        ? String(raw.uploadedAt)
        : (raw.createdAt != null ? String(raw.createdAt) : (raw.uploaded_at != null ? String(raw.uploaded_at) : null)),
  };
}

function normalizeTraining(raw: Record<string, unknown>): TrainingRow {
  const rawAtts = Array.isArray(raw.attachments)
    ? raw.attachments
    : (Array.isArray(raw.files) ? raw.files : (Array.isArray(raw.trainingAttachments) ? raw.trainingAttachments : []));
  return {
    id: Number(raw.id),
    title: String(raw.title ?? ""),
    description: raw.description != null ? String(raw.description) : null,
    progress: typeof raw.progress === "number" ? raw.progress : Number(raw.progress) || 0,
    fileUrl: raw.fileUrl != null ? String(raw.fileUrl) : null,
    attachments: rawAtts.map((a) => normalizeAttachment(a as Record<string, unknown>)),
  };
}

/** GET /api/training */
export async function getTrainings(): Promise<TrainingRow[]> {
  const url = TRAINING_URL;
  let res: Response;
  try {
    res = await fetch(url, { method: "GET", headers: ACCEPT_JSON, mode: "cors" });
  } catch (e) {
    throw wrapApiNetworkError(url, e);
  }
  const data = await handleJsonResponse<unknown>(res);
  if (!Array.isArray(data)) return [];
  return (data as Record<string, unknown>[]).map(normalizeTraining);
}

export type TrainingInput = { title: string; description: string };

/** POST /api/training */
export async function createTraining(body: TrainingInput): Promise<TrainingRow> {
  const url = TRAINING_URL;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: withUserIdHeader(JSON_HEADERS),
      mode: "cors",
      body: JSON.stringify({ title: body.title, description: body.description }),
    });
  } catch (e) {
    throw wrapApiNetworkError(url, e);
  }
  const data = await handleJsonResponse<Record<string, unknown>>(res);
  return normalizeTraining(data);
}

/** DELETE /api/training/{id} */
export async function deleteTraining(id: number): Promise<void> {
  const url = `${TRAINING_URL}/${encodeURIComponent(String(id))}`;
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 15000); // 15-second timeout
  let res: Response;
  try {
    res = await fetch(url, { method: "DELETE", headers: withUserIdHeader(ACCEPT_JSON), mode: "cors", signal: abort.signal });
  } catch (e) {
    clearTimeout(timer);
    if ((e as Error)?.name === "AbortError") throw new Error("Request timed out. Please check the server is running.");
    throw wrapApiNetworkError(url, e);
  }
  clearTimeout(timer);
  if (res.ok || res.status === 204) return;
  throw new Error(await readError(res));
}

export type TrainingAttachmentInput = {
  fileUrl: string;
  fileName: string;
  fileSize?: string;
};

/** POST /api/training/{id}/attachments — add an attachment to a module, returns updated Training */
export async function addTrainingAttachment(
  id: number,
  attachment: TrainingAttachmentInput,
): Promise<TrainingRow> {
  const url = `${TRAINING_URL}/${encodeURIComponent(String(id))}/attachments`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: withUserIdHeader(JSON_HEADERS),
      mode: "cors",
      body: JSON.stringify(attachment),
    });
  } catch (e) {
    throw wrapApiNetworkError(url, e);
  }
  const data = await handleJsonResponse<Record<string, unknown>>(res);
  return normalizeTraining(data);
}

/** DELETE /api/training/{moduleId}/attachments/{attachmentId} */
export async function deleteTrainingAttachment(
  moduleId: number,
  attachmentId: number,
): Promise<void> {
  const url = `${TRAINING_URL}/${encodeURIComponent(String(moduleId))}/attachments/${encodeURIComponent(String(attachmentId))}`;
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 15000); // 15-second timeout
  let res: Response;
  try {
    res = await fetch(url, { method: "DELETE", headers: withUserIdHeader(ACCEPT_JSON), mode: "cors", signal: abort.signal });
  } catch (e) {
    clearTimeout(timer);
    if ((e as Error)?.name === "AbortError") throw new Error("Request timed out. Please check the server is running.");
    throw wrapApiNetworkError(url, e);
  }
  clearTimeout(timer);
  if (res.ok || res.status === 204) return;
  throw new Error(await readError(res));
}

// --- Quiz Questions ---

export const QUIZ_QUESTIONS_URL = `${API_ORIGIN}/api/quiz-questions`;

export type QuizQuestionRow = {
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
    quizId: raw.quizId != null ? Number(raw.quizId) : null,
    question: String(raw.question ?? ""),
    optionA: String(raw.optionA ?? raw.optiona ?? ""),
    optionB: String(raw.optionB ?? raw.optionb ?? ""),
    optionC: String(raw.optionC ?? raw.optionc ?? ""),
    optionD: String(raw.optionD ?? raw.optiond ?? ""),
    correctAnswer: String(raw.correctAnswer ?? raw.correct_answer ?? ""),
  };
}

/** GET /api/quiz-questions */
export async function getQuizQuestions(): Promise<QuizQuestionRow[]> {
  const url = QUIZ_QUESTIONS_URL;
  let res: Response;
  try {
    res = await fetch(url, { method: "GET", headers: ACCEPT_JSON, mode: "cors" });
  } catch (e) {
    throw wrapApiNetworkError(url, e);
  }
  const data = await handleJsonResponse<unknown>(res);
  if (!Array.isArray(data)) return [];
  return (data as Record<string, unknown>[]).map(normalizeQuizQuestion);
}

export type QuizQuestionInput = {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
};

/** POST /api/quiz-questions */
export async function createQuizQuestion(body: QuizQuestionInput): Promise<QuizQuestionRow> {
  const url = QUIZ_QUESTIONS_URL;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: withUserIdHeader(JSON_HEADERS),
      mode: "cors",
      body: JSON.stringify({
        question: body.question,
        optionA: body.optionA,
        optionB: body.optionB,
        optionC: body.optionC,
        optionD: body.optionD,
        correctAnswer: body.correctAnswer,
      }),
    });
  } catch (e) {
    throw wrapApiNetworkError(url, e);
  }
  const data = await handleJsonResponse<Record<string, unknown>>(res);
  return normalizeQuizQuestion(data);
}

/** DELETE /api/quiz-questions/{id} */
export async function deleteQuizQuestion(id: number): Promise<void> {
  const url = `${QUIZ_QUESTIONS_URL}/${encodeURIComponent(String(id))}`;
  let res: Response;
  try {
    res = await fetch(url, { method: "DELETE", headers: withUserIdHeader(ACCEPT_JSON), mode: "cors" });
  } catch (e) {
    throw wrapApiNetworkError(url, e);
  }
  if (res.ok || res.status === 204) return;
  throw new Error(await readError(res));
}

// ─────────────────────────────────────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────────────────────────────────────

export const NOTIFICATIONS_URL = `${API_ORIGIN}/api/notifications`;

export type NotificationRow = {
  id: number;
  userId: number | null;   // null = global (visible to all)
  title: string | null;
  message: string;
  type: "article" | "training" | "simulation" | "alert" | string;
  read: boolean;           // maps from Java isRead
  createdAt: string;       // ISO datetime string
  link: string | null;     // optional deep-link e.g. /dashboard/knowledge/5
};

function normalizeNotification(raw: Record<string, unknown>): NotificationRow {
  return {
    id: Number(raw.id),
    userId: raw.userId != null ? Number(raw.userId) : null,
    title: raw.title != null ? String(raw.title) : null,
    message: String(raw.message ?? ""),
    type: String(raw.type ?? "alert"),
    // Java serialises isRead as "read" in JSON
    read: Boolean(raw.read ?? raw.isRead ?? false),
    createdAt: String(raw.createdAt ?? raw.created_at ?? ""),
    link: raw.link != null ? String(raw.link) : null,
  };
}

/**
 * GET notifications — tries user-scoped URL first (common Spring: /api/notifications/user/{userId}),
 * then plain /api/notifications, so we avoid 405 console noise when only one style is implemented.
 */
export async function getNotifications(): Promise<NotificationRow[]> {
  const uid = readStoredCurrentUserId();
  const urls = uid != null
    ? [`${NOTIFICATIONS_URL}/user/${encodeURIComponent(String(uid))}`, NOTIFICATIONS_URL]
    : [NOTIFICATIONS_URL];

  for (const url of urls) {
    try {
      const res = await fetch(url, { method: "GET", headers: ACCEPT_JSON, mode: "cors" });
      if (!res.ok) continue;
      const data = (await res.json().catch(() => null)) as unknown;
      if (!Array.isArray(data)) continue;
      return (data as Record<string, unknown>[]).map(normalizeNotification);
    } catch {
      /* try next url */
    }
  }
  return [];
}

/** GET /api/notifications/user/{userId} — user-scoped list (JWT recommended) */
export async function getNotificationsForUser(userId: number): Promise<NotificationRow[]> {
  const url = `${NOTIFICATIONS_URL}/user/${encodeURIComponent(String(userId))}`;
  const headers = new Headers(ACCEPT_JSON);
  const token = getAuthToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let res: Response;
  try {
    res = await fetch(url, { method: "GET", headers, mode: "cors" });
  } catch (e) {
    throw wrapApiNetworkError(url, e);
  }
  if (!res.ok) {
    throw new Error(await readError(res));
  }
  const data = (await res.json().catch(() => null)) as unknown;
  if (!Array.isArray(data)) return [];
  return (data as Record<string, unknown>[]).map(normalizeNotification);
}

/** GET unread count — same dual-path pattern as getNotifications */
export async function getUnreadCount(): Promise<number> {
  const uid = readStoredCurrentUserId();
  const urls =
    uid != null
      ? [
          `${NOTIFICATIONS_URL}/user/${encodeURIComponent(String(uid))}/unread-count`,
          `${NOTIFICATIONS_URL}/unread-count`,
        ]
      : [`${NOTIFICATIONS_URL}/unread-count`];

  for (const url of urls) {
    try {
      const res = await fetch(url, { method: "GET", headers: ACCEPT_JSON, mode: "cors" });
      if (!res.ok) continue;
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      return Number(data.count ?? 0);
    } catch {
      /* try next */
    }
  }
  return 0;
}

/** PUT /api/notifications/{id}/read — mark one notification as read */
export async function markNotificationRead(id: number): Promise<NotificationRow> {
  const url = `${NOTIFICATIONS_URL}/${encodeURIComponent(String(id))}/read`;
  let res: Response;
  try {
    res = await fetch(url, { method: "PUT", headers: ACCEPT_JSON, mode: "cors" });
  } catch (e) {
    throw wrapApiNetworkError(url, e);
  }
  const data = await handleJsonResponse<Record<string, unknown>>(res);
  return normalizeNotification(data);
}

/** PUT mark all read — tries /user/{id}/read-all then /read-all (sends JWT when present) */
export async function markAllNotificationsRead(explicitUserId?: number): Promise<void> {
  const uid =
    explicitUserId != null && Number.isFinite(explicitUserId) && explicitUserId > 0
      ? explicitUserId
      : readStoredCurrentUserId();
  const urls =
    uid != null
      ? [
          `${NOTIFICATIONS_URL}/user/${encodeURIComponent(String(uid))}/read-all`,
          `${NOTIFICATIONS_URL}/read-all`,
        ]
      : [`${NOTIFICATIONS_URL}/read-all`];

  const headers = new Headers(ACCEPT_JSON);
  const token = getAuthToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let lastMsg = "Could not mark all as read";
  for (const url of urls) {
    try {
      const res = await fetch(url, { method: "PUT", headers, mode: "cors" });
      if (res.ok || res.status === 204) return;
      lastMsg = await readError(res);
    } catch (e) {
      lastMsg = e instanceof Error ? e.message : lastMsg;
    }
  }
  throw new Error(lastMsg);
}

/** DELETE /api/notifications/user/{userId}/read — remove read notifications for user (JWT required) */
export async function deleteReadNotificationsForUser(userId: number): Promise<void> {
  const url = `${NOTIFICATIONS_URL}/user/${encodeURIComponent(String(userId))}/read`;
  const headers = new Headers(ACCEPT_JSON);
  const token = getAuthToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(url, { method: "DELETE", headers, mode: "cors" });
  } catch (e) {
    throw wrapApiNetworkError(url, e);
  }
  if (res.ok || res.status === 204) return;
  throw new Error(await readError(res));
}
