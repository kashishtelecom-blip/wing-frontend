'use client';
import { useState } from 'react';
import api from '@/lib/api';

// Inside your component:
const [isRequesting, setIsRequesting] = useState(false);

const handleRequestPayout = async () => {
  if (!confirm('Are you sure you want to request a payout? This will reset your available balance.')) return;
  
  setIsRequesting(true);
  try {
    const res = await api.post('/earnings/request-payout');
    alert(`Success! ₹${res.data.amount} has been sent to your bank account.`);
    // Refresh the page data
    window.location.reload(); 
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to request payout.');
  } finally {
    setIsRequesting(false);
  }
};

// Update the button in your JSX:
<button 
  onClick={handleRequestPayout}
  disabled={availableBalance < 500 || isRequesting}
  className={`w-full py-3 rounded-xl font-semibold transition ${
    availableBalance >= 500 
      ? 'bg-white text-purple-600 hover:bg-gray-100 shadow-lg' 
      : 'bg-white/20 text-white/50 cursor-not-allowed'
  }`}
>
  {isRequesting ? 'Processing...' : 'Request Payout'}
</button>