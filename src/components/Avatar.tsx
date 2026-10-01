'use client';

import Link from 'next/link';
import { getMediaUrl } from '@/lib/media';

interface Props {
  user: { _id?: string; username: string; name?: string; avatarUrl?: string };
  size?: 'sm' | 'md' | 'lg' | 'xl';
  linkTo?: boolean;
  className?: string;
}

const sizes = {
  sm: { class: 'w-8 h-8 text-sm', px: 32 },
  md: { class: 'w-10 h-10 text-base', px: 40 },
  lg: { class: 'w-12 h-12 text-lg', px: 48 },
  xl: { class: 'w-20 h-20 text-3xl', px: 80 },
};

export function Avatar({ user, size = 'md', linkTo = true, className = '' }: Props) {
  const s = sizes[size];
  const inner = user.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={getMediaUrl(user.avatarUrl)}
      alt={user.username || 'avatar'}
      width={s.px}
      height={s.px}
      loading="lazy"
      className={`${s.class} rounded-full object-cover flex-shrink-0 ${className}`}
    />
  ) : (
    <div
      className={`${s.class} rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0 ${className}`}
    >
      {user.username?.[0]?.toUpperCase() || '?'}
    </div>
  );

  if (linkTo && user._id) {
    return <Link href={`/profile/${user._id}`}>{inner}</Link>;
  }
  return inner;
}