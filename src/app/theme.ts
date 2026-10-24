// The site has a dark theme, its original look, and a light one. The theme
// is a class on <html>, which also switches HeroUI's components. Visitors
// who have not chosen one get the theme of their system.
export type Theme = 'light' | 'dark';

const storageKey = 'theme';

// The page color of each theme, as --color-bg in globals.css, for the
// browser's own bar on phones.
export const themeColors: Record<Theme, string> = {
  light: '#f6f6fb',
  dark: '#16171b',
};

// Runs in <head> before the page is drawn, so the page never shows up in the
// other theme first. Storage may be blocked, as in some private windows.
export const applyStoredTheme =
  '(function(){var t;try{t=localStorage.getItem("theme")}catch(e){}' +
  'if(t!=="light"&&t!=="dark")' +
  't=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";' +
  'var c=document.documentElement.classList;' +
  'c.toggle("light",t==="light");c.toggle("dark",t==="dark")})()';

export function currentTheme(): Theme {
  return document.documentElement.classList.contains('light')
    ? 'light'
    : 'dark';
}

export function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
}

export function hasStoredTheme() {
  try {
    return localStorage.getItem(storageKey) !== null;
  } catch {
    return false;
  }
}

// Picking the system's own theme forgets the choice, so the site follows
// the system again, as on a first visit.
export function storeTheme(theme: Theme) {
  try {
    if (theme === systemTheme()) localStorage.removeItem(storageKey);
    else localStorage.setItem(storageKey, theme);
  } catch {
    // Without storage, the choice lasts until the page is loaded again.
  }
}

export function applyTheme(theme: Theme) {
  const { classList } = document.documentElement;
  classList.toggle('light', theme === 'light');
  classList.toggle('dark', theme === 'dark');
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((meta) => meta.setAttribute('content', themeColors[theme]));
}
