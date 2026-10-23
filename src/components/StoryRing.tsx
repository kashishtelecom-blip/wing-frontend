'use client';

import { useEffect, useState, useRef } from 'react';
import { Plus } from 'lucide-react';
import { getStoriesFeed, GroupedStories, uploadStoryMedia, createStory } from '@/lib/stories';
import { Avatar } from './Avatar';

interface Props {
  onOpenStory: (groups: GroupedStories[], initialGroupIndex: number) => void;
}

export function StoryRing({ onOpenStory }: Props) {
  const [groups, setGroups] = useState<GroupedStories[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getStoriesFeed().then(setGroups).finally(() => setLoading(false));
  }, []);

  const handleCreateStory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // 1. Upload to Cloudinary
      const { mediaUrl } = await uploadStoryMedia(file);
      const isVideo = file.type.startsWith('video/');
      
      // 2. Save in DB
      await createStory(mediaUrl, isVideo ? 'video' : 'image');
      
      // 3. Refresh feed
      const newGroups = await getStoriesFeed();
      setGroups(newGroups);
    } catch (err) {
      console.error('Failed to create story', err);
      alert('Failed to upload story');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (loading) return null;

  return (
    <div className="flex gap-3 overflow-x-auto p-4 border-b border-gray-200 dark:border-gray-800 scrollbar-hide">
      
      {/* Create Story Button */}
      <div className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <Plus className="w-6 h-6 text-gray-500" />
        </div>
        <span className="text-xs text-gray-600 dark:text-gray-400">Add Story</span>
        <input type="file" accept="image/*,video/*" hidden ref={fileInputRef} onChange={handleCreateStory} />
      </div>

      {/* Other Users' Stories */}
      {groups.map((group, i) => (
        <div 
          key={group.author._id} 
          className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer"
          onClick={() => onOpenStory(groups, i)}
        >
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
  );
}