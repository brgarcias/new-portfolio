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

function storedTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    return null;
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

// Calls back when the page should take another theme without a click on it:
// the system changed, for who has not chosen; another tab chose; or the page
// came back from the browser's history after a choice made elsewhere, as on the
// way from the site to the game and back. Returns the function that stops it.
export function followTheme(apply: (theme: Theme) => void) {
  const check = () => {
    const theme = storedTheme() ?? systemTheme();
    if (theme !== currentTheme()) apply(theme);
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey || event.key === null) check();
  };
  const onShow = (event: PageTransitionEvent) => {
    if (event.persisted) check();
  };
  const media = window.matchMedia('(prefers-color-scheme: light)');
  media.addEventListener('change', check);
  window.addEventListener('storage', onStorage);
  window.addEventListener('pageshow', onShow);
  return () => {
    media.removeEventListener('change', check);
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('pageshow', onShow);
  };
}

export function applyTheme(theme: Theme) {
  const { classList } = document.documentElement;
  classList.toggle('light', theme === 'light');
  classList.toggle('dark', theme === 'dark');
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((meta) => meta.setAttribute('content', themeColors[theme]));
}

// Takes a theme at once, with CSS transitions off, so nothing fades on its own.
export function applyThemeAtOnce(theme: Theme) {
  const root = document.documentElement;
  root.classList.add('theme-switching');
  applyTheme(theme);
  // Reading a style applies the new colors while transitions are off.
  getComputedStyle(root).getPropertyValue('color');
  root.classList.remove('theme-switching');
}
