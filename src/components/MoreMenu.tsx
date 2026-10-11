'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  List, Users, Rocket, Briefcase, Megaphone, Mic,
  Settings, MoreHorizontal, BadgeCheck, Bookmark, Sparkles, Shield,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';

export function MoreMenu() {
  const t = useTranslations('nav');
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const isAdmin = (user as any)?.role === 'admin';

  const MENU_ITEMS = [
    { href: '/bookmarks', label: t('bookmarks'), Icon: Bookmark },
    { href: '/lists', label: t('lists'), Icon: List },
    { href: '/communities', label: t('communities'), Icon: Users },
    { href: '/creator', label: t('creator'), Icon: Rocket },
    { href: '/business', label: t('business'), Icon: Briefcase },
    { href: '/ads', label: t('ads'), Icon: Megaphone },
    { href: '/spaces', label: t('spaces'), Icon: Mic },
    { href: '/waitlist', label: t('invite'), Icon: Sparkles },
    { href: '/settings', label: t('settings'), Icon: Settings },
  ];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition text-sm ${
          open ? 'bg-blue-50 text-blue-500 font-semibold dark:bg-blue-950/50' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
        }`}
      >
        <MoreHorizontal className="w-4 h-4" />
        <span className="hidden sm:inline">{t('more')}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 py-3 z-50">
          <Link
            href="/subscribe"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition text-blue-600 dark:text-blue-400 border-b border-gray-100 dark:border-gray-800"
          >
            <div className="flex items-center gap-3">
              <BadgeCheck className="w-5 h-5" />
              <span className="font-semibold text-[15px]">{t('getVerified')}</span>
            </div>
            <span className="text-xs font-bold bg-blue-500 text-white px-2 py-0.5 rounded">₹199</span>
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-950/40 transition text-red-600 dark:text-red-400 border-b border-gray-100 dark:border-gray-800"
            >
              <Shield className="w-5 h-5" />
              <span className="font-medium text-[15px]">{t('adminPanel')}</span>
            </Link>
          )}

          {MENU_ITEMS.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-gray-800 dark:text-gray-200"
            >
              <Icon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <span className="font-medium text-[15px]">{label}</span>
            </Link>
          ))}

          <div className="border-t border-gray-100 dark:border-gray-800 mt-2 pt-2">
            <button
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-950/40 transition text-red-600 dark:text-red-400"
            >
              <span className="font-medium text-[15px]">Log out @{user.username}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}