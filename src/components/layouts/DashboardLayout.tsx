import { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  BookOpen,
  ClipboardCheck,
  ScanSearch,
  Trophy,
  Target,
  BookMarked,
  AlertTriangle,
  Wrench,
  LayoutDashboard,
  Bell,
  User,
  Menu,
  X,
  LogOut,
  Settings,
  ShieldAlert,
  CheckCheck,
  BookMarked as ArticleIcon,
  GraduationCap,
  Megaphone,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useCurrentUser } from '@/context/UsersContext';
import {
  getNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead,
  type NotificationRow,
} from '@/lib/api';
import { toast } from 'sonner';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
  { name: 'Training', href: '/dashboard/training', icon: BookOpen },
  { name: 'Quiz', href: '/dashboard/quiz', icon: ClipboardCheck },
  { name: 'Email Scanner', href: '/dashboard/scanner', icon: ScanSearch },
  { name: 'Leaderboard', href: '/dashboard/leaderboard', icon: Trophy },
  { name: 'Simulation', href: '/dashboard/simulation', icon: Target },
  { name: 'Knowledge Hub', href: '/dashboard/knowledge', icon: BookMarked },
  { name: 'Report Incident', href: '/dashboard/report', icon: AlertTriangle },
  { name: 'Security Tools', href: '/dashboard/tools', icon: Wrench },
  { name: 'Admin Panel', href: '/dashboard/admin', icon: ShieldAlert, adminOnly: true },
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';
}

// ── Notification icon helper ─────────────────────────────────────────────────
function NotifIcon({ type }: { type: string }) {
  if (type === 'article') return <ArticleIcon className="h-4 w-4 text-indigo-400 shrink-0" />;
  if (type === 'training') return <GraduationCap className="h-4 w-4 text-emerald-400 shrink-0" />;
  if (type === 'alert') return <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />;
  return <Megaphone className="h-4 w-4 text-yellow-400 shrink-0" />;
}

function timeAgo(iso: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDateTime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

// ── Main layout ──────────────────────────────────────────────────────────────
export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, currentUserId, loading, setCurrentUserId, isAdmin } =
    useCurrentUser();

  // ── Notification state ───────────────────────────────────────────────────
  const [notifOpen, setNotifOpen]           = useState(false);
  const [notifications, setNotifications]   = useState<NotificationRow[]>([]);
  const [notifLoading, setNotifLoading]     = useState(false);
  const [unreadCount, setUnreadCount]       = useState(0);
  const [markAllReadBusy, setMarkAllReadBusy] = useState(false);
  const notifRef                            = useRef<HTMLDivElement>(null);

  // Fetch notifications whenever the panel opens or the userId changes
  const fetchNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const [list, unread] = await Promise.all([getNotifications(), getUnreadCount()]);
      setNotifications(list);
      setUnreadCount(unread);
    } catch {
      // silent — bell just shows no items
    } finally {
      setNotifLoading(false);
    }
  }, []);

  // Poll every 60 s so new admin content shows up automatically
  useEffect(() => {
    void fetchNotifications();
    const interval = setInterval(() => { void fetchNotifications(); }, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close panel when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [notifOpen]);

  async function handleMarkRead(n: NotificationRow) {
    if (n.read) {
      if (n.link) {
        try {
          navigate(n.link);
          setNotifOpen(false);
        } catch (e) {
          console.error('[PhishGuard] notification navigate failed', e);
          toast.error('Could not open link');
        }
      }
      return;
    }
    try {
      const updated = await markNotificationRead(n.id);
      setNotifications(prev => prev.map(x => x.id === updated.id ? updated : x));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error('[PhishGuard] markNotificationRead failed', e);
      toast.error(e instanceof Error ? e.message : 'Could not mark as read');
      return;
    }
    if (n.link) {
      try {
        navigate(n.link);
        setNotifOpen(false);
      } catch (e) {
        console.error('[PhishGuard] notification navigate failed', e);
        toast.error('Could not open link');
      }
    }
  }

  async function handleMarkAllRead() {
    if (markAllReadBusy) return;
    setMarkAllReadBusy(true);
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error('[PhishGuard] markAllNotificationsRead failed', e);
      toast.error(e instanceof Error ? e.message : 'Could not mark all as read');
    } finally {
      setMarkAllReadBusy(false);
    }
  }

  useEffect(() => {
    if (!loading && currentUserId == null) {
      navigate('/', { replace: true });
    }
  }, [loading, currentUserId, navigate]);

  const handleLogout = () => {
    setCurrentUserId(null);
    navigate('/');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard/profile') {
      return (
        location.pathname === '/dashboard/profile' ||
        location.pathname.startsWith('/dashboard/profile/')
      );
    }
    return location.pathname === href;
  };

  const displayName = currentUser?.full_name ?? 'User';
  const displayEmail = currentUser?.email ?? '';

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Cybersecurity background pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1e3a8a08_1px,transparent_1px),linear-gradient(to_bottom,#1e3a8a08_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-slate-900 border-r border-slate-800 px-6 pb-4">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center">
            <Shield className="h-8 w-8 text-blue-500" aria-hidden="true" />
            <span className="ml-3 text-xl font-bold text-white">PhishGuard</span>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col" aria-label="Main navigation">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    if (item.adminOnly && !isAdmin) return null;
                    const active = isActive(item.href);

                    return (
                      <li key={item.name}>
                        <button
                          onClick={() => navigate(item.href)}
                          className={`
                            group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold w-full
                            transition-all duration-200
                            ${active
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }
                          `}
                          aria-current={active ? 'page' : undefined}
                        >
                          <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                          {item.name}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </li>
            </ul>
          </nav>

          {/* Logout button at bottom of sidebar */}
          <div className="border-t border-slate-800 pt-4 pb-2">
            <div className="flex items-center gap-3 px-2 mb-3">
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {initials(displayName)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                <p className="text-xs text-slate-400 truncate">{displayEmail}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold w-full text-red-400 hover:text-white hover:bg-red-600/20 transition-all duration-200 -mx-2 px-2"
            >
              <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
              Log out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />

            {/* Sidebar */}
            <motion.aside
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 lg:hidden"
            >
              <div className="flex h-16 items-center justify-between px-6">
                <div className="flex items-center">
                  <Shield className="h-8 w-8 text-blue-500" aria-hidden="true" />
                  <span className="ml-3 text-xl font-bold text-white">PhishGuard</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Close sidebar"
                >
                  <X className="h-5 w-5 text-slate-400" />
                </Button>
              </div>

              <nav className="mt-5 px-6" aria-label="Mobile navigation">
                <ul role="list" className="space-y-1">
                  {navigation.map((item) => {
                    if (item.adminOnly && !isAdmin) return null;
                    const active = isActive(item.href);

                    return (
                      <li key={item.name}>
                        <button
                          onClick={() => {
                            navigate(item.href);
                            setSidebarOpen(false);
                          }}
                          className={`
                            group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold w-full
                            transition-all duration-200
                            ${active 
                              ? 'bg-blue-600 text-white' 
                              : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }
                          `}
                          aria-current={active ? 'page' : undefined}
                        >
                          <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                          {item.name}
                        </button>
                      </li>
                    );
                  })}
                </ul>

                {/* Mobile logout */}
                <div className="border-t border-slate-800 mt-4 pt-4">
                  <button
                    onClick={() => { handleLogout(); setSidebarOpen(false); }}
                    className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold w-full text-red-400 hover:text-white hover:bg-red-600/20 transition-all duration-200"
                  >
                    <LogOut className="h-5 w-5 shrink-0" />
                    Log out
                  </button>
                </div>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-800 bg-slate-900/95 backdrop-blur-sm px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-slate-400"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h1 className="text-lg font-semibold text-white">
                {navigation.find(item => isActive(item.href))?.name || 'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* ── Notification Bell ── */}
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  aria-label="Notifications"
                  onClick={() => { setNotifOpen(prev => !prev); void fetchNotifications(); }}
                  className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <Bell className="h-5 w-5" />
                  {/* Unread badge */}
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* ── Notification Dropdown Panel ── */}
                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-80 z-50 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden"
                    >
                      {/* Panel header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4 text-blue-400" />
                          <span className="text-white font-semibold text-sm">Notifications</span>
                          {unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            disabled={markAllReadBusy}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              void handleMarkAllRead();
                            }}
                            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium disabled:opacity-50 disabled:pointer-events-none"
                          >
                            <CheckCheck className="h-3.5 w-3.5" />
                            {markAllReadBusy ? 'Updating…' : 'Mark all read'}
                          </button>
                        )}
                      </div>

                      {/* Notification list */}
                      <div className="max-h-96 overflow-y-auto">
                        {notifLoading ? (
                          <div className="py-8 text-center text-slate-400 text-sm">
                            Loading…
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="py-10 flex flex-col items-center gap-2 text-slate-400">
                            <Bell className="h-8 w-8 opacity-40" />
                            <p className="text-sm">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.map(n => (
                            <button
                              key={n.id}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                void handleMarkRead(n);
                              }}
                              className={`w-full text-left px-4 py-3 flex gap-3 border-b border-slate-800 transition-colors
                                ${n.read
                                  ? 'bg-slate-900 hover:bg-slate-800'
                                  : 'bg-slate-800/80 hover:bg-slate-700'}`}
                            >
                              {/* Type icon */}
                              <div className="mt-0.5 shrink-0">
                                <NotifIcon type={n.type} />
                              </div>

                              <div className="flex-1 min-w-0">
                                {n.title && (
                                  <p className={`text-xs leading-snug ${n.read ? 'text-slate-200' : 'text-white font-semibold'}`}>
                                    {n.title}
                                  </p>
                                )}
                                <p className={`text-xs leading-snug ${n.read ? 'text-slate-300' : 'text-slate-100'} ${n.title ? 'mt-0.5' : ''}`}>
                                  {n.message}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  {formatDateTime(n.createdAt)}
                                </p>
                              </div>

                              {/* Unread dot */}
                              {!n.read && (
                                <span className="h-2 w-2 rounded-full bg-blue-400 shrink-0 mt-1" />
                              )}
                            </button>
                          ))
                        )}
                      </div>

                      {/* Panel footer */}
                      {notifications.length > 0 && (
                        <div className="px-4 py-2 border-t border-slate-700 bg-slate-800 text-center">
                          <p className="text-xs text-slate-400">
                            {notifications.length} notification{notifications.length !== 1 ? 's' : ''} total
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="relative flex items-center gap-x-2 h-9 px-3 rounded-md text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-600 text-white text-xs">
                        {initials(displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden lg:flex lg:items-center">
                      <span className="text-sm font-semibold leading-6 text-white" aria-hidden="true">
                        {displayName}
                      </span>
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-slate-800 border-slate-700">
                  <DropdownMenuLabel className="text-slate-400">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-white">{displayName}</p>
                      <p className="text-xs leading-none text-slate-400">{displayEmail}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-700" />
                  <DropdownMenuItem
                    className="text-slate-300 focus:bg-slate-700 focus:text-white cursor-pointer"
                    onClick={() => navigate('/dashboard/profile')}
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-slate-300 focus:bg-slate-700 focus:text-white cursor-pointer"
                    onClick={() => navigate('/dashboard/profile')}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-700" />
                  <DropdownMenuItem 
                    className="text-red-400 focus:bg-red-900/20 focus:text-red-400 cursor-pointer"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="py-10 relative z-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
