const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware'); 
const db = require('../db'); 

// ==========================================
// 1. OBTENER FELIGRESES (CON PROMESAS)
// ==========================================
router.get('/', authMiddleware, async (req, res) => {
  try {
    const buscar = req.query.buscar || '';
    
    // 🛠️ CORREGIDO: Transformamos el 'activo' (1 o 0) en 'Activo'/'Inactivo' usando IF en SQL
    let sql = `
      SELECT 
        f.id, f.nombre, f.apellido, f.documento_identidad, 
        f.fecha_nacimiento, f.telefono, f.direccion, 
        IF(f.activo = 1, 'Activo', 'Inactivo') AS estado, 
        f.ciudad_id,
        c.nombre AS ciudad, p.nombre AS pais
      FROM feligreses f
      LEFT JOIN ciudades c ON f.ciudad_id = c.id
      LEFT JOIN paises p ON c.pais_id = p.id
    `;

    const params = [];

    if (buscar) {
      sql += ` WHERE f.nombre LIKE ? 
               OR f.apellido LIKE ? 
               OR f.documento_identidad LIKE ? 
               OR f.direccion LIKE ?`;
      
      const queryBusqueda = `%${buscar}%`;
      params.push(queryBusqueda, queryBusqueda, queryBusqueda, queryBusqueda);
      sql += ` ORDER BY f.apellido ASC, f.nombre ASC`;
    } else {
      sql += ` ORDER BY f.id DESC LIMIT 10`;
    }

    const [rows] = await db.query(sql, params);
    res.json(rows);

  } catch (err) {
    console.error("❌ Error al obtener feligreses:", err);
    return res.status(500).json({ message: "Error interno al consultar feligreses" });
  }
});

// ==========================================
// 2. REGISTRAR UN NUEVO FELIGRÉS (CON PROMESAS)
// ==========================================
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { nombre, apellido, documento_identidad, fecha_nacimiento, telefono, direccion, ciudad_id } = req.body;

    if (!nombre || !apellido) {
      return res.status(400).json({ message: "El nombre y el apellido son obligatorios." });
    }

    // 🛠️ CORREGIDO: Eliminamos la columna 'estado'. MySQL asignará 'activo = 1' por defecto automáticamente.
    const sql = `
      INSERT INTO feligreses 
        (nombre, apellido, documento_identidad, fecha_nacimiento, telefono, direccion, ciudad_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      nombre, 
      apellido, 
      documento_identidad || null, 
      fecha_nacimiento || null, 
      telefono || null, 
      direccion || null, 
      ciudad_id || null
    ];

    const [result] = await db.query(sql, params);
    res.status(201).json({ message: "Feligrés registrado con éxito", id: result.insertId });

  } catch (err) {
    console.error("❌ Error al insertar feligrés:", err);
    return res.status(500).json({ message: "No se pudo registrar en la base de datos." });
  }
});

// ==========================================
// 3. OBTENER LISTA DE CIUDADES (PÚBLICO PARA FORMULARIO)
// ==========================================
router.get('/ciudades-lista', async (req, res) => {
  try {
    const sql = `
      SELECT c.id, c.nombre AS ciudad, p.nombre AS pais 
      FROM ciudades c
      JOIN paises p ON c.pais_id = p.id
      ORDER BY c.nombre ASC
    `;

    const [rows] = await db.query(sql);
    res.json(rows);

  } catch (err) {
    console.error("❌ Error al obtener catálogo de ciudades:", err);
    return res.status(500).json({ message: "Error al obtener catálogo de ciudades" });
  }
});

module.exports = router;