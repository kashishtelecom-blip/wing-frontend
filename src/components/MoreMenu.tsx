'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  List, Users, Rocket, Briefcase, Megaphone, Mic,
  Settings, MoreHorizontal, BadgeCheck, Bookmark,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const MENU_ITEMS = [
  { href: '/bookmarks', label: 'Bookmarks', Icon: Bookmark },
  { href: '/lists', label: 'Lists', Icon: List },
  { href: '/communities', label: 'Communities', Icon: Users },
  { href: '/creator', label: 'Creator Studio', Icon: Rocket },
  { href: '/business', label: 'Business', Icon: Briefcase },
  { href: '/ads', label: 'Ads', Icon: Megaphone },
  { href: '/spaces', label: 'Create your Space', Icon: Mic },
  { href: '/settings', label: 'Settings and privacy', Icon: Settings },
];

export function MoreMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
          open ? 'bg-blue-50 text-blue-500 font-semibold' : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <MoreHorizontal className="w-4 h-4" />
        <span className="hidden sm:inline">More</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 py-3 z-50">
          <Link
            href="/subscribe"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-blue-50 transition text-blue-600 border-b border-gray-100"
          >
            <div className="flex items-center gap-3">
              <BadgeCheck className="w-5 h-5" />
              <span className="font-semibold text-[15px]">Get Verified</span>
            </div>
            <span className="text-xs font-bold bg-blue-500 text-white px-2 py-0.5 rounded">₹199</span>
          </Link>

          {MENU_ITEMS.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-gray-800"
            >
              <Icon className="w-5 h-5 text-gray-700" />
              <span className="font-medium text-[15px]">{label}</span>
            </Link>
          ))}

          <div className="border-t border-gray-100 mt-2 pt-2">
            <button
              onClick={() => { setOpen(false); logout(); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition text-red-600"
            >
              <span className="font-medium text-[15px]">Log out @{user.username}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}