const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  JWT_SECRET: process.env.JWT_SECRET, // Changed to uppercase S
  dbUrl: process.env.DATABASE_URL,
};
