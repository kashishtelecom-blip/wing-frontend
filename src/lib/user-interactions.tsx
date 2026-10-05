'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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

  // ✅ In-flight guards so rapid clicks don't fire duplicate requests
  const inFlightLikes = useRef<Set<string>>(new Set());
  const inFlightReposts = useRef<Set<string>>(new Set());
  const inFlightBookmarks = useRef<Set<string>>(new Set());

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

  // ✅ Generalized toggle with in-flight guard + 409 recovery
  const toggle = async (
    wingId: string,
    currentSet: Set<string>,
    setFn: React.Dispatch<React.SetStateAction<Set<string>>>,
    inFlight: Set<string>,
    doLike: () => Promise<any>,
    doUnlike: () => Promise<any>,
  ): Promise<boolean> => {
    // Ignore click if a request is already in-flight for this wing
    if (inFlight.has(wingId)) {
      return currentSet.has(wingId);
    }

    const wasActive = currentSet.has(wingId);
    inFlight.add(wingId);

    // Optimistic update
    setFn((prev) => {
      const next = new Set(prev);
      if (wasActive) next.delete(wingId);
      else next.add(wingId);
      return next;
    });

    try {
      if (wasActive) {
        await doUnlike();
      } else {
        await doLike();
      }
      return !wasActive;
    } catch (err: any) {
      const status = err?.response?.status;

      if (status === 409) {
        // Server says already-liked/already-reposted/etc. Sync to "on" state
        setFn((prev) => {
          const next = new Set(prev);
          next.add(wingId);
          return next;
        });
        return true;
      }

      if (status === 404) {
        // Server says not-liked/not-reposted/etc. Sync to "off" state
        setFn((prev) => {
          const next = new Set(prev);
          next.delete(wingId);
          return next;
        });
        return false;
      }

      // Unknown error — revert to original
      setFn((prev) => {
        const next = new Set(prev);
        if (wasActive) next.add(wingId);
        else next.delete(wingId);
        return next;
      });
      return wasActive;
    } finally {
      inFlight.delete(wingId);
    }
  };

  const toggleLike = (wingId: string) =>
    toggle(
      wingId,
      likedIds,
      setLikedIds,
      inFlightLikes.current,
      () => api.post('/wings/' + wingId + '/like'),
      () => api.delete('/wings/' + wingId + '/like'),
    );

  const toggleRepost = (wingId: string) =>
    toggle(
      wingId,
      repostedIds,
      setRepostedIds,
      inFlightReposts.current,
      () => api.post('/wings/' + wingId + '/repost', {}),
      () => api.delete('/wings/' + wingId + '/repost'),
    );

  const toggleBookmark = (wingId: string) =>
    toggle(
      wingId,
      bookmarkedIds,
      setBookmarkedIds,
      inFlightBookmarks.current,
      () => api.post('/wings/' + wingId + '/bookmark'),
      () => api.delete('/wings/' + wingId + '/bookmark'),
    );

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