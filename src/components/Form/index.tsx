// FORM PROPS
import { Dispatch, FC, FocusEvent, FormEvent, SetStateAction } from 'react';
// HEROUI
import { Spacer, Button } from '@heroui/react';
// FONTAWESOME
import { faEnvelope, faUserAlt } from '@fortawesome/free-solid-svg-icons';
// COMPONENT
import InputControl from './InputControl';
// I18N
import { useI18n } from '@/src/i18n/I18nProvider';
// CSS
import './styles.css';
// UTILS
import { formatEmail } from './utils';

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

  const handleInputChange = (inputName: string, value: string) => {
    validateField(inputName, value);
    switch (inputName) {
      case 'fullName':
        formData.setFullNameValue(value);
        break;
      case 'email':
        formData.setEmailValue(formatEmail(value, validateField));
        break;
      case 'feedback':
        formData.setFeedbackValue(value);
        break;
    }
  };

  const handleInputFocus = (
    inputName: string,
    e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    validateField(inputName, e.target.value);
  };

  const handleInputBlur = (inputName: string, value: string) => {
    validateField(inputName, value);
  };

  return (
    <form
      name="contact"
      className="contact-form"
      method="post"
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
        onFocusHandler={(e) => handleInputFocus('fullName', e)}
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
        onFocusHandler={(e) => handleInputFocus('email', e)}
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
        onFocusHandler={(e) => handleInputFocus('feedback', e)}
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
        <button
          className="action-button"
          disabled={actionButtonDisabled}
          type="submit"
        >
          {t.send}
        </button>
      </div>
    </form>
  );
};

export default Form;
