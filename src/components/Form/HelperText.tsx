type HelperTextProps = {
  error: boolean;
  helperText: string;
};

export const HelperText = ({ error, helperText }: HelperTextProps) => {
  return error ? (
    <span
      style={{
        color: "#e69a93",
        fontSize: "0.8rem",
        paddingLeft: "10px",
        transition: ".3s",
        textTransform: "none",
      }}
    >
      {helperText}
    </span>
  ) : null;
};
