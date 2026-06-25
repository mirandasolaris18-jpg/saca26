// routes/confirmaciones.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const db = require('../db');

// ==========================================
// 1. REGISTRAR UNA NUEVA CONFIRMACIÓN
// ==========================================
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      feligres_id, padrino_id, madrina_id, fecha_confirmacion, 
      sacerdote_id, numero_libro, pagina_libro, seccion_libro // 🛠️ Quitamos parroquia_id de aquí
    } = req.body;

    // 🛠️ NUEVO: Extraemos la parroquia directamente del token del usuario logueado
    const parroquia_id = req.user.parroquia_id;

    if (!parroquia_id) {
      return res.status(403).json({ message: "Su usuario no está asignado a ninguna parroquia." });
    }

    if (!feligres_id || !fecha_confirmacion || !sacerdote_id || !numero_libro || !pagina_libro || !seccion_libro) {
      return res.status(400).json({ message: "Todos los datos de la celebración y del libro son obligatorios." });
    }

    // 🛡️ REGLA: Exigir al menos 1 Padrino o Madrina
    if (!padrino_id && !madrina_id) {
      return res.status(400).json({ message: "Debe registrar al menos un Padrino o una Madrina." });
    }

    // 🛡️ REGLA: El confirmado no puede ser su propio padrino/madrina
    if (feligres_id == padrino_id || feligres_id == madrina_id) {
      return res.status(400).json({ message: "Datos ilógicos: El feligrés no puede ser su propio padrino o madrina." });
    }

    // 🛡️ REGLA: Validación de Duplicados
    const [yaConfirmado] = await db.query('SELECT id FROM confirmaciones WHERE feligres_id = ? AND activo = 1', [feligres_id]);
    if (yaConfirmado.length > 0) {
      return res.status(409).json({ message: "❌ Este feligrés ya cuenta con un acta de confirmación registrada." });
    }

    // 🛡️ REGLA CANÓNICA: Validar Bautizo de los padrinos seleccionados
    if (padrino_id) {
      const [padrinoBautizado] = await db.query('SELECT id FROM bautizos WHERE feligres_id = ?', [padrino_id]);
      if (padrinoBautizado.length === 0) {
        return res.status(400).json({ message: "❌ La persona seleccionada como Padrino no cuenta con un registro de Bautizo en el sistema." });
      }
    }

    if (madrina_id) {
      const [madrinaBautizada] = await db.query('SELECT id FROM bautizos WHERE feligres_id = ?', [madrina_id]);
      if (madrinaBautizada.length === 0) {
        return res.status(400).json({ message: "❌ La persona seleccionada como Madrina no cuenta con un registro de Bautizo en el sistema." });
      }
    }

    // --- INSERCIÓN ---
    const sql = `
      INSERT INTO confirmaciones 
        (feligres_id, padrino_id, madrina_id, fecha_confirmacion, parroquia_id, sacerdote_id, numero_libro, pagina_libro, seccion_libro, creado_por) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const usuario_creador = req.user?.nombre || 'sistema'; 

    const params = [
      feligres_id, 
      padrino_id || null, 
      madrina_id || null, 
      fecha_confirmacion, 
      parroquia_id, // 🛠️ Usamos el parroquia_id del usuario logueado
      sacerdote_id, 
      numero_libro, 
      pagina_libro, 
      seccion_libro,
      usuario_creador
    ];
    
    const [result] = await db.query(sql, params);
    res.status(201).json({ message: "Confirmación registrada con éxito", id: result.insertId });

  } catch (err) {
    console.error("❌ Error al registrar confirmación:", err);
    return res.status(500).json({ message: "Error interno del servidor al procesar el acta." });
  }
});

// ==========================================
// 2. OBTENER RECURSOS (COMBOBOX MEJORADOS)
// ==========================================
router.get('/recursos', authMiddleware, async (req, res) => {
  try {
    const [parroquias] = await db.query("SELECT id, nombre FROM parroquias WHERE activo = 1");
    const [sacerdotes] = await db.query("SELECT id, CONCAT(nombre, ' ', apellido) AS nombre_completo FROM sacerdotes WHERE activo = 1");
    
    // 🛠️ CORREGIDO: Aquí es donde va el LEFT JOIN para saber si ya tienen la confirmación
    const sqlFeligreses = `
      SELECT f.id, CONCAT(f.apellido, ' ', f.nombre) AS nombre_completo, f.documento_identidad,
             c.fecha_confirmacion AS fecha_sacramento, p.nombre AS parroquia_sacramento,
             IF(c.id IS NOT NULL, 1, 0) AS ya_lo_tiene
      FROM feligreses f
      LEFT JOIN confirmaciones c ON f.id = c.feligres_id
      LEFT JOIN parroquias p ON c.parroquia_id = p.id
      WHERE f.activo = 1 ORDER BY f.apellido ASC
    `;
    const [feligreses] = await db.query(sqlFeligreses);

    res.json({ parroquias, sacerdotes, feligreses });
  } catch (err) {
    console.error("❌ Error al cargar recursos:", err);
    res.status(500).json({ message: "Error al cargar listas." });
  }
});

// ==========================================
// 3. OBTENER LISTA DE CONFIRMACIONES (CON FILTRO DE JERARQUÍA)
// ==========================================
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { buscar } = req.query;
    const { nivel_jerarquico, parroquia_id } = req.user; // 🛠️ Extraemos datos del token
    
    // 🛠️ CORREGIDO: Restaurada la consulta para que la tabla del historial funcione
    let sql = `
      SELECT c.*, 
             f.nombre AS confirmado_nombre, f.apellido AS confirmado_apellido,
             p.nombre AS parroquia_nombre,
             CONCAT(s.nombre, ' ', s.apellido) AS sacerdote_nombre
      FROM confirmaciones c
      JOIN feligreses f ON c.feligres_id = f.id
      JOIN parroquias p ON c.parroquia_id = p.id
      JOIN sacerdotes s ON c.sacerdote_id = s.id
      WHERE c.activo = 1
    `;
    const params = [];

    // 🛠️ FILTRO DE JERARQUÍA: Si es Nivel 3 (Sacerdote/Secretaria), solo ve su parroquia
    if (nivel_jerarquico === 3) {
      sql += ` AND c.parroquia_id = ?`;
      params.push(parroquia_id);
    }

    if (buscar) {
      sql += ` AND (f.nombre LIKE ? OR f.apellido LIKE ? OR f.documento_identidad LIKE ?)`;
      const val = `%${buscar}%`;
      params.push(val, val, val);
    }
    sql += ` ORDER BY c.fecha_confirmacion DESC LIMIT 10`;
    
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error al obtener confirmaciones:", err);
    res.status(500).json({ message: "Error al obtener confirmaciones" });
  }
});

module.exports = router;