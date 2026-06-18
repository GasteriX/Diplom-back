import 'dotenv/config';
import { createHash, randomBytes } from 'crypto';
import mysql from 'mysql2/promise';

const API = (process.env.API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const email = `verify-e2e-${Date.now()}@example.com`;
const password = 'password123';

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { message: text };
  }
  return { status: res.status, body };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASS ?? '',
  database: process.env.DB_NAME ?? 'audio_marketplace',
});

try {
  console.log('1. Register');
  const reg = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, displayName: 'E2E Test', password }),
  });
  assert(reg.status === 200 || reg.status === 201, `Register failed: ${reg.status}`);
  console.log('   OK');

  console.log('2. Login before verify → 401');
  const loginBlocked = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  assert(loginBlocked.status === 401, `Expected 401, got ${loginBlocked.status}`);
  console.log('   OK');

  console.log('3. Inject known verification token');
  const rawToken = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  const expires = new Date(Date.now() + 15 * 60 * 1000);
  const [result] = await pool.execute(
    'UPDATE users SET email_verification_token = ?, email_verification_expires = ? WHERE email = ?',
    [tokenHash, expires, email],
  );
  assert(result.affectedRows === 1, 'User not found in DB');
  console.log('   OK');

  console.log('4. POST /auth/verify-email');
  const verifyPost = await request('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token: rawToken }),
  });
  assert(verifyPost.status === 201 || verifyPost.status === 200, `Verify POST failed: ${verifyPost.status} ${JSON.stringify(verifyPost.body)}`);
  assert(verifyPost.body.access_token, 'No access_token in response');
  assert(verifyPost.body.user?.isEmailVerified === true, 'User not marked verified');
  console.log('   OK, JWT issued');

  console.log('5. Reuse token after verify → 401 (token cleared)');
  const verifyAgain = await request(`/auth/verify-email?token=${encodeURIComponent(rawToken)}`);
  assert(verifyAgain.status === 401, `Expected 401, got ${verifyAgain.status}`);
  console.log('   OK');

  console.log('6. Login after verify → JWT');
  const loginOk = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  assert(loginOk.status === 201 || loginOk.status === 200, `Login failed: ${loginOk.status}`);
  assert(loginOk.body.access_token, 'No access_token on login');
  console.log('   OK');

  console.log('7. Protected route with JWT');
  const orders = await request('/orders/me', {
    headers: { Authorization: `Bearer ${loginOk.body.access_token}` },
  });
  assert(orders.status === 200, `Orders/me failed: ${orders.status}`);
  console.log('   OK');

  console.log('8. Invalid token → 401');
  const badVerify = await request('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token: 'invalid-token' }),
  });
  assert(badVerify.status === 401, `Expected 401, got ${badVerify.status}`);
  console.log('   OK');

  console.log('\nAll email verification checks passed.');
} catch (err) {
  console.error('\nFAILED:', err.message);
  process.exit(1);
} finally {
  await pool.end();
}
