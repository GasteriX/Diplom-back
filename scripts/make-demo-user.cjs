/**
 * Create (or refresh) a ready-to-use, email-verified demo customer.
 * Idempotent: updates the user if the email already exists.
 *
 *   node scripts/make-demo-user.cjs
 *
 * Credentials: demo@spectra.local / demo12345
 */
const path = require('path');
const Database = require('better-sqlite3');
const { hashSync } = require('bcryptjs');

const ROOT = path.join(__dirname, '..');
const DB_PATH = process.env.DB_PATH
  ? path.resolve(ROOT, process.env.DB_PATH)
  : path.join(ROOT, 'data', 'app.sqlite');

const EMAIL = 'demo@spectra.local';
const PASSWORD = 'demo12345';
const DISPLAY = 'Demo Customer';

const db = new Database(DB_PATH);
const hash = hashSync(PASSWORD, 10);
const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(EMAIL);

if (existing) {
  db.prepare(
    `UPDATE users SET password_hash = ?, display_name = ?, role = 'user',
       is_email_verified = 1, email_verification_token = NULL,
       email_verification_expires = NULL, updated_at = datetime('now')
     WHERE id = ?`,
  ).run(hash, DISPLAY, existing.id);
  console.log(`Updated demo user id=${existing.id} (${EMAIL})`);
} else {
  const info = db
    .prepare(
      `INSERT INTO users (email, password_hash, display_name, role, is_email_verified)
       VALUES (?, ?, ?, 'user', 1)`,
    )
    .run(EMAIL, hash, DISPLAY);
  console.log(`Created demo user id=${info.lastInsertRowid} (${EMAIL})`);
}

console.log(`Login: ${EMAIL} / ${PASSWORD}`);
db.close();
