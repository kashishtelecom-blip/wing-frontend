'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { NavBar } from '@/components/NavBar';
import { Avatar } from '@/components/Avatar';
import api from '@/lib/api';
import { useSocket } from '@/lib/socket-context';
import { useAuth } from '@/lib/auth-context';
import { Mic, PhoneOff, Users, Loader2 } from 'lucide-react';

export default function SpaceRoom() {
  const { id } = useParams();
  const router = useRouter();
  const { socket } = useSocket();
  const { user } = useAuth();
  
  const [space, setSpace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [listeners, setListeners] = useState<any[]>([]);

  useEffect(() => {
    api.get(`/spaces/${id}`)
      .then(res => setSpace(res.data))
      .catch(() => alert('Space not found'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!socket || !id || !user || loading) return;

    // Join the socket room when the page loads
    socket.emit('join-space', { 
      spaceId: id, 
      user: { 
        _id: user.userId, 
        username: user.username, 
        name: user.name, 
        avatarUrl: user.avatarUrl 
      } 
    });

    // Listen for updates
    const handleListenersUpdate = (updatedListeners: any[]) => {
      setListeners(updatedListeners);
    };

    socket.on('listeners-updated', handleListenersUpdate);

    // Cleanup when leaving the page
    return () => {
      socket.emit('leave-space', { spaceId: id });
      socket.off('listeners-updated', handleListenersUpdate);
    };
  }, [socket, id, user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  if (!space) return <div className="p-8 text-center text-white bg-gray-950 min-h-screen">Space not found.</div>;

  // Filter out the host from the listeners list so we don't show them twice
  const otherListeners = listeners.filter(l => l._id !== space.host._id);

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-20">
      <NavBar />
      <main className="max-w-3xl mx-auto p-4 mt-10">
        
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500/20 text-red-500 rounded-full mb-6 animate-pulse">
            <Mic className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold mb-2">{space.title}</h1>
          <p className="text-gray-400">Hosted by @{space.host.username}</p>
        </div>

        {/* Host Card */}
        <div className="flex justify-center mb-12">
          <div className="flex flex-col items-center bg-gray-900 p-6 rounded-2xl border border-gray-800 min-w-[150px]">
            <Avatar user={space.host} size="xl" linkTo={false} />
            <p className="font-semibold mt-3 text-lg">{space.host.name || space.host.username}</p>
            <span className="text-xs font-bold bg-red-500 text-white px-3 py-1 rounded-full mt-2 animate-pulse">
              Speaking...
            </span>
          </div>
        </div>

        {/* Listeners Section */}
        {otherListeners.length > 0 && (
          <div className="mb-12">
            <h3 className="text-center text-gray-400 mb-4 flex items-center justify-center gap-2">
              <Users className="w-4 h-4" /> {otherListeners.length} Listener{otherListeners.length > 1 ? 's' : ''}
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              {otherListeners.map((listener) => (
                <div key={listener.socketId} className="flex flex-col items-center">
                  <Avatar user={listener} size="md" linkTo={false} />
                  <p className="text-xs text-gray-400 mt-2">@{listener.username}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <button className="p-4 bg-gray-800 rounded-full hover:bg-gray-700 transition" title="View Listeners">
            <Users className="w-6 h-6" />
          </button>
          <button 
            onClick={() => router.push('/spaces')}
            className="px-8 py-3 bg-red-500 hover:bg-red-600 rounded-full font-bold transition flex items-center gap-2 text-white"
          >
            <PhoneOff className="w-5 h-5" /> Leave Space
          </button>
        </div>

      </main>
    </div>
  );
}