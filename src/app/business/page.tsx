'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Building2, Loader2 } from 'lucide-react';
import { NavBar } from '@/components/NavBar';
import { useAuth } from '@/lib/auth-context';
import { getMyBusinessPages, BusinessPage } from '@/lib/business';
import { useRouter } from 'next/navigation';

export default function MyBusinessPages() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [pages, setPages] = useState<BusinessPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading || !user) return;
    getMyBusinessPages()
      .then(setPages)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <NavBar />
        <div className="p-8 text-center">
          <Loader2 className="w-6 h-6 text-slate-500 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <NavBar />
      <main className="max-w-2xl mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6" /> My Pages
          </h1>
          <Link
            href="/business/create"
            className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1 hover:bg-blue-600 transition"
          >
            <Plus className="w-4 h-4" /> Create Page
          </Link>
        </div>

        {pages.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-xl">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              You don't own any pages yet.
            </p>
            <Link
              href="/business/create"
              className="text-blue-500 hover:underline font-semibold"
            >
              Create your first page
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {pages.map((p) => (
              <Link
                key={p._id}
                href={`/business/${p.slug}`}
                className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold dark:text-white">{p.name}</p>
                  <p className="text-xs text-gray-500">
                    @{p.slug} · {p.followers?.length || 0} followers
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}