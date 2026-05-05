const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    // Create Config Table (for enabled accents)
    db.run(`CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT
    )`);

    // Create Conversions History Table
    db.run(`CREATE TABLE IF NOT EXISTS conversions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      text TEXT,
      accent TEXT,
      audio_filename TEXT,
      user_id INTEGER
    )`, () => {
      // Intentar agregar user_id si la tabla ya existía de antes
      db.run(`ALTER TABLE conversions ADD COLUMN user_id INTEGER`, (err) => { /* Ignorar error si ya existe */ });
    });

    // Create Users Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT
    )`, () => {
      // Add new columns if they don't exist
      db.run(`ALTER TABLE users ADD COLUMN email TEXT`, (err) => { /* Ignore error if exists */ });
      db.run(`ALTER TABLE users ADD COLUMN google_id TEXT`, (err) => { /* Ignore error if exists */ });
      db.run(`ALTER TABLE users ADD COLUMN created_at TEXT`, (err) => { /* Ignore error if exists */ });
      db.run(`ALTER TABLE users ADD COLUMN location TEXT`, (err) => { /* Ignore error if exists */ });
      
      // Insert default users if table is empty
      const bcrypt = require('bcryptjs');
      db.get("SELECT count(*) as count FROM users", (err, row) => {
        if (row && row.count === 0) {
          const adminHash = bcrypt.hashSync("admin", 10);
          const userHash = bcrypt.hashSync("user", 10);
          db.run("INSERT INTO users (username, password, role) VALUES ('admin', ?, 'admin')", [adminHash]);
          db.run("INSERT INTO users (username, password, role) VALUES ('user', ?, 'user')", [userHash]);
          console.log("Default users created: admin/admin, user/user");
        }
      });
    });
  }
});

module.exports = db;
