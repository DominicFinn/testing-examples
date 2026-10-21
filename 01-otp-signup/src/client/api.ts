import type { Details } from '../shared/details.ts';
import type { Answers } from '../shared/quiz.ts';

export interface FieldError {
  field: string | null;
  message: string;
}

export type RegisterResult =
  | { ok: true; email: string; expiresAt: string }
  | { ok: false; errors: FieldError[] };

export async function register(details: Details, answers: Answers): Promise<RegisterResult> {
  let res: Response;
  try {
    res = await fetch('/api/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...details, answers }),
    });
  } catch {
    return { ok: false, errors: [{ field: null, message: 'The raven could not take off. Check your connection and try again.' }] };
  }

  const body = await res.json().catch(() => ({}));
  if (res.ok) return { ok: true, email: body.email, expiresAt: body.expiresAt };
  return {
    ok: false,
    errors: Array.isArray(body.errors) ? body.errors : [{ field: null, message: 'Something went wrong. Try again.' }],
  };
}
