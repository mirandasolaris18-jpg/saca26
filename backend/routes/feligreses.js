// backend/routes/feligreses.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const db = require('../db');

// ========================================================================
// 1. OBTENER TODOS LOS FELIGRESES (INCLUYENDO ESTADO DE SACRAMENTOS Y MATRIMONIO)
// ========================================================================
router.get('/', authMiddleware, async (req, res) => {
  try {
    const sql = `
      SELECT f.*,
        IF((SELECT id FROM bautizos WHERE feligres_id = f.id AND activo = 1 LIMIT 1) IS NOT NULL, 1, 0) AS bautizado,
        IF((SELECT id FROM confirmaciones WHERE feligres_id = f.id AND activo = 1 LIMIT 1) IS NOT NULL, 1, 0) AS confirmado,
        (SELECT fecha_matrimonio FROM matrimonios WHERE (novio_id = f.id OR novia_id = f.id) AND activo = 1 LIMIT 1) AS fecha_matrimonio,
        (SELECT p.nombre FROM matrimonios m JOIN parroquias p ON m.parroquia_id = p.id WHERE (m.novio_id = f.id OR m.novia_id = f.id) AND m.activo = 1 LIMIT 1) AS parroquia_matrimonio
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
// 2. OBTENER UN FELIGRÉS ESPECÍFICO POR ID
// ========================================================================
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `SELECT * FROM feligreses WHERE id = ? AND activo = 1`;
    const [rows] = await db.execute(sql, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Feligrés no encontrado." });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("❌ Error en GET feligrés por ID:", error);
    res.status(500).json({ message: "Error interno al obtener el feligrés." });
  }
});

// ========================================================================
// 3. REGISTRAR UN NUEVO FELIGRÉS
// ========================================================================
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { nombre, apellido, genero, documento_identidad, fecha_nacimiento, telefono, direccion } = req.body;
    const creado_por = req.user.username || 'sistema';

    const sql = `
      INSERT INTO feligreses 
      (nombre, apellido, genero, documento_identidad, fecha_nacimiento, telefono, direccion, creado_por)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.execute(sql, [
      nombre, apellido, genero || 'Masculino', documento_identidad || null, 
      fecha_nacimiento || null, telefono || null, direccion || null, creado_por
    ]);
    
    res.status(201).json({ message: "Feligrés registrado exitosamente.", id: result.insertId });
  } catch (error) {
    console.error("❌ Error en POST feligreses:", error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: "Ya existe un feligrés con ese documento." });
    }
    res.status(500).json({ message: "Error interno al registrar el feligrés." });
  }
});

// ========================================================================
// 4. ACTUALIZAR DATOS DE UN FELIGRÉS
// ========================================================================
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, genero, documento_identidad, fecha_nacimiento, telefono, direccion } = req.body;

    const sql = `
      UPDATE feligreses 
      SET nombre = ?, apellido = ?, genero = ?, documento_identidad = ?, 
          fecha_nacimiento = ?, telefono = ?, direccion = ?
      WHERE id = ? AND activo = 1
    `;
    
    const [result] = await db.execute(sql, [nombre, apellido, genero, documento_identidad, fecha_nacimiento, telefono, direccion, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Feligrés no encontrado." });
    }
    res.json({ message: "Feligrés actualizado correctamente." });
  } catch (error) {
    console.error("❌ Error en PUT feligreses:", error);
    res.status(500).json({ message: "Error al actualizar." });
  }
});

// ========================================================================
// 5. ELIMINAR FELIGRÉS (Baja lógica)
// ========================================================================
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Usamos el UPDATE para inactivar en lugar de borrar el registro
    const sql = `UPDATE feligreses SET activo = 0 WHERE id = ?`;
    const [result] = await db.execute(sql, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Feligrés no encontrado." });
    }

    res.json({ message: "Feligrés eliminado correctamente." });
  } catch (error) {
    console.error("❌ Error en DELETE feligreses:", error);
    res.status(500).json({ message: "Error al eliminar." });
  }
});

module.exports = router;