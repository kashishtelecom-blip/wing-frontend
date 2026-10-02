'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Megaphone, Plus, X, TrendingUp, MousePointerClick, DollarSign, Eye, Pause, Play, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { NavBar } from '@/components/NavBar';
import {
  AdCampaign, getMyCampaigns, createCampaign,
  updateCampaign, deleteCampaign,
} from '@/lib/ads';

const OBJECTIVES = [
  { value: 'awareness', label: 'Brand awareness', desc: 'Show your ad to as many people as possible' },
  { value: 'traffic', label: 'Traffic', desc: 'Send people to your website' },
  { value: 'engagement', label: 'Engagement', desc: 'Get more likes, comments, and shares' },
  { value: 'followers', label: 'Followers', desc: 'Grow your follower base' },
  { value: 'conversions', label: 'Conversions', desc: 'Drive purchases or sign-ups' },
];

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  active: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400',
  paused: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
};

export default function AdsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [working, setWorking] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formObjective, setFormObjective] = useState('awareness');
  const [formBudget, setFormBudget] = useState(50);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const load = async () => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    setCreating(true);
    setFormError('');
    try {
      const created = await createCampaign({
        name: formName.trim(),
        objective: formObjective,
        dailyBudget: Number(formBudget) || 1,
      });
      setCampaigns((prev) => [created, ...prev]);
      setShowCreate(false);
      setFormName('');
      setFormObjective('awareness');
      setFormBudget(50);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setFormError(Array.isArray(msg) ? msg.join(', ') : msg || 'Failed to create');
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (c: AdCampaign) => {
    setWorking(c._id);
    const nextStatus = c.status === 'active' ? 'paused' : 'active';
    try {
      const updated = await updateCampaign(c._id, { status: nextStatus });
      setCampaigns((prev) => prev.map((x) => (x._id === c._id ? updated : x)));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update');
    } finally {
      setWorking(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this campaign? This cannot be undone.')) return;
    setWorking(id);
    try {
      await deleteCampaign(id);
      setCampaigns((prev) => prev.filter((c) => c._id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete');
    } finally {
      setWorking(null);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <NavBar />
        <div className="p-8 text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  const totalImpressions = campaigns.reduce((sum, c) => sum + (c.impressions || 0), 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);
  const totalSpent = campaigns.reduce((sum, c) => sum + (c.spent || 0), 0);
  const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <NavBar />
      <main className="max-w-3xl mx-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5" />
            Ads Manager
          </h1>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold py-1.5 px-4 rounded-full"
          >
            <Plus className="w-4 h-4" />
            New campaign
          </button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-1">
              <Eye className="w-3.5 h-3.5" /> Impressions
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalImpressions.toLocaleString()}
            </p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-950/30 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 text-xs font-semibold mb-1">
              <MousePointerClick className="w-3.5 h-3.5" /> Clicks
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalClicks.toLocaleString()}
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-xs font-semibold mb-1">
              <DollarSign className="w-3.5 h-3.5" /> Spent
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ₹{totalSpent.toLocaleString()}
            </p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-950/30 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 text-xs font-semibold mb-1">
              <TrendingUp className="w-3.5 h-3.5" /> Active
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {activeCampaigns}
            </p>
          </div>
        </div>

        {/* Campaign list */}
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center">
            <Megaphone className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="font-medium text-gray-900 dark:text-white mb-1">
              No campaigns yet
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Create your first ad campaign to reach more people.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-full text-sm"
            >
              Create campaign
            </button>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {campaigns.map((c) => {
              const ctr = c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0;
              const objective = OBJECTIVES.find((o) => o.value === c.objective);
              return (
                <div
                  key={c._id}
                  className="border border-gray-200 dark:border-gray-800 rounded-2xl p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {c.name}
                        </h3>
                        <span
                          className={
                            'text-xs font-semibold px-2 py-0.5 rounded-full capitalize ' +
                            (STATUS_COLORS[c.status] || STATUS_COLORS.draft)
                          }
                        >
                          {c.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {objective?.label || c.objective} · ₹{c.dailyBudget}/day
                      </p>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {c.status !== 'completed' && c.status !== 'rejected' && (
                        <button
                          onClick={() => handleToggle(c)}
                          disabled={working === c._id}
                          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 disabled:opacity-50"
                          title={c.status === 'active' ? 'Pause' : 'Resume'}
                        >
                          {working === c._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : c.status === 'active' ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(c._id)}
                        disabled={working === c._id}
                        className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Impressions</p>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">
                        {c.impressions.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Clicks</p>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">
                        {c.clicks.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">CTR</p>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">
                        {ctr.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showCreate && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                New campaign
              </h2>
              <button
                onClick={() => setShowCreate(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-4 space-y-4">
              <div>
                <label htmlFor="ad-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Campaign name
                </label>
                <input
                  id="ad-name"
                  name="name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  maxLength={100}
                  placeholder="e.g. Summer sale 2026"
                  autoFocus
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Objective
                </span>
                <div className="space-y-2">
                  {OBJECTIVES.map((o) => (
                    <label
                      key={o.value}
                      htmlFor={'obj-' + o.value}
                      className={
                        'flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition ' +
                        (formObjective === o.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800')
                      }
                    >
                      <input
                        id={'obj-' + o.value}
                        type="radio"
                        name="objective"
                        value={o.value}
                        checked={formObjective === o.value}
                        onChange={() => setFormObjective(o.value)}
                        className="mt-0.5 w-4 h-4 accent-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {o.label}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {o.desc}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="ad-budget" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Daily budget (₹)
                </label>
                <input
                  id="ad-budget"
                  name="dailyBudget"
                  type="number"
                  min={1}
                  max={100000}
                  value={formBudget}
                  onChange={(e) => setFormBudget(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Minimum ₹1/day. You can pause anytime.
                </p>
              </div>

              {formError && (
                <div className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                  {formError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold py-2 rounded-full text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !formName.trim()}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-full text-sm disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}