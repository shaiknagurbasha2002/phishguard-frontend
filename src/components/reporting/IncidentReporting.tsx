import { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Skeleton } from '../ui/skeleton';
import { useCurrentUser } from '@/context/UsersContext';
import {
  createIncident,
  getAllIncidents,
  getIncidentsForUser,
  type IncidentRow,
} from '@/lib/api';
import { toast } from 'sonner';

const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

function formatReportedAt(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

export function IncidentReporting() {
  const { currentUser, isAdmin, loading: userLoading } = useCurrentUser();

  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<string>('MEDIUM');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadIncidents = useCallback(async () => {
    if (currentUser == null) {
      setIncidents([]);
      setListLoading(false);
      setListError(null);
      return;
    }
    setListLoading(true);
    setListError(null);
    try {
      const list = isAdmin
        ? await getAllIncidents()
        : await getIncidentsForUser(currentUser.id);
      setIncidents(list);
    } catch {
      setIncidents([]);
      setListError('Could not load incidents. Please try again.');
    } finally {
      setListLoading(false);
    }
  }, [currentUser, isAdmin]);

  useEffect(() => {
    if (userLoading) return;
    void loadIncidents();
  }, [userLoading, loadIncidents]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (currentUser == null) {
      setSubmitError('No current user selected.');
      return;
    }
    const t = title.trim();
    if (!t) {
      setSubmitError('Title is required.');
      return;
    }
    setSubmitting(true);
    try {
      await createIncident({
        userId: currentUser.id,
        title: t,
        description: description.trim(),
        severity: severity || 'MEDIUM',
      });
      toast.success('Incident reported');
      setTitle('');
      setDescription('');
      setSeverity('MEDIUM');
      await loadIncidents();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Submit failed';
      setSubmitError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h1 className="text-3xl font-bold text-white flex items-center gap-2">
        <AlertTriangle className="h-8 w-8 text-amber-500" aria-hidden="true" />
        Incident Reporting
      </h1>

      {userLoading ? (
        <Card className="border-slate-800 bg-slate-900/50 p-6">
          <Skeleton className="h-32 w-full rounded-xl bg-slate-800" />
        </Card>
      ) : currentUser == null ? (
        <Card className="border-slate-700/50 glass">
          <CardContent className="pt-6 text-slate-400">
            Select a current user (sign in / choose profile) to report an incident and load your list.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-slate-700/50 glass">
            <CardHeader>
              <CardTitle className="text-white">Report an incident</CardTitle>
              <CardDescription className="text-slate-400">
                Your report is submitted under your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
                <div className="space-y-2">
                  <Label htmlFor="incident-title" className="text-slate-300">
                    Title
                  </Label>
                  <Input
                    id="incident-title"
                    value={title}
                    onChange={(ev) => setTitle(ev.target.value)}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="Short summary"
                    disabled={submitting}
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="incident-desc" className="text-slate-300">
                    Description
                  </Label>
                  <Textarea
                    id="incident-desc"
                    value={description}
                    onChange={(ev) => setDescription(ev.target.value)}
                    className="bg-slate-800 border-slate-700 text-white min-h-[120px]"
                    placeholder="What happened?"
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="incident-severity" className="text-slate-300">
                    Severity
                  </Label>
                  <select
                    id="incident-severity"
                    value={severity}
                    onChange={(ev) => setSeverity(ev.target.value)}
                    disabled={submitting}
                    className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                  >
                    {SEVERITIES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                {submitError ? <p className="text-red-400 text-sm">{submitError}</p> : null}
                <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
                  {submitting ? 'Submitting…' : 'Submit report'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-slate-700/50 glass">
            <CardHeader>
              <CardTitle className="text-white">Your incidents</CardTitle>
              <CardDescription className="text-slate-400">
                {isAdmin ? 'All incidents reported across the organization.' : 'Incidents you have reported.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {listError ? <p className="text-red-400 text-sm mb-4">{listError}</p> : null}
              {listLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full rounded-lg bg-slate-800" />
                  <Skeleton className="h-20 w-full rounded-lg bg-slate-800" />
                </div>
              ) : incidents.length === 0 ? (
                <p className="text-sm text-slate-500">No incidents yet.</p>
              ) : (
                <ul className="space-y-4">
                  {incidents.map((inc) => (
                    <li
                      key={inc.id}
                      className="rounded-lg border border-slate-700/60 bg-slate-900/30 p-4 space-y-2"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="text-white font-semibold">{inc.title}</h3>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300">
                            {inc.severity}
                          </span>
                          <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300">
                            {inc.status}
                          </span>
                        </div>
                      </div>
                      {inc.description ? (
                        <p className="text-sm text-slate-400 whitespace-pre-wrap">{inc.description}</p>
                      ) : (
                        <p className="text-sm text-slate-600">No description</p>
                      )}
                      <p className="text-xs text-slate-500">
                        Reported {formatReportedAt(inc.reportedAt)}
                        {isAdmin ? ` · User ${inc.userId}` : null}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </motion.div>
  );
}
