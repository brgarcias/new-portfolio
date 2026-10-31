'use client';

// HOOKS
import { FocusEvent, SubmitEvent, useState } from 'react';
// HEROUI
import { Input, Textarea } from '@heroui/react';
// I18N
import { useI18n } from '@/src/i18n/I18nProvider';
// VALIDATION
import { fields, isValid, type Field } from './validate';
// CSS
import './styles.css';

interface FormProps {
  // Called once Netlify has the message.
  onSent: () => void;
  onClose: () => void;
}

// The feedback form. A field is checked when the visitor leaves it with
// something typed, all of them when the message is sent, and a field shown
// as wrong again as it changes, so its error goes away once it is right.
// The message goes to Netlify Forms, which only accepts a POST to the static
// file that declares the form, public/contact.html: a POST to / reaches the
// Next.js server and is lost. If sending fails, the dialog stays open with
// the text, to try again.
export default function Form({ onSent, onClose }: Readonly<FormProps>) {
  const t = useI18n().messages.feedback;
  const [invalid, setInvalid] = useState<Partial<Record<Field, boolean>>>({});
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);

  const mark = (field: Field, value: string) =>
    setInvalid((state) => ({ ...state, [field]: !isValid(field, value) }));

  // HeroUI's fields: the label above the value, and the error under it,
  // which the field names as its description for screen readers.
  const props = (field: Field) => ({
    name: field,
    variant: 'bordered' as const,
    labelPlacement: 'outside' as const,
    validationBehavior: 'aria' as const,
    isDisabled: sending,
    isInvalid: invalid[field] ?? false,
    onBlur: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (event.target.value.trim()) mark(field, event.target.value);
    },
    onValueChange: (value: string) => {
      if (invalid[field]) mark(field, value);
    },
  });

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    // The form has text fields only.
    const text = (entry: FormDataEntryValue | null) =>
      typeof entry === 'string' ? entry : '';
    const value = (field: Field) => text(data.get(field));
    const wrong = fields.filter((field) => !isValid(field, value(field)));
    if (wrong.length) {
      setInvalid(Object.fromEntries(wrong.map((field) => [field, true])));
      form.querySelector<HTMLElement>(`[name="${wrong[0]}"]`)?.focus();
      return;
    }
    setSending(true);
    setFailed(false);
    try {
      const response = await fetch('/contact.html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(
          [...data].map(([name, entry]) => [name, text(entry)]),
        ).toString(),
      });
      if (!response.ok) throw new Error(`Netlify answered ${response.status}`);
      onSent();
    } catch (error) {
      console.error('The feedback was not sent:', error);
      setFailed(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <form
      name="contact"
      className="feedback-form"
      method="post"
      noValidate
      onSubmit={submit}
    >
      {/* Must match the form in public/contact.html, which Netlify reads. */}
      <input type="hidden" name="form-name" value="contact" />
      <p hidden>
        <label>
          {t.botField} <input name="bot-field" />
        </label>
      </p>
      <Input
        {...props('fullName')}
        type="text"
        autoComplete="name"
        label={t.nameLabel}
        placeholder={t.namePlaceholder}
        errorMessage={t.nameError}
      />
      <Input
        {...props('email')}
        type="email"
        autoComplete="email"
        label={t.emailLabel}
        placeholder={t.emailPlaceholder}
        errorMessage={t.emailError}
      />
      <Textarea
        {...props('feedback')}
        minRows={4}
        label={t.feedbackLabel}
        placeholder={t.feedbackPlaceholder}
        errorMessage={t.feedbackError}
      />
      {failed && (
        <p className="feedback-form__failed" role="alert">
          {t.failed}
        </p>
      )}
      <div className="feedback-form__actions">
        <button type="button" className="btn btn--text" onClick={onClose}>
          {t.close}
        </button>
        <button
          type="submit"
          className="btn btn--primary btn--small"
          disabled={sending}
        >
          {sending ? t.sending : t.send}
        </button>
      </div>
    </form>
  );
}
