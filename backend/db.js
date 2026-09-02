// db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

// Pool de conexiones dinámico
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'proyecto1',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = db;