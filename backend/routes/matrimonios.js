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
      novio_id, novia_id, 
      padre_novio_id, madre_novio_id, padre_novia_id, madre_novia_id, // Nuevos campos añadidos
      padrino_id, madrina_id, testigo1_id, testigo2_id,
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
        (novio_id, novia_id, padre_novio_id, madre_novio_id, padre_novia_id, madre_novia_id, padrino_id, madrina_id, testigo1_id, testigo2_id, fecha_matrimonio, parroquia_id, sacerdote_id, numero_libro, pagina_libro, seccion_libro, creado_por)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    // Si no hay padres, padrino o madrina, enviamos NULL para no romper las Foreign Keys
    const params = [
      novio_id, 
      novia_id, 
      padre_novio_id || null, 
      madre_novio_id || null, 
      padre_novia_id || null, 
      madre_novia_id || null, 
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
// 2. OBTENER RECURSOS (Feligreses, Sacerdotes, Parejas Casadas)
// ==========================================
router.get('/recursos', authMiddleware, async (req, res) => {
  try {
    const [feligreses] = await db.execute("SELECT id, CONCAT(nombre, ' ', apellido) AS nombre_completo, genero FROM feligreses WHERE activo = 1 ORDER BY apellido ASC");
    const [sacerdotes] = await db.execute("SELECT id, CONCAT(nombre, ' ', apellido) AS nombre_completo FROM sacerdotes WHERE activo = 1");
    const [parroquias] = await db.execute("SELECT id, nombre FROM parroquias WHERE activo = 1");
    
    // Obtenemos exclusivamente a las parejas que ya tienen un matrimonio registrado
    const [parejas] = await db.execute(`
      SELECT m.novio_id, m.novia_id, 
             CONCAT(n1.nombre, ' ', n1.apellido) AS esposo_nombre, 
             CONCAT(n2.nombre, ' ', n2.apellido) AS esposa_nombre
      FROM matrimonios m
      JOIN feligreses n1 ON m.novio_id = n1.id
      JOIN feligreses n2 ON m.novia_id = n2.id
      WHERE m.activo = 1
    `);

    res.json({ feligreses, sacerdotes, parroquias, parejas });
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

// ==========================================
// 4. OBTENER DATOS FORMATEADOS PARA PDF
// ==========================================
router.get('/:id/pdf', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Formateamos la fecha directamente en SQL para que React la reciba lista
    const sql = `
      SELECT 
        DATE_FORMAT(m.fecha_matrimonio, '%d/%m/%Y') AS fecha_matrimonio, 
        m.numero_libro, m.pagina_libro, m.seccion_libro,
        CONCAT(novio.nombre, ' ', novio.apellido) AS novio_completo,
        CONCAT(novia.nombre, ' ', novia.apellido) AS novia_completo,
        CONCAT(p_novio.nombre, ' ', p_novio.apellido) AS padre_novio,
        CONCAT(m_novio.nombre, ' ', m_novio.apellido) AS madre_novio,
        CONCAT(p_novia.nombre, ' ', p_novia.apellido) AS padre_novia,
        CONCAT(m_novia.nombre, ' ', m_novia.apellido) AS madre_novia,
        CONCAT(padrino.nombre, ' ', padrino.apellido) AS padrino,
        CONCAT(madrina.nombre, ' ', madrina.apellido) AS madrina,
        CONCAT(t1.nombre, ' ', t1.apellido) AS testigo1,
        CONCAT(t2.nombre, ' ', t2.apellido) AS testigo2,
        parr.nombre AS parroquia,
        CONCAT(sac.nombre, ' ', sac.apellido) AS sacerdote
      FROM matrimonios m
      JOIN feligreses novio ON m.novio_id = novio.id
      JOIN feligreses novia ON m.novia_id = novia.id
      LEFT JOIN feligreses p_novio ON m.padre_novio_id = p_novio.id
      LEFT JOIN feligreses m_novio ON m.madre_novio_id = m_novio.id
      LEFT JOIN feligreses p_novia ON m.padre_novia_id = p_novia.id
      LEFT JOIN feligreses m_novia ON m.madre_novia_id = m_novia.id
      LEFT JOIN feligreses padrino ON m.padrino_id = padrino.id
      LEFT JOIN feligreses madrina ON m.madrina_id = madrina.id
      JOIN feligreses t1 ON m.testigo1_id = t1.id
      JOIN feligreses t2 ON m.testigo2_id = t2.id
      JOIN parroquias parr ON m.parroquia_id = parr.id
      JOIN sacerdotes sac ON m.sacerdote_id = sac.id
      WHERE m.id = ? AND m.activo = 1
    `;

    const [rows] = await db.execute(sql, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Matrimonio no encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error al obtener datos para PDF:", error);
    res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
});

module.exports = router;