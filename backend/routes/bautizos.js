// routes/bautizos.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const db = require('../db');

// ==========================================
// 1. REGISTRAR UN NUEVO BAUTIZO
// ==========================================
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      feligres_id, padre_id, madre_id, padrino_id, madrina_id,
      fecha_bautizo, sacerdote_id, // 🛠️ Quitamos parroquia_id de aquí
      numero_libro, pagina_libro, seccion_libro
    } = req.body;

    // 🛠️ NUEVO: Extraemos la parroquia directamente del token del usuario logueado
    const parroquia_id = req.user.parroquia_id;

    if (!parroquia_id) {
      return res.status(403).json({ message: "Su usuario no está asignado a ninguna parroquia." });
    }

    // --- VALIDACIÓN DE EXISTENCIA PREVIA ---
    if (!feligres_id) {
      return res.status(400).json({ message: "Debe seleccionar al feligrés que recibirá el bautizo." });
    }

    const [existente] = await db.query('SELECT id FROM bautizos WHERE feligres_id = ?', [feligres_id]);
    if (existente.length > 0) {
      return res.status(409).json({ message: "❌ Este feligrés ya cuenta con un acta de bautizo registrada en el sistema." });
    }

    // --- REGLAS DE NEGOCIO Y VALIDACIONES ---
    if (
      (padre_id && feligres_id == padre_id) ||
      (madre_id && feligres_id == madre_id) ||
      (padrino_id && feligres_id == padrino_id) ||
      (madrina_id && feligres_id == madrina_id)
    ) {
      return res.status(400).json({ message: "Datos ilógicos: El feligrés bautizado no puede ser su propio tutor o padrino." });
    }

    if (!padre_id && !madre_id) {
      return res.status(400).json({ message: "Es obligatorio registrar al menos un tutor (padre o madre)." });
    }
    if (!padrino_id && !madrina_id) {
      return res.status(400).json({ message: "Es obligatorio registrar al menos un padrino o madrina." });
    }
    if (!numero_libro || !pagina_libro || !seccion_libro) {
      return res.status(400).json({ message: "Los datos del libro (número, página y sección) son obligatorios." });
    }
    if (!fecha_bautizo || !sacerdote_id) { // 🛠️ Quitamos parroquia_id de esta validación
      return res.status(400).json({ message: "La fecha y el sacerdote son obligatorios." });
    }

    // --- INSERCIÓN EN LA BASE DE DATOS ---
    const sql = `
      INSERT INTO bautizos 
        (feligres_id, padre_id, madre_id, padrino_id, madrina_id, fecha_bautizo, parroquia_id, sacerdote_id, numero_libro, pagina_libro, seccion_libro) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      feligres_id, 
      padre_id || null, 
      madre_id || null, 
      padrino_id || null, 
      madrina_id || null, 
      fecha_bautizo, 
      parroquia_id, // 🛠️ Usamos el parroquia_id del usuario
      sacerdote_id, 
      numero_libro, 
      pagina_libro, 
      seccion_libro
    ];

    const [result] = await db.query(sql, params);
    res.status(201).json({ message: "Bautizo registrado con éxito", id: result.insertId });

  } catch (err) {
    console.error("❌ Error al registrar bautizo:", err);
    return res.status(500).json({ message: "Error interno al registrar el acta de bautizo." });
  }
});

// ==========================================
// 2. OBTENER RECURSOS (COMBOBOX MEJORADOS)
// ==========================================
router.get('/recursos', authMiddleware, async (req, res) => {
  try {
    const [parroquias] = await db.query("SELECT id, nombre FROM parroquias WHERE activo = 1");
    const [sacerdotes] = await db.query("SELECT id, CONCAT(nombre, ' ', apellido) AS nombre_completo FROM sacerdotes WHERE activo = 1");
    
    // 🛠️ NUEVO: LEFT JOIN para descubrir si ya están bautizados, dónde y cuándo
    const sqlFeligreses = `
      SELECT f.id, CONCAT(f.apellido, ' ', f.nombre) AS nombre_completo, f.documento_identidad,
             b.fecha_bautizo AS fecha_sacramento, p.nombre AS parroquia_sacramento,
             IF(b.id IS NOT NULL, 1, 0) AS ya_lo_tiene
      FROM feligreses f
      LEFT JOIN bautizos b ON f.id = b.feligres_id
      LEFT JOIN parroquias p ON b.parroquia_id = p.id
      WHERE f.activo = 1 ORDER BY f.apellido ASC
    `;
    const [feligreses] = await db.query(sqlFeligreses);

    res.json({ parroquias, sacerdotes, feligreses });
  } catch (err) {
    console.error("❌ Error al obtener recursos:", err);
    return res.status(500).json({ message: "Error al cargar listas desplegables." });
  }
});

// ==========================================
// 3. OBTENER LISTA DE BAUTIZOS (CON FILTRO DE JERARQUÍA)
// ==========================================
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { buscar } = req.query;
    const { nivel_jerarquico, parroquia_id } = req.user; // 🛠️ Extraemos datos del token
    
    let sql = `
      SELECT b.*, 
             f.nombre AS bautizado_nombre, f.apellido AS bautizado_apellido,
             p.nombre AS parroquia_nombre,
             CONCAT(s.nombre, ' ', s.apellido) AS sacerdote_nombre
      FROM bautizos b
      JOIN feligreses f ON b.feligres_id = f.id
      JOIN parroquias p ON b.parroquia_id = p.id
      JOIN sacerdotes s ON b.sacerdote_id = s.id
      WHERE 1=1
    `;
    
    const params = [];

    // 🛠️ FILTRO DE JERARQUÍA: Si es Sacerdote o Secretaria (Nivel 3), solo ve su parroquia
    if (nivel_jerarquico === 3) {
      sql += ` AND b.parroquia_id = ?`;
      params.push(parroquia_id);
    }

    if (buscar) {
      sql += ` AND (f.nombre LIKE ? OR f.apellido LIKE ? OR f.documento_identidad LIKE ?)`;
      const val = `%${buscar}%`;
      params.push(val, val, val);
    }
    
    sql += ` ORDER BY b.fecha_bautizo DESC LIMIT 10`;
    
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener bautizos" });
  }
});

module.exports = router;