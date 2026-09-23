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
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-20 h-20 text-3xl',
};

export function Avatar({ user, size = 'md', linkTo = true, className = '' }: Props) {
  const sizeClass = sizes[size];
  const inner = user.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={getMediaUrl(user.avatarUrl)}
      alt={user.username}
      className={`${sizeClass} rounded-full object-cover flex-shrink-0 ${className}`}
    />
  ) : (
    <div
      className={`${sizeClass} rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0 ${className}`}
    >
      {user.username?.[0]?.toUpperCase() || '?'}
    </div>
  );

  if (linkTo && user._id) {
    return <Link href={`/profile/${user._id}`}>{inner}</Link>;
  }
  return inner;
}