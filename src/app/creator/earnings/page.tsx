'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Wallet, Eye, TrendingUp, ArrowLeft, Loader2 } from 'lucide-react';
import { NavBar } from '@/components/NavBar';
import { useAuth } from '@/lib/auth-context';
import { getMyEarnings, CreatorEarnings } from '@/lib/earnings';
import api from '@/lib/api'; // Import api for the payout request

export default function CreatorEarningsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [earnings, setEarnings] = useState<CreatorEarnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPayoutLoading, setIsPayoutLoading] = useState(false); // New state for payout

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading || !user) return;
    getMyEarnings().then(setEarnings).catch(console.error).finally(() => setLoading(false));
  }, [authLoading, user]);

  // New Payout Handler
  const handleRequestPayout = async () => {
    if (!confirm('Are you sure you want to withdraw your available balance?')) return;
    
    setIsPayoutLoading(true);
    try {
      const res = await api.post('/earnings/request-payout');
      alert(`Success! ₹${res.data.amount} is being processed.`);
      
      // Refresh earnings data after successful payout
      const updatedEarnings = await getMyEarnings();
      setEarnings(updatedEarnings);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to request payout.');
    } finally {
      setIsPayoutLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <NavBar />
        <div className="p-8 text-center">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  // Use pendingBalance from the backend
  const balance = earnings?.pendingBalance || 0;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <NavBar />
      <main className="max-w-2xl mx-auto p-4 mt-6 pb-20">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Creator Earnings</h1>
        </div>

        {/* Wallet Card */}
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-6 text-white shadow-xl mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-6 h-6" />
              <span className="font-semibold text-lg">Available Balance</span>
            </div>
          </div>
          <div className="text-5xl font-bold mb-2">
            ₹{balance.toFixed(2)}
          </div>
          <p className="text-blue-100 text-sm mb-6">Minimum ₹500 required to withdraw.</p>
          
          <button 
            onClick={handleRequestPayout}
            disabled={balance < 500 || isPayoutLoading}
            className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPayoutLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              'Request Payout'
            )}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-2 text-gray-500 dark:text-gray-400">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase">Lifetime Earned</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ₹{earnings?.lifetimeEarnings?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-2 text-gray-500 dark:text-gray-400">
              <Eye className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase">Total Views</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {earnings?.totalQualifiedViews?.toLocaleString() || '0'}
            </p>
          </div>
        </div>

        {/* Info box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-100 dark:border-blue-800">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">How earnings work</h3>
          <p className="text-sm text-blue-700 dark:text-blue-400">
            You earn a share of the ad revenue pool based on the qualified views your posts get. Views are tracked automatically as users scroll through their feed. Payouts are processed on the 1st of every month.
          </p>
        </div>
      </main>
    </div>
  );
}