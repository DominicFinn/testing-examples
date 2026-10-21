import type { Db } from './db.ts';

export interface Email {
  to: string;
  subject: string;
  body: string;
}

export interface Mailer {
  send(email: Email): Promise<void>;
}

export interface OutboxEmail extends Email {
  id: number;
  createdAt: string;
}

/** Writes emails to the outbox table instead of sending them. */
export class OutboxMailer implements Mailer {
  constructor(
    private db: Db,
    private now: () => Date = () => new Date(),
    private log: boolean = true,
  ) {}

  async send(email: Email) {
    this.db
      .prepare('INSERT INTO outbox (to_address, subject, body, created_at) VALUES (?, ?, ?, ?)')
      .run(email.to, email.subject, email.body, this.now().toISOString());
    if (this.log) console.log(`\n[outbox] To: ${email.to}\n[outbox] Subject: ${email.subject}\n${email.body}\n`);
  }
}

export function readOutbox(db: Db, to?: string): OutboxEmail[] {
  const rows = to
    ? db.prepare('SELECT * FROM outbox WHERE to_address = ? ORDER BY id DESC').all(to)
    : db.prepare('SELECT * FROM outbox ORDER BY id DESC').all();
  return rows.map((row) => ({
    id: Number(row.id),
    to: String(row.to_address),
    subject: String(row.subject),
    body: String(row.body),
    createdAt: String(row.created_at),
  }));
}
