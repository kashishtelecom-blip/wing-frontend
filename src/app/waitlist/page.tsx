'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, Sparkles, Users, ArrowRight } from 'lucide-react';
import api from '@/lib/api';

interface CountResponse {
  count: number;
}

export default function WaitlistPage() {
  const [email, setEmail] = useState('');
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [alreadyOn, setAlreadyOn] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/waitlist/count')
      .then((res) => setCount(res.data?.count ?? 0))
      .catch(() => setCount(0));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/waitlist/join', {
  email: email.trim().toLowerCase(),
});
      setSuccess(true);
      setCount((c) => (c ?? 0) + 1);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      const msgStr = Array.isArray(msg) ? msg.join(', ') : msg || '';
      if (msgStr.toLowerCase().includes('already') || err.response?.status === 409) {
        setAlreadyOn(true);
      } else {
        setError(msgStr || 'Failed to join. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Image
              src="/wing-logo-v2.png"
              alt="Wing"
              width={80}
              height={80}
              priority
              className="object-contain"
            />
          </Link>
        </div>

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Early Access
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-3 leading-tight">
            Join the Wing
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            A new home for your ideas. Post, connect, and build your community
            — all in one place.
          </p>
        </div>

        {/* Live count */}
        {count !== null && count > 0 && (
          <div className="flex items-center justify-center gap-2 mb-8 text-gray-700 dark:text-gray-300">
            <Users className="w-4 h-4 text-blue-500" />
            <span className="text-sm">
              <strong className="text-gray-900 dark:text-white">{count}</strong>{' '}
              {count === 1 ? 'person' : 'people'} already joined
            </span>
          </div>
        )}

        {/* Form card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-6 sm:p-8">
          {success ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-950/50 mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                You&apos;re on the list!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                We&apos;ll email <strong>{email}</strong> when it&apos;s your turn.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600 font-semibold"
              >
                Explore Wing now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : alreadyOn ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-950/50 mb-4">
                <CheckCircle2 className="w-8 h-8 text-blue-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                You&apos;re already on the list
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                <strong>{email}</strong> is already signed up. We&apos;ll be in touch!
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600 font-semibold"
              >
                Explore Wing now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
             
              <div>
                <label htmlFor="waitlist-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email address
                </label>
                <input
                  id="waitlist-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {error && (
                <div className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
              >
                {loading ? 'Joining...' : 'Join the waitlist'}
              </button>
              <p className="text-xs text-gray-400 text-center">
                No spam. Unsubscribe anytime.
              </p>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-500 hover:underline font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}