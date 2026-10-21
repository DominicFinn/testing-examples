import { useState, type FormEvent } from 'react';
import { validateAnswer, type AnswerValue, type Question } from '../../shared/quiz.ts';
import type { FieldError } from '../api.ts';
import { ErrorText } from './ErrorText.tsx';

interface Props {
  question: Question;
  initialValue: AnswerValue | undefined;
  isLast: boolean;
  submitting: boolean;
  serverErrors: FieldError[];
  onBack: () => void;
  onNext: (value: AnswerValue) => void;
}

export function QuestionStep({ question, initialValue, isLast, submitting, serverErrors, onBack, onNext }: Props) {
  const [value, setValue] = useState<AnswerValue | undefined>(
    initialValue ?? (question.kind === 'range' ? question.initial : undefined),
  );
  const [error, setError] = useState<string | null>(null);
  const message = error ?? serverErrors[0]?.message;
  const errorId = `${question.id}-error`;
  const hintId = `${question.id}-hint`;
  const describedBy = [question.hint ? hintId : null, message ? errorId : null].filter(Boolean).join(' ') || undefined;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const normalised = question.kind === 'number' || question.kind === 'range' ? toNumber(value) : value;
    const found = validateAnswer(question, normalised);
    setError(found);
    if (!found && normalised !== undefined) onNext(normalised);
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {question.kind === 'choice' ? (
        <fieldset aria-describedby={describedBy}>
          <legend>
            <h2 id="step-heading">{question.prompt}</h2>
          </legend>
          {question.hint && <Hint id={hintId} text={question.hint} />}
          <div className="choices">
            {question.options.map((option) => (
              <label key={option.value} className="choice">
                <input
                  type="radio"
                  name={question.id}
                  value={option.value}
                  checked={value === option.value}
                  onChange={() => setValue(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : (
        <>
          <h2 id="step-heading">
            <label htmlFor={question.id}>{question.prompt}</label>
          </h2>
          {question.hint && <Hint id={hintId} text={question.hint} />}

          {question.kind === 'number' && (
            <input
              id={question.id}
              name={question.id}
              type="number"
              inputMode="numeric"
              min={question.min}
              max={question.max}
              value={value ?? ''}
              aria-invalid={!!message}
              aria-describedby={describedBy}
              onChange={(e) => setValue(e.target.value)}
            />
          )}

          {question.kind === 'text' && (
            <input
              id={question.id}
              name={question.id}
              type="text"
              autoComplete="off"
              placeholder={question.placeholder}
              value={value ?? ''}
              aria-invalid={!!message}
              aria-describedby={describedBy}
              onChange={(e) => setValue(e.target.value)}
            />
          )}

          {question.kind === 'range' && (
            <div className="range">
              <input
                id={question.id}
                name={question.id}
                type="range"
                min={question.min}
                max={question.max}
                step={1}
                value={value ?? question.initial}
                aria-describedby={describedBy}
                aria-valuetext={`${value} out of ${question.max}`}
                onChange={(e) => setValue(Number(e.target.value))}
              />
              <div className="range-labels" aria-hidden="true">
                <span>{question.minLabel}</span>
                <output htmlFor={question.id}>{value}</output>
                <span>{question.maxLabel}</span>
              </div>
            </div>
          )}
        </>
      )}

      <ErrorText id={errorId} message={message} />

      <div className="actions">
        <button type="button" onClick={onBack} disabled={submitting}>
          Back
        </button>
        <button type="submit" className={isLast ? 'seal' : 'primary'} disabled={submitting}>
          {isLast ? (submitting ? 'Sending the raven…' : 'Send the raven') : 'Next'}
        </button>
      </div>
    </form>
  );
}

function Hint({ id, text }: { id: string; text: string }) {
  return (
    <p id={id} className="hint">
      {text}
    </p>
  );
}

function toNumber(value: AnswerValue | undefined): number | undefined {
  if (value === undefined || value === '') return undefined;
  return Number(value);
}
