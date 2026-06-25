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

    const parroquia_id = req.user.parroquia_id; // Obtenido del token JWT

    if (!parroquia_id) {
      return res.status(403).json({ message: "Su usuario no está asignado a ninguna parroquia." });
    }

    // Validaciones de negocio
    if (novio_id === novia_id) {
      return res.status(400).json({ message: "❌ Los contrayentes no pueden ser la misma persona." });
    }
    if (testigo1_id === testigo2_id) {
      return res.status(400).json({ message: "❌ Los testigos deben ser personas diferentes." });
    }

    const sql = `
      INSERT INTO matrimonios 
        (novio_id, novia_id, padrino_id, madrina_id, testigo1_id, testigo2_id, fecha_matrimonio, parroquia_id, sacerdote_id, numero_libro, pagina_libro, seccion_libro, creado_por)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    // Si no hay padrino o madrina, enviamos NULL para no romper las Foreign Keys
    const params = [
      novio_id, 
      novia_id, 
      padrino_id || null, 
      madrina_id || null, 
      testigo1_id, 
      testigo2_id, 
      fecha_matrimonio, 
      parroquia_id, 
      sacerdote_id, 
      numero_libro, 
      pagina_libro, 
      seccion_libro, 
      req.user.username || 'sistema'
    ];

    const [result] = await db.execute(sql, params);

    res.status(201).json({ message: "Matrimonio registrado con éxito", id: result.insertId });

  } catch (error) {
    console.error("Error al registrar matrimonio:", error);
    res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
});

// ==========================================
// 2. OBTENER RECURSOS (Feligreses, Sacerdotes, etc)
// ==========================================
router.get('/recursos', authMiddleware, async (req, res) => {
  try {
    const [feligreses] = await db.execute("SELECT id, CONCAT(nombre, ' ', apellido) AS nombre_completo, genero FROM feligreses WHERE activo = 1 ORDER BY apellido ASC");
    const [sacerdotes] = await db.execute("SELECT id, CONCAT(nombre, ' ', apellido) AS nombre_completo FROM sacerdotes WHERE activo = 1");
    const [parroquias] = await db.execute("SELECT id, nombre FROM parroquias WHERE activo = 1");

    res.json({ feligreses, sacerdotes, parroquias });
  } catch (error) {
    console.error("Error al obtener recursos:", error);
    res.status(500).json({ message: "Error al cargar recursos." });
  }
});

// ==========================================
// 3. OBTENER LISTA DE MATRIMONIOS
// ==========================================
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { buscar } = req.query;
    const { nivel_jerarquico, parroquia_id } = req.user; 
    
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
      WHERE m.activo = 1
    `;
    const params = [];

    // Si es Usuario Normal (Nivel 3), solo ve los de su parroquia
    if (nivel_jerarquico === 3) {
      sql += ` AND m.parroquia_id = ?`;
      params.push(parroquia_id);
    }

    if (buscar) {
      sql += ` AND (n1.nombre LIKE ? OR n1.apellido LIKE ? OR n2.nombre LIKE ? OR n2.apellido LIKE ?)`;
      const searchParam = `%${buscar}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    sql += ` ORDER BY m.fecha_matrimonio DESC`;

    const [matrimonios] = await db.execute(sql, params);
    res.json(matrimonios);
  } catch (error) {
    console.error("Error al listar matrimonios:", error);
    res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
});

module.exports = router;