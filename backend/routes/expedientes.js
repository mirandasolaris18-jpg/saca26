// backend/routes/expedientes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const db = require('../db');

// OBTENER EXPEDIENTES (GET) - Esto parece estar bien, pero lo mejoramos
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { nivel_jerarquico, parroquia_id } = req.user;
    
    let sql = `
      SELECT e.*, 
             CONCAT(n1.nombre, ' ', n1.apellido) AS novio_nombre,
             CONCAT(n2.nombre, ' ', n2.apellido) AS novia_nombre
      FROM expedientes_matrimoniales e
      JOIN feligreses n1 ON e.novio_id = n1.id
      JOIN feligreses n2 ON e.novia_id = n2.id
      WHERE e.activo = 1
    `;
    const params = [];

    if (nivel_jerarquico === 3) {
      sql += " AND e.parroquia_id = ?";
      params.push(parroquia_id);
    }

    sql += " ORDER BY e.fecha_boda_programada ASC";
    const [rows] = await db.execute(sql, params);
    res.json(rows);
  } catch (error) {
    console.error("❌ Error en GET expedientes:", error);
    res.status(500).json({ message: "Error al obtener los expedientes." });
  }
});

// PROGRAMAR MATRIMONIO (POST)
router.post('/', authMiddleware, async (req, res) => {
  // 1. Log de depuración: Mira qué llega realmente desde React
  console.log("Datos recibidos en backend:", req.body);
  console.log("Usuario autenticado:", req.user);

  try {
    const { novio_id, novia_id, fecha_boda_programada } = req.body;
    
    // Validar si los datos existen
    if (!novio_id || !novia_id || !fecha_boda_programada) {
      return res.status(400).json({ message: "Datos incompletos enviados." });
    }

    const parroquia_id = req.user?.parroquia_id;
    const creado_por = req.user?.username || 'sistema';

    if (!parroquia_id) {
      return res.status(403).json({ message: "Su usuario no tiene una parroquia asignada." });
    }
    if (novio_id === novia_id) {
      return res.status(400).json({ message: "Los contrayentes no pueden ser la misma persona." });
    }

    const sqlVerificar = `
        SELECT id FROM expedientes_matrimoniales 
        WHERE (novio_id = ? OR novia_id = ? OR novio_id = ? OR novia_id = ?) 
        AND estado_tramite NOT IN ('Celebrado', 'Anulado') AND activo = 1
    `;
    const [existentes] = await db.execute(sqlVerificar, [novio_id, novio_id, novia_id, novia_id]);

    if (existentes.length > 0) {
      return res.status(400).json({ message: "Uno de los contrayentes ya tiene un trámite en curso." });
    }

    const sqlInsert = `
      INSERT INTO expedientes_matrimoniales (novio_id, novia_id, parroquia_id, fecha_boda_programada, creado_por)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    await db.execute(sqlInsert, [novio_id, novia_id, parroquia_id, fecha_boda_programada, creado_por]);

    res.status(201).json({ message: "Expediente iniciado con éxito." });
  } catch (error) {
    console.error("❌ Error FATAL en POST expedientes:", error);
    res.status(500).json({ message: "Error interno al programar el matrimonio." });
  }
});

module.exports = router;