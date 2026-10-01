'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, Camera, BadgeCheck, Lock, Bell, Palette, UserX, VolumeX, Download, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { NavBar } from '@/components/NavBar';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import api from '@/lib/api';
import {
  uploadAvatar, getSubscriptionStatus, SubscriptionStatus,
  getSettings, updateSettings, UserSettings,
  getBlockedUsers, unblockUser, getMutedUsers, unmuteUser,
  deactivateAccount, exportData,
} from '@/lib/users';
import { Avatar } from '@/components/Avatar';
import { getMediaUrl } from '@/lib/media';

type Section = 'profile' | 'privacy' | 'notifications' | 'content' | 'blocked' | 'account';

export default function SettingsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [section, setSection] = useState<Section>('profile');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [blocked, setBlocked] = useState<any[]>([]);
  const [muted, setMuted] = useState<any[]>([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading || !user) return;
    Promise.all([
      api.get('/users/me'),
      getSubscriptionStatus().catch(() => null),
      getSettings().catch(() => null),
      getBlockedUsers().catch(() => []),
      getMutedUsers().catch(() => []),
    ])
      .then(([meRes, sub, st, bl, mu]) => {
        setName(meRes.data.name || '');
        setBio(meRes.data.bio || '');
        setEmail(meRes.data.email || '');
        setUsername(meRes.data.username || '');
        setAvatarUrl(meRes.data.avatarUrl || '');
        setIsVerified(meRes.data.isVerified || false);
        setSubscription(sub);
        setSettings(st);
        setBlocked(bl || []);
        setMuted(mu || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setError('');
    try {
      const updated = await uploadAvatar(file);
      setAvatarUrl(updated.avatarUrl);
      setTimeout(() => window.location.reload(), 500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Avatar upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      await api.patch('/users/me', { name, bio });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const updateSettingSection = async (key: keyof UserSettings, value: any) => {
    if (!settings) return;
    const next = { ...settings, [key]: { ...settings[key], ...value } } as UserSettings;
    setSettings(next);
    try {
      await updateSettings({ [key]: value } as any);
    } catch (err) {
      console.error(err);
      setSettings(settings);
    }
  };

  const handleUnblock = async (id: string) => {
    await unblockUser(id);
    setBlocked((prev) => prev.filter((u) => u._id !== id));
  };

  const handleUnmute = async (id: string) => {
    await unmuteUser(id);
    setMuted((prev) => prev.filter((u) => u._id !== id));
  };

  const handleExport = async () => {
    const data = await exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wing-export-' + Date.now() + '.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeactivate = async () => {
    if (!confirm('Deactivate your account? You can reactivate anytime by logging in again.')) return;
    await deactivateAccount();
    logout();
  };

  if (authLoading || loading || !user) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <NavBar />
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      type="button"
      onClick={onChange}
      className={
        'relative w-11 h-6 rounded-full transition flex-shrink-0 ' +
        (checked ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-700')
      }
    >
      <span
        className={
          'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ' +
          (checked ? 'translate-x-5' : '')
        }
      />
    </button>
  );

  const sections: { key: Section; label: string; Icon: any }[] = [
    { key: 'profile', label: 'Profile', Icon: BadgeCheck },
    { key: 'privacy', label: 'Privacy', Icon: Lock },
    { key: 'notifications', label: 'Notifications', Icon: Bell },
    { key: 'content', label: 'Content', Icon: Palette },
    { key: 'blocked', label: 'Blocked & Muted', Icon: UserX },
    { key: 'account', label: 'Account', Icon: Trash2 },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <NavBar />
      <main className="max-w-3xl mx-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
        </div>

        <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-14 z-10">
          {sections.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setSection(key)}
              className={
                'flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ' +
                (section === key
                  ? 'text-blue-500 border-blue-500'
                  : 'text-gray-600 dark:text-gray-400 border-transparent hover:bg-gray-50 dark:hover:bg-gray-900')
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {section === 'profile' && (
          <div className="p-6 space-y-6">
            <div className="border-b border-gray-200 dark:border-gray-800 pb-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Profile picture</h2>
              <div className="flex items-center gap-6">
                <div className="relative">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getMediaUrl(avatarUrl)}
                      alt={username || 'avatar'}
                      width={96}
                      height={96}
                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-white text-4xl font-bold">
                      {username?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  {isVerified && (
                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-950 rounded-full p-0.5">
                      <VerifiedBadge size="lg" />
                    </div>
                  )}
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    id="avatar-file-input"
                    name="avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="flex items-center gap-2 bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-black dark:hover:bg-gray-100 text-white font-semibold py-2 px-5 rounded-full transition disabled:opacity-50 text-sm"
                  >
                    <Camera className="w-4 h-4" />
                    {uploadingAvatar ? 'Uploading...' : 'Change photo'}
                  </button>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">JPG, PNG or GIF. Max 3MB.</p>
                </div>
              </div>
            </div>

            <div className="border-b border-gray-200 dark:border-gray-800 pb-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Verification</h2>
              {isVerified && subscription?.isActive ? (
                <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <VerifiedBadge size="lg" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Verified account</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {subscription.daysLeft} days remaining · renews{' '}
                        {subscription.verifiedUntil ? new Date(subscription.verifiedUntil).toLocaleDateString() : ''}
                      </p>
                    </div>
                  </div>
                  <Link href="/subscribe" className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">
                    Manage
                  </Link>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-5 text-white">
                  <div className="flex items-center gap-3 mb-3">
                    <BadgeCheck className="w-6 h-6" />
                    <div>
                      <p className="font-bold text-lg">Get Verified</p>
                      <p className="text-sm opacity-90">₹199/month · cancel anytime</p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push('/subscribe')}
                    className="w-full bg-white text-blue-600 font-semibold py-2 rounded-full"
                  >
                    Subscribe now
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label htmlFor="settings-username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username
                </label>
                <input
                  id="settings-username"
                  name="username"
                  type="text"
                  value={username}
                  disabled
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label htmlFor="settings-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  id="settings-email"
                  name="email"
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label htmlFor="settings-display-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Display name
                </label>
                <input
                  id="settings-display-name"
                  name="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="settings-bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bio
                </label>
                <textarea
                  id="settings-bio"
                  name="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={160}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              {error && <div className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">{error}</div>}
              <div className="flex items-center gap-3">
                <button type="submit" disabled={saving} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-full transition disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
                {saved && (
                  <span className="text-green-600 dark:text-green-400 text-sm flex items-center gap-1">
                    <Check className="w-4 h-4" /> Saved
                  </span>
                )}
              </div>
            </form>
          </div>
        )}

        {section === 'privacy' && settings && (
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Private account</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Only approved followers can see your wings</p>
              </div>
              <Toggle checked={settings.privacy.privateAccount} onChange={() => updateSettingSection('privacy', { privateAccount: !settings.privacy.privateAccount })} />
            </div>
            <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Show activity status</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Let others see when you&apos;re online</p>
              </div>
              <Toggle checked={settings.privacy.showActivity} onChange={() => updateSettingSection('privacy', { showActivity: !settings.privacy.showActivity })} />
            </div>
            <div className="py-3">
              <p className="font-semibold text-gray-900 dark:text-white mb-2">Who can message you</p>
              <div className="space-y-2">
                {(['everyone', 'followers', 'nobody'] as const).map((opt) => (
                  <label key={opt} htmlFor={`dm-${opt}`} className="flex items-center gap-3 cursor-pointer p-2 -mx-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900">
                    <input
                      id={`dm-${opt}`}
                      type="radio"
                      name="dm"
                      checked={settings.privacy.allowDMsFrom === opt}
                      onChange={() => updateSettingSection('privacy', { allowDMsFrom: opt })}
                      className="w-4 h-4 accent-blue-500"
                    />
                    <span className="text-gray-800 dark:text-gray-200 capitalize">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {section === 'notifications' && settings && (
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">In-app notifications</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Get alerts inside Wing</p>
              </div>
              <Toggle checked={settings.notifications.inAppNotifications} onChange={() => updateSettingSection('notifications', { inAppNotifications: !settings.notifications.inAppNotifications })} />
            </div>
            <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Email on mention</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Get an email when someone @mentions you</p>
              </div>
              <Toggle checked={settings.notifications.emailOnMention} onChange={() => updateSettingSection('notifications', { emailOnMention: !settings.notifications.emailOnMention })} />
            </div>
            <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Email on follow</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Get an email when someone follows you</p>
              </div>
              <Toggle checked={settings.notifications.emailOnFollow} onChange={() => updateSettingSection('notifications', { emailOnFollow: !settings.notifications.emailOnFollow })} />
            </div>
            <div className="flex items-start justify-between gap-4 py-3">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Email on like</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Get an email when someone likes your wing</p>
              </div>
              <Toggle checked={settings.notifications.emailOnLike} onChange={() => updateSettingSection('notifications', { emailOnLike: !settings.notifications.emailOnLike })} />
            </div>
          </div>
        )}

        {section === 'content' && settings && (
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Show sensitive content</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Display content that may be sensitive</p>
              </div>
              <Toggle checked={settings.content.showSensitiveContent} onChange={() => updateSettingSection('content', { showSensitiveContent: !settings.content.showSensitiveContent })} />
            </div>
            <div className="flex items-start justify-between gap-4 py-3">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Autoplay videos</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Videos play automatically in the feed</p>
              </div>
              <Toggle checked={settings.content.autoplayVideos} onChange={() => updateSettingSection('content', { autoplayVideos: !settings.content.autoplayVideos })} />
            </div>
          </div>
        )}

        {section === 'blocked' && (
          <div className="p-6 space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <UserX className="w-5 h-5 text-red-500" />
                <h2 className="font-bold text-gray-900 dark:text-white">Blocked ({blocked.length})</h2>
              </div>
              {blocked.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-4">You haven&apos;t blocked anyone.</p>
              ) : (
                <div className="space-y-2">
                  {blocked.map((u) => (
                    <div key={u._id} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-800 rounded-xl">
                      <Avatar user={u} size="md" linkTo={false} />
                      <Link href={'/profile/' + u._id} className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{u.name || u.username}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">@{u.username}</p>
                      </Link>
                      <button
                        onClick={() => handleUnblock(u._id)}
                        className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                      >
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <VolumeX className="w-5 h-5 text-orange-500" />
                <h2 className="font-bold text-gray-900 dark:text-white">Muted ({muted.length})</h2>
              </div>
              {muted.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-4">You haven&apos;t muted anyone.</p>
              ) : (
                <div className="space-y-2">
                  {muted.map((u) => (
                    <div key={u._id} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-800 rounded-xl">
                      <Avatar user={u} size="md" linkTo={false} />
                      <Link href={'/profile/' + u._id} className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{u.name || u.username}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">@{u.username}</p>
                      </Link>
                      <button
                        onClick={() => handleUnmute(u._id)}
                        className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                      >
                        Unmute
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {section === 'account' && (
          <div className="p-6 space-y-6">
            <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Download className="w-5 h-5 text-blue-500" />
                <h2 className="font-bold text-gray-900 dark:text-white">Download your data</h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Get a copy of your Wing account data: profile, wings, comments, and more.
              </p>
              <button
                onClick={handleExport}
                className="bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-black dark:hover:bg-gray-100 text-white font-semibold py-2 px-5 rounded-full text-sm"
              >
                Download JSON
              </button>
            </div>

            <div className="border border-red-200 dark:border-red-900 rounded-xl p-5 bg-red-50/40 dark:bg-red-950/30">
              <div className="flex items-center gap-2 mb-3">
                <Trash2 className="w-5 h-5 text-red-500" />
                <h2 className="font-bold text-red-700 dark:text-red-400">Deactivate account</h2>
              </div>
              <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                Temporarily disable your account. Your profile and wings will be hidden. You can reactivate anytime by logging back in.
              </p>
              <button
                onClick={handleDeactivate}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-5 rounded-full text-sm"
              >
                Deactivate my account
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}