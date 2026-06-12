const Database = require('better-sqlite3');
const path = require('path');

// This opens (or creates) the database file immediately
const db = new Database(path.join(__dirname, 'database.sqlite'));

// Create the table if it doesn't exist
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        email TEXT UNIQUE,
        password TEXT,
        google_id TEXT UNIQUE,
        is_verified BOOLEAN DEFAULT 0
    )
`);

module.exports = db;

