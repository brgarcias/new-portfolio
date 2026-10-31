// The fields the visitor fills in, as public/contact.html declares them to
// Netlify, and what each one needs: the name and the message some text,
// the email an address with a domain.
export const fields = ['fullName', 'email', 'feedback'] as const;

export type Field = (typeof fields)[number];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValid(field: Field, value: string) {
  const text = value.trim();
  return field === 'email' ? emailPattern.test(text) : text.length > 0;
}
