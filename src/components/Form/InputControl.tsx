// HANDLERS
import { ChangeEventHandler, FocusEventHandler } from "react";
// NEXTUI
import { Input, Textarea } from "@nextui-org/react";
// FONTAWESOME
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
// HELPER TEXT COMPONENT
import { HelperText } from "./HelperText";

interface InputControlProps {
  icon: IconProp;
  label: string;
  name: string;
  placeholder: string;
  variant: "flat" | "faded" | "bordered" | "underlined" | undefined;
  type: string;
  isTextarea?: boolean;
  error: boolean;
  helperText: string;
  onChangeHandler: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onFocusHandler: FocusEventHandler;
  onBlurHandler: any;
  disabled: boolean;
}

export default function InputControl({
  icon,
  label,
  name,
  placeholder,
  variant,
  type,
  isTextarea = false,
  error = false,
  helperText,
  onChangeHandler,
  disabled = false,
  onFocusHandler,
  onBlurHandler,
}: InputControlProps) {
  return (
    <div>
      {isTextarea ? (
        <Textarea
          label={label}
          name={name}
          placeholder={placeholder}
          variant={variant}
          minRows={4}
          onChange={onChangeHandler}
          disabled={disabled}
          onFocus={onFocusHandler}
          onBlur={onBlurHandler}
        />
      ) : (
        <Input
          endContent={<FontAwesomeIcon icon={icon} />}
          label={label}
          name={name}
          placeholder={placeholder}
          variant={variant}
          type={type}
          onChange={onChangeHandler}
          disabled={disabled}
          onFocus={onFocusHandler}
          onBlur={onBlurHandler}
        />
      )}
      <HelperText error={error} helperText={helperText} />
    </div>
  );
}
