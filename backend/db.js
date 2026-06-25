// db.js
const mysql = require('mysql2/promise');

// Pool de conexiones
const db = mysql.createPool({
  host: 'localhost',
  user: 'proyecto1',        // Cambia a 'root' si usas XAMPP por defecto
  password: '123',          // En XAMPP normalmente la contraseña es ''
  database: 'proyecto1',    // Nombre de tu base de datos
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = db;
