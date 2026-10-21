export interface Details {
  name: string;
  email: string;
  oath: boolean;
}

export const NAME_MAX_LENGTH = 60;

// Deliberately loose. The real check is whether the code arrives.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateDetails(details: Partial<Details>): { field: keyof Details; message: string }[] {
  const errors: { field: keyof Details; message: string }[] = [];
  const name = typeof details.name === 'string' ? details.name.trim() : '';
  const email = typeof details.email === 'string' ? details.email.trim() : '';

  if (!name) errors.push({ field: 'name', message: 'Even Strider gave a name. Tell us yours.' });
  else if (name.length > NAME_MAX_LENGTH) {
    errors.push({ field: 'name', message: `Names longer than ${NAME_MAX_LENGTH} characters won't fit on the scroll.` });
  }

  if (!email) errors.push({ field: 'email', message: 'We need somewhere to send the raven.' });
  else if (!EMAIL_PATTERN.test(email)) errors.push({ field: 'email', message: "That doesn't look like an email address." });

  if (details.oath !== true) errors.push({ field: 'oath', message: 'You must swear the oath to continue.' });

  return errors;
}
