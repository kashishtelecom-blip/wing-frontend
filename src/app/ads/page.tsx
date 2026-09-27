'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Megaphone, Target, TrendingUp, DollarSign, Plus, X, Loader2,
  Pause, Play, Trash2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { NavBar } from '@/components/NavBar';
import {
  AdCampaign, getMyCampaigns, createCampaign, updateCampaign, deleteCampaign,
} from '@/lib/ads';

const OBJECTIVES = [
  'Boost impressions',
  'Gain followers',
  'Drive engagement',
  'Increase profile visits',
];

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  active: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300',
  paused: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
};

export default function AdsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [formName, setFormName] = useState('');
  const [formObjective, setFormObjective] = useState(OBJECTIVES[0]);
  const [formBudget, setFormBudget] = useState(1);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [working, setWorking] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getMyCampaigns();
      setCampaigns(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !user) return;
    load();
  }, [authLoading, user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!formName.trim()) {
      setFormError('Campaign name required');
      return;
    }
    setCreating(true);
    try {
      const created = await createCampaign({
        name: formName.trim(),
        objective: formObjective,
        dailyBudget: formBudget,
      });
      setCampaigns((prev) => [created, ...prev]);
      setShowCreate(false);
      setFormName('');
      setFormObjective(OBJECTIVES[0]);
      setFormBudget(1);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create campaign');
    } finally {
      setCreating(false);
    }
  };

  const handleStatus = async (c: AdCampaign) => {
    setWorking(c._id);
    const next = c.status === 'active' ? 'paused' : 'active';
    try {
      const updated = await updateCampaign(c._id, { status: next });
      setCampaigns((prev) => prev.map((x) => (x._id === c._id ? updated : x)));
    } catch (err) {
      console.error(err);
    } finally {
      setWorking(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this campaign?')) return;
    setWorking(id);
    try {
      await deleteCampaign(id);
      setCampaigns((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setWorking(null);
    }
  };

  if (authLoading || loading || !user) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <NavBar />
        <div className="p-8 text-center">
          <Loader2 className="w-6 h-6 text-orange-500 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  const stats = [
    { Icon: Target, label: 'Precise targeting', value: '50M+' },
    { Icon: TrendingUp, label: 'Avg. CTR', value: '3.2%' },
    { Icon: DollarSign, label: 'Starting from', value: '$1/day' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <NavBar />
      <main className="max-w-2xl mx-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-950/50 flex items-center justify-center">
              <Megaphone className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ads</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Reach the right audience</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-full flex items-center gap-2 text-sm transition"
          >
            <Plus className="w-4 h-4" /> New campaign
          </button>
        </div>

        {/* Stats grid */}
        <div className="p-6 grid grid-cols-3 gap-3">
          {stats.map(({ Icon, label, value }) => (
            <div key={label} className="border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-center">
              <Icon className="w-5 h-5 text-orange-500 mx-auto mb-2" />
              <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Campaigns section */}
        {campaigns.length === 0 ? (
          <div className="px-6 pb-6">
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white">
              <h2 className="text-xl font-bold mb-2">Promote your wings</h2>
              <p className="text-sm opacity-90 mb-4">
                Boost your posts, gain followers, and reach new audiences with Wing Ads.
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="bg-white text-orange-600 font-semibold py-2 px-6 rounded-full"
              >
                Start a campaign
              </button>
            </div>
          </div>
        ) : (
          <div className="px-4 pb-6">
            <h2 className="font-bold text-gray-900 dark:text-white mb-3 px-2">
              Your campaigns ({campaigns.length})
            </h2>
            {campaigns.map((c) => (
              <div
                key={c._id}
                className="p-4 border border-gray-200 dark:border-gray-800 rounded-2xl mb-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">{c.name}</h3>
                      <span className={'text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ' + (STATUS_COLORS[c.status] || STATUS_COLORS.draft)}>
                        {c.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{c.objective}</p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>${c.dailyBudget}/day</span>
                      <span>{c.impressions} impressions</span>
                      <span>{c.clicks} clicks</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {c.status !== 'completed' && c.status !== 'draft' && (
                      <button
                        onClick={() => handleStatus(c)}
                        disabled={working === c._id}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition disabled:opacity-50"
                        title={c.status === 'active' ? 'Pause' : 'Resume'}
                      >
                        {c.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(c._id)}
                      disabled={working === c._id}
                      className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 transition disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create dialog */}
      {showCreate && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">New campaign</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Campaign name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  maxLength={100}
                  placeholder="e.g. Launch campaign"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Objective
                </label>
                <select
                  value={formObjective}
                  onChange={(e) => setFormObjective(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {OBJECTIVES.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Daily budget (USD)
                </label>
                <input
                  type="number"
                  min={1}
                  value={formBudget}
                  onChange={(e) => setFormBudget(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Minimum $1/day</p>
              </div>

              {formError && (
                <div className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                  {formError}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold py-2 rounded-full text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-full text-sm transition disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}