'use client';

// NEXT
import dynamic from 'next/dynamic';
// HOOKS
import { FormEvent, useEffect, useState } from 'react';
// ICONS
import {
  AlertCircleIcon,
  CheckIcon,
  MessageIcon,
  type IconComponent,
} from '@/src/components/Icon';
// COMPONENTS
import ModalComponent from '@/src/components/Modal/Lazy';
import { openOnKey } from '@/src/components/Modal/openOnKey';
import { whenIdle } from '@/src/components/Modal/whenIdle';
import SnackbarFeedback from '@/src/components/SnackBar';
import { fields, isValidField } from '@/src/components/Form/utils';
// I18N
import { useI18n } from '@/src/i18n/I18nProvider';

// The feedback form uses HeroUI's fields, so it loads like the dialog: when
// the browser is idle after the page, or when the dialog opens.
const loadForm = () => import('@/src/components/Form');
const Form = dynamic(loadForm, { ssr: false });

const noErrors = { fullName: false, email: false, feedback: false };

// The button that opens the feedback form, the form itself and the notice of
// how the sending went.
export default function Feedback({ label }: Readonly<{ label: string }>) {
  const tf = useI18n().messages.feedback;
  const [visible, setVisible] = useState(false);
  const [fullNameValue, setFullNameValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [feedbackValue, setFeedbackValue] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState({
    open: false,
    title: '',
    description: '',
    icon: CheckIcon as IconComponent,
    colorIcon: '',
  });

  useEffect(() => whenIdle(() => void loadForm()), []);
  const [errorsState, setErrorsState] = useState(noErrors);
  const validateField = (fieldName: string, value: string | null) => {
    setErrorsState((prevState) => ({
      ...prevState,
      [fieldName]: !isValidField(fieldName, value),
    }));
  };

  const submitForm = async (data: FormEvent<HTMLFormElement>) => {
    data.preventDefault();
    const formData = new FormData(data.currentTarget);
    const formDataParsed: Record<string, string> = {};

    formData.forEach(function (value, index) {
      formDataParsed[index] = value.toString();
    });

    const validateAndSubmit = async () => {
      try {
        // Netlify Forms only accepts submissions posted to a static file.
        // A POST to / reaches the Next.js server and the message is lost.
        const response = await fetch('/contact.html', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(formDataParsed).toString(),
        });

        if (response.ok) {
          setOpenSnackbar({
            open: true,
            title: tf.sentTitle,
            description: tf.sentText,
            icon: CheckIcon,
            colorIcon: 'var(--color-success)',
          });
        } else {
          console.error('Error on sending forms: ', response);
          throw new Error('An error occurred while sending your message');
        }
      } catch (error) {
        console.error('Error submitting form:', error);
        setOpenSnackbar({
          open: true,
          title: tf.failedTitle,
          description: tf.failedText,
          icon: AlertCircleIcon,
          colorIcon: 'var(--color-error)',
        });
      } finally {
        setSubmitting(false);
        setVisible(false);
      }
    };
    // Only the visitor's fields are required. The form also sends form-name
    // and the bot-field honeypot, which stays empty. Every field is checked,
    // the email's format included, and the first wrong one takes the focus.
    // It does before the errors show, so a screen reader names the field and
    // then reads the errors, alerts, once.
    const wrong = fields.filter(
      (field) => !isValidField(field, formDataParsed[field]),
    );
    setErrorsState({
      fullName: wrong.includes('fullName'),
      email: wrong.includes('email'),
      feedback: wrong.includes('feedback'),
    });
    if (wrong.length) {
      const first = data.currentTarget.elements.namedItem(wrong[0]);
      if (first instanceof HTMLElement) first.focus();
      return;
    }
    setSubmitting(true);
    validateAndSubmit();
  };

  // The form opens with its fields empty, so without the errors of the last
  // time it was open.
  const openModalFeedback = () => {
    setErrorsState(noErrors);
    setVisible(true);
  };

  return (
    <>
      <SnackbarFeedback content={openSnackbar} setOpen={setOpenSnackbar} />
      <button
        type="button"
        className="btn btn--text"
        onClick={openModalFeedback}
        onKeyDown={openOnKey(openModalFeedback)}
      >
        <MessageIcon />
        {label}
      </button>
      <ModalComponent
        title={tf.title}
        subtitle={tf.subtitle}
        visible={visible}
        setVisible={setVisible}
        size="md"
        hideCloseButton
      >
        <Form
          submitForm={submitForm}
          isSubmitting={isSubmitting}
          formData={{
            emailValue,
            feedbackValue,
            fullNameValue,
            setEmailValue,
            setFeedbackValue,
            setFullNameValue,
          }}
          validateField={validateField}
          onClose={() => setVisible(false)}
          actionButtonDisabled={isSubmitting}
          errorsState={errorsState}
        />
      </ModalComponent>
    </>
  );
}
