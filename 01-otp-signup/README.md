# Scenario 1: OTP sign-up ("Choose thy race")

A small sign-up flow that ends in a one-time code sent by email. You give your name and email, answer six silly questions, and the Hall of Lineage works out whether you're an Elf, a Dwarf or a Man. You only find out once you've entered the code from the email.

This first pass stops at the "Check your emails" page. The code is generated, hashed, stored and emailed, but there's no screen to enter it yet. That's the next pass.

## Running it

Needs Node 24 or newer (it uses the built-in `node:sqlite`).

```sh
npm install
npm run dev
```

Open http://localhost:3000. Everything runs on localhost: Express serves the API and Vite serves the React app on the same port.

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload on port 3000 |
| `npm run build` | Builds the client into `dist/client` |
| `npm start` | Serves the built client in production mode (no dev outbox endpoint) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:reset` | Deletes the local SQLite database |

Environment variables: `PORT` (default 3000) and `DB_PATH` (default `data/hall-of-lineage.db`, and `:memory:` works).

## The flow

1. **Who goes there?** Name, email and an oath checkbox. All three are required.
2. **Six questions**, one per page, with Back and Next:
   - How old are you? (number, 1 to 20000)
   - How much do you like trees? (pick one)
   - How much do you desire power? (slider, 1 to 10)
   - I say mountain, you say… (free text, up to 40 characters)
   - Sword, bow or axe? (pick one)
   - How do you feel about beards? (pick one)
3. **Send the raven** posts everything to the API. The server works out the race, stores a pending registration, generates a 6-digit code that expires in 10 minutes and "emails" it.
4. **Check your emails.** The race isn't revealed yet.

The questions, validation and scoring live in `src/shared/quiz.ts` and `src/shared/details.ts`, and both the client and the server use them. Each answer gives 2 points to one race. If there's a tie, the weapon decides.

## Where the emails go

Nothing leaves the machine. Emails are written to an `outbox` table in SQLite and printed in the server log. In dev you can read them over HTTP:

```sh
curl 'http://localhost:3000/api/dev/outbox?to=gimli@erebor.me'
```

## API

### `POST /api/registrations`

```json
{
  "name": "Gimli",
  "email": "gimli@erebor.me",
  "oath": true,
  "answers": { "age": 139, "trees": "chop", "power": 5, "mountain": "under", "weapon": "axe", "beards": "essential" }
}
```

- `201` `{ id, email, status: "pending_verification", expiresAt }`. The email is trimmed and lower-cased.
- `400` `{ errors: [{ field, message }] }` for validation errors, one per bad field, or for a body that isn't valid JSON (`field: null`).
- `409` if the email belongs to a verified registration. Nothing can be verified yet, so you'll only see this if you set the status in the database yourself.

If the same email registers again before verifying, the registration is updated with the new name and answers, the old codes are deleted and a new code is sent.

### `GET /api/dev/outbox?to=<email>`

Dev only. Returns `{ emails: [{ id, to, subject, body, createdAt }] }`, newest first. `to` is optional.

## Data

SQLite via `node:sqlite`, created on start in `data/`. Three tables (see `src/server/db.ts`):

- `registrations`: name, email (unique), race, answers as JSON, status
- `otp_codes`: SHA-256 hash of the code, expiry, attempts, consumed time
- `outbox`: every email the app has sent

## Notes for whoever writes the tests

I've tried to leave sensible seams rather than any test setup, so pick the tools you like.

- `createApp()` in `src/server/app.ts` takes its dependencies: `db`, `mailer`, `now` and `generateCode`. Pass `openDb(':memory:')`, a fake mailer, a fixed clock and a fixed code generator and you get a fully predictable app for API tests.
- `scoreAnswers`, `validateAnswers`, `validateAnswer` and `validateDetails` are pure functions and easy to unit test.
- The UI uses real labels, fieldsets, legends and `role="alert"` on errors, so role and label based queries should work without test ids. Each step has a heading with `id="step-heading"`.
- For end-to-end tests, start the server with a throwaway `DB_PATH` and read the code from `/api/dev/outbox`.

Things worth covering up to the "Check your emails" page:

- Required fields and email format on the first page, client and server side
- Each question's validation (blank, out of range, not a whole number, too long)
- Back keeps earlier answers
- Scoring for each race, including ties
- Registering twice with the same email replaces the code rather than adding a second one
- The email lands in the outbox with a 6-digit code, and only the hash is stored
- Code expiry is 10 minutes from `now`
- Bad JSON and unknown `/api` routes return JSON errors

## Next pass

- Page to enter the code, with expiry and a limit on attempts (the `attempts` and `consumed_at` columns are already there)
- Resend code
- Reveal the race once verified
