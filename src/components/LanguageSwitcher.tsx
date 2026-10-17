'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', native: 'English'   },
  { code: 'hi', native: 'हिन्दी'      },
  { code: 'mr', native: 'मराठी'       },
  { code: 'ta', native: 'தமிழ்'       },
  { code: 'te', native: 'తెలుగు'      },
  { code: 'bn', native: 'বাংলা'       },
  { code: 'gu', native: 'ગુજરાતી'     },
  { code: 'kn', native: 'ಕನ್ನಡ'       },
  { code: 'ml', native: 'മലയാളം'      },
  { code: 'pa', native: 'ਪੰਜਾਬੀ'      },
] as const;

export function LanguageSwitcher() {
  const localeFromHook = useLocale();
  const [locale, setLocale] = useState<string>(localeFromHook);

  const change = (code: string) => {
    setLocale(code);
    const returnTo = window.location.pathname + window.location.search;
    // Let the SERVER set the cookie, then redirect back to the current page
    window.location.href = `/api/set-locale?code=${code}&returnTo=${encodeURIComponent(returnTo)}`;
  };

  return (
    <div className="relative inline-flex items-center">
      <Globe className="w-4 h-4 text-gray-500 dark:text-gray-400 pointer-events-none absolute left-2" />
      <select
        value={locale}
        onChange={(e) => change(e.target.value)}
        className="appearance-none bg-transparent text-sm text-gray-700 dark:text-gray-200 pl-8 pr-6 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
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