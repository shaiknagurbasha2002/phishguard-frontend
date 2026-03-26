import { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import {
  ScanSearch,
  Upload,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Download,
  History,
  Brain,
  Link as LinkIcon,
  Mail,
  Shield,
  Loader2,
  FileText,
  Eye,
  Flag,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Skeleton } from '../ui/skeleton';
import { toast } from 'sonner';
import { useCurrentUser } from '@/context/UsersContext';
import {
  createEmailScan,
  EMAIL_SCANS_URL,
  getAllEmailScans,
  getEmailScansForUser,
  type EmailScanRow,
} from '@/lib/api';

type ScanResult = {
  riskScore: number;
  status: 'safe' | 'suspicious' | 'dangerous';
  findings: Array<{
    type: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
  }>;
  aiSummary: string;
  suspiciousElements: string[];
  scanDate: string;
};

function mapFindingType(t: string): 'critical' | 'warning' | 'info' {
  const x = t.toLowerCase();
  if (x === 'critical') return 'critical';
  if (x === 'warning') return 'warning';
  return 'info';
}

function parseFindings(json: string | null): ScanResult['findings'] {
  if (!json || !json.trim()) return [];
  try {
    const arr = JSON.parse(json) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.map((item) => {
      const o = item as Record<string, unknown>;
      return {
        type: mapFindingType(String(o.type ?? 'info')),
        title: String(o.title ?? ''),
        description: String(o.description ?? ''),
      };
    });
  } catch {
    return [];
  }
}

function parseSuspicious(json: string | null): string[] {
  if (!json || !json.trim()) return [];
  try {
    const arr = JSON.parse(json) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.map((x) => String(x));
  } catch {
    return [];
  }
}

function formatScannedAt(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

function rowToScanResult(row: EmailScanRow): ScanResult {
  const st = (row.status || 'safe').toLowerCase();
  const status: ScanResult['status'] =
    st === 'dangerous' || st === 'suspicious' || st === 'safe' ? st : 'safe';
  return {
    riskScore: row.riskScore,
    status,
    findings: parseFindings(row.findingsJson),
    aiSummary: row.aiSummary ?? 'No summary available.',
    suspiciousElements: parseSuspicious(row.suspiciousElementsJson),
    scanDate: formatScannedAt(row.scannedAt),
  };
}

export function EmailScanner() {
  const { currentUser, isAdmin, loading: userLoading } = useCurrentUser();

  const [activeTab, setActiveTab] = useState<'email' | 'url'>('email');
  const [sender, setSender] = useState('');
  const [subject, setSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [urlContent, setUrlContent] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [scans, setScans] = useState<EmailScanRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadScans = useCallback(async () => {
    if (currentUser == null) {
      setScans([]);
      setListLoading(false);
      setListError(null);
      return;
    }
    setListLoading(true);
    setListError(null);
    try {
      const list = isAdmin
        ? await getAllEmailScans()
        : await getEmailScansForUser(currentUser.id);
      setScans(list);
    } catch (e) {
      setScans([]);
      setListError(e instanceof Error ? e.message : 'Failed to load scans');
    } finally {
      setListLoading(false);
    }
  }, [currentUser, isAdmin]);

  useEffect(() => {
    if (userLoading) return;
    void loadScans();
  }, [userLoading, loadScans]);

  const handleScan = async () => {
    setSubmitError(null);
    if (currentUser == null) {
      setSubmitError('No current user selected.');
      toast.error('Select a current user to run a scan.');
      return;
    }
    const content =
      activeTab === 'email' ? emailContent.trim() : urlContent.trim();
    if (!content) {
      setSubmitError('Paste email content or a URL to scan.');
      return;
    }

    setIsScanning(true);
    setScanResult(null);
    try {
      const row = await createEmailScan({
        userId: currentUser.id,
        sender: activeTab === 'email' ? sender.trim() : '',
        subject:
          activeTab === 'email'
            ? subject.trim()
            : subject.trim() || '(URL scan)',
        content,
        scanType: activeTab === 'url' ? 'URL' : 'EMAIL',
      });
      toast.success('Scan completed');
      setSender('');
      setSubject('');
      setEmailContent('');
      setUrlContent('');
      setScanResult(rowToScanResult(row));
      await loadScans();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Scan failed';
      setSubmitError(msg);
      toast.error(msg);
    } finally {
      setIsScanning(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return { bg: 'bg-red-500', text: 'text-red-500', glow: 'glow-red' };
    if (score >= 40) return { bg: 'bg-yellow-500', text: 'text-yellow-500', glow: 'glow-yellow' };
    return { bg: 'bg-green-500', text: 'text-green-500', glow: 'glow-green' };
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'safe':
        return {
          icon: CheckCircle2,
          color: 'text-green-500',
          bg: 'bg-green-900/20',
          border: 'border-green-500/50',
          label: 'Safe',
        };
      case 'suspicious':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-500',
          bg: 'bg-yellow-900/20',
          border: 'border-yellow-500/50',
          label: 'Suspicious',
        };
      case 'dangerous':
        return {
          icon: XCircle,
          color: 'text-red-500',
          bg: 'bg-red-900/20',
          border: 'border-red-500/50',
          label: 'Dangerous',
        };
      default:
        return {
          icon: Shield,
          color: 'text-slate-500',
          bg: 'bg-slate-800',
          border: 'border-slate-700',
          label: 'Unknown',
        };
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      void files[0].text().then((text) => setEmailContent(text));
    }
  };

  const canSubmit =
    !isScanning &&
    (activeTab === 'email' ? emailContent.trim().length > 0 : urlContent.trim().length > 0);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
          <ScanSearch className="h-8 w-8 text-blue-400" />
          Email & URL Scanner
        </h1>
        <p className="text-slate-200 text-lg">AI-powered threat detection and analysis</p>
      </motion.div>

      {userLoading ? (
        <Card className="border-slate-700/50 glass">
          <CardContent className="pt-6">
            <Skeleton className="h-24 w-full rounded-xl bg-slate-800" />
          </CardContent>
        </Card>
      ) : currentUser == null ? (
        <Card className="border-slate-700/50 glass">
          <CardContent className="pt-6 text-slate-300">
            Select a current user to submit scans and load history from the API.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-slate-700/50 glass">
                <CardHeader>
                  <CardTitle className="text-white text-xl">Scan Content</CardTitle>
                  <CardDescription className="text-slate-300">
                    Paste email content, URL, or upload a file for analysis · User {currentUser.id} · POST{' '}
                    {EMAIL_SCANS_URL}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'email' | 'url')}>
                    <TabsList className="grid w-full grid-cols-2 bg-slate-800">
                      <TabsTrigger value="email" className="data-[state=active]:bg-blue-600">
                        <Mail className="h-4 w-4 mr-2" />
                        Email Content
                      </TabsTrigger>
                      <TabsTrigger value="url" className="data-[state=active]:bg-blue-600">
                        <LinkIcon className="h-4 w-4 mr-2" />
                        URL/Link
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="email" className="space-y-4">
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                          isDragging
                            ? 'border-blue-500 bg-blue-900/20'
                            : 'border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-white font-semibold mb-1">
                          Drag & drop email file here
                        </p>
                        <p className="text-sm text-slate-400 mb-4">
                          or click to browse (.eml, .msg files)
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          className="border-slate-700"
                          onClick={() => document.getElementById('email-file-input')?.click()}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Choose File
                        </Button>
                        <input
                          id="email-file-input"
                          type="file"
                          className="hidden"
                          accept=".eml,.msg,.txt,text/*"
                          onChange={(ev) => {
                            const f = ev.target.files?.[0];
                            if (f) void f.text().then((text) => setEmailContent(text));
                            ev.target.value = '';
                          }}
                        />
                      </div>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-slate-700" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-slate-900 px-2 text-slate-300">Or paste content</span>
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="scan-sender" className="text-slate-300">
                            Sender
                          </Label>
                          <Input
                            id="scan-sender"
                            value={sender}
                            onChange={(e) => setSender(e.target.value)}
                            placeholder="From / sender address"
                            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="scan-subject" className="text-slate-300">
                            Subject
                          </Label>
                          <Input
                            id="scan-subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Email subject"
                            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                          />
                        </div>
                      </div>

                      <Textarea
                        placeholder="Paste email content, headers, or full message here..."
                        value={emailContent}
                        onChange={(e) => setEmailContent(e.target.value)}
                        className="min-h-[200px] bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 font-mono text-sm"
                      />
                    </TabsContent>

                    <TabsContent value="url" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="url-subject" className="text-slate-300">
                          Subject (optional)
                        </Label>
                        <Input
                          id="url-subject"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="Label for this URL scan"
                          className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                        />
                      </div>
                      <Textarea
                        placeholder="Paste suspicious URL or link here..."
                        value={urlContent}
                        onChange={(e) => setUrlContent(e.target.value)}
                        className="min-h-[200px] bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                      />
                    </TabsContent>
                  </Tabs>

                  {submitError ? (
                    <p className="text-sm text-red-400 mt-2">{submitError}</p>
                  ) : null}

                  <Button
                    type="button"
                    onClick={() => void handleScan()}
                    disabled={!canSubmit}
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <ScanSearch className="h-4 w-4 mr-2" />
                        Scan for Threats
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {scanResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card className={`border-slate-700/50 glass ${getRiskColor(scanResult.riskScore).glow}`}>
                  <CardContent className="p-8">
                    <div className="text-center mb-6">
                      <h3 className="text-xl text-slate-200 mb-4">Risk Score</h3>
                      <div className="relative inline-block">
                        <div className="relative w-48 h-48 mx-auto">
                          <svg className="transform -rotate-90 w-48 h-48">
                            <circle
                              cx="96"
                              cy="96"
                              r="88"
                              stroke="currentColor"
                              strokeWidth="12"
                              fill="none"
                              className="text-slate-800"
                            />
                            <circle
                              cx="96"
                              cy="96"
                              r="88"
                              stroke="currentColor"
                              strokeWidth="12"
                              fill="none"
                              strokeDasharray={`${(scanResult.riskScore / 100) * 553} 553`}
                              className={getRiskColor(scanResult.riskScore).text}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <div className={`text-5xl font-bold ${getRiskColor(scanResult.riskScore).text}`}>
                                {scanResult.riskScore}
                              </div>
                              <div className="text-sm text-slate-300">out of 100</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 ${
                          getStatusInfo(scanResult.status).bg
                        } ${getStatusInfo(scanResult.status).border}`}
                      >
                        {(() => {
                          const StatusIcon = getStatusInfo(scanResult.status).icon;
                          return (
                            <StatusIcon className={`h-6 w-6 ${getStatusInfo(scanResult.status).color}`} />
                          );
                        })()}
                        <span className={`text-xl font-bold ${getStatusInfo(scanResult.status).color}`}>
                          {getStatusInfo(scanResult.status).label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-3">{scanResult.scanDate}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-purple-500/50 glass glow-blue">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-400" />
                      AI Analysis Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-300 leading-relaxed">{scanResult.aiSummary}</p>
                  </CardContent>
                </Card>

                <Card className="border-slate-700/50 glass">
                  <CardHeader>
                    <CardTitle className="text-white">Detailed Findings</CardTitle>
                    <CardDescription className="text-slate-300">
                      {scanResult.findings.length} issues detected
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {scanResult.findings.map((finding, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${
                          finding.type === 'critical'
                            ? 'bg-red-900/10 border-red-500/30'
                            : finding.type === 'warning'
                              ? 'bg-yellow-900/10 border-yellow-500/30'
                              : 'bg-blue-900/10 border-blue-500/30'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2 rounded-lg ${
                              finding.type === 'critical'
                                ? 'bg-red-500/20'
                                : finding.type === 'warning'
                                  ? 'bg-yellow-500/20'
                                  : 'bg-blue-500/20'
                            }`}
                          >
                            {finding.type === 'critical' ? (
                              <XCircle className="h-5 w-5 text-red-500" />
                            ) : finding.type === 'warning' ? (
                              <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            ) : (
                              <Eye className="h-5 w-5 text-blue-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-white font-semibold mb-1">{finding.title}</h4>
                            <p className="text-sm text-slate-300">{finding.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-slate-700/50 glass">
                  <CardHeader>
                    <CardTitle className="text-white">Highlighted Suspicious Elements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {scanResult.suspiciousElements.map((element, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="bg-red-900/20 text-red-400 border-red-500/30 px-3 py-1"
                        >
                          {element}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex flex-wrap gap-4">
                  <Button type="button" className="bg-blue-600 hover:bg-blue-700">
                    <Download className="h-4 w-4 mr-2" />
                    Download Report
                  </Button>
                  <Button type="button" variant="outline" className="border-slate-700">
                    <Flag className="h-4 w-4 mr-2" />
                    Report as Phishing
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-700"
                    onClick={() => {
                      setScanResult(null);
                      setSender('');
                      setSubject('');
                      setEmailContent('');
                      setUrlContent('');
                    }}
                  >
                    New Scan
                  </Button>
                </div>
              </motion.div>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-slate-700/50 glass sticky top-6">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <History className="h-5 w-5 text-slate-400" />
                  Scan History
                </CardTitle>
                <CardDescription className="text-slate-300">
                  {isAdmin
                    ? `All scans · GET ${EMAIL_SCANS_URL}`
                    : `Your scans · GET ${EMAIL_SCANS_URL}/user/${currentUser.id}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {listError ? (
                  <p className="text-sm text-red-400">{listError}</p>
                ) : null}
                {listLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-24 w-full rounded-lg bg-slate-800" />
                    <Skeleton className="h-24 w-full rounded-lg bg-slate-800" />
                  </div>
                ) : scans.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    No saved scans yet. Run a scan to persist results to the backend.
                  </p>
                ) : (
                  scans.map((item) => {
                    const statusInfo = getStatusInfo(item.status.toLowerCase());
                    const StatusIcon = statusInfo.icon;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        className="w-full p-4 rounded-lg border border-slate-700 hover:border-slate-600 hover:bg-slate-800/50 transition-all text-left"
                        onClick={() => setScanResult(rowToScanResult(item))}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${statusInfo.bg}`}>
                            <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <p className="text-xs text-slate-400">
                              <span className="text-slate-400">Sender: </span>
                              <span className="text-slate-300">{item.sender?.trim() || '—'}</span>
                            </p>
                            <p className="text-sm text-white font-medium truncate">
                              {item.subject?.trim() || '(no subject)'}
                            </p>
                            <p className="text-xs text-slate-400 line-clamp-2">
                              {item.content?.trim() || '—'}
                            </p>
                            <div className="flex flex-wrap gap-2 pt-1 text-xs text-slate-400">
                              <span>
                                Risk:{' '}
                                <span className="text-slate-300 capitalize">{item.riskLevel}</span>
                              </span>
                              <span>·</span>
                              <span>
                                Status:{' '}
                                <span className="text-slate-300 capitalize">{item.status}</span>
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 pt-0.5">
                              Scanned: {formatScannedAt(item.scannedAt)}
                            </p>
                            <div className="flex items-center justify-end pt-1">
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  item.riskScore >= 70
                                    ? 'bg-red-900/20 text-red-400 border-red-500/30'
                                    : item.riskScore >= 40
                                      ? 'bg-yellow-900/20 text-yellow-400 border-yellow-500/30'
                                      : 'bg-green-900/20 text-green-400 border-green-500/30'
                                }`}
                              >
                                {item.riskScore}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}
