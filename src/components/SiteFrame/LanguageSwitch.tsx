'use client';

// HOOKS
import { useEffect, useId, useRef, useState } from 'react';
// FONT AWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe } from '@fortawesome/free-solid-svg-icons';
// I18N
import { homePath, locales, type Locale } from '@/src/i18n/config';
import { useI18n } from '@/src/i18n/I18nProvider';
// CONTENT
import type { SectionId } from '@/src/content/sections';

// Each language by its own name, as visitors look for it.
const names: Record<Locale, string> = {
  en: 'English',
  pt: 'Português',
  es: 'Español',
};

interface LanguageSwitchProps {
  // A list that opens from a button in the bar, or the languages side by
  // side in the menu.
  variant: 'dropdown' | 'inline';
  // The section on screen, which the page in the other language opens at.
  section: SectionId | null;
}

// Links to the same page in the other languages. They load the page again,
// which renders it, the theme included, in the new language.
export default function LanguageSwitch({
  variant,
  section,
}: Readonly<LanguageSwitchProps>) {
  const { locale, messages } = useI18n();
  const t = messages.frame;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  // The list closes with Escape or a click anywhere else.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const links = (
    <ul
      id={listId}
      className={`lang-switch__list lang-switch__list--${variant}`}
      aria-label={variant === 'inline' ? t.language : undefined}
    >
      {locales.map((code) => (
        <li key={code}>
          <a
            className="lang-switch__option"
            href={`${homePath(code)}${section ? `#${section}` : ''}`}
            hrefLang={code}
            lang={code}
            aria-current={code === locale ? 'true' : undefined}
          >
            <span className="lang-switch__code" aria-hidden="true">
              {code.toUpperCase()}
            </span>
            {names[code]}
          </a>
        </li>
      ))}
    </ul>
  );

  if (variant === 'inline') return links;

  return (
    <div
      ref={rootRef}
      className={`lang-switch${open ? ' is-open' : ''}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        type="button"
        className="lang-switch__button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
      >
        <FontAwesomeIcon icon={faGlobe} />
        <span aria-hidden="true">{locale.toUpperCase()}</span>
        <span className="visually-hidden">
          {t.language}: {names[locale]}
        </span>
      </button>
      {links}
    </div>
  );
}
