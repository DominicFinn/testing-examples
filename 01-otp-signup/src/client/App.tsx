import { useState } from 'react';
import type { Details } from '../shared/details.ts';
import { QUESTIONS, type AnswerValue, type Answers } from '../shared/quiz.ts';
import { register, type FieldError } from './api.ts';
import { Forest } from './Forest.tsx';
import { CheckEmailStep } from './steps/CheckEmailStep.tsx';
import { DetailsStep } from './steps/DetailsStep.tsx';
import { QuestionStep } from './steps/QuestionStep.tsx';

type Step = { kind: 'details' } | { kind: 'question'; index: number } | { kind: 'sent'; email: string };

const TOTAL_STEPS = 1 + QUESTIONS.length;
const DETAIL_FIELDS = ['name', 'email', 'oath'];

const emptyDetails: Details = { name: '', email: '', oath: false };

export function App() {
  const [step, setStep] = useState<Step>({ kind: 'details' });
  const [details, setDetails] = useState<Details>(emptyDetails);
  const [answers, setAnswers] = useState<Answers>({});
  const [serverErrors, setServerErrors] = useState<FieldError[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function submit(finalAnswers: Answers) {
    setSubmitting(true);
    setServerErrors([]);
    const result = await register(details, finalAnswers);
    setSubmitting(false);

    if (result.ok) {
      setStep({ kind: 'sent', email: result.email });
      return;
    }

    // Send the person back to whichever page the server didn't like.
    setServerErrors(result.errors);
    const first = result.errors[0]?.field;
    if (first && DETAIL_FIELDS.includes(first)) {
      setStep({ kind: 'details' });
    } else {
      const index = QUESTIONS.findIndex((q) => q.id === first);
      if (index >= 0) setStep({ kind: 'question', index });
    }
  }

  function answerQuestion(index: number, value: AnswerValue) {
    const next = { ...answers, [QUESTIONS[index].id]: value };
    setAnswers(next);
    setServerErrors([]);
    if (index < QUESTIONS.length - 1) setStep({ kind: 'question', index: index + 1 });
    else void submit(next);
  }

  function startAgain() {
    setDetails(emptyDetails);
    setAnswers({});
    setServerErrors([]);
    setStep({ kind: 'details' });
  }

  const stepNumber = step.kind === 'details' ? 1 : step.kind === 'question' ? step.index + 2 : TOTAL_STEPS;

  return (
    <>
      <Forest />
      <main className="page">
        <header className="title">
          <h1>The Hall of Lineage</h1>
          <p>Elf, Dwarf or Man? Answer truthfully and the scroll will tell.</p>
        </header>

        <section className="scroll" aria-labelledby="step-heading">
          {step.kind !== 'sent' && <Progress current={stepNumber} total={TOTAL_STEPS} />}

          {step.kind === 'details' && (
            <DetailsStep
              details={details}
              onChange={setDetails}
              serverErrors={serverErrors.filter((e) => e.field && DETAIL_FIELDS.includes(e.field))}
              onNext={() => {
                setServerErrors([]);
                setStep({ kind: 'question', index: 0 });
              }}
            />
          )}

          {step.kind === 'question' && (
            <QuestionStep
              // Remount per question so each one starts with its own draft value.
              key={QUESTIONS[step.index].id}
              question={QUESTIONS[step.index]}
              initialValue={answers[QUESTIONS[step.index].id]}
              isLast={step.index === QUESTIONS.length - 1}
              submitting={submitting}
              serverErrors={serverErrors.filter((e) => e.field === QUESTIONS[step.index].id || e.field === null)}
              onBack={() => setStep(step.index === 0 ? { kind: 'details' } : { kind: 'question', index: step.index - 1 })}
              onNext={(value) => answerQuestion(step.index, value)}
            />
          )}

          {step.kind === 'sent' && <CheckEmailStep email={step.email} onStartAgain={startAgain} />}
        </section>
      </main>
    </>
  );
}

function Progress({ current, total }: { current: number; total: number }) {
  return (
    <div className="progress">
      <p className="progress-label">
        Page {current} of {total}
      </p>
      <ol className="progress-runes" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <li key={i} className={i < current ? 'done' : undefined} />
        ))}
      </ol>
    </div>
  );
}
