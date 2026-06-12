// To see all your users:
// node sql.js "SELECT id, username, email FROM users"
// To delete a test user (be careful!):
// node sql.js "DELETE FROM users WHERE username = 'testuser'"
// To check the table structure:
// node sql.js "PRAGMA table_info(users)"

// Step A: Generate the hash
// node -e "console.log(require('bcryptjs').hashSync('secret123', 10))"
// (Assume this outputs: $2a$10$abcdefg...)
// Step B: Use the hash in your SQL insert
// node sql.js "INSERT INTO users (username, email, password) VALUES ('alice', 'alice@3d.org', '$2a$10$abcdefg...')"

const Database = require('better-sqlite3');
const path = require('path');

// 1. Connect to your existing database file
const db = new Database(path.join(__dirname, 'database.sqlite'));

// 2. Get the query from the command line argument
const query = process.argv[2];

if (!query) {
    console.log("Usage: node sql.js \"SELECT * FROM users\"");
    process.exit(1);
}

try {
    // 3. Determine if it's a 'GET' (select) or a 'RUN' (insert/update/delete)
    const stmt = db.prepare(query);
    
    if (query.trim().toLowerCase().startsWith('select')) {
        const rows = stmt.all();
        console.table(rows); // console.table makes it look like a real spreadsheet!
        console.log(`Total rows: ${rows.length}`);
    } else {
        const result = stmt.run();
        console.log("Success!");
        console.log(result); // Shows 'changes' (rows affected) and 'lastInsertRowid'
    }
} catch (err) {
    console.error("SQL Error:", err.message);
} finally {
    db.close();
}

