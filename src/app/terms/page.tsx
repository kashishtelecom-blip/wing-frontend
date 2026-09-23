'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NavBar } from '@/components/NavBar';
import { useAuth } from '@/lib/auth-context';

export default function TermsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <NavBar />
      <main className="max-w-3xl mx-auto p-6 prose dark:prose-invert">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-6 text-gray-700 dark:text-gray-300">
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">1. Acceptance of Terms</h2>
            <p>By creating an account or using Wing, you agree to these Terms of Service. If you do not agree, do not use the platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">2. Your Account</h2>
            <p>You are responsible for maintaining the confidentiality of your login credentials. You must be at least 13 years old to use Wing. You agree to provide accurate information when registering.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">3. Your Content</h2>
            <p>You retain full ownership of all content you post on Wing (posts, images, videos, comments). By posting, you grant Wing a non-exclusive, worldwide, royalty-free license to display and distribute your content on the platform. You may delete your content at any time.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">4. Prohibited Conduct</h2>
            <p>You may not use Wing to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Post illegal content or content that infringes on others&apos; rights</li>
              <li>Harass, threaten, or abuse other users</li>
              <li>Impersonate others or misrepresent your identity</li>
              <li>Distribute spam, malware, or phishing content</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">5. Termination</h2>
            <p>We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">6. Disclaimer</h2>
            <p>Wing is provided &ldquo;as is&rdquo; without warranties of any kind. We are not responsible for user-generated content or any damages arising from use of the platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">7. Changes</h2>
            <p>We may update these terms. Continued use of Wing after changes means you accept the new terms.</p>
          </section>
        </div>
      </main>
    </div>
  );
}