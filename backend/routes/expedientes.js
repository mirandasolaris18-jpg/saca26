// backend/routes/expedientes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const db = require('../db');

// ========================================================================
// 1. OBTENER EXPEDIENTES (Con cálculo dinámico de requisitos)
// ========================================================================
router.get('/', authMiddleware, async (req, res) => {
  try {
    const parroquia_id = req.user.parroquia_id || 1;
    const sql = `
      SELECT e.*, 
        n.nombre AS novio_nombre, n.apellido AS novio_apellido,
        m.nombre AS novia_nombre, m.apellido AS novia_apellido,
        pd.nombre AS parroquia_destino_nombre,
        (SELECT COUNT(id) FROM bautizos WHERE feligres_id = n.id AND activo = 1 LIMIT 1) AS novio_bautizado,
        (SELECT COUNT(id) FROM confirmaciones WHERE feligres_id = n.id AND activo = 1 LIMIT 1) AS novio_confirmado,
        (SELECT COUNT(id) FROM bautizos WHERE feligres_id = m.id AND activo = 1 LIMIT 1) AS novia_bautizada,
        (SELECT COUNT(id) FROM confirmaciones WHERE feligres_id = m.id AND activo = 1 LIMIT 1) AS novia_confirmada,
        (SELECT COUNT(id) FROM expedientes_intervinientes WHERE expediente_id = e.id AND activo = 1) AS total_intervinientes
      FROM expedientes_matrimoniales e
      JOIN feligreses n ON e.novio_id = n.id
      JOIN feligreses m ON e.novia_id = m.id
      LEFT JOIN parroquias pd ON e.parroquia_destino_id = pd.id
      WHERE (e.parroquia_id = ? OR e.parroquia_destino_id = ?) AND e.activo = 1
      ORDER BY e.fecha_boda_programada DESC
    `;
    const [rows] = await db.execute(sql, [parroquia_id, parroquia_id]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener expedientes." });
  }
});

// ========================================================================
// 2. CREAR NUEVO EXPEDIENTE CON VALIDACIONES ESTRICTAS
// ========================================================================
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { novio_id, novia_id, fecha_boda_programada } = req.body;
    if (!novio_id || !novia_id || !fecha_boda_programada) return res.status(400).json({ message: "Datos incompletos." });

    const parroquia_id = req.user.parroquia_id || 1;
    const creado_por = req.user.username || 'sistema';

    const fechaBoda = new Date(fecha_boda_programada);
    const fechaMinima = new Date();
    fechaMinima.setDate(fechaMinima.getDate() + 30);
    if (fechaBoda < fechaMinima) return res.status(400).json({ message: "La fecha debe ser al menos con 30 días de anticipación." });

    const sqlCheck = `
      SELECT e.id, p.nombre AS parroquia_nombre, e.parroquia_id, e.estado_tramite
      FROM expedientes_matrimoniales e
      LEFT JOIN parroquias p ON e.parroquia_id = p.id
      WHERE (e.novio_id IN (?, ?) OR e.novia_id IN (?, ?))
      AND e.estado_tramite NOT IN ('Cancelado') AND e.activo = 1
    `;
    const [tramitesExistentes] = await db.execute(sqlCheck, [novio_id, novia_id, novio_id, novia_id]);
    if (tramitesExistentes.length > 0) {
      const tramite = tramitesExistentes[0];
      if (tramite.parroquia_id === parroquia_id) return res.status(400).json({ message: "Ya existe un trámite en curso en esta parroquia." });
      return res.status(400).json({ message: `BLOQUEO: Uno o ambos novios ya tienen una reserva activa en la parroquia: ${tramite.parroquia_nombre}.` });
    }

    const sqlInsert = `
      INSERT INTO expedientes_matrimoniales (novio_id, novia_id, fecha_boda_programada, estado_tramite, parroquia_id, creado_por)
      VALUES (?, ?, ?, 'En Curso', ?, ?)
    `;
    const [result] = await db.execute(sqlInsert, [novio_id, novia_id, fecha_boda_programada, parroquia_id, creado_por]);
    res.status(201).json({ message: "Expediente creado.", id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear el expediente." });
  }
});

// ========================================================================
// 3. ACTUALIZAR ESTADO DE EXPEDIENTE
// ========================================================================
router.put('/:id/estado', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    await db.execute(`UPDATE expedientes_matrimoniales SET estado_tramite = ? WHERE id = ?`, [estado, id]);
    res.json({ message: `Trámite ${estado.toLowerCase()} correctamente.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al cambiar el estado." });
  }
});

// ========================================================================
// 4. GUARDAR INTERVINIENTES (Manejo robusto de array y transacciones)
// ========================================================================
router.post('/:id/intervinientes', authMiddleware, async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    
    let intervinientes = req.body;
    if (intervinientes && intervinientes.intervinientes) {
        intervinientes = intervinientes.intervinientes;
    }

    if (!Array.isArray(intervinientes)) {
      return res.status(400).json({ message: "Formato inválido de intervinientes. Se esperaba un arreglo." });
    }

    await connection.beginTransaction();
    await connection.execute('DELETE FROM expedientes_intervinientes WHERE expediente_id = ?', [id]);
    
    const sql = `INSERT INTO expedientes_intervinientes (expediente_id, feligres_id, rol, activo) VALUES (?, ?, ?, 1)`;
    for (const item of intervinientes) {
      await connection.execute(sql, [id, item.feligres_id, item.rol]);
    }
    
    await connection.commit();
    res.json({ message: "Intervinientes guardados correctamente." });
  } catch (error) {
    await connection.rollback();
    console.error("❌ Error al guardar intervinientes:", error);
    res.status(500).json({ message: "Error interno al guardar los intervinientes." });
  } finally {
    connection.release();
  }
});

// ========================================================================
// 5. OBTENER INTERVINIENTES Y SUGERENCIAS DE BAUTIZOS
// ========================================================================
router.get('/:id/intervinientes', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Intervinientes explícitamente guardados
    const sqlGuardados = `
      SELECT i.rol, i.feligres_id, f.nombre, f.apellido 
      FROM expedientes_intervinientes i
      JOIN feligreses f ON i.feligres_id = f.id
      WHERE i.expediente_id = ? AND i.activo = 1
    `;
    const [guardados] = await db.execute(sqlGuardados, [id]);

    // Búsqueda de padres en tabla de bautizos para sugerencias
    const [expRows] = await db.execute('SELECT novio_id, novia_id FROM expedientes_matrimoniales WHERE id = ?', [id]);
    let sugerencias = {};

    if (expRows.length > 0) {
      const exp = expRows[0];
      
      const [bNovio] = await db.execute('SELECT padre_id, madre_id FROM bautizos WHERE feligres_id = ? AND activo = 1 LIMIT 1', [exp.novio_id]);
      if (bNovio.length > 0) {
         if (bNovio[0].padre_id) sugerencias.padre_novio = bNovio[0].padre_id;
         if (bNovio[0].madre_id) sugerencias.madre_novio = bNovio[0].madre_id;
      }
      
      const [bNovia] = await db.execute('SELECT padre_id, madre_id FROM bautizos WHERE feligres_id = ? AND activo = 1 LIMIT 1', [exp.novia_id]);
      if (bNovia.length > 0) {
         if (bNovia[0].padre_id) sugerencias.padre_novia = bNovia[0].padre_id;
         if (bNovia[0].madre_id) sugerencias.madre_novia = bNovia[0].madre_id;
      }
    }

    res.json({ guardados, sugerencias });
  } catch (error) {
    console.error("❌ Error al obtener intervinientes:", error);
    res.status(500).json({ message: "Error al obtener intervinientes." });
  }
});

// ========================================================================
// 6. TRASLADAR EXPEDIENTE (EXHORTO)
// ========================================================================
router.put('/:id/trasladar', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { parroquia_destino_id } = req.body;
    await db.execute(`UPDATE expedientes_matrimoniales SET estado_tramite = 'Trasladado', parroquia_destino_id = ? WHERE id = ?`, [parroquia_destino_id, id]);
    res.json({ message: "Expediente trasladado con éxito." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al trasladar el expediente." });
  }
});

// ========================================================================
// 7. OBTENER DATOS COMPLETOS PARA IMPRESIÓN OFICIAL DEL EXPEDIENTE
// ========================================================================
router.get('/:id/impresion', authMiddleware, async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;

    // Expediente, Parroquia y Novios
    const sqlBase = `
      SELECT e.id AS expediente_id, e.fecha_boda_programada, e.creado_en AS fecha_registro,
             p.nombre AS parroquia_nombre, p.diocesis, p.id AS parroquia_id,
             n.id AS novio_id, n.nombre AS novio_nombre, n.apellido AS novio_apellido, n.fecha_nacimiento AS novio_nacimiento,
             m.id AS novia_id, m.nombre AS novia_nombre, m.apellido AS novia_apellido, m.fecha_nacimiento AS novia_nacimiento
      FROM expedientes_matrimoniales e
      JOIN parroquias p ON e.parroquia_id = p.id
      JOIN feligreses n ON e.novio_id = n.id
      JOIN feligreses m ON e.novia_id = m.id
      WHERE e.id = ? AND e.activo = 1
    `;
    const [baseRows] = await connection.execute(sqlBase, [id]);
    if (baseRows.length === 0) return res.status(404).json({ message: "Expediente no encontrado." });
    let data = baseRows[0];

    // Párroco asignado a la parroquia del expediente
    const [sacerdoteRows] = await connection.execute(`
      SELECT s.nombre, s.apellido FROM asignaciones_sacerdotes a 
      JOIN sacerdotes s ON a.sacerdote_id = s.id 
      WHERE a.parroquia_id = ? AND a.activo = 1 LIMIT 1
    `, [data.parroquia_id]);
    data.parroco = sacerdoteRows.length > 0 ? `${sacerdoteRows[0].nombre} ${sacerdoteRows[0].apellido}` : '______________________';

    // Helper para sacramentos
    const getSacramentos = async (feligresId) => {
      const sac = { bautizo_fecha: null, bautizo_parroquia: null, conf_fecha: null, conf_parroquia: null };
      const [b] = await connection.execute(`SELECT b.fecha_bautizo as fecha, p.nombre as parroquia FROM bautizos b JOIN parroquias p ON b.parroquia_id = p.id WHERE b.feligres_id = ? AND b.activo=1 LIMIT 1`, [feligresId]);
      if(b.length > 0) { sac.bautizo_fecha = b[0].fecha; sac.bautizo_parroquia = b[0].parroquia; }
      
      const [c] = await connection.execute(`SELECT c.fecha_confirmacion as fecha, p.nombre as parroquia FROM confirmaciones c JOIN parroquias p ON c.parroquia_id = p.id WHERE c.feligres_id = ? AND c.activo=1 LIMIT 1`, [feligresId]);
      if(c.length > 0) { sac.conf_fecha = c[0].fecha; sac.conf_parroquia = c[0].parroquia; }
      return sac;
    };

    data.sacramentos_novio = await getSacramentos(data.novio_id);
    data.sacramentos_novia = await getSacramentos(data.novia_id);

    // Intervinientes con validación de matrimonio para padrinos
    const [intervinientesRows] = await connection.execute(`
      SELECT i.rol, f.nombre, f.apellido,
        (SELECT fecha_matrimonio FROM matrimonios WHERE (novio_id = f.id OR novia_id = f.id) AND activo = 1 LIMIT 1) AS fecha_matrimonio_padrinos
      FROM expedientes_intervinientes i
      JOIN feligreses f ON i.feligres_id = f.id
      WHERE i.expediente_id = ? AND i.activo = 1
    `, [id]);
    data.intervinientes = intervinientesRows;

    res.json(data);
  } catch (error) {
    console.error("❌ Error en impresión:", error);
    res.status(500).json({ message: "Error al generar el expediente para impresión." });
  } finally {
    connection.release();
  }
});

module.exports = router;

// ========================================================================
// 8. GUARDAR DATOS DEL ACTA Y REGISTRO CIVIL (MÓDULO CELEBRACIÓN)
// ========================================================================
router.put('/:id/celebracion', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      numero_libro, folio, numero_acta, 
      lugar_civil, fecha_civil, oficialia_civil, partida_civil, numero_civil, obispo_diocesis 
    } = req.body;

    const sql = `
      UPDATE expedientes_matrimoniales 
      SET numero_libro = ?, folio = ?, numero_acta = ?, 
          lugar_civil = ?, fecha_civil = ?, oficialia_civil = ?, partida_civil = ?, numero_civil = ?, obispo_diocesis = ?,
          estado_tramite = 'Celebrado'
      WHERE id = ?
    `;
    
    await db.execute(sql, [
      numero_libro, folio, numero_acta, 
      lugar_civil, fecha_civil, oficialia_civil, partida_civil, numero_civil, obispo_diocesis, 
      id
    ]);
    
    res.json({ message: "Datos del acta guardados y matrimonio celebrado." });
  } catch (error) {
    console.error("❌ Error al guardar celebración:", error);
    res.status(500).json({ message: "Error al registrar el acta." });
  }
});