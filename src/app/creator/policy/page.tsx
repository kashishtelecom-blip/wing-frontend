'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { NavBar } from '@/components/NavBar';

export default function CreatorPolicyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 pb-20">
      <NavBar />
      <main className="max-w-2xl mx-auto p-4 mt-6">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-500" />
            Creator Monetization Policy
          </h1>
        </div>

        {/* Content */}
        <div className="prose prose-blue dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">1. Eligibility Requirements</h2>
            <p>To be eligible to earn money on Wing, you must:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Be at least 18 years old.</li>
              <li>Have a minimum of <strong>1,000 followers</strong> and <strong>10,000 qualified views</strong> in the last 30 days.</li>
              <li>Have an active account that is in good standing (no active strikes for hate speech, spam, or copyright).</li>
              <li>Set up a verified payout method.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">2. How You Earn</h2>
            <p>Wing operates on an <strong>Ad Revenue Share</strong> model. We place ads within the feed. A portion of the total ad revenue generated on the platform is pooled together and distributed to creators based on their share of "Qualified Views."</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Qualified View:</strong> A view is counted when a user scrolls past your post and watches/reads it for at least 3 seconds, with 50% of the post visible on screen.</li>
              <li><strong>Invalid Views:</strong> Bot traffic, rapid scrolling, or automated refreshes do not count. We actively monitor and filter these out.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">3. Payouts</h2>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Minimum Threshold:</strong> You must have a balance of at least <strong>₹500</strong> to request a payout.</li>
              <li><strong>Schedule:</strong> Payouts are processed on the 1st of every month.</li>
              <li><strong>Processing Time:</strong> Please allow 3-5 business days for funds to arrive in your bank account.</li>
              <li><strong>Taxes:</strong> You are responsible for paying income tax on your earnings.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">4. Prohibited Behavior (Zero Tolerance)</h2>
            <p>Engaging in the following will result in immediate removal from the monetization program and forfeiture of unpaid earnings:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Artificial Inflation:</strong> Using bots, click farms, or engagement pods to boost views.</li>
              <li><strong>Content Theft:</strong> Re-uploading content you do not own (Copyright violations).</li>
              <li><strong>Unsafe Content:</strong> Adult content, violence, illegal drugs, or promoting self-harm.</li>
              <li><strong>Fraudulent Payouts:</strong> Using stolen bank details or fake identities.</li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}