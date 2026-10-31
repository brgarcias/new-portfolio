// FORM PROPS
import { Dispatch, FC, FormEvent, SetStateAction } from 'react';
// HEROUI
import { Spacer, Button } from '@heroui/react';
// FONTAWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEnvelope,
  faPaperPlane,
  faUserAlt,
} from '@fortawesome/free-solid-svg-icons';
// COMPONENT
import InputControl from './InputControl';
// I18N
import { useI18n } from '@/src/i18n/I18nProvider';
// CSS
import './styles.css';

interface FormDataValue {
  emailValue: string;
  feedbackValue: string;
  fullNameValue: string;
  setEmailValue: Dispatch<SetStateAction<string>>;
  setFeedbackValue: Dispatch<SetStateAction<string>>;
  setFullNameValue: Dispatch<SetStateAction<string>>;
}

interface FormProps {
  submitForm: (e: FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
  formData: FormDataValue;
  errorsState: Record<string, boolean>;
  validateField: (input: string, value: string | null) => void;
  onClose: () => void;
  actionButtonDisabled: boolean;
}

const Form: FC<FormProps> = ({
  submitForm,
  isSubmitting,
  formData,
  validateField,
  errorsState,
  onClose,
  actionButtonDisabled,
}) => {
  const t = useI18n().messages.feedback;

  // A field in error is checked again as the visitor types, so the error
  // goes as soon as it is fixed; a field without one is left alone.
  const handleInputChange = (inputName: string, value: string) => {
    if (errorsState[inputName]) validateField(inputName, value);
    switch (inputName) {
      case 'fullName':
        formData.setFullNameValue(value);
        break;
      case 'email':
        formData.setEmailValue(value.trim());
        break;
      case 'feedback':
        formData.setFeedbackValue(value);
        break;
    }
  };

  // Leaving a field checks it once something is written there; entering an
  // empty one, or leaving it empty, says nothing until the form is sent.
  const handleInputBlur = (inputName: string, value: string) => {
    if (value.trim()) validateField(inputName, value);
  };

  return (
    // noValidate: the form checks the fields on sending. The browser's own
    // check stopped the sending of a wrong email with a message of its own.
    <form
      name="contact"
      className="contact-form"
      method="post"
      noValidate
      onSubmit={submitForm}
    >
      {/* Must match the form in public/contact.html, which Netlify reads. */}
      <input type="hidden" name="form-name" value="contact" />
      <p hidden>
        <label>
          {t.botField} <input name="bot-field" />
        </label>
      </p>
      <InputControl
        icon={faUserAlt}
        label={t.nameLabel}
        name="fullName"
        placeholder={t.namePlaceholder}
        type="text"
        variant="bordered"
        disabled={isSubmitting}
        onChangeHandler={(e) => handleInputChange('fullName', e.target.value)}
        onBlurHandler={(e) => handleInputBlur('fullName', e.target.value)}
        error={errorsState.fullName}
        helperText={t.nameError}
      />
      <Spacer y={2} />
      <InputControl
        icon={faEnvelope}
        label={t.emailLabel}
        name="email"
        placeholder={t.emailPlaceholder}
        type="email"
        variant="bordered"
        disabled={isSubmitting}
        onChangeHandler={(e) => handleInputChange('email', e.target.value)}
        onBlurHandler={(e) => handleInputBlur('email', e.target.value)}
        error={errorsState.email}
        helperText={t.emailError}
      />
      <Spacer y={2} />
      <InputControl
        label={t.feedbackLabel}
        placeholder={t.feedbackPlaceholder}
        variant="bordered"
        name="feedback"
        icon={faEnvelope}
        type="text"
        isTextarea
        disabled={isSubmitting}
        onChangeHandler={(e) => handleInputChange('feedback', e.target.value)}
        onBlurHandler={(e) => handleInputBlur('feedback', e.target.value)}
        error={errorsState.feedback}
        helperText={t.feedbackError}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'end',
          marginTop: '20px',
          marginBottom: '5px',
        }}
      >
        <Button color="default" variant="light" onPress={onClose}>
          {t.close}
        </Button>
        <Spacer x={2} />
        {/* The site's main button, as in the top's actions. */}
        <button
          className="btn btn--primary btn--small"
          disabled={actionButtonDisabled}
          type="submit"
        >
          {t.send}
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </div>
    </form>
  );
};

export default Form;
