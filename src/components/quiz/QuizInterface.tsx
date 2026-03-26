import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ClipboardCheck, CheckCircle, XCircle, RotateCcw, Trophy, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Progress } from '../ui/progress';
import { useCurrentUser } from '@/context/UsersContext';

const API = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8081';

type Question = {
  id: number;
  quizId: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
};

type QuizResult = {
  score: number;
  totalQuestions: number;
  message: string;
};

type HistoryEntry = {
  id: number;
  score: number;
  totalQuestions: number;
  submittedAt: string;
};

const OPTIONS: { key: 'A' | 'B' | 'C' | 'D'; label: string }[] = [
  { key: 'A', label: 'A' },
  { key: 'B', label: 'B' },
  { key: 'C', label: 'C' },
  { key: 'D', label: 'D' },
];

export function QuizInterface() {
  const { currentUser } = useCurrentUser();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    async function loadQuestions() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API}/api/quiz-questions`);
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();
        setQuestions(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load quiz questions.');
      } finally {
        setLoading(false);
      }
    }
    void loadQuestions();
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;
    setHistoryLoading(true);
    fetch(`${API}/api/quiz-results/user/${currentUser.id}`)
      .then(r => r.ok ? r.json() : [])
      .then((data: HistoryEntry[]) => {
        const sorted = [...data].sort(
          (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        );
        setHistory(sorted);
      })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [currentUser?.id, result]); // re-fetch after new result

  function selectAnswer(questionId: number, answer: string) {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  }

  async function handleSubmit() {
    if (!currentUser) return;
    setSubmitting(true);
    setSubmitError(null);

    const quizId = questions[0]?.quizId ?? 1;

    try {
      const res = await fetch(`${API}/api/quiz/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          quizId,
          answers,
        }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data: QuizResult = await res.json();
      setResult(data);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Failed to submit quiz.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleRetry() {
    setAnswers({});
    setResult(null);
    setSubmitError(null);
  }

  const answeredCount = Object.keys(answers).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;
  const scorePercent = result
    ? Math.round((result.score / result.totalQuestions) * 100)
    : 0;

  // ── Loading state ──
  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <ClipboardCheck className="h-8 w-8 text-purple-500" />
          Security Quiz
        </h1>
        {[1, 2, 3].map(i => (
          <Card key={i} className="border-slate-700/50 bg-slate-900/50">
            <CardHeader>
              <Skeleton className="h-5 w-3/4 bg-slate-800 rounded" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3, 4].map(j => (
                <Skeleton key={j} className="h-10 w-full bg-slate-800 rounded" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // ── Error loading questions ──
  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <ClipboardCheck className="h-8 w-8 text-purple-500" />
          Security Quiz
        </h1>
        <Card className="border-red-800/50 bg-red-900/10">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center gap-2">
              <XCircle className="h-5 w-5" /> Failed to load quiz
            </CardTitle>
            <CardDescription className="text-red-300">{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // ── No questions in DB ──
  if (questions.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <ClipboardCheck className="h-8 w-8 text-purple-500" />
          Security Quiz
        </h1>
        <Card className="border-slate-700/50 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-white">No questions available</CardTitle>
            <CardDescription className="text-slate-400">
              Add questions to the <code className="text-blue-400">quiz_questions</code> table in your database.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // ── Result screen ──
  if (result) {
    const passed = scorePercent >= 70;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <ClipboardCheck className="h-8 w-8 text-purple-500" />
          Security Quiz — Results
        </h1>

        <Card className={`border-2 ${passed ? 'border-green-600/50 bg-green-900/10' : 'border-orange-600/50 bg-orange-900/10'}`}>
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              {passed
                ? <Trophy className="h-16 w-16 text-yellow-400" />
                : <XCircle className="h-16 w-16 text-orange-400" />}
            </div>
            <CardTitle className={`text-4xl font-bold ${passed ? 'text-green-400' : 'text-orange-400'}`}>
              {scorePercent}%
            </CardTitle>
            <CardDescription className="text-slate-300 text-base mt-1">
              You scored <span className="text-white font-semibold">{result.score}</span> out of{' '}
              <span className="text-white font-semibold">{result.totalQuestions}</span> questions
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Progress value={scorePercent} className="h-3" />

            <div className="flex justify-center">
              <Badge
                className={`text-sm px-4 py-1 ${
                  passed
                    ? 'bg-green-600 text-white'
                    : 'bg-orange-600 text-white'
                }`}
              >
                {passed ? '✅ Passed' : '❌ Try Again'}
              </Badge>
            </div>

            <p className="text-center text-slate-400 text-sm">
              {passed
                ? 'Great job! You have strong phishing awareness.'
                : 'Keep studying! Review the training modules and try again.'}
            </p>

            <div className="flex justify-center pt-2">
              <Button
                onClick={handleRetry}
                className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Retake Quiz
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quiz History */}
        <Card className="border-slate-700 bg-slate-800/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <History className="h-4 w-4 text-purple-400" /> Your Quiz History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-10 bg-slate-700 rounded-lg animate-pulse" />)}
              </div>
            ) : history.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">No past attempts yet.</p>
            ) : (
              <div className="space-y-2">
                {history.map((h, i) => {
                  const pct = h.totalQuestions > 0 ? Math.round((h.score / h.totalQuestions) * 100) : 0;
                  const passed = pct >= 70;
                  return (
                    <div key={h.id} className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 text-xs font-mono w-4">{i + 1}</span>
                        <div>
                          <p className="text-white text-sm font-medium">
                            {h.score} / {h.totalQuestions} correct
                          </p>
                          <p className="text-slate-400 text-xs">
                            {new Date(h.submittedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${passed ? 'bg-green-700 text-white' : 'bg-red-700 text-white'}`}>
                        {pct}% {passed ? '✓' : '✗'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ── Quiz questions ──
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <ClipboardCheck className="h-8 w-8 text-purple-500" />
          Security Quiz
        </h1>
        <Badge className="bg-slate-700 text-slate-300 text-sm px-3 py-1">
          {answeredCount} / {questions.length} answered
        </Badge>
      </div>

      {/* Progress bar */}
      <Progress
        value={questions.length > 0 ? (answeredCount / questions.length) * 100 : 0}
        className="h-2"
      />

      {/* Questions */}
      {questions.map((q, index) => {
        const selected = answers[q.id];
        return (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="border-slate-700/50 bg-slate-900/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base font-medium leading-snug">
                  <span className="text-purple-400 font-bold mr-2">Q{index + 1}.</span>
                  {q.question}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {OPTIONS.map(({ key, label }) => {
                  const optionText = q[`option${key}` as keyof Question] as string;
                  const isSelected = selected === key;
                  return (
                    <button
                      key={key}
                      onClick={() => selectAnswer(q.id, key)}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-150 text-sm
                        ${isSelected
                          ? 'border-purple-500 bg-purple-600/20 text-white'
                          : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-500 hover:bg-slate-700/50'
                        }`}
                    >
                      <span className={`font-bold mr-2 ${isSelected ? 'text-purple-400' : 'text-slate-500'}`}>
                        {label}.
                      </span>
                      {optionText}
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}

      {/* Submit error */}
      {submitError && (
        <p className="text-red-400 text-sm text-center">{submitError}</p>
      )}

      {/* Submit button */}
      <div className="flex justify-center pt-2 pb-6">
        <Button
          onClick={handleSubmit}
          disabled={!allAnswered || submitting}
          className="bg-purple-600 hover:bg-purple-700 text-white px-10 py-3 text-base font-semibold disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : allAnswered ? 'Submit Quiz' : `Answer all ${questions.length} questions to submit`}
        </Button>
      </div>
    </motion.div>
  );
}
