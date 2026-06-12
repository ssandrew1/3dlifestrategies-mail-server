const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const setupDb = require('../database'); // Import your database.js

const JWT_SECRET = 'your_super_secret_random_string_here';

// MOCK DATABASE (Replace with real DB later)
const users = [
    {
        id: 1,
        username: 'steve',
        // This is a hashed version of 'password123'
	password: '$2b$10$mievyI/Vs7xQvxutdTqxyOVPBBi8NeqISFbZFE.Xq40Zhk.hlyeLm'

    }
];


router.post('/login', async (req, res) => {
    // 1. Move logs to the TOP
    console.log("--- AUTH ATTEMPT START ---");
    console.log("Body received:", req.body); 

    const { username, password } = req.body;

    // 2. Check if username exists
    const user = users.find(u => u.username === username);
    
    if (!user) {
        console.log(`Failed: User '${username}' not found in users array.`);
        return res.status(401).json({ message: "Invalid credentials (User)" });
    }

    // 3. Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`Bcrypt match for ${username}: ${isMatch}`);

    if (!isMatch) {
        console.log("Failed: Password mismatch.");
        return res.status(401).json({ message: "Invalid credentials (Pass)" });
    }

    // 4. Success -- NOTE: 8h ??? 
    const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '8h' }
    );

    console.log("Success: Token issued.");
    res.json({ success: true, token });
});


// 2. SIGNUP ROUTE (The "Add New User" logic)
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const db = await setupDb();

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert into database
        db.run(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        res.json({ success: true, message: "User created successfully!" });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ message: "Username or Email already exists." });
        }
        console.error("Signup Error:", err);
        res.status(500).json({ message: "Error creating user." });
    }
});


// VERIFY ROUTE (Used by the frontend to check if still logged in)
router.get('/verify', (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ authenticated: false });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ authenticated: false });
        res.json({ authenticated: true, user: decoded });
    });
});

module.exports = router;

