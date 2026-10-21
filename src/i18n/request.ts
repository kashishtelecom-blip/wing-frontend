import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export const locales = [
  'en', 'hi', 'mr', 'ta', 'te', 'bn', 'gu', 'kn', 'ml', 'pa',
] as const;

export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

function deepMerge(base: any, override: any): any {
  const result = { ...base };
  for (const key of Object.keys(override)) {
    const b = base[key];
    const o = override[key];
    if (
      b && o &&
      typeof b === 'object' && typeof o === 'object' &&
      !Array.isArray(b) && !Array.isArray(o)
    ) {
      result[key] = deepMerge(b, o);
    } else {
      result[key] = o;
    }
  }
  return result;
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const raw = cookieStore.get('locale')?.value as Locale | undefined;
  // ↓↓↓ DEBUG LINE — remove after diagnosis ↓↓↓
  
  // ↑↑↑ DEBUG LINE ↑↑↑
  const locale: Locale = raw && locales.includes(raw) ? raw : defaultLocale;

  const [localeMessages, enMessages] = await Promise.all([
    import(`../../messages/${locale}.json`).then((m) => m.default),
    import(`../../messages/en.json`).then((m) => m.default),
  ]);

  return {
    locale,
    messages:
      locale === 'en'
        ? enMessages
        : deepMerge(enMessages, localeMessages),
  };
});