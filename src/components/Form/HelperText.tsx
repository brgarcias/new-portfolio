type HelperTextProps = {
  id: string;
  error: boolean;
  helperText: string;
};

// An alert, so screen readers announce the error as it appears: on sending,
// or on leaving a field with a wrong value.
export const HelperText = ({ id, error, helperText }: HelperTextProps) => {
  return error ? (
    <span
      id={id}
      role="alert"
      style={{
        color: 'var(--color-error)',
        fontSize: '0.8rem',
        paddingLeft: '10px',
        transition: '.3s',
        textTransform: 'none',
      }}
    >
      {helperText}
    </span>
  ) : null;
};
