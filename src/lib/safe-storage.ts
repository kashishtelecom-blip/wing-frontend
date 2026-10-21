export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window === 'undefined') return null;
      return window.localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(key, value);
    } catch (e) {}
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window === 'undefined') return;
      window.localStorage.removeItem(key);
    } catch (e) {}
  },
};