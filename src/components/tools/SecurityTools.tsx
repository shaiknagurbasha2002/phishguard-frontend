import { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import {
  Wrench,
  Link as LinkIcon,
  Mail,
  Key,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  ExternalLink,
  Search,
  Loader2,
  Unlink,
} from 'lucide-react';
import { toast } from 'sonner';

// ── URL Safety Checker ────────────────────────────────────────
function UrlChecker() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<null | { safe: boolean; reasons: string[] }>(null);

  function check() {
    if (!url.trim()) return;
    const u = url.trim().toLowerCase();
    const reasons: string[] = [];

    if (!u.startsWith('https://')) reasons.push('Does not use HTTPS — connection may be unencrypted');
    if (/\d{1,3}(\.\d{1,3}){3}/.test(u)) reasons.push('URL uses an IP address instead of a domain name');
    if ((u.match(/-/g) || []).length > 3) reasons.push('Excessive hyphens in domain — common in phishing URLs');
    if (/login|signin|verify|update|secure|account|banking|paypal|amazon|google|microsoft/.test(u) && !/^https:\/\/(www\.)?(paypal|amazon|google|microsoft)\.com/.test(u)) {
      reasons.push('Contains sensitive brand/action keyword in a suspicious context');
    }
    if (u.includes('@')) reasons.push('URL contains "@" symbol — browser ignores everything before it');
    if (/\.(tk|ml|ga|cf|gq|xyz|top|work|click|link|online)(\?|\/|$)/.test(u)) reasons.push('Uses a high-risk free or suspicious TLD');
    if (u.length > 100) reasons.push('Unusually long URL — may be obfuscating the real destination');

    setResult({ safe: reasons.length === 0, reasons });
  }

  return (
    <Card className="border-slate-700/50 bg-slate-900/60">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <LinkIcon className="h-5 w-5 text-blue-400" /> URL Safety Checker
        </CardTitle>
        <CardDescription className="text-slate-400">
          Analyse a URL for phishing indicators without visiting it
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="https://example.com/login"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setResult(null); }}
            onKeyDown={(e) => e.key === 'Enter' && check()}
            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />
          <Button onClick={check} className="bg-blue-600 hover:bg-blue-700 shrink-0">Check</Button>
        </div>
        {result && (
          <div className={`rounded-lg border p-4 space-y-2 ${result.safe ? 'border-green-500/40 bg-green-900/10' : 'border-red-500/40 bg-red-900/10'}`}>
            <div className="flex items-center gap-2">
              {result.safe
                ? <CheckCircle2 className="h-5 w-5 text-green-400" />
                : <XCircle className="h-5 w-5 text-red-400" />}
              <span className={`font-semibold ${result.safe ? 'text-green-400' : 'text-red-400'}`}>
                {result.safe ? 'Looks Safe' : `${result.reasons.length} Risk Indicator${result.reasons.length > 1 ? 's' : ''} Found`}
              </span>
            </div>
            {result.reasons.map((r, i) => (
              <p key={i} className="text-sm text-slate-300 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" /> {r}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── URL Expander ──────────────────────────────────────────────
const SHORTENERS = [
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd',
  'buff.ly', 'adf.ly', 'short.link', 'rebrand.ly', 'cutt.ly',
  'shorturl.at', 'youtu.be', 'tiny.cc', 'rb.gy', 'su.pr',
];

function UrlExpander() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<null | { isShortened: boolean; service: string | null; info: string }>(null);

  function expand() {
    if (!url.trim()) return;
    const u = url.trim().toLowerCase();
    const detected = SHORTENERS.find(s => u.includes(s));
    if (detected) {
      setResult({
        isShortened: true,
        service: detected,
        info: `This is a shortened URL from "${detected}".\n\nShortened links hide the real destination and are widely used in phishing attacks to disguise malicious URLs.\n\nTo safely preview the destination:\n• Use unshorten.me or checkshorturl.com\n• Hover over the link before clicking\n• Never click shortened links in unexpected emails`,
      });
    } else {
      setResult({
        isShortened: false,
        service: null,
        info: 'This does not match any known URL shortener. The destination domain is visible in the URL itself.\n\nStill verify: Does the domain match the company you expect? Look for subtle misspellings like "paypa1.com" or "amaz0n.com".',
      });
    }
  }

  return (
    <Card className="border-slate-700/50 bg-slate-900/60">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Unlink className="h-5 w-5 text-teal-400" /> URL Expander
        </CardTitle>
        <CardDescription className="text-slate-400">
          Detect shortened URLs that may hide malicious destinations (bit.ly, tinyurl, etc.)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="https://bit.ly/abc123"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setResult(null); }}
            onKeyDown={(e) => e.key === 'Enter' && expand()}
            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />
          <Button onClick={expand} className="bg-teal-600 hover:bg-teal-700 shrink-0">Expand</Button>
        </div>
        {result && (
          <div className={`rounded-lg border p-4 space-y-2 ${result.isShortened ? 'border-amber-500/40 bg-amber-900/10' : 'border-green-500/40 bg-green-900/10'}`}>
            <div className="flex items-center gap-2">
              {result.isShortened
                ? <AlertTriangle className="h-5 w-5 text-amber-400" />
                : <CheckCircle2 className="h-5 w-5 text-green-400" />}
              <span className={`font-semibold ${result.isShortened ? 'text-amber-400' : 'text-green-400'}`}>
                {result.isShortened ? `Shortened URL Detected — ${result.service}` : 'Not a known shortened URL'}
              </span>
            </div>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">{result.info}</p>
            {result.isShortened && (
              <a
                href="https://unshorten.me"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-teal-400 hover:text-teal-300 hover:underline underline-offset-2"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Expand safely on unshorten.me →
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Data Breach Checker ───────────────────────────────────────
function BreachChecker() {
  const [email, setEmail] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<null | { email: string }>(null);

  function check() {
    const em = email.trim();
    if (!em || !em.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setChecking(true);
    setResult(null);
    setTimeout(() => {
      setResult({ email: em });
      setChecking(false);
    }, 1200);
  }

  return (
    <Card className="border-slate-700/50 bg-slate-900/60">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Search className="h-5 w-5 text-red-400" /> Data Breach Checker
        </CardTitle>
        <CardDescription className="text-slate-400">
          Check if your email appears in known data breaches via HaveIBeenPwned
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setResult(null); }}
            onKeyDown={(e) => e.key === 'Enter' && check()}
            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />
          <Button onClick={check} disabled={checking} className="bg-red-600 hover:bg-red-700 shrink-0">
            {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Check'}
          </Button>
        </div>
        {result && (
          <div className="rounded-lg border border-blue-500/40 bg-blue-900/10 p-4 space-y-3">
            <p className="text-sm text-slate-300">
              Check if <span className="text-white font-medium">{result.email}</span> has been exposed in any known data breaches:
            </p>
            <a
              href={`https://haveibeenpwned.com/account/${encodeURIComponent(result.email)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Check on HaveIBeenPwned.com
            </a>
            <p className="text-xs text-slate-500">
              HaveIBeenPwned is a free service by Troy Hunt tracking public data breaches. Your search is not stored.
            </p>
            <div className="border-t border-slate-700/50 pt-3">
              <p className="text-xs text-slate-400 font-medium mb-1">If your email was breached:</p>
              <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
                <li>Change your password on the affected site immediately</li>
                <li>Change it on any other site where you used the same password</li>
                <li>Enable two-factor authentication (2FA)</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Email Header Analyser ─────────────────────────────────────
function EmailHeaderAnalyser() {
  const [header, setHeader] = useState('');
  const [result, setResult] = useState<null | { flags: string[]; info: string[] }>(null);

  function analyse() {
    if (!header.trim()) return;
    const h = header.toLowerCase();
    const flags: string[] = [];
    const info: string[] = [];

    const fromMatch = header.match(/From:\s*(.+)/i);
    const replyToMatch = header.match(/Reply-To:\s*(.+)/i);
    if (fromMatch) info.push(`From: ${fromMatch[1].trim()}`);
    if (replyToMatch) {
      info.push(`Reply-To: ${replyToMatch[1].trim()}`);
      if (fromMatch && fromMatch[1].toLowerCase() !== replyToMatch[1].toLowerCase()) {
        flags.push('Reply-To differs from From address — replies go to a different address than the sender');
      }
    }

    if (h.includes('x-spam-status: yes') || h.includes('x-spam-flag: yes')) flags.push('Email was flagged as spam by the receiving mail server');
    if (!h.includes('dkim=pass')) flags.push('DKIM signature not verified — email authenticity cannot be confirmed');
    if (!h.includes('spf=pass')) flags.push('SPF check did not pass — sender may not be authorised to send from this domain');
    if (!h.includes('dmarc=pass')) flags.push('DMARC policy not passed — domain owner has not verified this email');

    const receivedCount = (h.match(/^received:/gm) || []).length;
    if (receivedCount > 5) flags.push(`High number of relay hops (${receivedCount}) — email passed through many servers`);
    if (receivedCount > 0) info.push(`Relay hops: ${receivedCount}`);

    if (flags.length === 0) flags.push('No major red flags found in the headers you provided');
    setResult({ flags, info });
  }

  return (
    <Card className="border-slate-700/50 bg-slate-900/60">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Mail className="h-5 w-5 text-purple-400" /> Email Header Analyser
        </CardTitle>
        <CardDescription className="text-slate-400">
          Paste raw email headers to detect spoofing (DKIM, SPF, DMARC)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <textarea
          placeholder={`From: support@paypa1.com\nReply-To: attacker@gmail.com\nReceived: from ...`}
          value={header}
          onChange={(e) => { setHeader(e.target.value); setResult(null); }}
          className="w-full min-h-[140px] rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 font-mono resize-y"
        />
        <Button onClick={analyse} className="bg-purple-600 hover:bg-purple-700">Analyse Headers</Button>
        {result && (
          <div className="space-y-3">
            {result.info.length > 0 && (
              <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3 space-y-1">
                {result.info.map((i, idx) => (
                  <p key={idx} className="text-xs text-slate-400 font-mono">{i}</p>
                ))}
              </div>
            )}
            <div className="space-y-2">
              {result.flags.map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  {f.startsWith('No major') ? (
                    <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                  )}
                  <span className={f.startsWith('No major') ? 'text-green-400' : 'text-slate-300'}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Password Strength Checker ─────────────────────────────────
function PasswordStrengthChecker() {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);

  function analyse(pw: string) {
    const checks = [
      { label: 'At least 8 characters', ok: pw.length >= 8 },
      { label: 'At least 12 characters', ok: pw.length >= 12 },
      { label: 'Uppercase letter (A–Z)', ok: /[A-Z]/.test(pw) },
      { label: 'Lowercase letter (a–z)', ok: /[a-z]/.test(pw) },
      { label: 'Number (0–9)', ok: /\d/.test(pw) },
      { label: 'Special character (!@#$…)', ok: /[^a-zA-Z0-9]/.test(pw) },
      { label: 'Not a common pattern (123, abc, qwerty…)', ok: !/123|abc|qwerty|password|admin|letmein/i.test(pw) },
    ];
    const score = checks.filter((c) => c.ok).length;
    const level = score <= 2 ? 'Weak' : score <= 4 ? 'Fair' : score <= 5 ? 'Good' : 'Strong';
    const color = score <= 2 ? 'text-red-400' : score <= 4 ? 'text-amber-400' : score <= 5 ? 'text-yellow-300' : 'text-green-400';
    const barColor = score <= 2 ? 'bg-red-500' : score <= 4 ? 'bg-amber-500' : score <= 5 ? 'bg-yellow-400' : 'bg-green-500';
    return { checks, score, level, color, barColor };
  }

  const result = password ? analyse(password) : null;

  return (
    <Card className="border-slate-700/50 bg-slate-900/60">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Key className="h-5 w-5 text-green-400" /> Password Strength Checker
        </CardTitle>
        <CardDescription className="text-slate-400">
          Check how strong your password is — nothing is sent to any server
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Input
            type={show ? 'text' : 'password'}
            placeholder="Enter a password to analyse"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 pr-10"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            onClick={() => setShow(!show)}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {result && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Strength:</span>
              <span className={`text-sm font-bold ${result.color}`}>{result.level}</span>
            </div>
            <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${result.barColor}`}
                style={{ width: `${(result.score / 7) * 100}%` }}
              />
            </div>
            <div className="grid grid-cols-1 gap-1 pt-1">
              {result.checks.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {c.ok
                    ? <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                    : <XCircle className="h-4 w-4 text-slate-600 shrink-0" />}
                  <span className={c.ok ? 'text-slate-300' : 'text-slate-500'}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Password Generator ────────────────────────────────────────
function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [generated, setGenerated] = useState('');

  function generate() {
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const all = lower + upper + nums + (includeSymbols ? symbols : '');
    let pw = '';
    pw += lower[Math.floor(Math.random() * lower.length)];
    pw += upper[Math.floor(Math.random() * upper.length)];
    pw += nums[Math.floor(Math.random() * nums.length)];
    if (includeSymbols) pw += symbols[Math.floor(Math.random() * symbols.length)];
    for (let i = pw.length; i < length; i++) {
      pw += all[Math.floor(Math.random() * all.length)];
    }
    setGenerated(pw.split('').sort(() => Math.random() - 0.5).join(''));
  }

  function copy() {
    if (!generated) return;
    navigator.clipboard.writeText(generated).then(() => toast.success('Password copied!')).catch(() => toast.error('Copy failed'));
  }

  return (
    <Card className="border-slate-700/50 bg-slate-900/60">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-amber-400" /> Secure Password Generator
        </CardTitle>
        <CardDescription className="text-slate-400">
          Generate a strong random password — nothing leaves your browser
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1">
            <Label className="text-slate-300 text-sm">Length: {length}</Label>
            <input
              type="range"
              min={8}
              max={32}
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-40 accent-blue-500"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeSymbols}
              onChange={(e) => setIncludeSymbols(e.target.checked)}
              className="accent-blue-500"
            />
            <span className="text-sm text-slate-300">Include symbols</span>
          </label>
          <Button onClick={generate} className="bg-amber-600 hover:bg-amber-700">
            <RefreshCw className="h-4 w-4 mr-2" /> Generate
          </Button>
        </div>
        {generated && (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-800 border border-slate-700 rounded-md px-3 py-2 font-mono text-sm text-white break-all">
              {generated}
            </div>
            <Button size="sm" variant="outline" className="border-slate-600 shrink-0" onClick={copy}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Phishing Red Flags Reference ──────────────────────────────
const RED_FLAGS = [
  { category: 'Sender', flag: 'Email domain doesn\'t match the company (e.g. paypa1.com vs paypal.com)', level: 'critical' },
  { category: 'Sender', flag: 'Reply-To address is different from the From address', level: 'critical' },
  { category: 'Language', flag: 'Creates false urgency ("Act now!", "Your account will be suspended in 24 hours")', level: 'high' },
  { category: 'Language', flag: 'Threatens negative consequences if you don\'t act immediately', level: 'high' },
  { category: 'Language', flag: 'Poor grammar, spelling mistakes, or unusual phrasing', level: 'medium' },
  { category: 'Links', flag: 'Hover text shows a different URL than the displayed link text', level: 'critical' },
  { category: 'Links', flag: 'URL uses HTTP instead of HTTPS', level: 'high' },
  { category: 'Links', flag: 'URL contains random numbers or letters (e.g. abc123-secure-login.com)', level: 'high' },
  { category: 'Attachments', flag: 'Unexpected attachment, especially .exe, .zip, .docm, or .xlsm files', level: 'critical' },
  { category: 'Request', flag: 'Asks for passwords, credit card numbers, or SSN via email', level: 'critical' },
  { category: 'Request', flag: 'Requests you to bypass normal security procedures', level: 'critical' },
  { category: 'General', flag: 'You didn\'t request the email but it claims to be a response', level: 'medium' },
  { category: 'General', flag: 'Too-good-to-be-true offers (prizes, refunds, free money)', level: 'high' },
];

function PhishingReference() {
  const levelColor: Record<string, string> = {
    critical: 'bg-red-900/20 text-red-400 border-red-500/30',
    high: 'bg-amber-900/20 text-amber-400 border-amber-500/30',
    medium: 'bg-yellow-900/20 text-yellow-300 border-yellow-500/30',
  };

  return (
    <Card className="border-slate-700/50 bg-slate-900/60">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-400" /> Phishing Red Flags Reference
        </CardTitle>
        <CardDescription className="text-slate-400">
          Quick reference card — know what to look for in suspicious emails
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {RED_FLAGS.map((item, i) => (
            <div key={i} className="flex items-start gap-3 py-2 border-b border-slate-800 last:border-0">
              <Badge className={`text-xs shrink-0 border ${levelColor[item.level]}`}>
                {item.category}
              </Badge>
              <p className="text-sm text-slate-300">{item.flag}</p>
              <Badge className={`text-xs shrink-0 ml-auto border ${levelColor[item.level]}`}>
                {item.level}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Component ────────────────────────────────────────────
export function SecurityTools() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Wrench className="h-8 w-8 text-slate-400" /> Security Tools
        </h1>
        <p className="text-slate-200 mt-1">
          Browser-based tools — nothing is sent to any external server
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <UrlChecker />
        <UrlExpander />
        <PasswordStrengthChecker />
        <PasswordGenerator />
        <BreachChecker />
        <EmailHeaderAnalyser />
      </div>

      <PhishingReference />
    </motion.div>
  );
}
