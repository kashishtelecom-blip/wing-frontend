'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Shield, Users, FileText, MessageSquare, AlertTriangle, Loader2,
  Search, Trash2, Ban, CheckCircle, UserCheck, Flag,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { NavBar } from '@/components/NavBar';
import { Avatar } from '@/components/Avatar';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { timeAgo } from '@/lib/time';
import {
  AdminStats, AdminUser, AdminWing, AdminCommunity, AdminReport,
  getAdminStats, listUsers, listWings, listCommunitiesAdmin, listReports,
  setUserRole, setUserActive, deleteUser, deleteWingAdmin,
  deleteCommunityAdmin, updateReportStatus,
} from '@/lib/admin';

type Tab = 'overview' | 'users' | 'wings' | 'communities' | 'reports';

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  // Overview
  const [stats, setStats] = useState<AdminStats | null>(null);

  // Lists
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [wings, setWings] = useState<AdminWing[]>([]);
  const [communities, setCommunities] = useState<AdminCommunity[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);

  // Search
  const [userQuery, setUserQuery] = useState('');
  const [wingQuery, setWingQuery] = useState('');
  const [reportFilter, setReportFilter] = useState<string>('');

  const [working, setWorking] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const loadStats = async () => {
    try {
      const s = await getAdminStats();
      setStats(s);
      setDenied(false);
    } catch (err: any) {
      if (err.response?.status === 403) setDenied(true);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await listUsers(userQuery || undefined);
      setUsers(res.data);
    } catch (err) { console.error(err); }
  };

  const loadWings = async () => {
    try {
      const res = await listWings(wingQuery || undefined);
      setWings(res.data);
    } catch (err) { console.error(err); }
  };

  const loadCommunities = async () => {
    try {
      const res = await listCommunitiesAdmin();
      setCommunities(res.data);
    } catch (err) { console.error(err); }
  };

  const loadReports = async () => {
    try {
      const res = await listReports(reportFilter || undefined);
      setReports(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (authLoading || !user) return;
    if (tab === 'overview') loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, tab]);

  useEffect(() => {
    if (tab === 'users') loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, userQuery]);

  useEffect(() => {
    if (tab === 'wings') loadWings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, wingQuery]);

  useEffect(() => {
    if (tab === 'communities') loadCommunities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    if (tab === 'reports') loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, reportFilter]);

  const handleSetRole = async (u: AdminUser, role: 'user' | 'admin') => {
    if (!confirm(`Set ${u.username}'s role to ${role}?`)) return;
    setWorking(u._id);
    try {
      const updated = await setUserRole(u._id, role);
      setUsers((prev) => prev.map((x) => (x._id === u._id ? { ...x, role: updated.role } : x)));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed');
    } finally {
      setWorking(null);
    }
  };

  const handleToggleActive = async (u: AdminUser) => {
    const action = u.isActive ? 'ban' : 'unban';
    if (!confirm(`Are you sure you want to ${action} @${u.username}?`)) return;
    setWorking(u._id);
    try {
      await setUserActive(u._id, !u.isActive);
      setUsers((prev) => prev.map((x) => (x._id === u._id ? { ...x, isActive: !x.isActive } : x)));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed');
    } finally {
      setWorking(null);
    }
  };

  const handleDeleteWing = async (w: AdminWing) => {
    if (!confirm('Delete this wing permanently?')) return;
    setWorking(w._id);
    try {
      await deleteWingAdmin(w._id);
      setWings((prev) => prev.filter((x) => x._id !== w._id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed');
    } finally {
      setWorking(null);
    }
  };

  const handleDeleteCommunity = async (c: AdminCommunity) => {
    if (!confirm(`Delete community "${c.name}"?`)) return;
    setWorking(c._id);
    try {
      await deleteCommunityAdmin(c._id);
      setCommunities((prev) => prev.filter((x) => x._id !== c._id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed');
    } finally {
      setWorking(null);
    }
  };

  const handleReportStatus = async (r: AdminReport, status: string) => {
    setWorking(r._id);
    try {
      const updated = await updateReportStatus(r._id, status);
      setReports((prev) =>
        prev.map((x) => (x._id === r._id ? { ...x, status: updated.status } : x)),
      );
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed');
    } finally {
      setWorking(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <NavBar />
        <div className="p-8 text-center">
          <Loader2 className="w-6 h-6 text-purple-500 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (denied) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <NavBar />
        <div className="p-12 text-center max-w-md mx-auto">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Admin access required
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Your account doesn't have admin privileges.
          </p>
          <Link
            href="/"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-full text-sm"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; Icon: any }[] = [
    { key: 'overview', label: 'Overview', Icon: Shield },
    { key: 'users', label: 'Users', Icon: Users },
    { key: 'wings', label: 'Wings', Icon: FileText },
    { key: 'communities', label: 'Communities', Icon: MessageSquare },
    { key: 'reports', label: 'Reports', Icon: Flag },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <NavBar />
      <main className="max-w-4xl mx-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
              <Shield className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Moderation & management</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-14 z-10">
          {tabs.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={
                'flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ' +
                (tab === key
                  ? 'text-red-500 border-red-500'
                  : 'text-gray-600 dark:text-gray-400 border-transparent hover:bg-gray-50 dark:hover:bg-gray-900')
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === 'overview' && stats && (
          <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
            <StatCard label="Total users" value={stats.users.total} sub={`${stats.users.active} active`} color="text-blue-500" />
            <StatCard label="Admins" value={stats.users.admins} color="text-red-500" />
            <StatCard label="Banned" value={stats.users.banned} color="text-red-500" />
            <StatCard label="Wings" value={stats.wings.total} sub={`${stats.wings.published} published`} color="text-purple-500" />
            <StatCard label="Comments" value={stats.comments.total} color="text-green-500" />
            <StatCard label="Communities" value={stats.communities.total} color="text-orange-500" />
            <StatCard label="Reports" value={stats.reports.total} sub={`${stats.reports.pending} pending`} color="text-yellow-500" />
            <StatCard label="Deleted wings" value={stats.wings.deleted} color="text-gray-500" />
          </div>
        )}

        {/* USERS */}
        {tab === 'users' && (
          <div className="p-6">
            <div className="relative mb-4">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="admin-user-search"
                name="user-search"
                type="text"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-9 pr-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm outline-none focus:border-blue-400"
              />
            </div>
            <div className="space-y-2">
              {users.map((u) => (
                <div
                  key={u._id}
                  className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-800 rounded-xl"
                >
                  <Avatar
                    user={{ _id: u._id, username: u.username, name: u.name, avatarUrl: u.avatarUrl }}
                    size="md"
                    linkTo={false}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                        {u.name || u.username}
                      </span>
                      {u.isVerified && <VerifiedBadge size="sm" />}
                      {u.role === 'admin' && (
                        <span className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded">ADMIN</span>
                      )}
                      {!u.isActive && (
                        <span className="text-xs font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">BANNED</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      @{u.username} · {u.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {u.role === 'admin' ? (
                      <button
                        onClick={() => handleSetRole(u, 'user')}
                        disabled={working === u._id}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                        title="Demote to user"
                      >
                        <UserCheck className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSetRole(u, 'admin')}
                        disabled={working === u._id}
                        className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500"
                        title="Promote to admin"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleActive(u)}
                      disabled={working === u._id}
                      className={
                        'p-2 rounded-full ' +
                        (u.isActive
                          ? 'hover:bg-yellow-50 dark:hover:bg-yellow-950/40 text-yellow-500'
                          : 'hover:bg-green-50 dark:hover:bg-green-950/40 text-green-500')
                      }
                      title={u.isActive ? 'Ban user' : 'Unban user'}
                    >
                      {u.isActive ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <p className="text-center text-gray-500 py-8">No users found</p>
              )}
            </div>
          </div>
        )}

        {/* WINGS */}
        {tab === 'wings' && (
          <div className="p-6">
            <div className="relative mb-4">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="admin-wing-search"
                name="wing-search"
                type="text"
                value={wingQuery}
                onChange={(e) => setWingQuery(e.target.value)}
                placeholder="Search wings..."
                className="w-full pl-9 pr-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm outline-none focus:border-blue-400"
              />
            </div>
            <div className="space-y-2">
              {wings.map((w) => (
                <div
                  key={w._id}
                  className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-800 rounded-xl"
                >
                  <div className="flex-1 min-w-0">
                    {w.title && (
                      <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{w.title}</p>
                    )}
                    <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{w.content}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      @{w.author?.username || 'unknown'} · {timeAgo(w.createdAt)} ·{' '}
                      {w.likesCount}❤ {w.commentsCount}💬 {w.views}👁
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteWing(w)}
                    disabled={working === w._id}
                    className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 flex-shrink-0"
                    title="Delete wing"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {wings.length === 0 && (
                <p className="text-center text-gray-500 py-8">No wings found</p>
              )}
            </div>
          </div>
        )}

        {/* COMMUNITIES */}
        {tab === 'communities' && (
          <div className="p-6 space-y-2">
            {communities.map((c) => (
              <div
                key={c._id}
                className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-800 rounded-xl"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center text-xl">
                  {c.emoji || '👥'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                    {c.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {c.membersCount} members · @{c.creator?.username || 'unknown'}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteCommunity(c)}
                  disabled={working === c._id}
                  className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500"
                  title="Delete community"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {communities.length === 0 && (
              <p className="text-center text-gray-500 py-8">No communities</p>
            )}
          </div>
        )}

        {/* REPORTS */}
        {tab === 'reports' && (
          <div className="p-6">
            <div className="flex gap-2 mb-4">
              {['', 'pending', 'reviewing', 'resolved', 'dismissed'].map((s) => (
                <button
                  key={s || 'all'}
                  onClick={() => setReportFilter(s)}
                  className={
                    'px-3 py-1 rounded-full text-xs font-medium capitalize transition ' +
                    (reportFilter === s
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800')
                  }
                >
                  {s || 'All'}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {reports.map((r) => (
                <div
                  key={r._id}
                  className="p-4 border border-gray-200 dark:border-gray-800 rounded-xl"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 dark:text-white text-sm">
                          {r.reason}
                        </span>
                        <span
                          className={
                            'text-xs font-bold uppercase px-1.5 py-0.5 rounded ' +
                            (r.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400'
                              : r.status === 'resolved'
                              ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400')
                          }
                        >
                          {r.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                        {r.description}
                      </p>
                      {r.wing && (
                        <p className="text-xs text-gray-500 mb-1">
                          Wing: {r.wing.title || r.wing.content?.slice(0, 60)}
                        </p>
                      )}
                      <p className="text-xs text-gray-400">
                        Reported by {r.reporter?.username || r.reporterEmail} ·{' '}
                        {timeAgo(r.createdAt)}
                      </p>

                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleReportStatus(r, 'resolved')}
                          disabled={working === r._id || r.status === 'resolved'}
                          className="text-xs font-semibold text-green-600 hover:text-green-700 px-3 py-1 border border-green-200 dark:border-green-800 rounded-full"
                        >
                          Mark resolved
                        </button>
                        <button
                          onClick={() => handleReportStatus(r, 'dismissed')}
                          disabled={working === r._id || r.status === 'dismissed'}
                          className="text-xs font-semibold text-gray-600 hover:text-gray-800 px-3 py-1 border border-gray-200 dark:border-gray-700 rounded-full"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {reports.length === 0 && (
                <p className="text-center text-gray-500 py-8">No reports</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({
  label, value, sub, color,
}: { label: string; value: number; sub?: string; color: string }) {
  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-4">
      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">{label}</p>
      <p className={'text-2xl font-bold ' + color}>{value.toLocaleString()}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}