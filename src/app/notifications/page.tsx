'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { NavBar } from '@/components/NavBar';
import { Avatar } from '@/components/Avatar';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';
import { timeAgo } from '@/lib/time';
import { Heart, MessageCircle, UserPlus, Repeat2, AtSign, DollarSign, Bell, Loader2 } from 'lucide-react';

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'mentions'>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    
    if (user) {
      api.get('/notifications')
        .then(res => {
          setNotifications(res.data);
          // Mark all as read when they open the page
          api.patch('/notifications/read-all').catch(() => {});
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <NavBar />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      </div>
    );
  }

  const filtered = notifications.filter(n => 
    activeTab === 'all' ? true : n.type === 'mention'
  );

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="w-6 h-6 text-red-500 fill-current" />;
      case 'comment': return <MessageCircle className="w-6 h-6 text-blue-500 fill-current" />;
      case 'follow': return <UserPlus className="w-6 h-6 text-purple-500" />;
      case 'repost': return <Repeat2 className="w-6 h-6 text-green-500" />;
      case 'mention': return <AtSign className="w-6 h-6 text-blue-400" />;
      case 'payout': return <DollarSign className="w-6 h-6 text-green-600" />;
      default: return <Bell className="w-6 h-6 text-gray-500" />;
    }
  };

  const getMessage = (n: any) => {
    if (n.type === 'payout') return 'Your payout was processed successfully!';
    
    const name = n.sender?.name || n.sender?.username || 'Someone';
    switch (n.type) {
      case 'like': return <span><strong>{name}</strong> liked your wing.</span>;
      case 'comment': return <span><strong>{name}</strong> commented on your wing.</span>;
      case 'follow': return <span><strong>{name}</strong> followed you.</span>;
      case 'repost': return <span><strong>{name}</strong> reposted your wing.</span>;
      case 'mention': return <span><strong>{name}</strong> mentioned you in a wing.</span>;
      default: return <span><strong>{name}</strong> interacted with you.</span>;
    }
  };

  const getLink = (n: any) => {
    if (n.type === 'follow') return `/profile/${n.sender?._id}`;
    if (n.type === 'payout') return '/creator/earnings';
    if (n.wing) return `/wing/${n.wing._id}`;
    return '#';
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 pb-20">
      <NavBar />
      <main className="max-w-2xl mx-auto">
        <div className="sticky top-14 z-10 bg-white/90 dark:bg-gray-950/90 backdrop-blur border-b border-gray-200 dark:border-gray-800">
          <div className="p-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          </div>
          <div className="flex border-t border-gray-100 dark:border-gray-800/50">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-3 text-sm font-semibold transition border-b-2 ${
                activeTab === 'all' ? 'text-blue-500 border-blue-500' : 'text-gray-500 border-transparent'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('mentions')}
              className={`flex-1 py-3 text-sm font-semibold transition border-b-2 ${
                activeTab === 'mentions' ? 'text-blue-500 border-blue-500' : 'text-gray-500 border-transparent'
              }`}
            >
              Mentions
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
              <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No notifications yet</p>
              <p className="text-sm">When someone interacts with you, it will show up here.</p>
            </div>
          ) : (
            filtered.map((n) => (
              <Link
                key={n._id}
                href={getLink(n)}
                className={`flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition ${
                  !n.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                }`}
              >
                <div className="mt-1 flex-shrink-0">
                  {getIcon(n.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {n.sender && n.type !== 'payout' ? (
                      <Avatar user={n.sender} size="sm" linkTo={false} />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                        <Bell className="w-4 h-4 text-gray-500" />
                      </div>
                    )}
                    <p className="text-sm text-gray-800 dark:text-gray-200">
                      {getMessage(n)}
                    </p>
                  </div>
                  {n.wing && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 pl-10">
                      "{n.wing.title || n.wing.text || 'View post'}"
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2 pl-10">
                    {timeAgo(n.createdAt)}
                  </p>
                </div>
                
                {!n.read && (
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                )}
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
}