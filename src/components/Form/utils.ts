// The fields the visitor fills in, and when a value is acceptable: any text,
// and for the email, an address.
export const fields = ['fullName', 'email', 'feedback'] as const;

const emailPattern =
  /^(([^<>()\\[\]\\.,;:\s@"]+(\.[^<>()\\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export function isValidField(field: string, value: string | null | undefined) {
  const text = (value ?? '').trim();
  if (!text) return false;
  return field === 'email' ? emailPattern.test(text) : true;
}
