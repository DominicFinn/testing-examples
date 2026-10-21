import { OTP_LENGTH, OTP_TTL_MINUTES } from '../../shared/otp.ts';

export function CheckEmailStep({ email, onStartAgain }: { email: string; onStartAgain: () => void }) {
  return (
    <div className="sent">
      <svg className="raven" viewBox="0 0 64 40" aria-hidden="true">
        <path d="M2 22c10-2 18-10 26-10 4 0 6 2 8 4l10-6c4-2 8-2 12 0l-8 4 12 2-14 4c-2 8-10 14-22 14-6 0-10-2-14-6l8-2C10 26 6 24 2 22z" />
      </svg>
      <h2 id="step-heading">Check your emails</h2>
      <p className="lede">
        A raven is on its way to <strong>{email}</strong> carrying a {OTP_LENGTH}-digit code. It's good
        for {OTP_TTL_MINUTES} minutes.
      </p>
      <p>Enter the code when it arrives and the scroll will reveal whether you're Elf, Dwarf or Man.</p>
      <p className="hint">Nothing there? Check your spam folder. Ravens are easily distracted.</p>
      <div className="actions">
        <button type="button" onClick={onStartAgain}>
          Wrong address? Start again
        </button>
        <span />
      </div>
    </div>
  );
}
