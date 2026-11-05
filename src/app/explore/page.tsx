'use client';

import { useEffect, useState } from 'react';
import { NavBar } from '@/components/NavBar';
import { WingCard } from '@/components/WingCard';
import { getTrendingHashtags, getTrendingPosts } from '@/lib/wings';
import { Loader2, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function ExplorePage() {
  const [hashtags, setHashtags] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tagsData, postsData] = await Promise.all([
          getTrendingHashtags(),
          getTrendingPosts()
        ]);
        setHashtags(tagsData);
        setPosts(postsData);
      } catch (err) {
        console.error('Failed to load explore data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <NavBar />
        <div className="p-8 text-center">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 pb-20">
      <NavBar />
      <main className="max-w-5xl mx-auto p-4 mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Trending Posts */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-6 h-6 text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trending on Wing</h1>
          </div>
          
          <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
            {posts.map((post) => (
              <WingCard key={post._id} wing={post} />
            ))}
            {posts.length === 0 && (
              <p className="text-center text-gray-500 p-8">No trending posts yet.</p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Trending Hashtags */}
        <div className="hidden md:block">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 sticky top-20">
            <h2 className="font-bold text-gray-900 dark:text-white mb-4">Trending Hashtags</h2>
            <div className="space-y-3">
              {hashtags.map((tag, index) => (
                <Link 
                  key={tag._id} 
                  href={`/search?q=%23${tag._id}`}
                  className="block hover:bg-white dark:hover:bg-gray-800 p-2 rounded-lg transition"
                >
                  <p className="text-xs text-gray-500">#{index + 1} Trending</p>
                  <p className="font-semibold text-gray-900 dark:text-white">#{tag._id}</p>
                  <p className="text-xs text-gray-400">{tag.count} posts</p>
                </Link>
              ))}
              {hashtags.length === 0 && (
                <p className="text-sm text-gray-500">No hashtags trending right now.</p>
              )}
            </div>
          </div>
        </div>
        
      </main>
    </div>
  );
}