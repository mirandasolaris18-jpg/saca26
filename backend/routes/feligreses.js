// backend/routes/feligreses.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const db = require('../db');

// ========================================================================
// 1. OBTENER TODOS LOS FELIGRESES (CON ESTADO DE SACRAMENTOS Y MATRIMONIO)
// ========================================================================
router.get('/', authMiddleware, async (req, res) => {
  try {
    const sql = `
      SELECT f.*,
        IF((SELECT id FROM bautizos WHERE feligres_id = f.id AND activo = 1 LIMIT 1) IS NOT NULL, 1, 0) AS bautizado,
        IF((SELECT id FROM confirmaciones WHERE feligres_id = f.id AND activo = 1 LIMIT 1) IS NOT NULL, 1, 0) AS confirmado,
        (SELECT fecha_matrimonio FROM matrimonios WHERE (novio_id = f.id OR novia_id = f.id) AND activo = 1 LIMIT 1) AS fecha_matrimonio,
        (SELECT p.nombre FROM matrimonios m JOIN parroquias p ON m.parroquia_id = p.id WHERE (m.novio_id = f.id OR m.novia_id = f.id) AND m.activo = 1 LIMIT 1) AS parroquia_matrimonio,
        (SELECT IF(novio_id = f.id, novia_id, novio_id) FROM matrimonios WHERE (novio_id = f.id OR novia_id = f.id) AND activo = 1 LIMIT 1) AS conyuge_id
      FROM feligreses f
      WHERE f.activo = 1
      ORDER BY f.apellido ASC, f.nombre ASC
    `;
    const [rows] = await db.execute(sql);
    res.json(rows);
  } catch (error) {
    console.error("❌ Error en GET feligreses:", error);
    res.status(500).json({ message: "Error interno al obtener los feligreses." });
  }
});

// ========================================================================
// 2. CREAR FELIGRÉS
// ========================================================================
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { nombre, apellido, genero, documento_identidad, fecha_nacimiento, telefono, direccion, ciudad_id } = req.body;
    const creado_por = req.user.username || 'sistema';

    const sql = `
      INSERT INTO feligreses (nombre, apellido, genero, documento_identidad, fecha_nacimiento, telefono, direccion, ciudad_id, estado_id, creado_por, activo) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 1)
    `;
    const [result] = await db.execute(sql, [nombre, apellido, genero, documento_identidad, fecha_nacimiento, telefono, direccion, ciudad_id, creado_por]);
    res.status(201).json({ message: "Feligrés creado con éxito.", id: result.insertId });
  } catch (error) {
    console.error("❌ Error al crear feligrés:", error);
    res.status(500).json({ message: "Error al crear el feligrés." });
  }
});

// ========================================================================
// 3. ACTUALIZAR FELIGRÉS
// ========================================================================
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, genero, documento_identidad, fecha_nacimiento, telefono, direccion, ciudad_id } = req.body;

    const sql = `
      UPDATE feligreses 
      SET nombre = ?, apellido = ?, genero = ?, documento_identidad = ?, fecha_nacimiento = ?, telefono = ?, direccion = ?, ciudad_id = ?
      WHERE id = ? AND activo = 1
    `;
    await db.execute(sql, [nombre, apellido, genero, documento_identidad, fecha_nacimiento, telefono, direccion, ciudad_id, id]);
    res.json({ message: "Feligrés actualizado correctamente." });
  } catch (error) {
    console.error("❌ Error al actualizar feligrés:", error);
    res.status(500).json({ message: "Error al actualizar feligrés." });
  }
});

// ========================================================================
// 4. ELIMINAR FELIGRÉS (Lógico)
// ========================================================================
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute(`UPDATE feligreses SET activo = 0 WHERE id = ?`, [id]);
    res.json({ message: "Feligrés eliminado correctamente." });
  } catch (error) {
    console.error("❌ Error al eliminar feligrés:", error);
    res.status(500).json({ message: "Error al eliminar feligrés." });
  }
});

module.exports = router;