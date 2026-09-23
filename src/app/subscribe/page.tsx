'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Crown, Zap, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { NavBar } from '@/components/NavBar';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { getSubscriptionStatus, subscribe, cancelSubscription, SubscriptionStatus } from '@/lib/users';

const BENEFITS = [
  { Icon: VerifiedBadge, text: 'Blue verified badge on your profile' },
  { Icon: Zap, text: 'Priority ranking in replies and search' },
  { Icon: Sparkles, text: 'Early access to new features' },
  { Icon: Crown, text: 'Support independent development' },
];

export default function SubscribePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading || !user) return;
    getSubscriptionStatus()
      .then(setStatus)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  const handleSubscribe = async () => {
    setWorking(true);
    try {
      await subscribe();
      const s = await getSubscriptionStatus();
      setStatus(s);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error(err);
    }
    setWorking(false);
  };

  const handleCancel = async () => {
    if (!confirm('Cancel your subscription? You will lose your verified badge.')) return;
    setWorking(true);
    try {
      await cancelSubscription();
      const s = await getSubscriptionStatus();
      setStatus(s);
    } catch (err) {
      console.error(err);
    }
    setWorking(false);
  };

  if (authLoading || loading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  }

  const isActive = status?.isActive;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <NavBar />
      <main className="max-w-2xl mx-auto p-6">
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
            <p className="text-green-800 font-medium">You&apos;re verified! Welcome to Wing Premium.</p>
          </div>
        )}

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mx-auto flex items-center justify-center mb-4">
            <VerifiedBadge className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Get Verified</h1>
          <p className="text-gray-500 mt-2">Stand out with a blue checkmark and premium features</p>
        </div>

        {isActive ? (
          <div className="border-2 border-blue-500 rounded-2xl p-6 bg-blue-50/50">
            <div className="flex items-center gap-3 mb-4">
              <VerifiedBadge size="lg" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">You&apos;re verified!</h2>
                <p className="text-sm text-gray-600">
                  {status?.daysLeft} days remaining · renews on{' '}
                  {status?.verifiedUntil ? new Date(status.verifiedUntil).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              disabled={working}
              className="text-sm text-red-500 hover:text-red-600 font-medium disabled:opacity-50"
            >
              {working ? 'Processing...' : 'Cancel subscription'}
            </button>
          </div>
        ) : (
          <>
            <div className="border-2 border-blue-500 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                MOST POPULAR
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-4xl font-bold text-gray-900">₹199</span>
                <span className="text-gray-500">/month</span>
              </div>
              <p className="text-sm text-gray-500 mb-6">Cancel anytime</p>

              <div className="space-y-3 mb-6">
                {BENEFITS.map(({ Icon, text }, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {Icon === VerifiedBadge ? (
                      <VerifiedBadge />
                    ) : (
                      <Icon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    )}
                    <span className="text-gray-700">{text}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSubscribe}
                disabled={working}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-full transition disabled:opacity-50"
              >
                {working ? 'Processing payment...' : 'Subscribe for ₹199/month'}
              </button>
              <p className="text-xs text-gray-400 text-center mt-3">
                Mock payment · No real charge yet
              </p>
            </div>

            <div className="mt-6 text-sm text-gray-500 text-center">
              Secure payment · Cancel anytime · Instant activation
            </div>
          </>
        )}
      </main>
    </div>
  );
}