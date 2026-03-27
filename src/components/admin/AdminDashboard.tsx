import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { Skeleton } from '../ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '../ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../ui/select';
import {
  Users, Target, AlertTriangle, BookOpen,
  GraduationCap, ClipboardList,
  Trash2, UserPlus, Plus, RefreshCw,
  ShieldCheck, ShieldX, Eye, XCircle, CheckCircle2,
  Upload, FileText, Paperclip, X,
  BarChart2, Megaphone, Medal, TrendingUp,
} from 'lucide-react';
import { useUsers, useCreateUser, useDeleteUser, useCurrentUser } from '@/context/UsersContext';
import {
  API_ORIGIN,
  withUserIdHeader,
  getAllIncidents, updateIncidentStatus, deleteIncident,
  getSimulations, createSimulation, deleteSimulation,
  getKnowledgeArticles, createKnowledgeArticle, deleteKnowledgeArticle,
  getTrainings, createTraining, deleteTraining,
  addTrainingAttachment, deleteTrainingAttachment,
  getQuizQuestions, createQuizQuestion, deleteQuizQuestion,
  attachFileToArticle, uploadFile,
  type IncidentRow, type SimulationRow, type KnowledgeArticle,
  type TrainingRow, type TrainingAttachment, type QuizQuestionRow,
  type SimulationCreateInput, type KnowledgeArticleInput,
  type TrainingInput, type QuizQuestionInput,
} from '@/lib/api';
import { toast } from 'sonner';

type Tab = 'users' | 'training' | 'quizzes' | 'simulations' | 'incidents' | 'knowledge' | 'analytics' | 'announcements';

const TABS: { id: Tab; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'users',         label: 'Users',         icon: Users,          color: 'text-blue-400'   },
  { id: 'training',      label: 'Training',      icon: GraduationCap,  color: 'text-emerald-400'},
  { id: 'quizzes',       label: 'Quizzes',       icon: ClipboardList,  color: 'text-purple-400' },
  { id: 'simulations',   label: 'Simulations',   icon: Target,         color: 'text-orange-400' },
  { id: 'incidents',     label: 'Incidents',     icon: AlertTriangle,  color: 'text-red-400'    },
  { id: 'knowledge',     label: 'Knowledge',     icon: BookOpen,       color: 'text-indigo-400' },
  { id: 'analytics',     label: 'Analytics',     icon: BarChart2,      color: 'text-cyan-400'   },
  { id: 'announcements', label: 'Announcements', icon: Megaphone,      color: 'text-yellow-400' },
];

const SIM_TYPES  = ['PHISHING', 'SPEAR_PHISHING', 'MALWARE', 'SOCIAL_ENGINEERING'];
const CATEGORIES = ['Basics', 'Detection', 'Advanced', 'Best Practices', 'Procedures'];
const OPTIONS    = ['A', 'B', 'C', 'D'] as const;

// ── Badge / colour helpers ───────────────────────────────────────────────────
function severityClass(s: string) {
  switch (s?.toUpperCase()) {
    case 'HIGH':   return 'text-red-300 bg-red-500/15 border-red-500/40';
    case 'MEDIUM': return 'text-yellow-300 bg-yellow-500/15 border-yellow-500/40';
    case 'LOW':    return 'text-green-300 bg-green-500/15 border-green-500/40';
    default:       return 'text-slate-300 bg-slate-500/15 border-slate-500/40';
  }
}
function statusClass(s: string) {
  switch (s?.toUpperCase()) {
    case 'VERIFIED':  return 'text-green-300 bg-green-500/15 border-green-500/40';
    case 'DISMISSED': return 'text-slate-400 bg-slate-700/50 border-slate-600/40';
    case 'OPEN':      return 'text-blue-300 bg-blue-500/15 border-blue-500/40';
    default:          return 'text-slate-300 bg-slate-500/15 border-slate-500/40';
  }
}
function simTypeClass(t: string) {
  switch (t) {
    case 'SPEAR_PHISHING':     return 'text-red-300 bg-red-500/15 border-red-500/40';
    case 'PHISHING':           return 'text-orange-300 bg-orange-500/15 border-orange-500/40';
    case 'MALWARE':            return 'text-purple-300 bg-purple-500/15 border-purple-500/40';
    case 'SOCIAL_ENGINEERING': return 'text-yellow-300 bg-yellow-500/15 border-yellow-500/40';
    default:                   return 'text-blue-300 bg-blue-500/15 border-blue-500/40';
  }
}
function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

// ── Shared sub-components ────────────────────────────────────────────────────
function SectionHeader({ title, count, onRefresh, loading }: {
  title: string; count?: number; onRefresh: () => void; loading: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-white font-semibold">{title}</span>
        {count != null && (
          <span className="text-xs bg-slate-700 text-slate-300 rounded-full px-2 py-0.5">{count}</span>
        )}
      </div>
      <Button type="button" variant="outline" size="sm"
        className="border-slate-600 text-slate-300 hover:bg-slate-700 gap-1.5"
        onClick={onRefresh} disabled={loading}>
        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
      </Button>
    </div>
  );
}

// DeleteButton — uses window.confirm() instead of Radix AlertDialog.
// Radix portals inside a looped list (items.map) create one overlay per item
// which combined with motion.div layout causes a full browser freeze.
// window.confirm() is a native browser dialog — zero portals, zero freeze, works everywhere.
function DeleteButton({ onConfirm, title, description, disabled }: {
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      className="inline-flex items-center justify-center h-7 px-2 rounded-md cursor-pointer
                 bg-red-600/80 hover:bg-red-600 active:bg-red-700 text-white
                 disabled:opacity-50 disabled:pointer-events-none transition-colors"
      onClick={() => {
        if (!window.confirm(`${title}\n\n${description}`)) return;
        void Promise.resolve(onConfirm()).catch(err => {
          console.error('[PhishGuard] DeleteButton onConfirm failed', err);
        });
      }}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}

function SkeletonRows({ n = 3 }: { n?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: n }).map((_, i) => (
        <Skeleton key={i} className="h-11 w-full bg-slate-700 rounded-lg" />
      ))}
    </div>
  );
}

function getNameFromUrl(url: string): string {
  try {
    const parts = url.split('/');
    const raw = parts[parts.length - 1].split('?')[0];
    // strip timestamp prefix like "1710000000000_" if present
    return raw.replace(/^\d+_/, '');
  } catch {
    return 'File attached';
  }
}

function FileUploadBox({ onUploaded, currentUrl, disabled, clearAfterUpload }: {
  onUploaded: (url: string, name: string, fileSize?: string) => void;
  currentUrl?: string | null;
  disabled?: boolean;
  clearAfterUpload?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName]   = useState<string | null>(
    currentUrl ? getNameFromUrl(currentUrl) : null
  );
  const [fileUrl, setFileUrl]     = useState<string | null>(currentUrl ?? null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadFile(file);
      if (clearAfterUpload) {
        setFileUrl(null);
        setFileName(null);
      } else {
        setFileUrl(result.fileUrl);
        setFileName(result.fileName);
      }
      onUploaded(result.fileUrl, result.fileName, result.fileSize);
      toast.success(`"${result.fileName}" uploaded!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Label className="text-white text-xs font-bold flex items-center gap-1.5">
        <Paperclip className="h-3.5 w-3.5 text-yellow-300" /> Attach File (PDF, DOCX, PPTX, TXT — max 20 MB)
      </Label>
      <div className={`flex items-center gap-3 rounded-lg border-2 p-3 transition-colors
        ${fileUrl ? 'border-emerald-400 bg-emerald-900' : 'border-slate-400 bg-slate-700'}`}>
        {fileUrl ? (
          <>
            <FileText className="h-5 w-5 text-emerald-300 shrink-0" />
            <span className="text-white text-xs font-bold flex-1 truncate">{fileName ?? getNameFromUrl(fileUrl)}</span>
            <button type="button" onClick={() => { setFileUrl(null); setFileName(null); }}
              className="text-white hover:text-red-300 transition-colors" disabled={disabled}>
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <Upload className="h-5 w-5 text-white shrink-0" />
            <span className="text-white text-xs font-semibold flex-1">No file attached</span>
          </>
        )}
        <label className={`cursor-pointer text-xs font-bold px-3 py-1.5 rounded-lg transition-colors
          ${uploading || disabled
            ? 'opacity-50 cursor-not-allowed bg-slate-600 text-white'
            : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}>
          {uploading ? 'Uploading…' : fileUrl ? 'Replace' : 'Browse'}
          <input
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
            onChange={handleFile}
            disabled={uploading || disabled}
          />
        </label>
      </div>
    </div>
  );
}

// ── USERS TAB ────────────────────────────────────────────────────────────────
function UsersTab() {
  const navigate = useNavigate();
  const { users, loading, error, refreshUsers } = useUsers();
  const { createUser, isLoading: creating } = useCreateUser();
  const { deleteUser, isLoading: deleting } = useDeleteUser();
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [formError, setFormError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const n = name.trim(), em = email.trim();
    if (!n || !em) { setFormError('Name and email are required.'); return; }
    try {
      await createUser({ full_name: n, email: em });
      toast.success('User created');
      setName(''); setEmail('');
      await refreshUsers();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Create failed';
      setFormError(msg); toast.error(msg);
    }
  };

  return (
    <div className="space-y-5">
      <Card className="border-slate-700 bg-slate-800/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-blue-400" /> Add New User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
            {formError && (
              <div className="w-full">
                <Alert className="bg-red-900/20 border-red-900 py-2">
                  <AlertDescription className="text-sm">{formError}</AlertDescription>
                </Alert>
              </div>
            )}
            <div className="flex-1 min-w-[180px] space-y-1">
              <Label className="text-white text-xs font-semibold">Full Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)}
                className="bg-slate-900 border-slate-600 text-white h-9" placeholder="John Doe" disabled={creating} />
            </div>
            <div className="flex-1 min-w-[200px] space-y-1">
              <Label className="text-white text-xs font-semibold">Email Address</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="bg-slate-900 border-slate-600 text-white h-9" placeholder="user@example.com" disabled={creating} />
            </div>
            <Button type="submit" disabled={creating} className="h-9 bg-blue-600 hover:bg-blue-700 gap-1.5">
              <UserPlus className="h-4 w-4" />{creating ? 'Creating…' : 'Create User'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-slate-700 bg-slate-800/60">
        <CardHeader className="pb-3">
          <SectionHeader title="All Users" count={users.length} onRefresh={() => void refreshUsers()} loading={loading} />
        </CardHeader>
        <CardContent>
          {error && <Alert className="mb-3 bg-red-900/20 border-red-900"><AlertDescription>{error}</AlertDescription></Alert>}
          {loading ? <SkeletonRows /> : users.length === 0 ? (
            <p className="text-gray-300 text-sm text-center py-8">No users found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-transparent">
                  <TableHead className="text-slate-400 w-12">ID</TableHead>
                  <TableHead className="text-slate-400">Name</TableHead>
                  <TableHead className="text-slate-400">Email</TableHead>
                  <TableHead className="text-slate-400 text-right">Points</TableHead>
                  <TableHead className="text-slate-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.id} className="border-slate-700 hover:bg-slate-700/30">
                    <TableCell className="text-gray-300 text-xs">{u.id}</TableCell>
                    <TableCell className="text-white font-medium">{u.full_name}</TableCell>
                    <TableCell className="text-slate-300 text-sm">{u.email}</TableCell>
                    <TableCell className="text-right">
                      <span className="text-yellow-400 font-bold text-sm">{u.total_points}</span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline"
                        className="h-7 px-2 border-slate-600 text-slate-300 hover:bg-slate-700 text-xs"
                        onClick={() => navigate(`/dashboard/profile/${u.id}`)}>
                        <Eye className="h-3.5 w-3.5 mr-1" /> View
                      </Button>
                      <DeleteButton
                        title="Delete user?"
                        description={`${u.full_name} (${u.email}) will be permanently removed.`}
                        onConfirm={async () => {
                          try { await deleteUser(u.id); toast.success('User deleted'); }
                          catch (err) { toast.error(err instanceof Error ? err.message : 'Delete failed'); }
                        }}
                        disabled={deleting}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── TRAINING TAB ─────────────────────────────────────────────────────────────

function TrainingTab() {
  const { isAdmin } = useCurrentUser();
  const [items, setItems]     = useState<TrainingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  // No global "operating" lock — we use optimistic UI instead (instant remove, restore on error)
  const [title, setTitle]         = useState('');
  const [description, setDescription] = useState('');
  const [pendingFileUrl, setPendingFileUrl]   = useState('');
  const [pendingFileName, setPendingFileName] = useState('');
  const [pendingFileSize, setPendingFileSize] = useState('');
  const [formError, setFormError] = useState('');

  async function load() {
    setLoading(true);
    try { setItems(await getTrainings()); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Failed to load'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    const t = title.trim(), d = description.trim();
    if (!t || !d) { setFormError('Title and description are required.'); return; }
    setCreating(true);
    try {
      const body: TrainingInput = { title: t, description: d };
      let created = await createTraining(body);
      if (pendingFileUrl) {
        created = await addTrainingAttachment(created.id, {
          fileUrl: pendingFileUrl,
          fileName: pendingFileName,
          fileSize: pendingFileSize,
        });
      }
      setItems(prev => [...prev, created]);
      setTitle(''); setDescription('');
      setPendingFileUrl(''); setPendingFileName(''); setPendingFileSize('');
      toast.success('Training module added!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed';
      setFormError(msg); toast.error(msg);
    } finally { setCreating(false); }
  }

  async function handleAddAttachment(id: number, fileUrl: string, fileName: string, fileSize: string) {
    if (!fileUrl) return;   // guard — never send empty URL
    try {
      const updated = await addTrainingAttachment(id, { fileUrl, fileName, fileSize });
      setItems(prev => prev.map(m => m.id === id ? updated : m));
      toast.success(`"${fileName}" attached!`);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to attach file'); }
  }

  // Delete a single attachment — uses window.confirm (no portal, no overlay, no freeze)
  async function handleDeleteAttachment(moduleId: number, attachmentId: number, fileName: string) {
    if (!window.confirm(`Delete "${fileName}"?\nThis file will be permanently removed.`)) return;
    const snapshot = items;
    setItems(prev => prev.map(m =>
      m.id === moduleId
        ? { ...m, attachments: (m.attachments as TrainingAttachment[]).filter(a => a.id !== attachmentId) }
        : m
    ));
    try {
      await deleteTrainingAttachment(moduleId, attachmentId);
      toast.success(`"${fileName}" removed`);
    } catch (err) {
      setItems(snapshot);
      toast.error(err instanceof Error ? err.message : 'Delete failed — file restored');
    }
  }

  // Delete a whole module — uses window.confirm (no portal, no overlay, no freeze)
  async function handleDeleteModule(moduleId: number, moduleTitle: string) {
    if (!window.confirm(`Delete module "${moduleTitle}"?\nAll attached files will also be permanently removed.`)) return;
    const snapshot = items;
    setItems(prev => prev.filter(m => m.id !== moduleId));
    try {
      await deleteTraining(moduleId);
      toast.success(`"${moduleTitle}" deleted`);
    } catch (err) {
      setItems(snapshot);
      toast.error(err instanceof Error ? err.message : 'Delete failed — module restored');
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-emerald-500 bg-emerald-800/30 p-4 flex gap-3">
        <GraduationCap className="h-5 w-5 text-emerald-300 shrink-0 mt-0.5" />
        <div>
          <p className="text-white font-semibold text-sm">Training Modules</p>
          <p className="text-slate-200 text-xs mt-0.5">
            Add lessons here. You can attach a PDF, DOCX, or PPTX file — students will see a <strong className="text-white">Download Material</strong> button on each module.
          </p>
        </div>
      </div>

      {isAdmin && (
        <Card className="border-slate-700 bg-slate-800/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Plus className="h-4 w-4 text-emerald-400" /> Add Training Module
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-3">
              {formError && (
                <Alert className="bg-red-900/20 border-red-900 py-2">
                  <AlertDescription className="text-sm">{formError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-1">
                <Label className="text-white text-xs font-semibold">Module Title</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)}
                  className="bg-slate-900 border-slate-600 text-white h-9"
                  placeholder="e.g. Introduction to Phishing, Social Engineering Tactics…"
                  disabled={creating} />
              </div>
              <div className="space-y-1">
                <Label className="text-white text-xs font-semibold">Description / Content</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)}
                  className="bg-slate-900 border-slate-600 text-white resize-none min-h-[80px]"
                  placeholder="Explain what this module covers and what students will learn…"
                  disabled={creating} />
              </div>
              <FileUploadBox
                onUploaded={(url, name, size) => {
                  setPendingFileUrl(url);
                  setPendingFileName(name);
                  setPendingFileSize(size ?? '');
                }}
                disabled={creating}
              />
              <Button type="submit" disabled={creating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                <Plus className="h-4 w-4" />{creating ? 'Adding…' : 'Add Module'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-700 bg-slate-800/60">
        <CardHeader className="pb-3">
          <SectionHeader title="All Training Modules" count={items.length} onRefresh={load} loading={loading} />
        </CardHeader>
        <CardContent>
          {loading ? <SkeletonRows /> : items.length === 0 ? (
            <p className="text-gray-300 text-sm text-center py-8">No modules yet. Add your first one above.</p>
          ) : (
            <div className="space-y-3">
              {items.map((m, idx) => (
                // Plain div — no motion.div/layout here to avoid framer-motion
                // interfering with Radix portals and causing measurement loops
                <div key={m.id}
                  className="rounded-lg border border-slate-600 bg-slate-800 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3 items-start flex-1 min-w-0">
                      <span className="text-slate-300 text-xs font-bold w-5 shrink-0 mt-0.5">{idx + 1}.</span>
                      <div className="min-w-0">
                        <p className="text-white font-semibold text-sm">{m.title}</p>
                        {m.description && (
                          <p className="text-slate-200 text-xs mt-1 line-clamp-2">{m.description}</p>
                        )}
                        {(m.attachments as TrainingAttachment[]).length > 0 && (
                          <div className="mt-1.5 space-y-1">
                            {(m.attachments as TrainingAttachment[]).map(att => (
                              <div key={att.id} className="flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5 text-emerald-300 shrink-0" />
                                <a href={att.fileUrl} target="_blank" rel="noreferrer"
                                  className="text-xs text-emerald-300 hover:text-white font-medium truncate flex-1">
                                  {att.fileName}
                                </a>
                                <span className="text-slate-400 text-xs shrink-0">{formatDate(att.uploadedAt)}</span>
                                {isAdmin && (
                                  // Plain button — opens the ONE shared dialog via state
                                  <button
                                    type="button"
                                    title="Delete this file"
                                    className="ml-1 inline-flex items-center justify-center h-6 w-6 rounded cursor-pointer
                                               text-slate-400 hover:text-white hover:bg-red-600
                                               transition-all duration-150 shrink-0 group"
                                    onClick={e => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      void handleDeleteAttachment(m.id, att.id, att.fileName);
                                    }}
                                  >
                                    <X className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {isAdmin && (
                      <button
                        type="button"
                        title="Delete this module"
                        className="inline-flex items-center justify-center gap-1 h-7 px-2.5 rounded-md cursor-pointer
                                   bg-red-600/80 hover:bg-red-600 active:bg-red-700 text-white
                                   transition-all duration-150 shrink-0 group"
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          void handleDeleteModule(m.id, m.title);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                      </button>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="pl-8">
                      <FileUploadBox
                        clearAfterUpload
                        onUploaded={(url, name, size) => void handleAddAttachment(m.id, url, name, size ?? '')}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

// ── QUIZZES TAB ───────────────────────────────────────────────────────────────
function QuizzesTab() {
  const [questions, setQuestions] = useState<QuizQuestionRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [creating, setCreating]   = useState(false);
  const [deleting, setDeleting]   = useState(false);

  const [questionText, setQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correct, setCorrect] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [formError, setFormError] = useState('');

  async function load() {
    setLoading(true);
    try { setQuestions(await getQuizQuestions()); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Failed to load'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  function resetForm() {
    setQuestionText(''); setOptionA(''); setOptionB('');
    setOptionC(''); setOptionD(''); setCorrect('A');
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    const q = questionText.trim(), a = optionA.trim(), b = optionB.trim(),
          c = optionC.trim(), d = optionD.trim();
    if (!q || !a || !b || !c || !d) {
      setFormError('Question and all 4 options are required.');
      return;
    }
    setCreating(true);
    try {
      const body: QuizQuestionInput = {
        question: q, optionA: a, optionB: b, optionC: c, optionD: d,
        correctAnswer: correct,
      };
      const created = await createQuizQuestion(body);
      setQuestions(prev => [...prev, created]);
      resetForm();
      toast.success('Quiz question added!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed';
      setFormError(msg); toast.error(msg);
    } finally { setCreating(false); }
  }

  async function handleDelete(id: number) {
    setDeleting(true);
    try {
      await deleteQuizQuestion(id);
      setQuestions(prev => prev.filter(q => q.id !== id));
      toast.success('Question deleted');
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Delete failed'); }
    finally { setDeleting(false); }
  }

  const optionFields = [
    { label: 'Option A', value: optionA, onChange: setOptionA },
    { label: 'Option B', value: optionB, onChange: setOptionB },
    { label: 'Option C', value: optionC, onChange: setOptionC },
    { label: 'Option D', value: optionD, onChange: setOptionD },
  ];

  return (
    <div className="space-y-5">
      {/* Info banner */}
      <div className="rounded-xl border border-purple-500 bg-purple-900/40 p-4 flex gap-3">
        <ClipboardList className="h-5 w-5 text-purple-300 shrink-0 mt-0.5" />
        <div>
          <p className="text-white font-semibold text-sm">Quiz Questions</p>
          <p className="text-slate-200 text-xs mt-0.5">
            Add multiple-choice questions here. Students answer them in the Quiz section and earn points for correct answers.
            Mark the correct answer with the dropdown.
          </p>
        </div>
      </div>

      {/* Create form */}
      <Card className="border-slate-700 bg-slate-800/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Plus className="h-4 w-4 text-purple-400" /> Add Quiz Question
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            {formError && (
              <Alert className="bg-red-900/20 border-red-900 py-2">
                <AlertDescription className="text-sm">{formError}</AlertDescription>
              </Alert>
            )}

            {/* Question */}
            <div className="space-y-1">
              <Label className="text-white text-xs font-semibold">Question</Label>
              <Textarea value={questionText} onChange={e => setQuestionText(e.target.value)}
                className="bg-slate-900 border-slate-600 text-white resize-none min-h-[80px]"
                placeholder="e.g. Which of the following is a common sign of a phishing email?"
                disabled={creating} />
            </div>

            {/* 4 options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {optionFields.map(f => (
                <div key={f.label} className="space-y-1">
                  <Label className="text-white text-xs font-semibold">{f.label}</Label>
                  <Input value={f.value} onChange={e => f.onChange(e.target.value)}
                    className="bg-slate-900 border-slate-600 text-white h-9"
                    placeholder={`Enter ${f.label}…`} disabled={creating} />
                </div>
              ))}
            </div>

            {/* Correct answer selector */}
            <div className="flex items-center gap-4 p-3 rounded-lg border border-green-500 bg-green-800/40">
              <CheckCircle2 className="h-4 w-4 text-green-300 shrink-0" />
              <div className="flex-1">
                <Label className="text-white text-xs font-semibold">Correct Answer</Label>
                <p className="text-slate-300 text-xs">Select which option is the correct answer</p>
              </div>
              <Select value={correct} onValueChange={v => setCorrect(v as 'A' | 'B' | 'C' | 'D')} disabled={creating}>
                <SelectTrigger className="w-24 bg-slate-900 border-green-500/40 text-green-300 h-9 font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {OPTIONS.map(o => (
                    <SelectItem key={o} value={o} className="text-white hover:bg-slate-800 font-medium">
                      Option {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={creating}
              className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5">
              <Plus className="h-4 w-4" />{creating ? 'Adding…' : 'Add Question'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Questions list */}
      <Card className="border-slate-700 bg-slate-800/60">
        <CardHeader className="pb-3">
          <SectionHeader title="All Quiz Questions" count={questions.length} onRefresh={load} loading={loading} />
        </CardHeader>
        <CardContent>
          {loading ? <SkeletonRows n={4} /> : questions.length === 0 ? (
            <p className="text-gray-300 text-sm text-center py-8">No questions yet. Add your first one above.</p>
          ) : (
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <motion.div key={q.id} layout
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-2.5 items-start flex-1 min-w-0">
                      <span className="text-xs font-bold text-purple-400 bg-purple-500/15 border border-purple-500/30 rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-white font-medium text-sm leading-relaxed">{q.question}</p>
                    </div>
                    <DeleteButton
                      title="Delete question?"
                      description="This quiz question will be permanently removed."
                      onConfirm={() => void handleDelete(q.id)}
                      disabled={deleting}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 pl-8">
                    {(['A', 'B', 'C', 'D'] as const).map(letter => {
                      const text = q[`option${letter}` as keyof QuizQuestionRow] as string;
                      const isCorrect = q.correctAnswer === letter;
                      return (
                        <div key={letter}
                          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs border
                            ${isCorrect
                              ? 'bg-green-500 border-green-400 text-white font-bold'
                              : 'bg-slate-700 border-slate-500 text-white'}`}>
                          <span className={`font-bold w-4 shrink-0 ${isCorrect ? 'text-white' : 'text-gray-200'}`}>
                            {letter}
                          </span>
                          <span className="flex-1 font-semibold">{text || '—'}</span>
                          {isCorrect && <CheckCircle2 className="h-3.5 w-3.5 text-white shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── SIMULATIONS TAB ──────────────────────────────────────────────────────────
function SimulationsTab() {
  const [items, setItems]     = useState<SimulationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [title, setTitle]         = useState('');
  const [description, setDescription] = useState('');
  const [type, setType]           = useState('PHISHING');
  const [formError, setFormError] = useState('');

  async function load() {
    setLoading(true);
    try { setItems(await getSimulations()); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Failed to load'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    const t = title.trim(), d = description.trim();
    if (!t || !d) { setFormError('Title and description are required.'); return; }
    setCreating(true);
    try {
      const body: SimulationCreateInput = { title: t, description: d, type };
      const created = await createSimulation(body);
      setItems(prev => [created, ...prev]);
      setTitle(''); setDescription('');
      toast.success('Simulation created!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed';
      setFormError(msg); toast.error(msg);
    } finally { setCreating(false); }
  }

  async function handleDelete(id: number, simTitle: string) {
    setDeleting(true);
    try {
      await deleteSimulation(id);
      setItems(prev => prev.filter(s => s.id !== id));
      toast.success(`"${simTitle}" deleted`);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Delete failed'); }
    finally { setDeleting(false); }
  }

  return (
    <div className="space-y-5">
      <Card className="border-slate-700 bg-slate-800/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Plus className="h-4 w-4 text-orange-400" /> Create Phishing Simulation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-3">
            {formError && (
              <Alert className="bg-red-900/20 border-red-900 py-2">
                <AlertDescription className="text-sm">{formError}</AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-slate-400 text-xs">Scenario Title</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)}
                  className="bg-slate-900 border-slate-600 text-white h-9"
                  placeholder="e.g. CEO Fraud Attempt" disabled={creating} />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-400 text-xs">Attack Type</Label>
                <Select value={type} onValueChange={setType} disabled={creating}>
                  <SelectTrigger className="bg-slate-900 border-slate-600 text-white h-9"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {SIM_TYPES.map(t => (
                      <SelectItem key={t} value={t} className="text-white hover:bg-slate-800">{t.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-slate-400 text-xs">Scenario Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)}
                className="bg-slate-900 border-slate-600 text-white resize-none min-h-[80px]"
                placeholder="Describe the phishing scenario students will face…" disabled={creating} />
            </div>
            <Button type="submit" disabled={creating} className="bg-orange-600 hover:bg-orange-700 text-white gap-1.5">
              <Plus className="h-4 w-4" />{creating ? 'Creating…' : 'Create Simulation'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-slate-700 bg-slate-800/60">
        <CardHeader className="pb-3">
          <SectionHeader title="All Simulations" count={items.length} onRefresh={load} loading={loading} />
        </CardHeader>
        <CardContent>
          {loading ? <SkeletonRows /> : items.length === 0 ? (
            <p className="text-gray-300 text-sm text-center py-8">No simulations yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-transparent">
                  <TableHead className="text-slate-400">Title</TableHead>
                  <TableHead className="text-slate-400">Type</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Created</TableHead>
                  <TableHead className="text-slate-400 text-right">Delete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(sim => (
                  <TableRow key={sim.id} className="border-slate-700 hover:bg-slate-700/30">
                    <TableCell>
                      <p className="text-white font-medium text-sm">{sim.title}</p>
                      {sim.description && <p className="text-gray-200 text-xs line-clamp-1 mt-0.5">{sim.description}</p>}
                    </TableCell>
                    <TableCell>
                      {sim.type && (
                        <span className={`text-xs font-medium uppercase tracking-wide rounded-full px-2 py-0.5 border ${simTypeClass(sim.type)}`}>
                          {sim.type.replace('_', ' ')}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium text-green-400 bg-green-500/10 border border-green-500/30 rounded-full px-2 py-0.5">
                        {sim.status ?? 'ACTIVE'}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-400 text-xs">{formatDate(sim.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <DeleteButton
                        title="Delete simulation?"
                        description={`"${sim.title}" will be permanently deleted.`}
                        onConfirm={() => void handleDelete(sim.id, sim.title)}
                        disabled={deleting}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── INCIDENTS TAB ─────────────────────────────────────────────────────────────
function IncidentsTab() {
  const [items, setItems]         = useState<IncidentRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [updating, setUpdating]   = useState<number | null>(null);
  const [deleting, setDeleting]   = useState(false);

  async function load() {
    setLoading(true);
    try { setItems(await getAllIncidents()); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Failed to load'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function handleStatus(id: number, status: string) {
    setUpdating(id);
    try {
      const updated = await updateIncidentStatus(id, status);
      setItems(prev => prev.map(i => i.id === id ? updated : i));
      toast.success(`Marked as ${status}`);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Update failed'); }
    finally { setUpdating(null); }
  }

  async function handleDelete(id: number) {
    setDeleting(true);
    try {
      await deleteIncident(id);
      setItems(prev => prev.filter(i => i.id !== id));
      toast.success('Incident deleted');
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Delete failed'); }
    finally { setDeleting(false); }
  }

  const open     = items.filter(i => i.status?.toUpperCase() === 'OPEN').length;
  const verified = items.filter(i => i.status?.toUpperCase() === 'VERIFIED').length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total',    value: items.length, color: 'text-white' },
          { label: 'Open',     value: open,         color: 'text-blue-400' },
          { label: 'Verified', value: verified,     color: 'text-green-400' },
        ].map(s => (
          <Card key={s.label} className="border-slate-700 bg-slate-800/60 text-center">
            <CardContent className="py-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-200 uppercase tracking-wide mt-1 font-semibold">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-700 bg-slate-800/60">
        <CardHeader className="pb-3">
          <SectionHeader title="Reported Incidents" count={items.length} onRefresh={load} loading={loading} />
        </CardHeader>
        <CardContent>
          {loading ? <SkeletonRows n={4} /> : items.length === 0 ? (
            <p className="text-gray-300 text-sm text-center py-8">No incidents reported yet.</p>
          ) : (
            <div className="space-y-3">
              {items.map(inc => (
                <motion.div key={inc.id} layout
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="text-white font-semibold text-sm">{inc.title}</p>
                        <span className={`text-xs font-medium uppercase rounded-full px-2 py-0.5 border ${severityClass(inc.severity)}`}>{inc.severity || '—'}</span>
                        <span className={`text-xs font-medium uppercase rounded-full px-2 py-0.5 border ${statusClass(inc.status)}`}>{inc.status || '—'}</span>
                      </div>
                      {inc.description && <p className="text-gray-200 text-xs line-clamp-2 mt-1">{inc.description}</p>}
                      <p className="text-gray-300 text-xs mt-1 font-medium">User #{inc.userId} · {formatDate(inc.reportedAt)}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {inc.status?.toUpperCase() !== 'VERIFIED' && (
                        <Button size="sm" className="h-7 px-2 bg-green-700/80 hover:bg-green-700 text-white text-xs gap-1"
                          disabled={updating === inc.id}
                          onClick={() => void handleStatus(inc.id, 'VERIFIED')}>
                          <ShieldCheck className="h-3.5 w-3.5" />{updating === inc.id ? '…' : 'Verify'}
                        </Button>
                      )}
                      {inc.status?.toUpperCase() !== 'DISMISSED' && (
                        <Button size="sm" className="h-7 px-2 bg-slate-600 hover:bg-slate-500 text-white text-xs gap-1"
                          disabled={updating === inc.id}
                          onClick={() => void handleStatus(inc.id, 'DISMISSED')}>
                          <ShieldX className="h-3.5 w-3.5" />{updating === inc.id ? '…' : 'Dismiss'}
                        </Button>
                      )}
                      <DeleteButton
                        title="Delete incident?"
                        description="This report will be permanently removed."
                        onConfirm={() => void handleDelete(inc.id)}
                        disabled={deleting}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── KNOWLEDGE TAB ─────────────────────────────────────────────────────────────
function KnowledgeTab() {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [loading, setLoading]   = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [title, setTitle]       = useState('');
  const [category, setCategory] = useState('Basics');
  const [author, setAuthor]     = useState('');
  const [content, setContent]   = useState('');
  const [pendingFileUrl, setPendingFileUrl] = useState('');
  const [formError, setFormError] = useState('');

  async function load() {
    setLoading(true);
    try { setArticles(await getKnowledgeArticles()); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Failed to load'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    const t = title.trim(), c = content.trim();
    if (!t || !c) { setFormError('Title and content are required.'); return; }
    setCreating(true);
    try {
      const body: KnowledgeArticleInput = { title: t, category, content: c, author: author.trim() };
      let created = await createKnowledgeArticle(body);
      if (pendingFileUrl) {
        created = await attachFileToArticle(created.id, pendingFileUrl);
      }
      setArticles(prev => [created, ...prev]);
      setTitle(''); setContent(''); setAuthor(''); setPendingFileUrl('');
      toast.success('Article published!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed';
      setFormError(msg); toast.error(msg);
    } finally { setCreating(false); }
  }

  async function handleDelete(id: number, artTitle: string) {
    setDeleting(true);
    try {
      await deleteKnowledgeArticle(id);
      setArticles(prev => prev.filter(a => a.id !== id));
      toast.success(`"${artTitle}" deleted`);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Delete failed'); }
    finally { setDeleting(false); }
  }

  async function handleAttachFile(id: number, fileUrl: string) {
    try {
      const updated = await attachFileToArticle(id, fileUrl || '');
      setArticles(prev => prev.map(a => a.id === id ? updated : a));
      toast.success(fileUrl ? 'File attached!' : 'File removed');
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
  }

  return (
    <div className="space-y-5">
      <Card className="border-slate-700 bg-slate-800/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Plus className="h-4 w-4 text-indigo-400" /> Publish New Article
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-3">
            {formError && (
              <Alert className="bg-red-900/20 border-red-900 py-2">
                <AlertDescription className="text-sm">{formError}</AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-white text-xs font-semibold">Article Title</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)}
                  className="bg-slate-900 border-slate-600 text-white h-9"
                  placeholder="e.g. How to Spot a Phishing Email" disabled={creating} />
              </div>
              <div className="space-y-1">
                <Label className="text-white text-xs font-semibold">Category</Label>
                <Select value={category} onValueChange={setCategory} disabled={creating}>
                  <SelectTrigger className="bg-slate-900 border-slate-600 text-white h-9"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {CATEGORIES.map(c => (
                      <SelectItem key={c} value={c} className="text-white hover:bg-slate-800">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-white text-xs font-semibold">Author Name</Label>
              <Input value={author} onChange={e => setAuthor(e.target.value)}
                className="bg-slate-900 border-slate-600 text-white h-9"
                placeholder="Your name (optional)" disabled={creating} />
            </div>
            <div className="space-y-1">
              <Label className="text-white text-xs font-semibold">Article Content</Label>
              <Textarea value={content} onChange={e => setContent(e.target.value)}
                className="bg-slate-900 border-slate-600 text-white resize-none min-h-[120px]"
                placeholder="Write the full article content here…" disabled={creating} />
            </div>
            <FileUploadBox
              onUploaded={(url) => setPendingFileUrl(url)}
              disabled={creating}
            />
            <Button type="submit" disabled={creating} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
              <Plus className="h-4 w-4" />{creating ? 'Publishing…' : 'Publish Article'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-slate-700 bg-slate-800/60">
        <CardHeader className="pb-3">
          <SectionHeader title="Published Articles" count={articles.length} onRefresh={load} loading={loading} />
        </CardHeader>
        <CardContent>
          {loading ? <SkeletonRows /> : articles.length === 0 ? (
            <p className="text-gray-300 text-sm text-center py-8">No articles yet. Publish your first one above.</p>
          ) : (
            <div className="space-y-3">
              {articles.map(a => (
                <motion.div key={a.id} layout
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="text-white font-bold text-sm">{a.title}</p>
                        {a.category && (
                          <span className="text-xs font-bold text-white bg-indigo-600 border border-indigo-400 rounded-full px-2.5 py-0.5">{a.category}</span>
                        )}
                      </div>
                      <p className="text-gray-300 text-xs font-medium">{a.author ? `By ${a.author} · ` : ''}{formatDate(a.publishedAt)}</p>
                      {a.content && <p className="text-gray-200 text-xs mt-1.5 line-clamp-2">{a.content}</p>}
                      {a.fileUrl && (
                        <a href={a.fileUrl} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg px-2.5 py-1 mt-2 transition-colors">
                          <FileText className="h-3.5 w-3.5" /> View attached file
                        </a>
                      )}
                    </div>
                    <DeleteButton
                      title="Delete article?"
                      description={`"${a.title}" will be permanently removed.`}
                      onConfirm={() => void handleDelete(a.id, a.title)}
                      disabled={deleting}
                    />
                  </div>
                  <FileUploadBox
                    currentUrl={a.fileUrl}
                    onUploaded={(url) => void handleAttachFile(a.id, url)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── ANALYTICS TAB ─────────────────────────────────────────────────────────────
type StudentRow = {
  userId: number; name: string; email: string; points: number;
  quizAttempts: number; avgScore: number; bestScore: number; lastAttempt: string | null;
};

function ScoreBadge({ pct }: { pct: number }) {
  const cls = pct >= 70 ? 'bg-green-700 text-white' : pct >= 40 ? 'bg-yellow-700 text-white' : 'bg-red-700 text-white';
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cls}`}>{pct}%</span>;
}

function AnalyticsTab() {
  const [rows, setRows]       = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API_ORIGIN}/api/admin/analytics`, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json() as StudentRow[];
      setRows(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load analytics');
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  const filtered = rows.filter(r =>
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.email?.toLowerCase().includes(search.toLowerCase())
  );

  const totalAttempts = rows.reduce((s, r) => s + r.quizAttempts, 0);
  const avgPlatform   = rows.length > 0 ? Math.round(rows.reduce((s, r) => s + r.avgScore, 0) / rows.length) : 0;
  const passed        = rows.filter(r => r.bestScore >= 70).length;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-cyan-500 bg-cyan-800/30 p-4 flex gap-3">
        <BarChart2 className="h-5 w-5 text-cyan-300 shrink-0 mt-0.5" />
        <div>
          <p className="text-white font-semibold text-sm">Student Progress Analytics</p>
          <p className="text-slate-200 text-xs mt-0.5">See every student's quiz performance and points at a glance.</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Students', value: rows.length, icon: Users, color: 'text-blue-400' },
          { label: 'Quiz Attempts',  value: totalAttempts, icon: ClipboardList, color: 'text-purple-400' },
          { label: 'Avg Score',      value: `${avgPlatform}%`, icon: TrendingUp, color: 'text-cyan-400' },
          { label: 'Passed (≥70%)',  value: passed, icon: Medal, color: 'text-yellow-400' },
        ].map(c => (
          <Card key={c.label} className="border-slate-600 bg-slate-800">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <c.icon className={`h-4 w-4 ${c.color}`} />
                <span className="text-slate-300 text-xs">{c.label}</span>
              </div>
              <p className="text-white text-2xl font-bold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-700 bg-slate-800/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <SectionHeader title="All Students" count={filtered.length} onRefresh={load} loading={loading} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="bg-slate-900 border border-slate-600 text-white text-xs rounded-lg px-3 py-2 w-56 placeholder:text-slate-500 focus:outline-none focus:border-slate-400"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <SkeletonRows /> : filtered.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No students found.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-700">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-transparent">
                    <TableHead className="text-slate-300 font-semibold">#</TableHead>
                    <TableHead className="text-slate-300 font-semibold">Student</TableHead>
                    <TableHead className="text-slate-300 font-semibold text-center">Points</TableHead>
                    <TableHead className="text-slate-300 font-semibold text-center">Attempts</TableHead>
                    <TableHead className="text-slate-300 font-semibold text-center">Avg Score</TableHead>
                    <TableHead className="text-slate-300 font-semibold text-center">Best Score</TableHead>
                    <TableHead className="text-slate-300 font-semibold">Last Attempt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r, i) => (
                    <TableRow key={r.userId} className="border-slate-700 hover:bg-slate-700/30">
                      <TableCell className="text-slate-400 text-xs font-mono">{i + 1}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-white font-semibold text-sm">{r.name}</p>
                          <p className="text-slate-400 text-xs">{r.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-yellow-300 font-bold text-sm">{r.points}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-white text-sm">{r.quizAttempts}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        {r.quizAttempts > 0 ? <ScoreBadge pct={r.avgScore} /> : <span className="text-gray-300 text-xs font-semibold">—</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        {r.quizAttempts > 0 ? <ScoreBadge pct={r.bestScore} /> : <span className="text-gray-300 text-xs font-semibold">—</span>}
                      </TableCell>
                      <TableCell className="text-slate-300 text-xs">
                        {r.lastAttempt ? new Date(r.lastAttempt).toLocaleDateString() : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── ANNOUNCEMENTS TAB ─────────────────────────────────────────────────────────
type AnnouncementRow = { id: number; title: string; message: string; createdAt: string };

function AnnouncementsTab() {
  const [items, setItems]     = useState<AnnouncementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [title, setTitle]     = useState('');
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API_ORIGIN}/api/announcements`, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      setItems(await res.json() as AnnouncementRow[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load');
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setFormError('Title is required.'); return; }
    if (!message.trim()) { setFormError('Message is required.'); return; }
    setFormError('');
    setCreating(true);
    try {
      const res = await fetch(`${API_ORIGIN}/api/announcements`, {
        method: 'POST',
        headers: withUserIdHeader({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ title: title.trim(), message: message.trim() }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const created = await res.json() as AnnouncementRow;
      setItems(prev => [created, ...prev]);
      setTitle(''); setMessage('');
      toast.success('Announcement posted!');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to post');
    } finally { setCreating(false); }
  }

  async function handleDelete(id: number) {
    const snapshot = items;
    setItems(prev => prev.filter(a => a.id !== id));   // remove from UI instantly
    try {
      const res = await fetch(`${API_ORIGIN}/api/announcements/${id}`, {
        method: 'DELETE',
        headers: withUserIdHeader({ Accept: 'application/json' }),
      });
      if (!res.ok && res.status !== 204) throw new Error(`Server error: ${res.status}`);
      toast.success('Announcement deleted');
    } catch (e) {
      setItems(snapshot);                               // restore on failure
      toast.error(e instanceof Error ? e.message : 'Failed to delete');
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-yellow-500 bg-yellow-800/20 p-4 flex gap-3">
        <Megaphone className="h-5 w-5 text-yellow-300 shrink-0 mt-0.5" />
        <div>
          <p className="text-white font-semibold text-sm">Announcements</p>
          <p className="text-slate-200 text-xs mt-0.5">Post notices and updates — students see them on their dashboard homepage.</p>
        </div>
      </div>

      <Card className="border-slate-700 bg-slate-800/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Plus className="h-4 w-4 text-yellow-400" /> Post New Announcement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-3">
            {formError && (
              <Alert className="bg-red-900/20 border-red-900 py-2">
                <AlertDescription className="text-red-300 text-sm">{formError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-1">
              <Label className="text-white text-xs font-semibold">Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)}
                className="bg-slate-900 border-slate-600 text-white h-9"
                placeholder="e.g. New training module available, Quiz deadline reminder…"
                disabled={creating} />
            </div>
            <div className="space-y-1">
              <Label className="text-white text-xs font-semibold">Message</Label>
              <Textarea value={message} onChange={e => setMessage(e.target.value)}
                className="bg-slate-900 border-slate-600 text-white resize-none min-h-[80px]"
                placeholder="Write your announcement message here…"
                disabled={creating} />
            </div>
            <Button type="submit" disabled={creating}
              className="bg-yellow-600 hover:bg-yellow-700 text-white gap-1.5">
              <Megaphone className="h-4 w-4" />{creating ? 'Posting…' : 'Post Announcement'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-slate-700 bg-slate-800/60">
        <CardHeader className="pb-3">
          <SectionHeader title="Posted Announcements" count={items.length} onRefresh={load} loading={loading} />
        </CardHeader>
        <CardContent>
          {loading ? <SkeletonRows /> : items.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No announcements yet.</p>
          ) : (
            <div className="space-y-3">
              {items.map(a => (
                <motion.div key={a.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-yellow-500/30 bg-yellow-900/10 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm">{a.title}</p>
                      <p className="text-slate-200 text-xs mt-1 whitespace-pre-wrap">{a.message}</p>
                      <p className="text-slate-400 text-xs mt-2">{formatDate(a.createdAt)}</p>
                    </div>
                    <DeleteButton
                      title="Delete announcement?"
                      description="This announcement will be removed from the student dashboard."
                      onConfirm={() => void handleDelete(a.id)}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const { isAdmin } = useCurrentUser();

  if (!isAdmin) {
    return (
      <Card className="border-slate-800 bg-slate-900/50">
        <CardContent className="py-20 text-center space-y-3">
          <XCircle className="h-14 w-14 text-red-400 mx-auto" />
          <p className="text-white font-bold text-xl">Access Denied</p>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            Admin tools are only available to accounts whose email contains "admin".
            Log in with an admin account to access this panel.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="h-8 w-8 text-blue-400" />
          Admin Panel
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage all platform content — users, training, quizzes, simulations, incidents, knowledge, analytics and announcements
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-800/60 rounded-xl p-1 border border-slate-700 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[80px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap
              ${activeTab === tab.id
                ? 'bg-slate-900 text-white shadow border border-slate-600'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
          >
            <tab.icon className={`h-4 w-4 shrink-0 ${activeTab === tab.id ? tab.color : ''}`} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content with animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === 'users'         && <UsersTab />}
          {activeTab === 'training'      && <TrainingTab />}
          {activeTab === 'quizzes'       && <QuizzesTab />}
          {activeTab === 'simulations'   && <SimulationsTab />}
          {activeTab === 'incidents'     && <IncidentsTab />}
          {activeTab === 'knowledge'     && <KnowledgeTab />}
          {activeTab === 'analytics'     && <AnalyticsTab />}
          {activeTab === 'announcements' && <AnnouncementsTab />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
