'use client';

// NEXT
import dynamic from 'next/dynamic';
// HOOKS
import { useCallback, useEffect, useState } from 'react';
// FONTAWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComment } from '@fortawesome/free-solid-svg-icons';
// COMPONENTS
import ModalComponent from '@/src/components/Modal/Lazy';
import { openOnKey } from '@/src/components/Modal/openOnKey';
import { whenIdle } from '@/src/components/Modal/whenIdle';
import SnackbarFeedback from '@/src/components/SnackBar';
// I18N
import { useI18n } from '@/src/i18n/I18nProvider';

// The form uses HeroUI's fields, so it loads like the dialog: when the
// browser is idle after the page, or as soon as the dialog opens.
const loadForm = () => import('@/src/components/Form');
const Form = dynamic(loadForm, { ssr: false });

// A comment about the portfolio for Bruno: a quiet button that opens the
// form in a dialog, and a notice once the message has gone out.
export default function Feedback() {
  const t = useI18n().messages.feedback;
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const show = () => setOpen(true);
  const hideNotice = useCallback(() => setSent(false), []);

  useEffect(() => whenIdle(() => void loadForm()), []);

  return (
    <>
      <button
        type="button"
        className="btn btn--text feedback-trigger"
        onClick={show}
        onKeyDown={openOnKey(show)}
      >
        <FontAwesomeIcon icon={faComment} />
        {t.open}
      </button>
      <ModalComponent
        title={t.title}
        subtitle={t.subtitle}
        visible={open}
        setVisible={setOpen}
        size="md"
        hideCloseButton
      >
        <Form
          onSent={() => {
            setOpen(false);
            setSent(true);
          }}
          onClose={() => setOpen(false)}
        />
      </ModalComponent>
      <SnackbarFeedback
        open={sent}
        onClose={hideNotice}
        title={t.sentTitle}
        description={t.sentText}
      />
    </>
  );
}
