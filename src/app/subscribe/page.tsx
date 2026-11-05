'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';
import { NavBar } from '@/components/NavBar';
import { BadgeCheck, Check, Loader2, ShieldCheck, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SubscribePage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  if (!authLoading && !user) {
    router.push('/login');
    return null;
  }

  const handlePayment = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data: order } = await api.post('/payments/create-order', { amount: 199 });

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Wing',
        description: 'Verified Badge (1 Month)',
        order_id: order.id,
        handler: async function (response: any) {
          try {
            await api.post('/payments/verify', {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            
            setSuccess(true);
            await refreshUser(); 
            
            setTimeout(() => {
              window.location.href = '/'; 
            }, 2000);
            
          } catch (err: any) {
            console.error("Verification error:", err.response?.data || err.message);
            alert(`Payment verification failed: ${err.response?.data?.message || 'Please contact support.'}`);
            setLoading(false);
          }
        },
        prefill: {
          name: user.username,
          email: user.email,
        },
        theme: {
          color: '#3b82f6',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      
      rzp.on('payment.failed', function (response: any) {
        alert(`Payment failed: ${response.error.description}`);
      });
      
      rzp.open();
    } catch (err) {
      console.error(err);
      alert('Failed to initiate payment. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your blue tick? You will lose your verified status immediately.')) return;
    
    setCancelling(true);
    try {
      await api.delete('/users/me/subscribe');
      await refreshUser();
      alert('Subscription cancelled successfully.');
    } catch (err) {
      alert('Failed to cancel subscription.');
    } finally {
      setCancelling(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col items-center justify-center p-4">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
          <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">You are Verified!</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Your account has been successfully upgraded.</p>
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <p className="text-sm text-gray-400 mt-2">Refreshing your profile...</p>
      </div>
    );
  }

  // --- NEW: If the user is already verified, show this screen instead of the payment form ---
  if (user?.isVerified) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <NavBar />
        <main className="max-w-xl mx-auto p-6 mt-10 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-6">
            <BadgeCheck className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">You are Verified</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Your account has an active blue tick. Thank you for supporting Wing!
          </p>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800">
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-3.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {cancelling ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
              {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
            </button>
            <p className="text-xs text-gray-400 mt-3">
              If you cancel, your blue tick will be removed immediately and you will not be charged again.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // --- If NOT verified, show the original payment screen ---
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <NavBar />
      <main className="max-w-xl mx-auto p-6 mt-10">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
            <BadgeCheck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Get Verified</h1>
          <p className="text-gray-500 dark:text-gray-400">Stand out from the crowd with a blue checkmark.</p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800">
          <div className="flex items-baseline justify-center gap-1 mb-6">
            <span className="text-4xl font-bold text-gray-900 dark:text-white">₹199</span>
            <span className="text-gray-500 dark:text-gray-400">/ month</span>
          </div>

          <ul className="space-y-4 mb-8">
            {[
              'Official blue tick next to your name',
              'Stand out in comments and search results',
              'Priority support',
              'Support the development of Wing',
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                </div>
                {feature}
              </li>
            ))}
          </ul>

          <button
            onClick={handlePayment}
            disabled={loading || authLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Processing...
              </>
            ) : (
              'Subscribe Now'
            )}
          </button>
          
          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 mt-4">
            <ShieldCheck className="w-4 h-4" /> Secure payment via Razorpay
          </div>
        </div>
      </main>
    </div>
  );
}