'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { X, Eye } from 'lucide-react';
import { GroupedStories, StoryItem, markStoryViewed } from '@/lib/stories';
import { getMediaUrl } from '@/lib/media';
import { Avatar } from './Avatar';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';

interface Props {
  groups: GroupedStories[];
  initialGroupIndex: number;
  onClose: () => void;
}

export function StoryViewer({ groups, initialGroupIndex, onClose }: Props) {
  const { user } = useAuth();
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState<any[]>([]);
  const [loadingViewers, setLoadingViewers] = useState(false);

  const currentGroup = groups[groupIndex];
  const currentStory = currentGroup?.stories[storyIndex];
  const isMyStory = user?.userId === currentGroup?.author._id;

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.removeAttribute('src'); 
      audioRef.current.load();
    }
  };

  const handleClose = () => {
    stopAudio();
    onClose();
  };

  const handleNext = () => {
    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex(storyIndex + 1);
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex(groupIndex + 1);
      setStoryIndex(0);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (storyIndex > 0) {
      setStoryIndex(storyIndex - 1);
    } else if (groupIndex > 0) {
      setGroupIndex(groupIndex - 1);
      setStoryIndex(groups[groupIndex - 1].stories.length - 1);
    }
  };

  useEffect(() => {
    if (!currentStory) return;
    
    setProgress(0);
    markStoryViewed(currentStory._id);

    if (currentStory.music?.previewUrl) {
      if (!audioRef.current) {
        audioRef.current = new Audio(currentStory.music.previewUrl);
      } else {
        audioRef.current.src = currentStory.music.previewUrl;
      }
      
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log('Audio autoplay blocked', e));
    } else {
      stopAudio();
    }

    // 1. Progress bar animation (15 seconds total)
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + 1, 100));
    }, 150);

    // 2. Timer to advance story after 15 seconds
    const timer = setTimeout(() => {
      if (storyIndex < currentGroup.stories.length - 1) {
        setStoryIndex(storyIndex + 1);
      } else if (groupIndex < groups.length - 1) {
        setGroupIndex(groupIndex + 1);
        setStoryIndex(0);
      } else {
        handleClose();
      }
    }, 15000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
      stopAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyIndex, groupIndex, currentStory]);

  const fetchViewers = async () => {
    if (!currentStory) return;
    setLoadingViewers(true);
    try {
      const res = await api.get(`/stories/${currentStory._id}/viewers`);
      setViewers(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingViewers(false);
    }
  };

  const handleOpenViewers = () => {
    setShowViewers(true);
    fetchViewers();
  };

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      <div className="relative w-full max-w-md h-full md:h-[85vh] bg-gray-900 md:rounded-xl overflow-hidden flex flex-col">
        
        {/* Progress Bars */}
        <div className="flex gap-1 p-2 absolute top-0 w-full z-20">
          {currentGroup.stories.map((s: StoryItem, i: number) => (
            <div key={s._id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div className="h-full bg-white transition-all duration-100 ease-linear" style={{ width: i === storyIndex ? `${progress}%` : i < storyIndex ? '100%' : '0%' }} />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-4 w-full px-3 flex items-center justify-between z-20">
          <Link href={`/profile/${currentGroup.author._id}`} onClick={handleClose} className="flex items-center gap-2 hover:opacity-80 transition">
            <Avatar user={currentGroup.author} size="sm" linkTo={false} />
            <span className="text-white font-semibold text-sm">{currentGroup.author.username}</span>
          </Link>
          <button onClick={handleClose} className="text-white p-1 bg-black/40 rounded-full"><X className="w-5 h-5" /></button>
        </div>

        {/* Touch Areas */}
        <div className="absolute inset-y-0 left-0 w-1/3 z-10" onClick={handlePrev} />
        <div className="absolute inset-y-0 right-0 w-1/3 z-10" onClick={handleNext} />

        {/* Media */}
        {currentStory.mediaType === 'video' ? (
          <video src={getMediaUrl(currentStory.mediaUrl)} autoPlay controls={false} className="w-full h-full object-contain" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={getMediaUrl(currentStory.mediaUrl)} alt="story" className="w-full h-full object-contain" />
        )}

        {/* MUSIC STICKER OVERLAY */}
        {currentStory.music && (
          <div className="absolute bottom-16 left-4 right-4 z-20 animate-bounce-slow">
            <div className="bg-black/60 backdrop-blur-md rounded-full px-3 py-2 flex items-center gap-3 w-max max-w-full border border-white/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={currentStory.music.artworkUrl} alt="music" className="w-8 h-8 rounded-full animate-spin-slow" />
              <div className="min-w-0 pr-2">
                <p className="text-white text-xs font-bold truncate">{currentStory.music.title}</p>
                <p className="text-gray-300 text-[10px] truncate">{currentStory.music.artist}</p>
              </div>
            </div>
          </div>
        )}

        {/* VIEWERS BUTTON (Only for My Story) */}
        {isMyStory && (
          <button 
            onClick={handleOpenViewers}
            className="absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-2 rounded-full border border-white/20 text-white text-xs font-semibold hover:bg-black/80 transition"
          >
            <Eye className="w-4 h-4" /> Viewers ({currentStory.viewsCount || 0})
          </button>
        )}

        {/* VIEWERS MODAL */}
        {showViewers && (
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gray-900 rounded-t-2xl z-30 flex flex-col animate-slide-up">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-gray-900 z-10">
              <h3 className="text-white font-bold text-lg">Story Viewers</h3>
              <button onClick={() => setShowViewers(false)} className="text-gray-400 p-1 bg-gray-800 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {loadingViewers ? (
                <p className="text-gray-500 text-center mt-4">Loading...</p>
              ) : viewers.length === 0 ? (
                <p className="text-gray-500 text-center mt-4">No viewers yet.</p>
              ) : (
                viewers.map((v: any) => (
                  <Link 
                    key={v._id} 
                    href={`/profile/${v._id}`} 
                    onClick={handleClose}
                    className="flex items-center gap-3 p-3 hover:bg-gray-800 rounded-xl transition"
                  >
                    <Avatar user={v} size="sm" linkTo={false} />
                    <div>
                      <p className="text-white font-semibold text-sm">{v.name || v.username}</p>
                      <p className="text-gray-400 text-xs">@{v.username}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}