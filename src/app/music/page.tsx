'use client';

import { useState } from 'react';
import { Search, Play, Pause, Music as MusicIcon } from 'lucide-react';
import { NavBar } from '@/components/NavBar';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

interface Track {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100: string;
  previewUrl: string;
}

export default function MusicPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [searching, setSearching] = useState(false);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  if (!loading && !user) {
    router.push('/login');
    return null;
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    try {
      // Using the free iTunes Search API (no API key needed)
      const res = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=25`
      );
      const data = await res.json();
      setTracks(data.results.filter((t: any) => t.previewUrl));
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setSearching(false);
    }
  };

  const togglePlay = (track: Track) => {
    if (playingId === track.trackId) {
      audio?.pause();
      setPlayingId(null);
      return;
    }

    if (audio) audio.pause();
    const newAudio = new Audio(track.previewUrl);
    newAudio.play();
    newAudio.onended = () => setPlayingId(null);
    setAudio(newAudio);
    setPlayingId(track.trackId);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <NavBar />
      <main className="max-w-2xl mx-auto p-4">
        <div className="flex items-center gap-2 mb-6">
          <MusicIcon className="w-6 h-6 text-blue-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Discover Music</h1>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Bollywood, J-Pop, Arijit Singh, Yoasobi..."
            className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 dark:text-white rounded-full outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={searching}
            className="bg-blue-500 hover:bg-blue-600 text-white p-2.5 rounded-full transition disabled:opacity-50"
          >
            <Search className="w-5 h-5" />
          </button>
        </form>

        {searching ? (
          <div className="text-center text-gray-500 py-10">Searching iTunes...</div>
        ) : tracks.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-10">
            Search for a song to listen to a 30-second preview.
          </div>
        ) : (
          <div className="space-y-2">
            {tracks.map((track) => (
              <div
                key={track.trackId}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
                onClick={() => togglePlay(track)}
              >
                {/* Album Art */}
                <div className="relative w-12 h-12 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={track.artworkUrl100}
                    alt={track.trackName}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  {/* Play/Pause Overlay */}
                  <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                    {playingId === track.trackId ? (
                      <Pause className="w-5 h-5 text-white fill-current" />
                    ) : (
                      <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                    )}
                  </div>
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">
                    {track.trackName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {track.artistName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}