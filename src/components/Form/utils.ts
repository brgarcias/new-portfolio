const formatEmail = (
  input: string,
  validateField: (input: string, value: any) => void
) => {
  const inputFormatted = input.trim();
  const regex =
    /^(([^<>()\\[\]\\.,;:\s@"]+(\.[^<>()\\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  if (regex.test(inputFormatted)) {
    validateField("emailValue", inputFormatted);
  } else {
    validateField("emailValue", null);
  }
  return inputFormatted;
};
