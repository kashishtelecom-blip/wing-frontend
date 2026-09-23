'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, ArrowUp, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { NavBar } from '@/components/NavBar';
import { WingCard } from '@/components/WingCard';
import { PostComposer } from '@/components/PostComposer';
import { WhoToFollow } from '@/components/WhoToFollow';
import { getFeed, getPublicWings, Wing } from '@/lib/wings';
import { usePullToRefresh } from '@/lib/use-pull-to-refresh';

const POLL_INTERVAL_MS = 30000;
const PAGE_SIZE = 20;
const SCROLL_TOP_TRIGGER_DELAY = 800;

type FeedTab = 'foryou' | 'following';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<FeedTab>('foryou');
  const [wings, setWings] = useState<Wing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [newWingsCount, setNewWingsCount] = useState(0);
  const latestWingIdRef = useRef<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const scrollTopTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const loadWings = useCallback(async (currentTab: FeedTab, pageToLoad = 1, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const data = currentTab === 'following'
        ? await getFeed(pageToLoad, PAGE_SIZE)
        : await getPublicWings(pageToLoad, PAGE_SIZE);
      const fetched: Wing[] = data.data || [];

      if (append) {
        setWings((prev) => {
          const ids = new Set(prev.map((w) => w._id));
          const merged = [...prev, ...fetched.filter((w) => !ids.has(w._id))];
          return merged;
        });
      } else {
        setWings(fetched);
        if (fetched.length > 0) latestWingIdRef.current = fetched[0]._id;
      }
      setHasMore(fetched.length === PAGE_SIZE);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      setPage(1);
      loadWings(tab, 1, false);
    }
  }, [authLoading, user, tab, loadWings]);

  // Infinite scroll
  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const next = page + 1;
          setPage(next);
          loadWings(tab, next, true);
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, page, tab, loadWings]);

  // Poll for new wings
  useEffect(() => {
    if (authLoading || !user || tab !== 'following') return;
    const interval = setInterval(async () => {
      try {
        const data = await getFeed(1, PAGE_SIZE);
        const fetched: Wing[] = data.data || [];
        if (latestWingIdRef.current && fetched.length > 0) {
          const idx = fetched.findIndex((w) => w._id === latestWingIdRef.current);
          if (idx === -1) setNewWingsCount(fetched.length);
          else if (idx > 0) setNewWingsCount(idx);
        }
      } catch {}
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [authLoading, user, tab]);

  // Auto-refresh when user scrolls back to top (after a delay)
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY < 5) {
        if (scrollTopTimerRef.current) clearTimeout(scrollTopTimerRef.current);
        scrollTopTimerRef.current = setTimeout(async () => {
          if (window.scrollY < 5 && !refreshing) {
            setRefreshing(true);
            setNewWingsCount(0);
            setPage(1);
            await loadWings(tab, 1, false);
            setRefreshing(false);
          }
        }, SCROLL_TOP_TRIGGER_DELAY);
      } else {
        if (scrollTopTimerRef.current) {
          clearTimeout(scrollTopTimerRef.current);
          scrollTopTimerRef.current = null;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTopTimerRef.current) clearTimeout(scrollTopTimerRef.current);
    };
  }, [tab, loadWings, refreshing]);

  const manualRefresh = useCallback(async () => {
    setRefreshing(true);
    setNewWingsCount(0);
    setPage(1);
    await loadWings(tab, 1, false);
    setRefreshing(false);
  }, [tab, loadWings]);

  const { pullDistance, refreshing: pullRefreshing, threshold } = usePullToRefresh({
    onRefresh: manualRefresh,
  });

  const handleManualRefresh = async () => {
    await manualRefresh();
  };

  const handleShowNew = async () => {
    setNewWingsCount(0);
    setPage(1);
    await loadWings(tab, 1, false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePosted = async () => {
    setNewWingsCount(0);
    latestWingIdRef.current = null;
    setPage(1);
    await loadWings(tab, 1, false);
  };

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500 dark:text-gray-400">Loading...</div>;
  }

  const tabClass = (t: FeedTab) =>
    tab === t
      ? 'flex-1 py-3 text-sm font-semibold text-gray-900 dark:text-white border-b-2 border-blue-500 transition'
      : 'flex-1 py-3 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 border-b-2 border-transparent transition';

  const showPullSpinner = pullDistance > 0 || pullRefreshing;
  const pullReady = pullDistance >= threshold;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <NavBar />

      {/* Pull-to-refresh indicator */}
      <div
        className="fixed top-14 left-0 right-0 flex justify-center pointer-events-none z-20 transition-opacity"
        style={{
          opacity: showPullSpinner ? 1 : 0,
          transform: 'translateY(' + Math.min(pullDistance, threshold) + 'px)',
        }}
      >
        <div className="bg-white dark:bg-gray-900 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center gap-2">
          <Loader2
            className={
              'w-4 h-4 ' +
              (pullRefreshing ? 'animate-spin text-blue-500' :
               pullReady ? 'text-blue-500' : 'text-gray-400')
            }
          />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {pullRefreshing ? 'Refreshing...' : pullReady ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </div>
      </div>

      <main className="max-w-2xl mx-auto">
        <div className="sticky top-14 bg-white/90 dark:bg-gray-900/90 backdrop-blur z-10 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center">
            <button onClick={() => setTab('foryou')} className={tabClass('foryou')}>
              For you
            </button>
            <button onClick={() => setTab('following')} className={tabClass('following')}>
              Following
            </button>
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="p-3 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={'w-4 h-4 ' + (refreshing ? 'animate-spin' : '')} />
            </button>
          </div>
        </div>

        {newWingsCount > 0 && (
          <button
            onClick={handleShowNew}
            className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 transition sticky top-[104px] z-10"
          >
            <ArrowUp className="w-4 h-4" />
            Show {newWingsCount} new wing{newWingsCount !== 1 ? 's' : ''}
          </button>
        )}

        {tab === 'foryou' && <WhoToFollow />}
        <PostComposer onPosted={handlePosted} />

        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading feed...</div>
        ) : wings.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-900 dark:text-white font-medium mb-1">
              {tab === 'following' ? 'Follow people to see their wings here' : 'No wings yet'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {tab === 'following'
                ? 'Find interesting people on Explore and tap Follow.'
                : 'Be the first to post!'}
            </p>
          </div>
        ) : (
          <>
            {wings.map((wing) => (
              <WingCard
                key={wing._id}
                wing={wing}
                onDeleted={(id) => setWings((prev) => prev.filter((w) => w._id !== id))}
              />
            ))}
            {hasMore && (
              <div ref={loadMoreRef} className="p-8 text-center">
                {loadingMore ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Loading more...</p>
                ) : (
                  <p className="text-gray-400 dark:text-gray-500 text-sm">Scroll for more</p>
                )}
              </div>
            )}
            {!hasMore && wings.length > 0 && (
              <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">
                You&apos;re all caught up ✓
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}