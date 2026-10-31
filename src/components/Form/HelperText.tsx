// FONTAWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons';

type HelperTextProps = {
  id: string;
  error: boolean;
  helperText: string;
};

// An alert, so screen readers announce the error as it appears: on sending,
// or on leaving a field with a wrong value.
export const HelperText = ({ id, error, helperText }: HelperTextProps) => {
  return error ? (
    <span id={id} role="alert" className="form-error">
      <FontAwesomeIcon icon={faCircleExclamation} />
      {helperText}
    </span>
  ) : null;
};
