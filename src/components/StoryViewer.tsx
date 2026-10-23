'use client';

import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { GroupedStories, markStoryViewed } from '@/lib/stories';
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

  const currentGroup = groups[groupIndex];
  const currentStory = currentGroup?.stories[storyIndex];

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (!currentStory) return;
    
    setProgress(0);
    markStoryViewed(currentStory._id);

    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          handleNext();
          return 0;
        }
        return p + 2; // 2% every 100ms = 5 seconds total
      });
    }, 100);

    return () => clearInterval(interval);
  }, [storyIndex, groupIndex, currentStory]);

  const handleNext = () => {
    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex(storyIndex + 1);
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex(groupIndex + 1);
      setStoryIndex(0);
    } else {
      onClose();
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

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      <div className="relative w-full max-w-md h-full md:h-[85vh] bg-gray-900 md:rounded-xl overflow-hidden flex flex-col">
        
        {/* Progress Bars */}
        <div className="flex gap-1 p-2 absolute top-0 w-full z-10">
          {currentGroup.stories.map((s, i) => (
            <div key={s._id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{ width: i === storyIndex ? `${progress}%` : i < storyIndex ? '100%' : '0%' }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-4 w-full px-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Avatar user={currentGroup.author} size="sm" linkTo={false} />
            <span className="text-white font-semibold text-sm">{currentGroup.author.username}</span>
          </div>
          <button onClick={onClose} className="text-white p-1"><X /></button>
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
      </div>
    </div>
  );
}