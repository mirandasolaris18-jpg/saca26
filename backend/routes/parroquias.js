// backend/routes/parroquias.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const db = require('../db');

// Obtener todas las parroquias
router.get('/', authMiddleware, async (req, res) => {
  try {
    const sql = `SELECT id, nombre, diocesis FROM parroquias WHERE activo = 1 ORDER BY nombre ASC`;
    const [rows] = await db.execute(sql);
    res.json(rows);
  } catch (error) {
    console.error("❌ Error en GET parroquias:", error);
    res.status(500).json({ message: "Error al obtener la lista de parroquias." });
  }
});

module.exports = router;