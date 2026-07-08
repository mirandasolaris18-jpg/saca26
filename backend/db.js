// db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

// Pool de conexiones dinámico
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root2',
  password: process.env.DB_PASSWORD || '1234567890',
  database: process.env.DB_NAME || 'proyecto1',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = db;