import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, BookMarked } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { getKnowledgeArticle, type KnowledgeArticle } from '../../lib/api';

function formatPublishedAt(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

export function KnowledgeArticleDetail() {
  const { articleId } = useParams<{ articleId: string }>();
  const idNum = articleId != null ? Number(articleId) : NaN;

  const [article, setArticle] = useState<KnowledgeArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(idNum) || idNum <= 0) {
      setLoading(false);
      setError('Invalid article id');
      setArticle(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const a = await getKnowledgeArticle(idNum);
        if (!cancelled) setArticle(a);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load article');
          setArticle(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [idNum]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/dashboard/knowledge"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Knowledge Hub
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-white">Article</h1>

      {error ? (
        <Card className="border-slate-800 bg-slate-900/50 p-6 text-white">
          <p className="text-red-400 text-sm">{error}</p>
        </Card>
      ) : null}

      {loading ? (
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader>
            <Skeleton className="h-8 w-2/3 rounded-md bg-slate-800" />
            <Skeleton className="h-4 w-48 rounded-md bg-slate-800 mt-3" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full rounded-md bg-slate-800" />
            <Skeleton className="h-4 w-full rounded-md bg-slate-800" />
            <Skeleton className="h-4 w-4/5 rounded-md bg-slate-800" />
          </CardContent>
        </Card>
      ) : null}

      {!loading && !error && article ? (
        <Card className="border-slate-800 bg-slate-900/50 text-white">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <CardTitle className="text-white text-2xl">{article.title}</CardTitle>
              {article.category ? (
                <span className="text-xs font-medium uppercase tracking-wide text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-2 py-0.5">
                  {article.category}
                </span>
              ) : null}
            </div>
            <CardDescription className="text-slate-400 space-y-1">
              <div className="text-sm">
                <span className="text-slate-500">Author: </span>
                {article.author ?? '—'}
              </div>
              <div className="text-sm">
                <span className="text-slate-500">Published: </span>
                {formatPublishedAt(article.publishedAt)}
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {article.content ? (
              <div className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">{article.content}</div>
            ) : (
              <p className="text-slate-500 text-sm italic">No content</p>
            )}
          </CardContent>
        </Card>
      ) : null}
    </motion.div>
  );
}
