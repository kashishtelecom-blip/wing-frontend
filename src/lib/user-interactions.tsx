'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from './api';
import { useAuth } from './auth-context';

interface InteractionsContextType {
  likedIds: Set<string>;
  repostedIds: Set<string>;
  bookmarkedIds: Set<string>;
  toggleLike: (wingId: string) => Promise<boolean>;
  toggleRepost: (wingId: string) => Promise<boolean>;
  toggleBookmark: (wingId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const InteractionsContext = createContext<InteractionsContextType | null>(null);

export function InteractionsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [repostedIds, setRepostedIds] = useState<Set<string>>(new Set());
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const [bookmarksRes, repostsRes] = await Promise.all([
        api.get('/users/me/bookmarks').catch(() => ({ data: [] })),
        api.get('/users/me/reposts').catch(() => ({ data: [] })),
      ]);
      const bIds = new Set<string>();
      (bookmarksRes.data || []).forEach((b: any) => {
        const id = b.wing?._id || b.wing;
        if (id) bIds.add(id);
      });
      setBookmarkedIds(bIds);

      const rIds = new Set<string>();
      (repostsRes.data || []).forEach((r: any) => {
        const id = r.wing?._id || r.wing;
        if (id) rIds.add(id);
      });
      setRepostedIds(rIds);
    } catch (err) {
      console.error('Failed to load interactions', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) refresh();
    else {
      setLikedIds(new Set());
      setRepostedIds(new Set());
      setBookmarkedIds(new Set());
    }
  }, [user, refresh]);

  const toggleLike = async (wingId: string) => {
    const wasLiked = likedIds.has(wingId);
    const next = new Set(likedIds);
    if (wasLiked) next.delete(wingId); else next.add(wingId);
    setLikedIds(next);
    try {
      if (wasLiked) await api.delete('/wings/' + wingId + '/like');
      else await api.post('/wings/' + wingId + '/like');
      return !wasLiked;
    } catch {
      setLikedIds(likedIds);
      return wasLiked;
    }
  };

  const toggleRepost = async (wingId: string) => {
    const wasReposted = repostedIds.has(wingId);
    const next = new Set(repostedIds);
    if (wasReposted) next.delete(wingId); else next.add(wingId);
    setRepostedIds(next);
    try {
      if (wasReposted) await api.delete('/wings/' + wingId + '/repost');
      else await api.post('/wings/' + wingId + '/repost', {});
      return !wasReposted;
    } catch {
      setRepostedIds(repostedIds);
      return wasReposted;
    }
  };

  const toggleBookmark = async (wingId: string) => {
    const wasBookmarked = bookmarkedIds.has(wingId);
    const next = new Set(bookmarkedIds);
    if (wasBookmarked) next.delete(wingId); else next.add(wingId);
    setBookmarkedIds(next);
    try {
      if (wasBookmarked) await api.delete('/wings/' + wingId + '/bookmark');
      else await api.post('/wings/' + wingId + '/bookmark');
      return !wasBookmarked;
    } catch {
      setBookmarkedIds(bookmarkedIds);
      return wasBookmarked;
    }
  };

  return (
    <InteractionsContext.Provider
      value={{ likedIds, repostedIds, bookmarkedIds, toggleLike, toggleRepost, toggleBookmark, refresh }}
    >
      {children}
    </InteractionsContext.Provider>
  );
}

export function useInteractions() {
  const ctx = useContext(InteractionsContext);
  if (!ctx) throw new Error('useInteractions must be used within InteractionsProvider');
  return ctx;
}