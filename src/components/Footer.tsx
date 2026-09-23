'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Footer() {
  const pathname = usePathname();

  // Don't show footer on full-screen pages
  if (pathname === '/chat') return null;

  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 mt-12 py-6 px-4 text-center text-xs text-gray-500 dark:text-gray-400">
      <div className="max-w-2xl mx-auto space-y-2">
        <p className="font-semibold text-gray-700 dark:text-gray-300">
          &copy; {year} Wing. All rights reserved.
        </p>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          <Link href="/terms" className="hover:underline hover:text-blue-500">Terms of Service</Link>
          <Link href="/privacy" className="hover:underline hover:text-blue-500">Privacy Policy</Link>
          <Link href="/copyright" className="hover:underline hover:text-blue-500">Copyright / DMCA</Link>
        </div>
        <p className="text-[10px] text-gray-400 dark:text-gray-500">
          User content is owned by its original author. Wing claims no ownership over your posts.
        </p>
      </div>
    </footer>
  );
}