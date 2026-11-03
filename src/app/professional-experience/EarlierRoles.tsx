'use client';

// HOOKS
import { type ReactNode, useId, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
// ICONS
import { ChevronDownIcon } from '@/src/components/Icon';
// I18N
import { useI18n } from '@/src/i18n/I18nProvider';
import { format } from '@/src/i18n/messages';

// The early roles, behind a button, so the timeline leads with the work that
// matters most today. Showing them takes the focus to the first one, so the
// keyboard goes on from there.
export default function EarlierRoles({
  count,
  children,
}: Readonly<{ count: number; children: ReactNode }>) {
  const t = useI18n().messages.experience;
  const [expanded, setExpanded] = useState(false);
  const listId = useId();
  const list = useRef<HTMLOListElement>(null);

  const toggle = () => {
    flushSync(() => setExpanded(!expanded));
    if (!expanded) list.current?.querySelector('button')?.focus();
  };

  return (
    <>
      <ol ref={list} id={listId} className="xp__list" hidden={!expanded}>
        {children}
      </ol>
      <div className="xp__earlier">
        <button
          type="button"
          className="btn btn--ghost btn--small"
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={toggle}
        >
          {expanded ? t.fewerEarlier : format(t.earlier, { count })}
          <ChevronDownIcon />
        </button>
      </div>
    </>
  );
}
