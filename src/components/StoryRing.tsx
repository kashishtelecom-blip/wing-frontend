'use client';

import { useEffect, useState, useRef } from 'react';
import { Plus, Search, X, Music as MusicIcon } from 'lucide-react';
import { getStoriesFeed, GroupedStories, uploadStoryMedia, createStory, StoryMusic } from '@/lib/stories';
import { Avatar } from './Avatar';

interface Props {
  onOpenStory: (groups: GroupedStories[], initialGroupIndex: number) => void;
}

export function StoryRing({ onOpenStory }: Props) {
  const [groups, setGroups] = useState<GroupedStories[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedMusic, setSelectedMusic] = useState<StoryMusic | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    getStoriesFeed().then(setGroups).finally(() => setLoading(false));
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSearchMusic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&entity=song&limit=10`);
      const data = await res.json();
      setSearchResults(data.results.filter((t: any) => t.previewUrl));
    } catch (err) {}
  };

  const handlePostStory = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const { mediaUrl } = await uploadStoryMedia(selectedFile);
      const isVideo = selectedFile.type.startsWith('video/');
      
      await createStory(mediaUrl, isVideo ? 'video' : 'image', selectedMusic || undefined);
      
      const newGroups = await getStoriesFeed();
      setGroups(newGroups);
      
      // Reset
      setSelectedFile(null);
      setSelectedMusic(null);
      setSearchResults([]);
      setSearchQuery('');
    } catch (err) {
      console.error(err);
      alert('Failed to upload story');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return null;

  return (
    <>
      <div className="flex gap-3 overflow-x-auto p-4 border-b border-gray-200 dark:border-gray-800 scrollbar-hide">
        <div className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <Plus className="w-6 h-6 text-gray-500" />
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Add Story</span>
          <input type="file" accept="image/*,video/*" hidden ref={fileInputRef} onChange={handleFileSelect} />
        </div>

        {groups.map((group, i) => (
          <div key={group.author._id} className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer" onClick={() => onOpenStory(groups, i)}>
            <div className={`p-[2px] rounded-full ${group.hasUnseen ? 'bg-gradient-to-tr from-yellow-400 to-pink-600' : 'bg-gray-300 dark:bg-gray-700'}`}>
              <div className="bg-white dark:bg-gray-950 p-1 rounded-full">
                <Avatar user={group.author} size="md" linkTo={false} />
              </div>
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 w-16 truncate text-center">
              {group.author.username}
            </span>
          </div>
        ))}
      </div>

      {/* CREATE STORY MODAL */}
      {selectedFile && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 dark:text-white">Create Story</h3>
              <button onClick={() => { setSelectedFile(null); setSelectedMusic(null); }} className="text-gray-500"><X /></button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto">
              {/* File Preview */}
              <div className="bg-gray-100 dark:bg-gray-800 rounded-xl h-40 flex items-center justify-center overflow-hidden mb-4">
                {selectedFile.type.startsWith('video/') ? (
                  <video src={URL.createObjectURL(selectedFile)} className="h-full object-contain" autoPlay muted loop />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={URL.createObjectURL(selectedFile)} alt="preview" className="h-full object-contain" />
                )}
              </div>

              {/* Music Search */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <MusicIcon className="w-4 h-4 text-pink-500" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Add Music</span>
                </div>

                {selectedMusic ? (
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={selectedMusic.artworkUrl} className="w-8 h-8 rounded" alt="art" />
                      <div className="truncate">
                        <p className="text-xs font-bold truncate dark:text-white">{selectedMusic.title}</p>
                        <p className="text-[10px] text-gray-500 truncate">{selectedMusic.artist}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedMusic(null)} className="text-red-500 text-xs font-semibold px-2">Remove</button>
                  </div>
                ) : (
                  <>
                    <form onSubmit={handleSearchMusic} className="flex gap-1 mb-2">
                      <input 
                        type="text" placeholder="Search songs..." 
                        value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        className="flex-1 text-sm px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded outline-none dark:text-white"
                      />
                      <button type="submit" className="bg-gray-200 dark:bg-gray-700 p-1.5 rounded"><Search className="w-4 h-4" /></button>
                    </form>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {searchResults.map(song => (
                        <div key={song.trackId} onClick={() => {
                          setSelectedMusic({ previewUrl: song.previewUrl, title: song.trackName, artist: song.artistName, artworkUrl: song.artworkUrl100 });
                          setSearchResults([]);
                        }} className="flex items-center gap-2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={song.artworkUrl100} className="w-6 h-6 rounded" alt="art" />
                          <div className="truncate">
                            <p className="text-[11px] font-medium truncate dark:text-white">{song.trackName}</p>
                            <p className="text-[9px] text-gray-500 truncate">{song.artistName}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
              <button 
                onClick={handlePostStory} 
                disabled={uploading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 rounded-full disabled:opacity-50"
              >
                {uploading ? 'Posting...' : 'Post Story'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}