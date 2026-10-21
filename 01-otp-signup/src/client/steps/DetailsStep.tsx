import { useState, type FormEvent } from 'react';
import { validateDetails, type Details } from '../../shared/details.ts';
import type { FieldError } from '../api.ts';
import { ErrorText } from './ErrorText.tsx';

interface Props {
  details: Details;
  onChange: (details: Details) => void;
  onNext: () => void;
  serverErrors: FieldError[];
}

export function DetailsStep({ details, onChange, onNext, serverErrors }: Props) {
  const [errors, setErrors] = useState<FieldError[]>([]);
  const shown = errors.length > 0 ? errors : serverErrors;
  const errorFor = (field: keyof Details) => shown.find((e) => e.field === field)?.message;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found = validateDetails(details);
    setErrors(found);
    if (found.length === 0) onNext();
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h2 id="step-heading">Who goes there?</h2>
      <p className="lede">Before the questions, the Hall needs to know who you are and where to send word.</p>

      <div className="field">
        <label htmlFor="name">Your name</label>
        <input
          id="name"
          name="name"
          autoComplete="name"
          value={details.name}
          aria-invalid={!!errorFor('name')}
          aria-describedby={errorFor('name') ? 'name-error' : undefined}
          onChange={(e) => onChange({ ...details, name: e.target.value })}
        />
        <ErrorText id="name-error" message={errorFor('name')} />
      </div>

      <div className="field">
        <label htmlFor="email">Your email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={details.email}
          aria-invalid={!!errorFor('email')}
          aria-describedby={errorFor('email') ? 'email-error' : 'email-hint'}
          onChange={(e) => onChange({ ...details, email: e.target.value })}
        />
        <p id="email-hint" className="hint">
          We'll send a raven with a code to prove it's you.
        </p>
        <ErrorText id="email-error" message={errorFor('email')} />
      </div>

      <div className="field checkbox">
        <input
          id="oath"
          name="oath"
          type="checkbox"
          checked={details.oath}
          aria-invalid={!!errorFor('oath')}
          aria-describedby={errorFor('oath') ? 'oath-error' : undefined}
          onChange={(e) => onChange({ ...details, oath: e.target.checked })}
        />
        <label htmlFor="oath">I swear to answer truthfully, by the light of Eärendil.</label>
        <ErrorText id="oath-error" message={errorFor('oath')} />
      </div>

      <div className="actions">
        <span />
        <button type="submit" className="primary">
          Begin the questions
        </button>
      </div>
    </form>
  );
}
