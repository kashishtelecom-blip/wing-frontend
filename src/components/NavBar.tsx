'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bell, Home, Search, MessageCircle, Clock, User, Flame, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme';
import { getUnreadCount } from '@/lib/notifications';
import { MoreMenu } from './MoreMenu';
import { VerifiedBadge } from './VerifiedBadge';
import api from '@/lib/api';
import { getMediaUrl } from '@/lib/media';

export function NavBar() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);
  const [chatUnread, setChatUnread] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try { setUnread(await getUnreadCount()); } catch {}
      try {
        const chatRes = await api.get('/chat/unread-count').catch(() => ({ data: { count: 0 } }));
        setChatUnread(chatRes?.data?.count || 0);
      } catch {}
      try {
        const res = await api.get('/users/me');
        setAvatarUrl(res.data.avatarUrl || '');
        setIsVerified(res.data.isVerified || false);
      } catch {}
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [user, pathname]);

  if (!user) return null;

  const linkClass = (path: string) =>
    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition text-sm ' +
    (pathname === path
      ? 'bg-blue-50 text-blue-500 font-semibold dark:bg-blue-950/50 dark:text-blue-400'
      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800');

  return (
    <header className="border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur z-30">
      <div className="max-w-3xl mx-auto px-3 py-2.5 flex items-center justify-between gap-2">
           <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="logo-wrap">
            <Image src="/wing-logo-v2.png" alt="Wing" width={30} height={30} className="object-contain" />
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white hidden sm:inline">Wing</span>
        </Link>

        <nav className="flex items-center gap-0.5">
          <Link href="/" className={linkClass('/')} title="Home">
            <Home className="w-4 h-4" />
            <span className="hidden md:inline">Home</span>
          </Link>
          <Link href="/search" className={linkClass('/search')} title="Search">
            <Search className="w-4 h-4" />
            <span className="hidden md:inline">Search</span>
          </Link>
          <Link href="/trending" className={linkClass('/trending')} title="Trending">
            <Flame className="w-4 h-4" />
            <span className="hidden md:inline">Trending</span>
          </Link>
          <Link href="/notifications" className={linkClass('/notifications') + ' relative'} title="Alerts">
            <Bell className="w-4 h-4" />
            <span className="hidden md:inline">Alerts</span>
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Link>
          <Link href="/chat" className={linkClass('/chat') + ' relative'} title="Chat">
            <MessageCircle className="w-4 h-4" />
            <span className="hidden md:inline">Chat</span>
            {chatUnread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-blue-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                {chatUnread > 9 ? '9+' : chatUnread}
              </span>
            )}
          </Link>
          <Link href="/history" className={linkClass('/history')} title="History">
            <Clock className="w-4 h-4" />
            <span className="hidden md:inline">History</span>
          </Link>
          <Link href={'/profile/' + user.userId} className={linkClass('/profile/' + user.userId)} title="Profile">
            <User className="w-4 h-4" />
            <span className="hidden md:inline">Profile</span>
          </Link>
          <MoreMenu />
        </nav>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            title="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-yellow-400" />
            ) : (
              <Moon className="w-4 h-4 text-gray-600" />
            )}
          </button>
          <Link href={'/profile/' + user.userId} className="flex items-center gap-1.5 hover:opacity-80 transition">
            {avatarUrl ? (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src={getMediaUrl(avatarUrl)}
    alt={user.username}
    className="w-7 h-7 rounded-full object-cover"
    onError={(e) => {
      const target = e.target as HTMLImageElement;
      target.style.display = 'none';
      const fallback = target.nextElementSibling as HTMLElement | null;
      if (fallback) fallback.style.display = 'flex';
    }}
  />
) : null}
<div
  className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold"
  style={{ display: avatarUrl ? 'none' : 'flex' }}
>
  {user.username?.[0]?.toUpperCase() || '?'}
</div>
            <span className="text-sm text-gray-700 dark:text-gray-300 hidden lg:inline">@{user.username}</span>
            {isVerified && <VerifiedBadge size="sm" />}
          </Link>
        </div>
      </div>
    </header>
  );
}