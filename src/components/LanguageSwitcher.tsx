'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English',  native: 'English'   },
  { code: 'hi', label: 'Hindi',    native: 'हिन्दी'      },
  { code: 'mr', label: 'Marathi',  native: 'मराठी'       },
  { code: 'ta', label: 'Tamil',    native: 'தமிழ்'       },
  { code: 'te', label: 'Telugu',   native: 'తెలుగు'      },
  { code: 'bn', label: 'Bengali',  native: 'বাংলা'       },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી'     },
  { code: 'kn', label: 'Kannada',  native: 'ಕನ್ನಡ'       },
  { code: 'ml', label: 'Malayalam',native: 'മലയാളം'      },
  { code: 'pa', label: 'Punjabi',  native: 'ਪੰਜਾਬੀ'      },
] as const;

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const change = (code: string) => {
    // Persist choice for 1 year
    document.cookie = `locale=${code};path=/;max-age=31536000;SameSite=Lax`;
    // Re-render server components with the new locale
    startTransition(() => router.refresh());
  };

  return (
    <div className="relative inline-flex items-center">
      <Globe className="w-4 h-4 text-gray-500 dark:text-gray-400 pointer-events-none absolute left-2" />
      <select
        value={locale}
        onChange={(e) => change(e.target.value)}
        disabled={pending}
        className="appearance-none bg-transparent text-sm text-gray-700 dark:text-gray-200 pl-8 pr-6 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer disabled:opacity-50"
        aria-label="Select language"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code} className="text-gray-900">
            {l.native}
          </option>
        ))}
      </select>
    </div>
  );
}