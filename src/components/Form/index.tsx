// FORM PROPS
import { Dispatch, FC, FormEvent, SetStateAction } from "react";
// NEXTUI
import { Spacer } from "@nextui-org/react";
// FONTAWESOME
import { faEnvelope, faUserAlt } from "@fortawesome/free-solid-svg-icons";
// NEXT UI BUTTON
import { Button } from "@nextui-org/react";
// COMPONENT
import InputControl from "./InputControl";

interface FormDataValue {
  emailValue: string;
  feedbackValue: string;
  fullNameValue: string;
  setEmailValue: Dispatch<SetStateAction<string>>;
  setFeedbackValue: Dispatch<SetStateAction<string>>;
  setFullNameValue: Dispatch<SetStateAction<string>>;
}

interface FormProps {
  submitForm: (e: FormEvent) => void;
  isSubmitting: boolean;
  formData: FormDataValue;
  errorsState: Record<string, boolean>;
  validateField: (input: string, value: any) => void;
  actionForm: (data: any) => Promise<void>;
  onClose: () => void;
  actionButtonDisabled: boolean;
}

const Form: FC<FormProps> = ({
  submitForm,
  isSubmitting,
  formData,
  validateField,
  errorsState,
  actionForm,
  onClose,
  actionButtonDisabled,
}) => {
  const handleInputChange = (inputName: string, value: string) => {
    validateField(inputName, value);
    switch (inputName) {
      case "fullName":
        formData.setFullNameValue(value);
        break;
      case "email":
        formData.setEmailValue(value);
        break;
      case "feedback":
        formData.setFeedbackValue(value);
        break;
    }
  };

  const handleInputFocus = (inputName: string) => {
    let value = null;
    switch (inputName) {
      case "fullName":
        value = formData.fullNameValue;
        break;
      case "email":
        value = formData.emailValue;
        break;
      case "feedback":
        value = formData.feedbackValue;
        break;
    }
    validateField(inputName, value);
  };

  const handleInputBlur = (inputName: string, value: string) => {
    validateField(inputName, value);
  };

  const actionButtonForm = (data: any) => actionForm(data);
  return (
    <form
      name="contact"
      className="contact-form"
      data-netlify="true"
      netlify-honeypot="bot-field"
      method="post"
      onSubmit={submitForm}
    >
      <input type="hidden" name="form-name" value="contact" />
      <InputControl
        icon={faUserAlt}
        label="Full Name"
        name="fullName"
        placeholder="Let me know you"
        type="text"
        variant="bordered"
        disabled={isSubmitting}
        onChangeHandler={(e) => handleInputChange("fullName", e.target.value)}
        onFocusHandler={(_e) => handleInputFocus("fullName")}
        onBlurHandler={(e) => handleInputBlur("fullName", e.target.value)}
        error={errorsState.fullNameValue}
        helperText="Please, write your name."
      />
      <Spacer y={2} />
      <InputControl
        icon={faEnvelope}
        label="Email"
        name="email"
        placeholder="Enter your email"
        type="email"
        variant="bordered"
        disabled={isSubmitting}
        onChangeHandler={(e) => handleInputChange("email", e.target.value)}
        onFocusHandler={(_e) => handleInputFocus("email")}
        onBlurHandler={(e) => handleInputBlur("email", e.target.value)}
        error={errorsState.emailValue}
        helperText="Please, tell me your email."
      />
      <Spacer y={2} />
      <InputControl
        label="Feedback"
        placeholder="Leave your feedback"
        variant="bordered"
        name="feedback"
        icon={faEnvelope}
        type="text"
        isTextarea
        disabled={isSubmitting}
        onChangeHandler={(e) => handleInputChange("feedback", e.target.value)}
        onFocusHandler={(_e) => handleInputFocus("feedback")}
        onBlurHandler={(e) => handleInputBlur("feedback", e.target.value)}
        error={errorsState.feedbackValue}
        helperText="Please, write your feedback."
      />
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "end",
          marginTop: "20px",
        }}
      >
        <Button color="default" variant="light" onPress={onClose}>
          Close
        </Button>
        <Spacer x={2} />
        <Button
          style={{
            backgroundColor: "#5c5edc",
          }}
          type="submit"
          onPress={actionButtonForm}
          disabled={actionButtonDisabled}
        >
          Send
        </Button>
      </div>
      <div data-netlify-recaptcha="true" />
    </form>
  );
};

export default Form;
