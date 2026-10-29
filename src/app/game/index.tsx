'use client';

// NEXT
import dynamic from 'next/dynamic';
// HOOKS
import { useSyncExternalStore } from 'react';
// FONT AWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
// I18N
import { useI18n } from '@/src/i18n/I18nProvider';
// GAME
import type { GameProps } from './Game';
// CSS
import './styles.css';

function Notice({ children }: { children: React.ReactNode }) {
  return <div className="game-notice">{children}</div>;
}

function Loading() {
  const t = useI18n().messages.game;
  return (
    <Notice>
      <p className="game-notice__text" role="status">
        {t.loading}
      </p>
    </Notice>
  );
}

// The game and three.js only download here, in the browser, after the page
// is shown.
const Game = dynamic(() => import('./Game'), {
  ssr: false,
  loading: () => <Loading />,
});

// Whether the browser draws 3D, asked once. The server does not know, and
// says nothing, so the page is the same on both sides until then.
let drawing: boolean | null = null;
const canDraw = () => {
  if (drawing === null) {
    const canvas = document.createElement('canvas');
    drawing = Boolean(
      canvas.getContext('webgl2') ?? canvas.getContext('webgl'),
    );
  }
  return drawing;
};
const never = () => () => {};
const unknown = () => null;

// Checks that the browser draws 3D before the game, and three.js, load.
export default function GameLoader({
  places,
  home,
  panels,
}: Readonly<GameProps>) {
  const t = useI18n().messages.game;
  const webgl = useSyncExternalStore(never, canDraw, unknown);

  if (webgl === null) return <Loading />;
  if (!webgl) {
    return (
      <Notice>
        <p className="game-notice__text">{t.noWebgl}</p>
        <a className="btn btn--primary" href={home}>
          <FontAwesomeIcon icon={faArrowLeft} />
          {t.backToSite}
        </a>
      </Notice>
    );
  }
  return <Game places={places} home={home} panels={panels} />;
}
