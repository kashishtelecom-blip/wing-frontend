'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, BarChart3, Users, Zap } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { NavBar } from '@/components/NavBar';

export default function BusinessPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  }

  const features = [
    { Icon: BarChart3, title: 'Advanced analytics', desc: 'Deep insights into your audience and content performance' },
    { Icon: Users, title: 'Team management', desc: 'Multiple contributors, roles, and approval workflows' },
    { Icon: Zap, title: 'Bulk tools', desc: 'Schedule posts, manage multiple accounts, and more' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      <main className="max-w-2xl mx-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-slate-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Business</h1>
              <p className="text-sm text-gray-500">Tools for teams and organizations</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-3">
          {features.map(({ Icon, title, desc }) => (
            <div key={title} className="border border-gray-200 rounded-2xl p-5 flex gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500 mt-1">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 pb-6">
          <button className="w-full bg-slate-900 hover:bg-black text-white font-semibold py-3 rounded-full">
            Join the waitlist
          </button>
        </div>
      </main>
    </div>
  );
}