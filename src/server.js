const express = require('express');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
const mainRouter = require('./routes'); // Import the main router

app.get('/', (req, res) => {
  res.send('License Management API is running!');
});

app.use('/api', mainRouter); // Use the main router for all /api routes

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
