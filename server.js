const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Import Routers
const contactRoutes = require('./routes/contact');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Link the routes to prefixes
app.use('/api/auth', authRoutes); // This makes /login become /api/auth/login
app.use('/api', contactRoutes); // This makes /send-inquiry become /api/send-inquiry

app.listen(PORT, '127.0.0.1', () => {
    console.log(`Server running internally on http://127.0.0.1:${PORT}`);
});

