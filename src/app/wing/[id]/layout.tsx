import type { Metadata } from 'next';

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://wing-backend-zh2o.onrender.com/api';

  try {
    const res = await fetch(`${apiUrl}/wings/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error('Not found');
    const wing = await res.json();

    const title = wing.title || wing.content?.slice(0, 50) || 'A post on Wing';
    const description = wing.content || `Posted by @${wing.author?.username} on Wing`;
    const image = wing.imageUrl || wing.author?.avatarUrl || 'https://wing-frontend.vercel.app/wing-logo-v2.png';

    return {
      title: `${title} — Wing`,
      description: description,
      openGraph: {
        title: title,
        description: description,
        images: [{ url: image }],
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title: title,
        description: description,
        images: [image],
      },
    };
  } catch (err) {
    return {
      title: 'Wing — A new home for your ideas',
    };
  }
}

export default function WingLayout({ children }: Props) {
  return <>{children}</>;
}