'use client';

// HOOKS
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from 'react';
// I18N
import { useI18n } from '@/src/i18n/I18nProvider';
import { format } from '@/src/i18n/messages';
// CONTENT
import type { SectionId } from '@/src/content/sections';
// SITE
import { siteUrl } from '@/src/app/site';
// GAME
import {
  cssFilter,
  develop,
  filterIds,
  frameIds,
  frames,
  type FilterId,
  type FrameId,
} from './darkroom';
import { overlay } from './overlay';
import {
  cameraSettings,
  dolly,
  limits,
  orbit,
  pan,
  photo,
  resetCamera,
  setCamera,
  type CameraSetting,
} from './photo';
import type { Ship } from './ships';
import { snapshot } from './Snapshot';
import { play } from './sound';
import { Keycap } from './ui';
import { useDialog } from './useDialog';
import { biomes } from './world/biomes';
// ICONS
import {
  ArrowLeftIcon,
  CameraIcon,
  CheckIcon,
  DownloadIcon,
  EyeIcon,
  EyeOffIcon,
  RotateCcwIcon,
  SendIcon,
  XIcon,
} from '@/src/components/Icon';

const siteName = siteUrl.replace(/^https?:\/\//, '');

const registerRoot = (element: HTMLDivElement | null) => {
  photo.root = element;
};

const steps: Record<CameraSetting, number> = {
  rotate: 1,
  angle: 1,
  distance: 0.5,
  zoom: 0.05,
  tilt: 1,
};

// A slider of the camera. The camera's frame writes its value and its number, as
// the pointer and the keys move the camera too.
function CameraSlider({
  setting,
  label,
}: Readonly<{ setting: CameraSetting; label: string }>) {
  const id = useId();
  const [min, max] = limits[setting];
  return (
    <div className="photo-range">
      <label htmlFor={id}>{label}</label>
      <output
        ref={(element) => {
          (photo.sliders[setting] ??= {}).output = element;
        }}
        className="g-num"
        htmlFor={id}
      />
      <input
        ref={(element) => {
          (photo.sliders[setting] ??= {}).input = element;
        }}
        id={id}
        type="range"
        min={min}
        max={max}
        step={steps[setting]}
        onChange={(event) =>
          setCamera(setting, Number(event.currentTarget.value))
        }
      />
    </div>
  );
}

function Switch({
  label,
  on,
  onChange,
}: Readonly<{ label: string; on: boolean; onChange: (on: boolean) => void }>) {
  return (
    <button
      type="button"
      role="switch"
      className="photo-switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
    >
      {label}
      <span className="photo-switch__led" aria-hidden="true" />
    </button>
  );
}

interface Picture {
  canvas: HTMLCanvasElement;
  blob: Blob;
  url: string;
  name: string;
}

// The photo, before it is kept: saved, shared where the system can, or left
// behind for another try.
function Preview({
  picture,
  onClose,
}: Readonly<{ picture: Picture; onClose: () => void }>) {
  const t = useI18n().messages.game;
  const dialog = useRef<HTMLDivElement>(null);
  const save = useRef<HTMLAnchorElement>(null);
  const shown = useRef<HTMLCanvasElement>(null);
  const [saved, setSaved] = useState(false);
  const { canvas, blob, url, name } = picture;
  useDialog(dialog, onClose, save);

  useEffect(() => {
    shown.current?.getContext('2d')?.drawImage(canvas, 0, 0);
  }, [canvas]);

  const file = new File([blob], name, { type: 'image/png' });
  const canShare =
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] });
  const share = () => {
    navigator
      .share({ files: [file] })
      .then(() => setSaved(true))
      // Closed the system's sheet: nothing to say.
      .catch(() => undefined);
  };

  return (
    <div className="photo-preview" data-photo-preview="">
      <div
        ref={dialog}
        className="photo-preview__sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="photo-preview-title"
        tabIndex={-1}
      >
        <canvas
          ref={shown}
          className="photo-preview__picture"
          width={canvas.width}
          height={canvas.height}
          role="img"
          aria-label={t.yourPhoto}
        />
        <div className="photo-preview__side">
          <div>
            <p className="g-label">{t.photoMode}</p>
            <h2 id="photo-preview-title" className="photo-preview__title">
              {t.yourPhoto}
            </h2>
            <p className="photo-preview__meta g-num">
              {name}
              <br />
              {format(t.photoSize, {
                width: String(canvas.width),
                height: String(canvas.height),
              })}
            </p>
          </div>
          <div className="photo-preview__actions">
            <a
              ref={save}
              className="g-btn g-btn--primary"
              href={url}
              download={name}
              onClick={() => setSaved(true)}
            >
              <DownloadIcon />
              {t.savePhoto}
            </a>
            {canShare && (
              <button type="button" className="g-btn" onClick={share}>
                <SendIcon />
                {t.sharePhoto}
              </button>
            )}
            <button type="button" className="g-btn" onClick={onClose}>
              <ArrowLeftIcon />
              {t.backToCamera}
              <Keycap>Esc</Keycap>
            </button>
          </div>
          <p className="photo-preview__saved" role="status">
            {saved && (
              <>
                <CheckIcon />
                {t.photoSaved}
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

// Where the fingers or the mouse's buttons are, on the picture.
const pointers = new Map<
  number,
  { x: number; y: number; pan: boolean; moved: boolean }
>();

type Tab = 'camera' | 'look' | 'frame';

// The photo mode, like a console game's: the world stops, the camera is free to
// go around, and the picture takes a filter, a frame and a caption. Taking the
// photo shows it first, to save it, share it or try again. It sits over the
// flight, whose camera PhotoRig moves, and darkroom.ts develops the picture.
export default function PhotoMode({
  ship,
  onLeave,
}: Readonly<{ ship: Ship; onLeave: () => void }>) {
  const t = useI18n().messages.game;
  // On a phone the settings start closed, as they cover half of the picture, and
  // a tab opens them and closes them again.
  const [tab, setTab] = useState<Tab | null>(() =>
    window.matchMedia('(max-width: 767px)').matches ? null : 'camera',
  );
  const [filter, setFilter] = useState<FilterId>('none');
  const [exposure, setExposure] = useState(0);
  const [frame, setFrame] = useState<FrameId>('screen');
  const [vignette, setVignette] = useState(false);
  const [grid, setGrid] = useState(false);
  const [caption, setCaption] = useState(true);
  const [showShip, setShowShip] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [shots, setShots] = useState(0);
  const [picture, setPicture] = useState<Picture | null>(null);
  const shutter = useRef<HTMLButtonElement>(null);
  const stamp = useRef<HTMLDivElement>(null);
  // The planet under the ship, which does not move while the photo is framed.
  const [sector] = useState(() => overlay.hud?.dataset.sector);
  const planet =
    sector && sector !== 'hub'
      ? biomes[sector as SectionId].planet
      : t.centralDeck;
  const fileSlug =
    sector && sector !== 'hub'
      ? biomes[sector as SectionId].planet.toLowerCase()
      : 'space';
  const line = `${ship.name} · ${siteName}`;

  // The focus goes back where it was, and the keyboard starts on the shutter.
  useEffect(() => {
    const before = document.activeElement;
    shutter.current?.focus({ preventScroll: true });
    return () => {
      if (before instanceof HTMLElement && before.isConnected) before.focus();
      pointers.clear();
    };
  }, []);

  // The filter shows on the canvas itself, as it would come out.
  useEffect(() => {
    const canvas = document.querySelector<HTMLElement>('.game__canvas');
    if (!canvas) return;
    canvas.style.filter = cssFilter(filter, exposure);
    return () => {
      canvas.style.filter = '';
    };
  }, [filter, exposure]);

  useEffect(() => {
    photo.hideShip = !showShip;
  }, [showShip]);

  // The memory of the last photo goes with it.
  useEffect(() => {
    photo.held = Boolean(picture);
    if (!picture) return;
    const { url } = picture;
    return () => URL.revokeObjectURL(url);
  }, [picture]);

  const take = () => {
    if (!snapshot.take || picture) return;
    const family = stamp.current
      ? getComputedStyle(stamp.current).fontFamily
      : 'sans-serif';
    const developed = snapshot.take((canvas) =>
      develop(canvas, {
        filter,
        exposure,
        vignette,
        frame,
        caption: caption ? { title: planet, line, family } : null,
      }),
    );
    play('photo');
    setShots((count) => count + 1);
    developed.toBlob((blob) => {
      if (!blob) return;
      setPicture({
        canvas: developed,
        blob,
        url: URL.createObjectURL(blob),
        name: `portfolio-${fileSlug}.png`,
      });
    }, 'image/png');
  };

  // Q and E take the camera down and up, Space takes the photo, H clears the
  // screen and R brings the camera back. With the photo showing, Escape and P
  // close it, and do not leave the mode, whose keys are on the window.
  const onKey = useRef<(event: KeyboardEvent) => void>(() => undefined);
  useEffect(() => {
    onKey.current = (event) => {
      const down = event.type === 'keydown';
      const { target } = event;
      // The flight's keyboard takes Space from the page, buttons included, so
      // it presses them here.
      const pressed =
        down &&
        !event.repeat &&
        event.code === 'Space' &&
        target instanceof HTMLButtonElement &&
        target !== shutter.current;
      if (pressed) target.click();
      if (picture) {
        if (event.key === 'Escape' || event.code === 'KeyP') {
          event.stopPropagation();
        }
        return;
      }
      if (pressed) return;
      if (hidden && down && event.key === 'Escape') {
        event.stopPropagation();
        setHidden(false);
        return;
      }
      if (event.code === 'KeyQ' || event.code === 'KeyE') {
        const lift = event.code === 'KeyE' ? 1 : -1;
        if (down) photo.lift = lift;
        else if (photo.lift === lift) photo.lift = 0;
        return;
      }
      if (!down || event.repeat) return;
      if (event.code === 'KeyH') {
        setHidden((value) => !value);
      } else if (event.code === 'KeyR') {
        resetCamera();
      } else if (event.code === 'Space') {
        take();
      }
    };
  });
  useEffect(() => {
    const listener = (event: KeyboardEvent) => onKey.current(event);
    document.addEventListener('keydown', listener);
    document.addEventListener('keyup', listener);
    return () => {
      document.removeEventListener('keydown', listener);
      document.removeEventListener('keyup', listener);
      photo.lift = 0;
    };
  }, []);

  // On the picture: drag to go around the ship, with the right button or Shift
  // to move, the wheel for the distance. Two fingers pinch and move; a tap brings
  // the controls back.
  const onDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    if (document.activeElement instanceof HTMLInputElement) {
      document.activeElement.blur();
    }
    pointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
      pan: event.button !== 0 || event.shiftKey,
      moved: false,
    });
  };
  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    const pointer = pointers.get(event.pointerId);
    if (!pointer) return;
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    const height = event.currentTarget.clientHeight;
    if (Math.abs(dx) + Math.abs(dy) > 0) pointer.moved = true;
    if (pointers.size >= 2) {
      const other = [...pointers.entries()].find(
        ([id]) => id !== event.pointerId,
      )?.[1];
      if (other) {
        const before = Math.hypot(pointer.x - other.x, pointer.y - other.y);
        const after = Math.hypot(
          event.clientX - other.x,
          event.clientY - other.y,
        );
        if (before > 0 && after > 0) dolly(before / after);
        // The fingers' middle moves by half of what this one did.
        pan(dx / 2, dy / 2, height);
      }
    } else if (pointer.pan) {
      pan(dx, dy, height);
    } else {
      orbit(dx, dy);
    }
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  };
  const onUp = (event: PointerEvent<HTMLDivElement>) => {
    const pointer = pointers.get(event.pointerId);
    pointers.delete(event.pointerId);
    if (pointer && !pointer.moved && event.pointerType === 'touch') {
      setHidden(false);
    }
  };

  const ratio = frames[frame];

  return (
    <div
      ref={registerRoot}
      className="photo"
      role="group"
      aria-label={t.photoMode}
      data-hidden={hidden ? '' : undefined}
    >
      <div
        className="photo__surface"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onWheel={(event) => dolly(Math.exp(event.deltaY * 0.001))}
        onContextMenu={(event) => event.preventDefault()}
      />

      {/* What will come out: the frame, the vignette and the caption. */}
      <div
        className="photo__crop"
        data-frame={frame}
        style={ratio ? ({ '--ratio': ratio } as CSSProperties) : undefined}
      >
        {vignette && <span className="photo__vignette" aria-hidden="true" />}
        {grid && <span className="photo__grid" aria-hidden="true" />}
        <span className="photo__frame" aria-hidden="true" />
        <div
          ref={stamp}
          className="photo__caption"
          data-off={caption ? undefined : ''}
          aria-hidden="true"
        >
          <b>{planet}</b>
          <span>{line}</span>
        </div>
      </div>

      {hidden ? (
        <button
          type="button"
          className="g-btn g-btn--icon photo__reveal"
          aria-label={t.showControls}
          data-tip={t.showControls}
          data-key="H"
          onClick={() => setHidden(false)}
        >
          <EyeIcon />
        </button>
      ) : (
        <>
          <div className="photo__bar">
            <span className="g-label photo__label">
              <CameraIcon />
              {t.photoMode}
            </span>
            <button
              type="button"
              className="g-btn g-btn--icon"
              aria-label={t.hideControls}
              data-tip={t.hideControls}
              data-key="H"
              onClick={() => setHidden(true)}
            >
              <EyeOffIcon />
            </button>
            <button type="button" className="g-btn" onClick={onLeave}>
              <XIcon />
              <span className="photo__leave">{t.leavePhoto}</span>
              <Keycap>Esc</Keycap>
            </button>
          </div>

          <p className="photo__hints photo__hints--keys">
            <span>
              <Keycap>W</Keycap>
              <Keycap>A</Keycap>
              <Keycap>S</Keycap>
              <Keycap>D</Keycap>
              {t.photoHintMove}
            </span>
            <span>
              <Keycap>Q</Keycap>
              <Keycap>E</Keycap>
              {t.photoHintHeight}
            </span>
            <span>{t.photoHintDrag}</span>
            <span>{t.photoHintPan}</span>
            <span>{t.photoHintWheel}</span>
          </p>
          <p className="photo__hints photo__hints--touch">{t.photoHintTouch}</p>

          <div className="photo__dock">
            <button
              ref={shutter}
              type="button"
              className="g-btn g-btn--primary photo__shutter"
              onClick={take}
            >
              <CameraIcon />
              {t.takePhoto}
              <Keycap>Space</Keycap>
            </button>

            <div className="photo__panel">
              <div
                className="photo__tabs"
                role="group"
                aria-label={t.photoSettings}
              >
                {(['camera', 'look', 'frame'] as const).map((id) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={tab === id}
                    onClick={() =>
                      setTab((current) => (current === id ? null : id))
                    }
                  >
                    {t.photoTabs[id]}
                  </button>
                ))}
              </div>

              <div className="photo__tab" hidden={tab !== 'camera'}>
                {cameraSettings.map((setting) => (
                  <CameraSlider
                    key={setting}
                    setting={setting}
                    label={t.photoCamera[setting]}
                  />
                ))}
                <Switch
                  label={t.photoShip}
                  on={showShip}
                  onChange={setShowShip}
                />
                <button
                  type="button"
                  className="g-btn photo__reset"
                  onClick={resetCamera}
                >
                  <RotateCcwIcon />
                  {t.resetCamera}
                  <Keycap>R</Keycap>
                </button>
              </div>

              <div className="photo__tab" hidden={tab !== 'look'}>
                <p className="g-label">{t.photoFilter}</p>
                <div className="photo__chips">
                  {filterIds.map((id) => (
                    <button
                      key={id}
                      type="button"
                      className="photo-chip"
                      aria-pressed={filter === id}
                      onClick={() => setFilter(id)}
                    >
                      <span
                        className="photo-chip__swatch"
                        style={{ filter: cssFilter(id, 0) }}
                        aria-hidden="true"
                      />
                      {t.photoFilters[id]}
                    </button>
                  ))}
                </div>
                <div className="photo-range">
                  <label htmlFor="photo-exposure">{t.photoExposure}</label>
                  <output className="g-num" htmlFor="photo-exposure">
                    {exposure > 0 ? '+' : ''}
                    {exposure.toFixed(1)}
                  </output>
                  <input
                    id="photo-exposure"
                    type="range"
                    min={-1}
                    max={1}
                    step={0.1}
                    value={exposure}
                    onChange={(event) =>
                      setExposure(Number(event.currentTarget.value))
                    }
                  />
                </div>
                <Switch
                  label={t.photoVignette}
                  on={vignette}
                  onChange={setVignette}
                />
              </div>

              <div className="photo__tab" hidden={tab !== 'frame'}>
                <div className="photo__chips">
                  {frameIds.map((id) => (
                    <button
                      key={id}
                      type="button"
                      className="photo-chip"
                      aria-pressed={frame === id}
                      onClick={() => setFrame(id)}
                    >
                      <span
                        className="photo-chip__shape"
                        style={
                          {
                            '--shape': frames[id] ?? 'var(--screen-shape)',
                          } as CSSProperties
                        }
                        aria-hidden="true"
                      />
                      {t.photoFrames[id]}
                    </button>
                  ))}
                </div>
                <Switch label={t.photoGrid} on={grid} onChange={setGrid} />
                <Switch
                  label={t.photoCaption}
                  on={caption}
                  onChange={setCaption}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {picture && (
        <Preview picture={picture} onClose={() => setPicture(null)} />
      )}
      {shots > 0 && (
        <span key={shots} className="photo__flash" aria-hidden="true" />
      )}
    </div>
  );
}
