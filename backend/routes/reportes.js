// routes/reportes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const db = require('../db'); // Conexión a la base de datos de la raíz

// =========================================================================
// 1. ESTADÍSTICAS DE BAUTIZOS POR PARROQUIA (CON PÁRROCO ACTUAL)
// =========================================================================
router.get('/bautizos', authMiddleware, async (req, res) => {
  const { fechaInicio, fechaFin } = req.query;

  if (!fechaInicio || !fechaFin) {
    return res.status(400).json({ message: "❌ Las fechas de inicio y fin son obligatorias." });
  }

  try {
    const sql = `
      SELECT 
        p.id AS parroquia_id,
        p.nombre AS parroquia_nombre,
        COUNT(b.id) AS total_bautizos,
        IFNULL(CONCAT(s.nombre, ' ', s.apellido), 'Sin Párroco Asignado') AS parroco_actual
      FROM parroquias p
      LEFT JOIN bautizos b ON b.parroquia_id = p.id AND b.fecha_bautizo BETWEEN ? AND ?
      LEFT JOIN asignaciones_sacerdotes asig ON asig.parroquia_id = p.id AND asig.activo = 1
      LEFT JOIN sacerdotes s ON asig.sacerdote_id = s.id
      GROUP BY p.id, s.id
      ORDER BY total_bautizos DESC;
    `;

    const [rows] = await db.query(sql, [fechaInicio, fechaFin]);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error en reporte de bautizos:", err);
    res.status(500).json({ message: "Error al generar estadísticas de bautizos." });
  }
});

// =========================================================================
// 2. ESTADÍSTICAS DE CONFIRMACIONES POR PARROQUIA
// =========================================================================
router.get('/confirmaciones', authMiddleware, async (req, res) => {
  const { fechaInicio, fechaFin } = req.query;

  if (!fechaInicio || !fechaFin) {
    return res.status(400).json({ message: "❌ Las fechas de inicio y fin son obligatorias." });
  }

  try {
    const sql = `
      SELECT 
        p.id AS parroquia_id,
        p.nombre AS parroquia_nombre,
        COUNT(c.id) AS total_confirmaciones,
        IFNULL(CONCAT(s.nombre, ' ', s.apellido), 'Sin Párroco Asignado') AS parroco_actual
      FROM parroquias p
      LEFT JOIN confirmaciones c ON c.parroquia_id = p.id AND c.fecha_confirmacion BETWEEN ? AND ?
      LEFT JOIN asignaciones_sacerdotes asig ON asig.parroquia_id = p.id AND asig.activo = 1
      LEFT JOIN sacerdotes s ON asig.sacerdote_id = s.id
      WHERE c.activo = 1 OR c.id IS NULL
      GROUP BY p.id, s.id
      ORDER BY total_confirmaciones DESC;
    `;

    const [rows] = await db.query(sql, [fechaInicio, fechaFin]);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error en reporte de confirmaciones:", err);
    res.status(500).json({ message: "Error al generar estadísticas de confirmaciones." });
  }
});

// =========================================================================
// 3. ESTADÍSTICAS DE MATRIMONIOS POR PARROQUIA
// =========================================================================
router.get('/matrimonios', authMiddleware, async (req, res) => {
  const { fechaInicio, fechaFin } = req.query;

  if (!fechaInicio || !fechaFin) {
    return res.status(400).json({ message: "❌ Las fechas de inicio y fin son obligatorias." });
  }

  try {
    const sql = `
      SELECT 
        p.id AS parroquia_id,
        p.nombre AS parroquia_nombre,
        COUNT(m.id) AS total_matrimonios,
        IFNULL(CONCAT(s.nombre, ' ', s.apellido), 'Sin Párroco Asignado') AS parroco_actual
      FROM parroquias p
      LEFT JOIN matrimonio m ON m.parroquia_id = p.id AND m.fecha_matrimonios BETWEEN ? AND ?
      LEFT JOIN asignaciones_sacerdotes asig ON asig.parroquia_id = p.id AND asig.activo = 1
      LEFT JOIN sacerdotes s ON asig.sacerdote_id = s.id
      GROUP BY p.id, s.id
      ORDER BY total_matrimonios DESC;
    `;

    const [rows] = await db.query(sql, [fechaInicio, fechaFin]);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error en reporte de matrimonios:", err);
    res.status(500).json({ message: "Error al generar estadísticas de matrimonios." });
  }
});

// =========================================================================
// 4. RESUMEN GENERAL (Para tarjetas informativas rápidas del Dashboard)
// =========================================================================
router.get('/resumen-general', authMiddleware, async (req, res) => {
  const { fechaInicio, fechaFin } = req.query;

  if (!fechaInicio || !fechaFin) {
    return res.status(400).json({ message: "❌ Las fechas de inicio y fin son obligatorias." });
  }

  try {
    // Tres consultas paralelas rápidas para obtener los totales globales del rango
    const [bautizos] = await db.query("SELECT COUNT(*) AS total FROM bautizos WHERE fecha_bautizo BETWEEN ? AND ?", [fechaInicio, fechaFin]);
    const [confirmaciones] = await db.query("SELECT COUNT(*) AS total FROM confirmaciones WHERE fecha_confirmacion BETWEEN ? AND ? AND activo = 1", [fechaInicio, fechaFin]);
    const [matrimonios] = await db.query("SELECT COUNT(*) AS total FROM matrimonios WHERE fecha_matrimonios BETWEEN ? AND ?", [fechaInicio, fechaFin]);

    res.json({
      totalBautizos: bautizos[0].total,
      totalConfirmaciones: confirmaciones[0].total,
      totalMatrimonios: matrimonios[0].total
    });
  } catch (err) {
    console.error("❌ Error en resumen general:", err);
    res.status(500).json({ message: "Error al generar el resumen general." });
  }
});

module.exports = router;