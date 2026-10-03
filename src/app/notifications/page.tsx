'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, MessageCircle, UserPlus, Repeat2, AtSign } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { NavBar } from '@/components/NavBar';
import { getNotifications, markAllRead, Notification } from '@/lib/notifications';
import { timeAgo } from '@/lib/time';

const icons = {
  like: { Icon: Heart, color: 'text-red-500', label: 'liked your wing' },
  comment: { Icon: MessageCircle, color: 'text-blue-500', label: 'commented on your wing' },
  follow: { Icon: UserPlus, color: 'text-purple-500', label: 'followed you' },
  repost: { Icon: Repeat2, color: 'text-green-500', label: 'reposted your wing' },
  mention: { Icon: AtSign, color: 'text-blue-500', label: 'mentioned you' },
};

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading || !user) return;
    getNotifications()
      .then(setNotifications)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      setNotifications((ns) => ns.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <NavBar />
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <NavBar />
      <main className="max-w-2xl mx-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          {hasUnread && (
            <button
              onClick={handleMarkAllRead}
              className="text-sm text-blue-500 hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No notifications yet. When someone likes, comments, follows, or mentions you, it will show up here.
          </div>
        ) : (
          notifications.map((n) => {
            const meta = icons[n.type] || icons.like;
            const Icon = meta.Icon;
            const rowClass =
              'flex gap-3 p-4 border-b border-gray-100 dark:border-gray-800 ' +
              (n.read ? '' : 'bg-blue-50/40 dark:bg-blue-950/30');
            const iconClass =
              'w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 ' +
              meta.color;
            return (
              <div key={n._id} className={rowClass}>
                <Link href={'/profile/' + n.sender._id} className="flex-shrink-0">
                  <div className={iconClass}>
                    <Icon className="w-5 h-5" />
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    <Link
                      href={'/profile/' + n.sender._id}
                      className="font-semibold text-gray-900 dark:text-white hover:underline"
                    >
                      {n.sender.name || n.sender.username}
                    </Link>{' '}
                    <span className="text-gray-600 dark:text-gray-400">{meta.label}</span>
                    {n.wing && (
                      <>
                        {' '}
                        <span className="text-gray-400">·</span>{' '}
                        <Link
                          href={'/wing/' + n.wing._id}
                          className="text-blue-500 hover:underline"
                        >
                          &ldquo;{n.wing.title}&rdquo;
                        </Link>
                      </>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {timeAgo(n.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}