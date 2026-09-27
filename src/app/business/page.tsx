'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, BarChart3, Users, Zap, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { NavBar } from '@/components/NavBar';
import api from '@/lib/api';
import { joinWaitlist, checkWaitlist, getWaitlistCount } from '@/lib/waitlist';

export default function BusinessPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [onWaitlist, setOnWaitlist] = useState(false);
  const [totalWaitlist, setTotalWaitlist] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading || !user) return;
    Promise.all([
      checkWaitlist().catch(() => ({ onWaitlist: false })),
      getWaitlistCount().catch(() => ({ total: 0 })),
    ])
      .then(([check, count]) => {
        setOnWaitlist(check.onWaitlist);
        setTotalWaitlist(count.total);
      })
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  const handleJoinWaitlist = async () => {
    if (!user || joining) return;
    setJoining(true);
    setError('');
    try {
      // Get user email from /users/me
      const meRes = await api.get('/users/me');
      const email = meRes.data.email;
      const result = await joinWaitlist(email);
      setOnWaitlist(true);
      setSuccessMsg(result.message || 'Added to waitlist!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to join waitlist');
    } finally {
      setJoining(false);
    }
  };

  if (authLoading || loading || !user) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <NavBar />
        <div className="p-8 text-center">
          <Loader2 className="w-6 h-6 text-slate-500 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  const features = [
    { Icon: BarChart3, title: 'Advanced analytics', desc: 'Deep insights into your audience and content performance' },
    { Icon: Users, title: 'Team management', desc: 'Multiple contributors, roles, and approval workflows' },
    { Icon: Zap, title: 'Bulk tools', desc: 'Schedule posts, manage multiple accounts, and more' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <NavBar />
      <main className="max-w-2xl mx-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-slate-700 dark:text-slate-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Business</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Tools for teams and organizations</p>
            </div>
          </div>

          {totalWaitlist !== null && (
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              <strong className="text-gray-900 dark:text-white">{totalWaitlist}</strong> people already on the waitlist
            </p>
          )}
        </div>

        <div className="p-6 space-y-3">
          {features.map(({ Icon, title, desc }) => (
            <div key={title} className="border border-gray-200 dark:border-gray-800 rounded-2xl p-5 flex gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 pb-6">
          {successMsg && (
            <div className="mb-3 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 p-3 rounded-lg text-sm flex items-center gap-2">
              <Check className="w-4 h-4" /> {successMsg}
            </div>
          )}
          {error && (
            <div className="mb-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {onWaitlist ? (
            <div className="w-full bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 font-semibold py-3 rounded-full text-center flex items-center justify-center gap-2">
              <Check className="w-5 h-5" /> You&apos;re on the waitlist
            </div>
          ) : (
            <button
              onClick={handleJoinWaitlist}
              disabled={joining}
              className="w-full bg-slate-900 hover:bg-black dark:bg-white dark:text-slate-900 dark:hover:bg-gray-100 text-white font-semibold py-3 rounded-full transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {joining ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Joining...
                </>
              ) : (
                'Join the waitlist'
              )}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}