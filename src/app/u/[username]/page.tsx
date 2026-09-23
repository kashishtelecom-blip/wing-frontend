'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';

export default function UsernameRedirect() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [error, setError] = useState('');

  const username = (params.username as string) || '';

  useEffect(() => {
    if (authLoading || !user || !username) return;
    (async () => {
      try {
        const res = await api.get('/search/users?q=' + encodeURIComponent(username) + '&limit=20');
        const list = res.data || [];
        const match = list.find((u: any) => u.username.toLowerCase() === username.toLowerCase());
        if (match) {
          router.replace('/profile/' + match._id);
        } else {
          setError('User not found');
        }
      } catch (err) {
        setError('User not found');
      }
    })();
  }, [authLoading, user, username, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        {error}
      </div>
    );
  }
  return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">
      Finding @{username}...
    </div>
  );
}