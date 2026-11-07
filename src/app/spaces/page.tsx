'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, Headphones, Radio, Users, Loader2, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { NavBar } from '@/components/NavBar';
import api from '@/lib/api';

export default function SpacesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const handleStartSpace = async () => {
    if (!title.trim()) return setError('Please enter a title');
    
    setCreating(true);
    setError('');

    try {
      const res = await api.post('/spaces', { title });
      router.push(`/spaces/${res.data._id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to create space. Is the backend running?');
      setCreating(false);
    }
  };

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <NavBar />
      <main className="max-w-2xl mx-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-pink-50 dark:bg-pink-900/30 flex items-center justify-center">
              <Mic className="w-6 h-6 text-pink-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Spaces</h1>
              <p className="text-sm text-gray-500">Live audio conversations</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl p-8 text-white text-center">
            <div className="w-16 h-16 rounded-full bg-white/20 mx-auto flex items-center justify-center mb-4">
              <Radio className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Host a Space</h2>
            <p className="text-sm opacity-90 mb-6 max-w-md mx-auto">
              Start a live audio conversation. Invite speakers, take listeners, and grow your community in real time.
            </p>
            
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-white text-pink-600 font-semibold py-3 px-8 rounded-full hover:bg-gray-100 transition"
            >
              Start a Space
            </button>
          </div>
        </div>

        <div className="px-6 pb-6 grid grid-cols-2 gap-3">
          {[
            { Icon: Users, label: 'Unlimited listeners', desc: 'Bring your whole community' },
            { Icon: Headphones, label: 'Speaker slots', desc: 'Invite up to 10 speakers' },
          ].map(({ Icon, label, desc }) => (
            <div key={label} className="border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
              <Icon className="w-5 h-5 text-pink-500 mb-2" />
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Start a Space</h2>
            <p className="text-sm text-gray-500 mb-4">Give your live audio room a title.</p>
            
            {error && <p className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded">{error}</p>}

            <input
              type="text"
              placeholder="e.g. Late Night Tech Talk"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 mb-4"
              autoFocus
            />

            <button
              onClick={handleStartSpace}
              disabled={creating}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {creating ? 'Starting...' : 'Start Room'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}