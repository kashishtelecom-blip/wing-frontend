import type { Metadata } from 'next';

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://wing-backend-zh2o.onrender.com/api';

  try {
    const res = await fetch(`${apiUrl}/users/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error('Not found');
    const user = await res.json();

    const title = `${user.name || user.username} (@${user.username}) — Wing`;
    const description = user.bio || `Check out @${user.username}'s profile on Wing`;
    const image = user.avatarUrl || 'https://wing-frontend.vercel.app/wing-logo-v2.png';

    return {
      title: title,
      description: description,
      openGraph: {
        title: title,
        description: description,
        images: [{ url: image }],
        type: 'profile',
        username: user.username,
      },
      twitter: {
        card: 'summary',
        title: title,
        description: description,
        images: [image],
      },
    };
  } catch (err) {
    return {
      title: 'Profile — Wing',
    };
  }
}

export default function ProfileLayout({ children }: Props) {
  return <>{children}</>;
}