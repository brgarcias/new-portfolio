// HANDLERS
import { ChangeEventHandler, FocusEventHandler, useId } from 'react';
// HEROUI
import { Input, Textarea } from '@heroui/react';
// HELPER TEXT COMPONENT
import { HelperText } from './HelperText';
// ICONS
import type { IconComponent } from '@/src/components/Icon';

interface InputControlProps {
  icon: IconComponent;
  label: string;
  name: string;
  placeholder: string;
  variant: 'flat' | 'faded' | 'bordered' | 'underlined' | undefined;
  type: string;
  isTextarea?: boolean;
  error: boolean;
  helperText: string;
  onChangeHandler: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onBlurHandler: FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  disabled: boolean;
}

export default function InputControl({
  icon: Icon,
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
  onBlurHandler,
}: InputControlProps) {
  // The error under the field describes it, so it is read with the field.
  // The form checks the fields itself, in the page's language, so HeroUI
  // doesn't add the browser's own message under it (validationBehavior).
  const errorId = useId();
  const describedBy = error ? errorId : undefined;
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
          onBlur={onBlurHandler}
          validationBehavior="aria"
          aria-invalid={error || undefined}
          aria-describedby={describedBy}
        />
      ) : (
        <Input
          endContent={<Icon />}
          label={label}
          name={name}
          placeholder={placeholder}
          variant={variant}
          type={type}
          onChange={onChangeHandler}
          disabled={disabled}
          onBlur={onBlurHandler}
          validationBehavior="aria"
          aria-invalid={error || undefined}
          aria-describedby={describedBy}
        />
      )}
      <HelperText id={errorId} error={error} helperText={helperText} />
    </div>
  );
}
