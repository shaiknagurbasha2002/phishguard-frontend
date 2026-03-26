import { useEffect, useState } from 'react';
import type { TrainingAttachment } from '@/lib/api';
import { TRAINING_URL } from '@/lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import {
  BookOpen, CheckCircle, Clock, Shield, Lock, Mail, Globe, Users,
  Download, FileText, ChevronDown, ChevronUp, BookOpenCheck, PlayCircle,
  X, Eye, AlertCircle,
} from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

// ── File Viewer Modal ─────────────────────────────────────────────────────────
function getFileType(url: string): 'pdf' | 'txt' | 'office' | 'unknown' {
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'txt') return 'txt';
  if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext)) return 'office';
  return 'unknown';
}

function FileViewerModal({ url, title, onClose }: {
  url: string; title: string; onClose: () => void;
}) {
  const [txtContent, setTxtContent] = useState<string | null>(null);
  const [txtError, setTxtError]     = useState(false);
  const type = getFileType(url);

  useEffect(() => {
    if (type === 'txt') {
      fetch(url)
        .then(r => r.text())
        .then(setTxtContent)
        .catch(() => setTxtError(true));
    }
  }, [url, type]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-5xl h-[90vh] flex flex-col rounded-2xl border border-slate-600 bg-slate-900 overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700 bg-slate-800 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 text-indigo-400 shrink-0" />
            <span className="text-white font-semibold text-sm truncate">{title}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-slate-950">
          {type === 'pdf' && (
            <iframe
              src={url}
              title={title}
              className="w-full h-full border-0"
            />
          )}

          {type === 'txt' && (
            <div className="h-full overflow-y-auto p-6">
              {txtContent != null ? (
                <pre className="text-slate-100 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                  {txtContent}
                </pre>
              ) : txtError ? (
                <div className="flex items-center gap-2 text-red-400 mt-4">
                  <AlertCircle className="h-5 w-5" />
                  <span>Could not load file content.</span>
                </div>
              ) : (
                <p className="text-slate-400 text-sm animate-pulse">Loading file…</p>
              )}
            </div>
          )}

          {type === 'office' && (
            <div className="flex flex-col items-center justify-center h-full gap-5 text-center px-6">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                <FileText className="h-8 w-8 text-slate-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-lg mb-1">Preview not available</p>
                <p className="text-slate-400 text-sm max-w-sm">
                  DOCX, PPTX and XLSX files cannot be previewed in the browser directly.
                  Please download the file to open it with Microsoft Office or Google Docs.
                </p>
              </div>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors"
              >
                <Download className="h-4 w-4" /> Download to Open
              </a>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

const TRAINING_API_URL = TRAINING_URL;

function formatUploadDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getRawAttachments(r: Record<string, unknown>): unknown[] {
  if (Array.isArray(r.attachments)) return r.attachments;
  if (Array.isArray(r.files)) return r.files;
  if (Array.isArray(r.trainingAttachments)) return r.trainingAttachments;
  return [];
}

export type TrainingModuleRow = {
  id: number;
  title: string;
  description: string | null;
  progress: number;
  fileUrl?: string | null;
  attachments: TrainingAttachment[];
};

function getModuleIcon(title: string) {
  const t = title.toLowerCase();
  if (t.includes('password')) return <Lock className="h-6 w-6" />;
  if (t.includes('email'))    return <Mail className="h-6 w-6" />;
  if (t.includes('social') || t.includes('engineer')) return <Users className="h-6 w-6" />;
  if (t.includes('brows') || t.includes('web'))       return <Globe className="h-6 w-6" />;
  return <Shield className="h-6 w-6" />;
}

function getModuleColor(title: string) {
  const t = title.toLowerCase();
  if (t.includes('password')) return { bg: 'bg-purple-800', icon: 'text-purple-200', accent: 'border-purple-400 bg-purple-700 text-white' };
  if (t.includes('email'))    return { bg: 'bg-blue-800',   icon: 'text-blue-200',   accent: 'border-blue-400 bg-blue-700 text-white'   };
  if (t.includes('social') || t.includes('engineer'))
    return { bg: 'bg-orange-800', icon: 'text-orange-200', accent: 'border-orange-400 bg-orange-700 text-white' };
  if (t.includes('brows') || t.includes('web'))
    return { bg: 'bg-green-800', icon: 'text-green-200', accent: 'border-green-400 bg-green-700 text-white' };
  return { bg: 'bg-red-800', icon: 'text-red-200', accent: 'border-red-400 bg-red-700 text-white' };
}

function getStatusLabel(progress: number) {
  if (progress >= 100) return { label: 'Completed',   color: 'bg-green-700 text-white' };
  if (progress > 0)    return { label: 'In Progress', color: 'bg-yellow-700 text-white' };
  return                      { label: 'Not Started', color: 'bg-slate-700 text-slate-300' };
}

// ── Single module card ───────────────────────────────────────────────────────
function ModuleCard({
  m, index, completing, onMarkComplete,
}: {
  m: TrainingModuleRow;
  index: number;
  completing: number | null;
  onMarkComplete: (id: number) => void;
}) {
  const [open, setOpen]           = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

  const color      = getModuleColor(m.title);
  const status     = getStatusLabel(m.progress);
  const isCompleted  = m.progress >= 100;
  const isCompleting = completing === m.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className={`border-slate-700/50 bg-slate-900/50 transition-all duration-200
        ${open ? 'border-slate-500/60' : 'hover:border-slate-600/50'}`}>

        {/* ── Header row ── */}
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            {/* Icon + title */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`p-2 rounded-lg shrink-0 ${color.bg} ${color.icon}`}>
                {getModuleIcon(m.title)}
              </div>
              <div className="min-w-0">
                <CardTitle className="text-white text-base leading-snug">{m.title}</CardTitle>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge className={`text-xs px-2 py-0.5 ${status.color}`}>
                    {status.label}
                  </Badge>
                  <span className="text-slate-300 text-xs flex items-center gap-1">
                    <Clock className="h-3 w-3" /> ~15 min
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {isCompleted ? (
                <CheckCircle className="h-6 w-6 text-green-400" />
              ) : (
                <Button size="sm"
                  onClick={() => onMarkComplete(m.id)}
                  disabled={isCompleting}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8">
                  {isCompleting ? 'Saving…' : 'Mark Complete'}
                </Button>
              )}
            </div>
          </div>

          {/* Short description always visible */}
          {m.description && (
            <CardDescription className="text-gray-200 mt-2 ml-11 line-clamp-2">
              {m.description}
            </CardDescription>
          )}

          {/* Action buttons row */}
          <div className="ml-11 mt-3 flex flex-wrap gap-2">
            {/* Open / Read module button */}
            <button
              type="button"
              onClick={() => setOpen(prev => !prev)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all
                ${open
                  ? 'bg-indigo-700 hover:bg-indigo-800 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
            >
              {open
                ? <><ChevronUp className="h-3.5 w-3.5" /> Close Module</>
                : <><PlayCircle className="h-3.5 w-3.5" /> Read Module</>
              }
            </button>

            {/* File buttons — one View+Download pair per attachment */}
            {m.attachments && m.attachments.length > 0 && m.attachments.map(att => (
              <span key={att.id} className="inline-flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setViewerUrl(att.fileUrl)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-colors"
                  title={att.fileName}
                >
                  <Eye className="h-3.5 w-3.5" />
                  {att.fileName.length > 20 ? att.fileName.slice(0, 18) + '…' : att.fileName}
                </button>
                <a
                  href={att.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </a>
              </span>
            ))}
          </div>

          {m.attachments && m.attachments.length > 0 && (
            <div className="ml-11 mt-2 space-y-1">
              {m.attachments.map(att => (
                <div key={`meta-${att.id}`} className="flex items-center gap-2 text-xs text-slate-300">
                  <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{att.fileName}</span>
                  <span className="text-slate-400 shrink-0">
                    {att.uploadedAt ? `· ${formatUploadDate(att.uploadedAt)}` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardHeader>

        {/* ── Expandable content panel ── */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mx-6 mb-5 rounded-xl border border-slate-600 bg-slate-800 overflow-hidden">
                {/* Panel header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-600 bg-slate-700">
                  <BookOpenCheck className="h-4 w-4 text-indigo-400" />
                  <span className="text-sm font-semibold text-white">{m.title}</span>
                  <span className="ml-auto text-xs text-slate-300">Study Material</span>
                </div>

                {/* Module content */}
                <div className="px-5 py-5">
                  {m.description ? (
                    <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                      {m.description}
                    </p>
                  ) : (
                    <p className="text-slate-300 text-sm italic">No written content provided for this module.</p>
                  )}

                  {/* Attachments list inside panel */}
                  {m.attachments && m.attachments.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-slate-600">
                      <p className="text-slate-200 text-xs mb-3 font-semibold uppercase tracking-wide">
                        Attached Study Files ({m.attachments.length})
                      </p>
                      <div className="space-y-3">
                        {m.attachments.map(att => (
                          <div key={att.id} className="rounded-lg border border-slate-600 bg-slate-900 p-3">
                            <div className="flex items-center gap-2 mb-2 min-w-0">
                              <FileText className="h-4 w-4 text-slate-300 shrink-0" />
                              <span className="text-white text-xs font-semibold flex-1 truncate">{att.fileName}</span>
                              <span className="text-slate-400 text-xs shrink-0 ml-2">
                                {att.uploadedAt ? formatUploadDate(att.uploadedAt) : ''}
                                {att.fileSize ? ` · ${formatFileSize(att.fileSize)}` : ''}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => setViewerUrl(att.fileUrl)}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors"
                              >
                                <Eye className="h-4 w-4" />
                                View on Screen
                              </button>
                              <a
                                href={att.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
                              >
                                <Download className="h-4 w-4" />
                                Download File
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Mark complete from inside panel */}
                {!isCompleted && (
                  <div className="px-5 pb-5">
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 h-11 text-sm"
                      onClick={() => { onMarkComplete(m.id); setOpen(false); }}
                      disabled={isCompleting}
                    >
                      <CheckCircle className="h-4 w-4" />
                      {isCompleting ? 'Saving…' : "I've Read This — Mark as Complete"}
                    </Button>
                  </div>
                )}
                {isCompleted && (
                  <div className="px-5 pb-4 flex items-center gap-2 text-green-400 text-sm font-semibold">
                    <CheckCircle className="h-4 w-4" /> Module completed
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Progress bar ── */}
        <CardContent className="space-y-1 pt-0 pb-4">
          <div className="flex justify-between text-xs text-slate-300 ml-11">
            <span>Progress</span>
            <span className="text-white font-semibold">{m.progress}%</span>
          </div>
          <div className="ml-11">
            <Progress value={m.progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* ── File Viewer Modal ── */}
      <AnimatePresence>
        {viewerUrl && (
          <FileViewerModal
            url={viewerUrl}
            title={m.title}
            onClose={() => setViewerUrl(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function TrainingModules() {
  const [modules, setModules]   = useState<TrainingModuleRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [completing, setCompleting] = useState<number | null>(null);

  useEffect(() => { void loadModules(); }, []);

  async function loadModules() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(TRAINING_API_URL, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data: unknown = await res.json();
      const list = Array.isArray(data) ? data : [];
      const normalized: TrainingModuleRow[] = list.map((raw: unknown) => {
        const r = raw as Record<string, unknown>;
        const rawAtts = getRawAttachments(r);
        return {
          id: Number(r.id),
          title: String(r.title ?? ''),
          description: r.description != null ? String(r.description) : null,
          progress: Math.min(100, Math.max(0, Number(r.progress) || 0)),
          fileUrl: r.fileUrl != null ? String(r.fileUrl) : null,
          attachments: rawAtts.map((a: unknown, index: number) => {
            const att = a as Record<string, unknown>;
            return {
              id: Number(att.id ?? index),
              fileName: String(att.fileName ?? att.filename ?? att.name ?? ''),
              fileUrl: String(att.fileUrl ?? att.url ?? ''),
              fileSize: att.fileSize != null ? Number(att.fileSize) : (att.size != null ? Number(att.size) : null),
              uploadedAt: att.uploadedAt != null
                ? String(att.uploadedAt)
                : (att.createdAt != null ? String(att.createdAt) : (att.uploaded_at != null ? String(att.uploaded_at) : null)),
            };
          }),
        };
      });
      setModules(normalized);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load training modules');
      setModules([]);
    } finally {
      setLoading(false);
    }
  }

  async function markComplete(moduleId: number) {
    setCompleting(moduleId);
    try {
      const res = await fetch(`${TRAINING_API_URL}/${moduleId}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: 100 }),
      });
      if (!res.ok) throw new Error('Failed to update');
      setModules(prev => prev.map(m => m.id === moduleId ? { ...m, progress: 100 } : m));
    } catch {
      // silent fail
    } finally {
      setCompleting(null);
    }
  }

  const completedCount  = modules.filter(m => m.progress >= 100).length;
  const overallProgress = modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <BookOpen className="h-8 w-8 text-blue-500" /> Training Modules
        </h1>
        {[1, 2, 3].map(i => (
          <Card key={i} className="border-slate-700/50 bg-slate-900/50">
            <CardHeader>
              <Skeleton className="h-6 w-48 bg-slate-800 rounded" />
              <Skeleton className="h-4 w-full max-w-md bg-slate-800 rounded mt-2" />
            </CardHeader>
            <CardContent><Skeleton className="h-3 w-full bg-slate-800 rounded-full" /></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <BookOpen className="h-8 w-8 text-blue-500" /> Training Modules
        </h1>
        <Card className="border-red-800/50 bg-red-900/10">
          <CardHeader>
            <CardTitle className="text-red-400">Failed to load modules</CardTitle>
            <CardDescription className="text-red-300">{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <BookOpen className="h-8 w-8 text-blue-500" /> Training Modules
        </h1>
        <Card className="border-slate-700/50 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-white">No modules yet</CardTitle>
            <CardDescription className="text-slate-400">
              The professor has not added any training modules yet.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <BookOpen className="h-8 w-8 text-blue-500" /> Training Modules
        </h1>
        <Badge className="bg-slate-700 text-slate-300 px-3 py-1 text-sm">
          {completedCount} / {modules.length} completed
        </Badge>
      </div>

      {/* How-to hint */}
      <div className="rounded-xl border border-indigo-400 bg-indigo-800 px-4 py-3 flex items-center gap-3">
        <PlayCircle className="h-5 w-5 text-indigo-200 shrink-0" />
        <p className="text-white text-sm">
          Click <strong className="text-yellow-300">Read Module</strong> on any lesson to open and read the full content.
          Once done, click <strong className="text-blue-200">Mark as Complete</strong> to track your progress.
        </p>
      </div>

      {/* Overall progress */}
      <Card className="border-slate-700/50 bg-slate-900/50">
        <CardContent className="pt-4 pb-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-200 font-medium">Overall Progress</span>
            <span className="text-white font-bold">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-3" />
        </CardContent>
      </Card>

      {/* Module cards */}
      <div className="space-y-4">
        {modules.map((m, index) => (
          <ModuleCard
            key={m.id}
            m={m}
            index={index}
            completing={completing}
            onMarkComplete={markComplete}
          />
        ))}
      </div>
    </motion.div>
  );
}
