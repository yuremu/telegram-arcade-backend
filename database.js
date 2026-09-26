const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'arcade.db');
const db = new sqlite3.Database(dbPath);

// Inicializar la base de datos
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      telegram_id INTEGER PRIMARY KEY,
      first_name TEXT,
      username TEXT,
      coins INTEGER DEFAULT 0,
      streak INTEGER DEFAULT 0,
      last_claim_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

module.exports = db;