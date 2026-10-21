import { fileURLToPath } from 'node:url';
import express from 'express';
import { createApp } from './app.ts';
import { openDb } from './db.ts';
import { OutboxMailer } from './mailer.ts';

const root = fileURLToPath(new URL('../..', import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT ?? 3000);
const dbPath = process.env.DB_PATH ?? `${root}data/hall-of-lineage.db`;

const db = openDb(dbPath);
const app = createApp({ db, mailer: new OutboxMailer(db), exposeOutbox: !isProduction });

if (isProduction) {
  const clientDir = `${root}dist/client`;
  app.use(express.static(clientDir));
  app.get('/{*splat}', (_req, res) => res.sendFile(`${clientDir}/index.html`));
} else {
  // Vite runs inside Express in dev, so the UI and the API share one port.
  const { createServer } = await import('vite');
  const vite = await createServer({ root, server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
}

app.listen(port, () => {
  console.log(`The Hall of Lineage is open at http://localhost:${port}`);
  console.log(`Database: ${dbPath}`);
});
