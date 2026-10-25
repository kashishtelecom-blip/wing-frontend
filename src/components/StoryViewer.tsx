'use client';

import { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';
import { GroupedStories, StoryItem, markStoryViewed } from '@/lib/stories';
import { getMediaUrl } from '@/lib/media';
import { Avatar } from './Avatar';

interface Props {
  groups: GroupedStories[];
  initialGroupIndex: number;
  onClose: () => void;
}

export function StoryViewer({ groups, initialGroupIndex, onClose }: Props) {
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentGroup = groups[groupIndex];
  const currentStory = currentGroup?.stories[storyIndex];

  useEffect(() => {
    if (!currentStory) return;
    
    setProgress(0);
    markStoryViewed(currentStory._id);

    // Play music if exists
    if (currentStory.music?.previewUrl) {
      if (!audioRef.current) audioRef.current = new Audio(currentStory.music.previewUrl);
      else audioRef.current.src = currentStory.music.previewUrl;
      
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log('Audio autoplay blocked', e));
    } else if (audioRef.current) {
      audioRef.current.pause();
    }

    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          handleNext();
          return 0;
        }
        return p + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [storyIndex, groupIndex, currentStory]);

  const handleNext = () => {
    if (storyIndex < currentGroup.stories.length - 1) setStoryIndex(storyIndex + 1);
    else if (groupIndex < groups.length - 1) { setGroupIndex(groupIndex + 1); setStoryIndex(0); }
    else onClose();
  };

  const handlePrev = () => {
    if (storyIndex > 0) setStoryIndex(storyIndex - 1);
    else if (groupIndex > 0) { setGroupIndex(groupIndex - 1); setStoryIndex(groups[groupIndex - 1].stories.length - 1); }
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
          <div className="flex items-center gap-2">
            <Avatar user={currentGroup.author} size="sm" linkTo={false} />
            <span className="text-white font-semibold text-sm">{currentGroup.author.username}</span>
          </div>
          <button onClick={onClose} className="text-white p-1 bg-black/40 rounded-full"><X className="w-5 h-5" /></button>
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
          <div className="absolute bottom-8 left-4 right-4 z-20 animate-bounce-slow">
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
      </div>
    </div>
  );
}