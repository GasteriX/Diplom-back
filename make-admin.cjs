const Database = require('better-sqlite3');
const path = process.env.DB_PATH || 'data/app.sqlite';

// Email пользователя, которого делаем админом (можно передать аргументом)
const email = process.argv[2] || 'semiramid292@gmail.com';

const db = new Database(path);
const info = db.prepare('UPDATE users SET role = ? WHERE email = ?').run('admin', email);
db.close();

if (info.changes > 0) {
  console.log(`OK: пользователь ${email} теперь admin`);
} else {
  console.log(`Не найден пользователь с email ${email}`);
}
