import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Search, Bookmark, BookmarkCheck, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { getKnowledgeArticles, type KnowledgeArticle } from '../../lib/api';

const BOOKMARKS_KEY = 'phishguard_knowledge_bookmarks';

function loadBookmarks(): number[] {
  try { return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) ?? '[]') as number[]; } catch { return []; }
}
function saveBookmarks(ids: number[]) {
  try { localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(ids)); } catch {}
}

function formatPublishedAt(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString();
}

const CATEGORY_COLORS: Record<string, string> = {
  'Basics':         'text-white bg-blue-700 border-blue-400',
  'Detection':      'text-white bg-green-700 border-green-400',
  'Advanced':       'text-white bg-red-700 border-red-400',
  'Best Practices': 'text-white bg-yellow-700 border-yellow-400',
  'Procedures':     'text-white bg-purple-700 border-purple-400',
};

function categoryClass(cat: string | null): string {
  if (!cat) return 'text-white bg-indigo-700 border-indigo-400';
  return CATEGORY_COLORS[cat] ?? 'text-white bg-indigo-700 border-indigo-400';
}

export function KnowledgeHub() {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>(loadBookmarks);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const list = await getKnowledgeArticles();
        if (!cancelled) setArticles(list);
      } catch {
        if (!cancelled) {
          setError('Could not load articles. Please try again.');
          setArticles([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(articles.map(a => a.category).filter(Boolean));
    return Array.from(cats) as string[];
  }, [articles]);

  const filtered = useMemo(() => {
    return articles.filter(a => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q ||
        a.title.toLowerCase().includes(q) ||
        (a.content?.toLowerCase().includes(q) ?? false) ||
        (a.author?.toLowerCase().includes(q) ?? false) ||
        (a.category?.toLowerCase().includes(q) ?? false);
      const matchesCategory = !categoryFilter || a.category === categoryFilter;
      const matchesBookmark = !showBookmarked || bookmarks.includes(a.id);
      return matchesSearch && matchesCategory && matchesBookmark;
    });
  }, [articles, search, categoryFilter, showBookmarked, bookmarks]);

  function toggleBookmark(id: number) {
    setBookmarks(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      saveBookmarks(next);
      return next;
    });
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold text-white">Knowledge Hub</h1>
          <p className="text-slate-200 text-sm mt-1">Articles, tutorials and guides on cybersecurity awareness</p>
        </div>
        <span className="text-slate-300 text-sm">{articles.length} article{articles.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Search + Filter */}
      {!loading && articles.length > 0 && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
            <Input
              placeholder="Search articles by title, content, or author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => { setCategoryFilter(null); setShowBookmarked(false); }}
              className={(!categoryFilter && !showBookmarked) ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'border border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800'}
            >
              All
            </Button>
            {categories.map(cat => (
              <Button
                key={cat}
                size="sm"
                onClick={() => { setCategoryFilter(categoryFilter === cat ? null : cat); setShowBookmarked(false); }}
                className={categoryFilter === cat ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'border border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800'}
              >
                {cat}
              </Button>
            ))}
            <Button
              size="sm"
              onClick={() => { setShowBookmarked(!showBookmarked); setCategoryFilter(null); }}
              className={showBookmarked ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'border border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800'}
            >
              <BookmarkCheck className="h-3.5 w-3.5 mr-1" />
              Saved ({bookmarks.length})
            </Button>
          </div>
        </div>
      )}

      {error ? (
        <Card className="border-red-900/50 bg-red-900/10 p-6">
          <p className="text-red-400 text-sm">{error}</p>
        </Card>
      ) : null}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <Skeleton className="h-6 w-48 rounded-md bg-slate-800" />
                <Skeleton className="h-4 w-full max-w-md rounded-md bg-slate-800 mt-2" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full rounded-md bg-slate-800" />
                <Skeleton className="h-4 w-3/4 rounded-md bg-slate-800" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {!loading && !error && filtered.length === 0 ? (
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-white">
              {search || categoryFilter || showBookmarked ? 'No matching articles' : 'No articles yet'}
            </CardTitle>
            {(search || categoryFilter || showBookmarked) ? (
              <CardDescription className="text-slate-300">
                Try a different search term or clear the filters.
              </CardDescription>
            ) : null}
          </CardHeader>
        </Card>
      ) : null}

      {!loading && filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((a) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-slate-800 bg-slate-900/50 text-white hover:border-slate-600 transition-colors">
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-white text-xl leading-tight">{a.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {a.category ? (
                        <span className={`text-xs font-medium uppercase tracking-wide rounded-full px-2 py-0.5 border ${categoryClass(a.category)}`}>
                          {a.category}
                        </span>
                      ) : null}
                      <button
                        type="button"
                        title={bookmarks.includes(a.id) ? 'Remove bookmark' : 'Bookmark this article'}
                        onClick={() => toggleBookmark(a.id)}
                        className="text-slate-400 hover:text-amber-400 transition-colors"
                      >
                        {bookmarks.includes(a.id)
                          ? <BookmarkCheck className="h-5 w-5 text-amber-400" />
                          : <Bookmark className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  <CardDescription className="text-gray-200 flex flex-wrap gap-3 text-sm mt-1">
                    <span><span className="text-gray-300">Author: </span>{a.author ?? '—'}</span>
                    <span><span className="text-gray-300">Published: </span>{formatPublishedAt(a.publishedAt)}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {a.content ? (
                    <p className="text-gray-200 text-sm whitespace-pre-wrap line-clamp-3">{a.content}</p>
                  ) : (
                    <p className="text-gray-300 text-sm italic">No content</p>
                  )}
                  <div className="flex items-center gap-3 flex-wrap">
                    <Link
                      to={`/dashboard/knowledge/${a.id}`}
                      className="inline-flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 hover:underline underline-offset-2 font-medium"
                    >
                      Read full article →
                    </Link>
                    {a.fileUrl && (
                      <a
                        href={a.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" /> Download Material
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : null}
    </motion.div>
  );
}
