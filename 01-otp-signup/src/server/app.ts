import { randomUUID } from 'node:crypto';
import express, { type ErrorRequestHandler } from 'express';
import { validateDetails } from '../shared/details.ts';
import { scoreAnswers, validateAnswers, type Answers } from '../shared/quiz.ts';
import type { Db } from './db.ts';
import { readOutbox, type Mailer } from './mailer.ts';
import { OTP_TTL_MINUTES } from '../shared/otp.ts';
import { generateCode as defaultGenerateCode, hashCode } from './otp.ts';

export interface AppDeps {
  db: Db;
  mailer: Mailer;
  now?: () => Date;
  generateCode?: () => string;
  /** Adds GET /api/dev/outbox so you can read the emails the app has "sent". */
  exposeOutbox?: boolean;
}

export function createApp({
  db,
  mailer,
  now = () => new Date(),
  generateCode = defaultGenerateCode,
  exposeOutbox = false,
}: AppDeps) {
  const app = express();
  app.use(express.json({ limit: '10kb' }));

  app.post('/api/registrations', async (req, res) => {
    const { name, email, oath, answers } = req.body ?? {};
    const errors = [...validateDetails({ name, email, oath }), ...validateAnswers(answers)];
    if (errors.length > 0) {
      res.status(400).json({ errors });
      return;
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const { race } = scoreAnswers(answers as Answers);
    const timestamp = now().toISOString();

    const existing = db.prepare('SELECT id, status FROM registrations WHERE email = ?').get(cleanEmail);
    if (existing?.status === 'verified') {
      res.status(409).json({
        errors: [{ field: 'email', message: 'That email is already sworn to another fellowship.' }],
      });
      return;
    }

    // Someone who never verified can start again. Their old answers and codes are replaced.
    const id = existing ? String(existing.id) : randomUUID();
    if (existing) {
      db.prepare('UPDATE registrations SET name = ?, race = ?, answers = ?, updated_at = ? WHERE id = ?').run(
        cleanName,
        race,
        JSON.stringify(answers),
        timestamp,
        id,
      );
      db.prepare('DELETE FROM otp_codes WHERE registration_id = ?').run(id);
    } else {
      db.prepare(
        `INSERT INTO registrations (id, name, email, race, answers, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'pending_verification', ?, ?)`,
      ).run(id, cleanName, cleanEmail, race, JSON.stringify(answers), timestamp, timestamp);
    }

    const code = generateCode();
    const expiresAt = new Date(now().getTime() + OTP_TTL_MINUTES * 60_000).toISOString();
    db.prepare('INSERT INTO otp_codes (registration_id, code_hash, expires_at, created_at) VALUES (?, ?, ?, ?)').run(
      id,
      hashCode(code),
      expiresAt,
      timestamp,
    );

    await mailer.send({
      to: cleanEmail,
      subject: 'Your code from the Hall of Lineage',
      body: [
        `Well met, ${cleanName}.`,
        '',
        `Your code is ${code}. It expires in ${OTP_TTL_MINUTES} minutes.`,
        '',
        "Enter it on the scroll to learn whether you're Elf, Dwarf or Man.",
        '',
        "If you didn't ask for this, someone may be using your name in the wild. Ignore this and nothing will happen.",
      ].join('\n'),
    });

    // The race stays secret until the code is verified.
    res.status(201).json({ id, email: cleanEmail, status: 'pending_verification', expiresAt });
  });

  if (exposeOutbox) {
    app.get('/api/dev/outbox', (req, res) => {
      const to = typeof req.query.to === 'string' ? req.query.to.trim().toLowerCase() : undefined;
      res.json({ emails: readOutbox(db, to) });
    });
  }

  app.use('/api', (_req, res) => {
    res.status(404).json({ errors: [{ field: null, message: 'Not found.' }] });
  });

  const onError: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err?.type === 'entity.parse.failed') {
      res.status(400).json({ errors: [{ field: null, message: 'The request body is not valid JSON.' }] });
      return;
    }
    console.error(err);
    res.status(500).json({ errors: [{ field: null, message: 'Something went wrong in the forge.' }] });
  };
  app.use(onError);

  return app;
}
