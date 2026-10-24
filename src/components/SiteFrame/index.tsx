'use client';

// NEXT
import { usePathname } from 'next/navigation';
// HOOKS
import {
  CSSProperties,
  MouseEvent,
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
// FONT AWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowDown } from '@fortawesome/free-solid-svg-icons';
// COMPONENTS
import LanguageSwitch from './LanguageSwitch';
import SiteFooter from './SiteFooter';
import ThemeToggle from './ThemeToggle';
// I18N
import { homePath } from '@/src/i18n/config';
import { useI18n } from '@/src/i18n/I18nProvider';
// CONTENT
import { resume, socialIcons, type NavItem } from './content';
import type { SocialLink } from '@/src/content';
import { sectionIds, type SectionId } from '@/src/content/sections';
// CSS
import './styles.css';

// closed: the page scrolls normally. locked: the page is pinned where it was,
// ready to move. open: the page sits back in 3D under the menu. closing: the
// page comes forward, back to where it was or to the chosen section.
type MenuState = 'closed' | 'locked' | 'open' | 'closing';

// The page moves in 0.6s. The timer only has to outlast that, in case the
// transition never ends, as with "reduce motion".
const TRANSITION_TIMEOUT = 1000;

// Distance from the top of the page to an element, ignoring transforms.
function offsetWithin(element: HTMLElement, container: HTMLElement) {
  let top = 0;
  let node: HTMLElement | null = element;
  while (node && node !== container) {
    top += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return top;
}

function headerHeight() {
  return document.querySelector<HTMLElement>('.site-header')?.offsetHeight ?? 0;
}

interface SiteFrameProps {
  children: ReactNode;
  nav: NavItem[];
  social: readonly SocialLink[];
  name: string;
  role: string;
  year: number;
}

export default function SiteFrame({
  children,
  nav,
  social,
  name,
  role,
  year,
}: Readonly<SiteFrameProps>) {
  const { locale, messages } = useI18n();
  const t = messages.frame;
  const pathname = usePathname();
  const home = homePath(locale);
  // The server renders the English home page as /en, which / rewrites to,
  // while the browser reads /. Both are the home page.
  const isHome = pathname === home || pathname === `/${locale}`;
  const [menu, setMenu] = useState<MenuState>('closed');
  const [scroll, setScroll] = useState({ saved: 0, target: 0 });
  const [targetId, setTargetId] = useState<SectionId | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<SectionId | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const wasLocked = useRef(false);
  const frozenRef = useRef(false);

  const locked = menu !== 'closed';
  const open = menu === 'open';
  const current = isHome ? active : null;

  const openMenu = useCallback(() => {
    setScroll({ saved: window.scrollY, target: window.scrollY });
    setTargetId(null);
    setMenu('locked');
  }, []);

  const closeMenu = useCallback(
    (id?: SectionId) => {
      const sheet = sheetRef.current;
      let target = scroll.saved;
      const element = id ? document.getElementById(id) : null;
      if (sheet && element) {
        const max = Math.max(0, sheet.offsetHeight - window.innerHeight);
        target = Math.min(
          Math.max(0, offsetWithin(element, sheet) - headerHeight()),
          max,
        );
      }
      setScroll((value) => ({ ...value, target }));
      setTargetId(id ?? null);
      setMenu('closing');
    },
    [scroll.saved],
  );

  // Pinned in place, the page moves back on the next frame, so the transition
  // starts from where it was.
  useLayoutEffect(() => {
    if (menu !== 'locked') return;
    sheetRef.current?.getBoundingClientRect();
    const frame = requestAnimationFrame(() => setMenu('open'));
    return () => cancelAnimationFrame(frame);
  }, [menu]);

  useEffect(() => {
    if (menu !== 'closing') return;
    const sheet = sheetRef.current;
    const finish = () => setMenu('closed');
    const onEnd = (event: TransitionEvent) => {
      if (event.target === sheet && event.propertyName === 'transform') {
        finish();
      }
    };
    sheet?.addEventListener('transitionend', onEnd);
    // With "reduce motion" the page does not move, so there is nothing to
    // wait for.
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const timer = window.setTimeout(finish, reduced ? 0 : TRANSITION_TIMEOUT);
    return () => {
      sheet?.removeEventListener('transitionend', onEnd);
      window.clearTimeout(timer);
    };
  }, [menu]);

  // Back in the normal flow, the page scrolls to where the sheet was shown,
  // so nothing jumps.
  useLayoutEffect(() => {
    if (menu === 'closed' && wasLocked.current) {
      window.scrollTo({ top: scroll.target, behavior: 'instant' });
      if (targetId) {
        history.replaceState(null, '', `#${targetId}`);
        document.getElementById(targetId)?.focus({ preventScroll: true });
      } else {
        toggleRef.current?.focus({ preventScroll: true });
      }
    }
    if (menu === 'open') {
      firstLinkRef.current?.focus({ preventScroll: true });
    }
    wasLocked.current = menu !== 'closed';
  }, [menu, scroll.target, targetId]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, closeMenu]);

  // While the menu is open, the page sits back in 3D and other sections
  // cross the middle of the screen. The one that was there still counts,
  // for the bar and for the language links. As the menu closes, the page
  // slides to the section it goes to, which counts again.
  useLayoutEffect(() => {
    frozenRef.current = menu === 'locked' || menu === 'open';
  }, [menu]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Highlights the section that crosses the middle of the screen. Browsers
  // without IntersectionObserver simply get no highlight.
  useEffect(() => {
    if (!isHome || !('IntersectionObserver' in window)) return;
    const elements = ['top', ...sectionIds]
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        if (frozenRef.current) return;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = entry.target.id;
          setActive(id === 'top' ? null : (id as SectionId));
        }
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [isHome]);

  const toggleMenu = () => {
    if (menu === 'closed') openMenu();
    else if (menu === 'open') closeMenu();
  };

  // On the home page the menu brings the chosen section forward. Elsewhere
  // the link simply opens the home page at that section.
  const onMenuLink = (event: MouseEvent<HTMLAnchorElement>, id: SectionId) => {
    if (!isHome) return;
    event.preventDefault();
    closeMenu(id);
  };

  // While the menu is open, the page is cut at the top of what was on screen,
  // so it reads as a sheet and the content above it does not cover the menu.
  const visibleTop = menu === 'closing' ? scroll.target : scroll.saved;
  const sheetStyle: CSSProperties | undefined = locked
    ? {
        top: -scroll.saved,
        clipPath: `inset(${visibleTop}px 0 0 0 round 1.25rem 1.25rem 0 0)`,
        transform:
          menu === 'closing'
            ? `translate3d(0, ${scroll.saved - scroll.target}px, 0)`
            : undefined,
      }
    : undefined;

  const sectionHref = (id: SectionId) => (isHome ? `#${id}` : `${home}#${id}`);

  return (
    <>
      {/* Hidden until it gets focus, so keyboards can jump past the bar. */}
      <a className="skip-link" href="#main">
        {t.skipToContent}
      </a>
      <header
        className={[
          'site-header',
          scrolled && 'site-header--scrolled',
          locked && 'site-header--menu',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="site-header__inner">
          <a className="site-brand" href={isHome ? '#top' : home}>
            <span className="site-brand__mark" aria-hidden="true">
              BG
            </span>
            <span className="site-brand__name">{name}</span>
          </a>

          <nav className="site-nav" aria-label={t.sections}>
            <ul>
              {nav.map(({ id, label }) => (
                <li key={id}>
                  <a
                    className={`site-nav__link${current === id ? ' is-active' : ''}`}
                    href={sectionHref(id)}
                    aria-current={current === id ? 'location' : undefined}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="site-header__actions">
            <LanguageSwitch variant="dropdown" section={current} />
            <ThemeToggle />
            <a
              className="btn btn--ghost btn--small site-header__cv"
              href={resume.href}
              download={resume.fileName}
            >
              <FontAwesomeIcon icon={faArrowDown} />
              {t.cv}
            </a>
            <button
              ref={toggleRef}
              type="button"
              className={`menu-toggle${locked ? ' is-open' : ''}`}
              aria-expanded={open}
              aria-controls="stack-menu"
              aria-label={locked ? t.closeMenu : t.openMenu}
              onClick={toggleMenu}
            >
              <span className="menu-toggle__line" />
              <span className="menu-toggle__line" />
            </button>
          </div>
        </div>
      </header>

      <nav
        id="stack-menu"
        className={`stack-menu${open ? ' stack-menu--open' : ''}`}
        aria-label={t.menu}
        inert={!open}
      >
        <ol className="stack-menu__list">
          {nav.map(({ id, label, title }, index) => (
            <li
              key={id}
              className="stack-menu__item"
              style={{ '--i': index } as CSSProperties}
            >
              <a
                ref={index === 0 ? firstLinkRef : undefined}
                className="stack-menu__link"
                href={sectionHref(id)}
                onClick={(event) => onMenuLink(event, id)}
              >
                <span className="stack-menu__index">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="stack-menu__title">
                  <span className="stack-menu__title-full">{title}</span>
                  <span className="stack-menu__title-short">{label}</span>
                </span>
              </a>
            </li>
          ))}
        </ol>
        <div className="stack-menu__footer">
          <LanguageSwitch variant="inline" section={current} />
          <ul className="social-links">
            {social.map(({ id, href, text }) => (
              <li key={id}>
                <a
                  className="social-links__link"
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={text}
                >
                  <FontAwesomeIcon icon={socialIcons[id]} />
                </a>
              </li>
            ))}
          </ul>
          <a
            className="btn btn--ghost btn--small"
            href={resume.href}
            download={resume.fileName}
          >
            <FontAwesomeIcon icon={faArrowDown} />
            {t.downloadCv}
          </a>
        </div>
      </nav>

      {open && (
        <button
          type="button"
          className="stage-catcher"
          aria-label={t.backToPage}
          tabIndex={-1}
          onClick={() => closeMenu()}
        />
      )}

      <div
        className={['stage', locked && 'stage--locked', open && 'stage--open']
          .filter(Boolean)
          .join(' ')}
      >
        {locked && (
          <>
            <div className="stage__ghost stage__ghost--back" aria-hidden />
            <div className="stage__ghost stage__ghost--middle" aria-hidden />
          </>
        )}
        <div
          ref={sheetRef}
          className="stage__sheet"
          style={sheetStyle}
          inert={locked}
        >
          {children}
          <SiteFooter
            home={home}
            isHome={isHome}
            name={name}
            role={role}
            social={social}
            year={year}
          />
        </div>
      </div>
    </>
  );
}
