import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { AlertTriangle, CheckCircle2, XCircle, Mail, ChevronDown, ChevronUp, Target } from 'lucide-react';
import { getSimulations, SIMULATIONS_URL, type SimulationRow } from '@/lib/api';
import { toast } from 'sonner';

// Simulated email content for each scenario (matched by title keywords)
type SimulatedEmail = {
  from: string;
  subject: string;
  body: string;
  isPhishing: boolean;
  explanation: string;
};

function getSimulatedEmail(sim: SimulationRow): SimulatedEmail {
  const t = sim.title.toLowerCase();

  if (t.includes('ceo') || t.includes('fraud') || t.includes('wire')) {
    return {
      from: 'ceo-office@c0mpany-secure.net',
      subject: 'URGENT: Wire Transfer Required Today',
      body: `Hi,

I need you to process an urgent wire transfer of $48,500 to a new vendor. This is time-sensitive and must be completed before 3 PM today.

Do not discuss this with anyone else — I am currently in a confidential meeting and cannot be reached by phone.

Please confirm once done.

Best,
Robert Chen
CEO`,
      isPhishing: true,
      explanation: 'This is a CEO Fraud / Business Email Compromise (BEC) attack. Red flags: urgent wire transfer request, secrecy ("do not discuss"), CEO unavailable by phone, sender domain is "c0mpany-secure.net" (note the zero instead of "o").',
    };
  }

  if (t.includes('it support') || t.includes('credential') || t.includes('reset')) {
    return {
      from: 'it-support@company-helpdesk.info',
      subject: 'Action Required: Reset Your Password Now',
      body: `Dear Employee,

Our system has detected unusual activity on your account. For your security, you must reset your password immediately.

Click the link below to verify your identity:
http://company-helpdesk.info/reset?token=a7f3k2

⚠️ Failure to reset within 24 hours will result in your account being locked.

IT Support Team`,
      isPhishing: true,
      explanation: 'This is a credential harvesting attack. Red flags: urgency + threat (account locked), HTTP link (not HTTPS), the domain "company-helpdesk.info" is not your company\'s real domain, and IT departments never ask for passwords via email.',
    };
  }

  if (t.includes('invoice') || t.includes('attachment') || t.includes('malware')) {
    return {
      from: 'billing@invoices-secure-portal.com',
      subject: 'Invoice #INV-2024-8821 — Payment Due',
      body: `Dear Customer,

Please find attached your invoice for services rendered this month. Payment is due within 5 business days.

📎 Invoice_INV-2024-8821.docm

If you have any questions, reply to this email.

Kind regards,
Accounts Receivable Team`,
      isPhishing: true,
      explanation: 'This is a malware delivery attack via a malicious attachment. Red flags: unexpected invoice from an unknown billing address, ".docm" file extension (Word macro document — can execute malicious code), sender domain does not match any known vendor.',
    };
  }

  if (t.includes('prize') || t.includes('winner') || t.includes('lottery') || t.includes('social')) {
    return {
      from: 'awards@global-winners-notification.com',
      subject: '🎉 Congratulations! You\'ve Been Selected as a Winner',
      body: `Dear Lucky Winner,

You have been randomly selected to receive a $500 Amazon Gift Card as part of our annual customer appreciation program!

To claim your prize, you must:
1. Confirm your identity
2. Pay a small processing fee of $9.99
3. Provide your shipping address

Click here to claim: http://claim-your-prize-now.xyz/win

This offer expires in 48 HOURS!

Global Rewards Team`,
      isPhishing: true,
      explanation: 'This is a prize/lottery scam (social engineering). Red flags: unsolicited prize notification, requires a "processing fee" (you never pay to receive a prize), suspicious domain ending in ".xyz", extreme urgency ("48 HOURS"), and generic greeting.',
    };
  }

  if (t.includes('usb') || t.includes('physical') || t.includes('device')) {
    return {
      from: 'security-alert@office-systems.net',
      subject: 'Security Alert: Unknown USB Device Detected',
      body: `Hello,

Our monitoring system has detected an unknown USB device connected to a workstation in your building.

To investigate this incident, please plug in the provided security audit tool (USB drive left at the reception desk) and run the diagnostic program.

This is mandatory per company security policy — Section 4.2.

IT Security Operations`,
      isPhishing: true,
      explanation: 'This is a USB baiting attack. Red flags: the email asks you to plug in an unknown USB device — this is a classic attack vector where the device installs malware. Legitimate IT security teams never ask you to plug in unverified devices.',
    };
  }

  // Default fallback
  return {
    from: `no-reply@${sim.type?.toLowerCase() ?? 'phishing'}-simulation.test`,
    subject: `Security Test: ${sim.title}`,
    body: `${sim.description ?? 'A simulated phishing scenario for security awareness training.'}\n\nThis is a simulated attack of type: ${sim.type ?? 'UNKNOWN'}.`,
    isPhishing: true,
    explanation: `This scenario (${sim.type}) represents a real-world phishing attack pattern. Always verify the sender, check links before clicking, and report suspicious emails.`,
  };
}

type ChallengeState = 'idle' | 'active' | 'correct' | 'wrong';

function SimulationCard({ sim }: { sim: SimulationRow }) {
  const [state, setState] = useState<ChallengeState>('idle');
  const [expanded, setExpanded] = useState(false);
  const email = getSimulatedEmail(sim);

  const typeColor: Record<string, string> = {
    SPEAR_PHISHING:     'text-red-300 bg-red-500/10 border-red-500/30',
    PHISHING:           'text-orange-300 bg-orange-500/10 border-orange-500/30',
    MALWARE:            'text-purple-300 bg-purple-500/10 border-purple-500/30',
    SOCIAL_ENGINEERING: 'text-yellow-300 bg-yellow-500/10 border-yellow-500/30',
    DEFAULT:            'text-blue-300 bg-blue-500/10 border-blue-500/30',
  };

  const tc = sim.type ? (typeColor[sim.type] ?? typeColor.DEFAULT) : typeColor.DEFAULT;

  function handleAnswer(isPhishingGuess: boolean) {
    if (isPhishingGuess === email.isPhishing) {
      setState('correct');
      toast.success('Correct! Great awareness!');
    } else {
      setState('wrong');
      toast.error('Incorrect — read the explanation below.');
    }
  }

  return (
    <Card className="border-slate-800 bg-slate-900/50 text-white overflow-hidden">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-red-400 shrink-0" />
              {sim.title}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {sim.type && (
              <span className={`text-xs font-medium uppercase tracking-wide rounded-full px-2 py-0.5 border ${tc}`}>
                {sim.type.replace('_', ' ')}
              </span>
            )}
            <Badge variant="outline" className="text-xs border-green-500/40 text-green-400 bg-green-500/10">
              {sim.status ?? 'ACTIVE'}
            </Badge>
          </div>
        </div>
        {sim.description ? (
          <CardDescription className="text-slate-300 text-sm">{sim.description}</CardDescription>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Start challenge button */}
        {state === 'idle' && (
          <Button
            onClick={() => { setState('active'); setExpanded(true); }}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            <Mail className="h-4 w-4 mr-2" /> Try This Simulation
          </Button>
        )}

        {/* Simulated email display */}
        <AnimatePresence>
          {(state === 'active' || state === 'correct' || state === 'wrong') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              {/* Email preview */}
              <div className="rounded-lg border border-slate-700 bg-slate-950 overflow-hidden">
                <div className="border-b border-slate-700 bg-slate-900/80 px-4 py-3 space-y-1">
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-slate-400 w-16 shrink-0">From:</span>
                    <span className="text-red-300 font-mono text-xs break-all">{email.from}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-slate-400 w-16 shrink-0">Subject:</span>
                    <span className="text-white font-medium">{email.subject}</span>
                  </div>
                </div>
                <div className="px-4 py-4">
                  <pre className="text-slate-300 text-sm whitespace-pre-wrap font-sans leading-relaxed">{email.body}</pre>
                </div>
              </div>

              {/* Challenge buttons */}
              {state === 'active' && (
                <div className="space-y-2">
                  <p className="text-slate-200 text-sm text-center font-medium">Is this email phishing or legitimate?</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => handleAnswer(true)}
                      className="bg-red-600 hover:bg-red-700 font-semibold"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" /> Phishing!
                    </Button>
                    <Button
                      onClick={() => handleAnswer(false)}
                      className="bg-green-600 hover:bg-green-700 font-semibold"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" /> Looks Legit
                    </Button>
                  </div>
                </div>
              )}

              {/* Result */}
              {(state === 'correct' || state === 'wrong') && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-lg border p-4 space-y-3 ${state === 'correct' ? 'border-green-500/40 bg-green-900/10' : 'border-red-500/40 bg-red-900/10'}`}
                >
                  <div className="flex items-center gap-2">
                    {state === 'correct'
                      ? <CheckCircle2 className="h-5 w-5 text-green-400" />
                      : <XCircle className="h-5 w-5 text-red-400" />}
                    <span className={`font-bold ${state === 'correct' ? 'text-green-400' : 'text-red-400'}`}>
                      {state === 'correct' ? 'Correct! This is a phishing email.' : 'Incorrect — this was a phishing email!'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-300 font-semibold uppercase tracking-wide mb-1">Why it\'s phishing:</p>
                    <p className="text-sm text-slate-300 leading-relaxed">{email.explanation}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-slate-300"
                    onClick={() => setState('idle')}
                  >
                    Try Again
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-300 transition-colors"
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {expanded ? 'Hide details' : 'Show details'}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-xs text-slate-400 space-y-1 border-t border-slate-800 pt-3"
            >
              <p><span className="text-slate-300">Type:</span> {sim.type ?? '—'}</p>
              <p><span className="text-slate-300">Status:</span> {sim.status ?? '—'}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

function formatCreatedAt(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

export function PhishingSimulation() {
  const [items, setItems] = useState<SimulationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const list = await getSimulations();
        if (!cancelled) setItems(list);
      } catch (e) {
        if (!cancelled) {
          setItems([]);
          setError(e instanceof Error ? e.message : 'Failed to load simulations');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Target className="h-8 w-8 text-red-400" />
          Phishing Simulation
        </h1>
        <p className="text-slate-200 mt-1">
          Test your skills — can you spot the phishing email? Click "Try This Simulation" on each scenario.
        </p>
      </div>

      {error ? (
        <Card className="border-red-900/50 bg-red-900/10 p-6">
          <p className="text-sm text-red-400">{error}</p>
        </Card>
      ) : null}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <Skeleton className="h-6 w-56 rounded-md bg-slate-800" />
                <Skeleton className="h-4 w-full max-w-lg rounded-md bg-slate-800 mt-2" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full rounded-md bg-slate-800" />
                <Skeleton className="h-4 w-3/4 rounded-md bg-slate-800" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <Card className="border-slate-800 bg-slate-900/50 p-6 text-white">
          <p className="text-sm text-slate-300">No simulations available yet.</p>
          <p className="text-xs text-slate-400 mt-2">GET {SIMULATIONS_URL} returned an empty list.</p>
        </Card>
      ) : null}

      {!loading && items.length > 0 ? (
        <div className="space-y-4">
          {items.map((sim) => (
            <SimulationCard key={sim.id} sim={sim} />
          ))}
        </div>
      ) : null}
    </motion.div>
  );
}
