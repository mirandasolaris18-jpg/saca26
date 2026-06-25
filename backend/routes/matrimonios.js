// routes/matrimonios.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const db = require('../db');

// ==========================================
// 1. REGISTRAR UN NUEVO MATRIMONIO
// ==========================================
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      novio_id, novia_id, padrino_id, madrina_id, testigo1_id, testigo2_id,
      fecha_matrimonio, sacerdote_id, numero_libro, pagina_libro, seccion_libro
    } = req.body;

    // 🛠️ NUEVO: Extraemos la parroquia directamente del token del usuario logueado
    const parroquia_id = req.user.parroquia_id;

    if (!parroquia_id) {
      return res.status(403).json({ message: "Su usuario no está asignado a ninguna parroquia." });
    }

    // Validaciones de negocio básicas
    if (novio_id === novia_id) {
      return res.status(400).json({ message: "❌ Los contrayentes no pueden ser la misma persona." });
    }
    if (testigo1_id === testigo2_id) {
      return res.status(400).json({ message: "❌ Los testigos deben ser personas diferentes." });
    }

    const sql = `
      INSERT INTO matrimonios 
        (novio_id, novia_id, padrino_id, madrina_id, testigo1_id, testigo2_id, fecha_matrimonio, parroquia_id, sacerdote_id, numero_libro, pagina_libro, seccion_libro)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      novio_id, novia_id, padrino_id || null, madrina_id || null,
      testigo1_id, testigo2_id, fecha_matrimonio, 
      parroquia_id, // 🛠️ Usamos el parroquia_id del usuario logueado
      sacerdote_id, numero_libro, pagina_libro, seccion_libro
    ];

    const [result] = await db.query(sql, params);
    res.status(201).json({ message: "Matrimonio registrado con éxito", id: result.insertId });
  } catch (err) {
    console.error("❌ Error al registrar matrimonio:", err);
    res.status(500).json({ message: "Error interno al procesar el acta de matrimonio." });
  }
});

// ==========================================
// 2. OBTENER RECURSOS (COMBOBOX MEJORADOS)
// ==========================================
router.get('/recursos', authMiddleware, async (req, res) => {
  try {
    const [parroquias] = await db.query("SELECT id, nombre FROM parroquias WHERE activo = 1");
    const [sacerdotes] = await db.query("SELECT id, CONCAT(nombre, ' ', apellido) AS nombre_completo FROM sacerdotes WHERE activo = 1");
    
    // 🛠️ CORREGIDO: Aquí es donde va el LEFT JOIN para saber si ya están casados
    const sqlFeligreses = `
      SELECT f.id, CONCAT(f.apellido, ' ', f.nombre) AS nombre_completo, f.documento_identidad,
             m.fecha_matrimonio AS fecha_sacramento, p.nombre AS parroquia_sacramento,
             IF(m.id IS NOT NULL, 1, 0) AS ya_lo_tiene
      FROM feligreses f
      LEFT JOIN matrimonios m ON (f.id = m.novio_id OR f.id = m.novia_id)
      LEFT JOIN parroquias p ON m.parroquia_id = p.id
      WHERE f.activo = 1 ORDER BY f.apellido ASC
    `;
    const [feligreses] = await db.query(sqlFeligreses);
    
    res.json({ parroquias, sacerdotes, feligreses });
  } catch (err) {
    console.error("Error al cargar recursos:", err);
    res.status(500).json({ message: "Error al cargar recursos para matrimonios." });
  }
});

// ==========================================
// 3. OBTENER LISTA DE MATRIMONIOS (CON FILTRO DE JERARQUÍA)
// ==========================================
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { buscar } = req.query;
    const { nivel_jerarquico, parroquia_id } = req.user; // 🛠️ Extraemos datos del token
    
    // 🛠️ CORREGIDO: Restaurada la consulta para que la tabla del historial de matrimonios funcione
    let sql = `
      SELECT m.*, 
             CONCAT(n1.nombre, ' ', n1.apellido) AS esposo_nombre,
             CONCAT(n2.nombre, ' ', n2.apellido) AS esposa_nombre,
             p.nombre AS parroquia_nombre,
             CONCAT(s.nombre, ' ', s.apellido) AS sacerdote_nombre
      FROM matrimonios m
      JOIN feligreses n1 ON m.novio_id = n1.id
      JOIN feligreses n2 ON m.novia_id = n2.id
      JOIN parroquias p ON m.parroquia_id = p.id
      JOIN sacerdotes s ON m.sacerdote_id = s.id
      WHERE 1=1
    `;
    const params = [];

    // 🛠️ FILTRO DE JERARQUÍA: Si es Nivel 3 (Sacerdote/Secretaria), solo ve su parroquia
    if (nivel_jerarquico === 3) {
      sql += ` AND m.parroquia_id = ?`;
      params.push(parroquia_id);
    }

    if (buscar) {
      sql += ` AND (n1.nombre LIKE ? OR n1.apellido LIKE ? OR n2.nombre LIKE ? OR n2.apellido LIKE ?)`;
      const val = `%${buscar}%`;
      params.push(val, val, val, val);
    }
    
    sql += " ORDER BY m.fecha_matrimonio DESC LIMIT 10";
    
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error al obtener matrimonios:", err);
    res.status(500).json({ message: "Error al obtener matrimonios" });
  }
});

module.exports = router;