'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { NavBar } from '@/components/NavBar';
import { Avatar } from '@/components/Avatar';
import api from '@/lib/api';
import { Mic, PhoneOff, Users } from 'lucide-react';

export default function SpaceRoom() {
  const { id } = useParams();
  const router = useRouter();
  const [space, setSpace] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/spaces/${id}`)
      .then(res => setSpace(res.data))
      .catch(() => alert('Space not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!space) return <div className="p-8 text-center">Space not found.</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <NavBar />
      <main className="max-w-3xl mx-auto p-4 mt-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 text-red-500 rounded-full mb-4 animate-pulse">
            <Mic className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">{space.title}</h1>
          <p className="text-gray-400">Hosted by @{space.host.username}</p>
        </div>

        {/* Host Card */}
        <div className="flex justify-center mb-12">
          <div className="flex flex-col items-center">
            <Avatar user={space.host} size="xl" linkTo={false} />
            <p className="font-semibold mt-3">{space.host.name || space.host.username}</p>
            <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full mt-1 animate-pulse">Speaking</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <button className="p-4 bg-gray-800 rounded-full hover:bg-gray-700 transition">
            <Users className="w-6 h-6" />
          </button>
          <button 
            onClick={() => router.push('/spaces')}
            className="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-full font-semibold transition flex items-center gap-2"
          >
            <PhoneOff className="w-5 h-5" /> Leave Space
          </button>
        </div>
      </main>
    </div>
  );
}