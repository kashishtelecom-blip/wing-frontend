'use client';

import Link from 'next/link';
import { Fragment } from 'react';

interface Props {
  text: string;
  className?: string;
}

// Matches @username or #hashtag
const TOKEN_REGEX = /(@[a-zA-Z0-9_]+|#[a-zA-Z0-9_]+)/g;

export function RichText({ text, className = '' }: Props) {
  if (!text) return null;

  const parts = text.split(TOKEN_REGEX);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith('@') && part.length > 1) {
          const username = part.slice(1);
          return (
            <Link
              key={i}
              href={'/u/' + username}
              onClick={(e) => e.stopPropagation()}
              className="text-blue-500 hover:underline font-medium"
            >
              {part}
            </Link>
          );
        }
        if (part.startsWith('#') && part.length > 1) {
          const tag = part.slice(1).toLowerCase();
          return (
            <Link
              key={i}
              href={'/hashtag/' + tag}
              onClick={(e) => e.stopPropagation()}
              className="text-blue-500 hover:underline font-medium"
            >
              {part}
            </Link>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </span>
  );
}