const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const db = require('../db');

// ==========================================
// 1. REGISTRAR UN NUEVO CATEQUISTA
// ==========================================
router.post('/catequistas', authMiddleware, async (req, res) => {
  try {
    const { feligres_id, es_certificado, ruta_certificado } = req.body;
    const parroquia_id = req.user.parroquia_id; // Parroquia del usuario actual

    // 1. Verificar si ya es catequista
    const [existente] = await db.execute("SELECT id FROM catequistas WHERE feligres_id = ? AND activo = 1", [feligres_id]);
    
    let catequista_id;

    if (existente.length > 0) {
      catequista_id = existente[0].id;
    } else {
      // Si no existe, lo creamos
      const [nuevoCatequista] = await db.execute(
        "INSERT INTO catequistas (feligres_id, es_certificado, ruta_certificado, creado_por) VALUES (?, ?, ?, ?)",
        [feligres_id, es_certificado || 0, ruta_certificado || null, req.user.username]
      );
      catequista_id = nuevoCatequista.insertId;
    }

    // 2. Verificar en cuántas parroquias está asignado
    const [parroquiasAsignadas] = await db.execute(
      "SELECT COUNT(*) as total FROM catequistas_parroquias WHERE catequista_id = ? AND activo = 1",
      [catequista_id]
    );

    if (parroquiasAsignadas[0].total >= 2) {
      return res.status(400).json({ message: "❌ Error: Este catequista ya alcanzó el límite máximo de 2 parroquias." });
    }

    // 3. Verificar si ya está en ESTA parroquia
    const [yaEnParroquia] = await db.execute(
      "SELECT id FROM catequistas_parroquias WHERE catequista_id = ? AND parroquia_id = ? AND activo = 1",
      [catequista_id, parroquia_id]
    );

    if (yaEnParroquia.length > 0) {
      return res.status(400).json({ message: "⚠️ El catequista ya está registrado en su parroquia." });
    }

    // 4. Asignarlo a la parroquia actual
    await db.execute(
      "INSERT INTO catequistas_parroquias (catequista_id, parroquia_id, creado_por) VALUES (?, ?, ?)",
      [catequista_id, parroquia_id, req.user.username]
    );

    res.status(201).json({ message: "✅ Catequista registrado y vinculado a su parroquia exitosamente." });

  } catch (error) {
    console.error("Error al registrar catequista:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

// ==========================================
// 2. CREAR GRUPO DE CATEQUESIS (CON VALIDACIÓN DE HORARIOS)
// ==========================================
router.post('/grupos', authMiddleware, async (req, res) => {
  try {
    const { 
      periodo_id, nombre_grupo, catequista_id, 
      dia_reunion_ninos, hora_inicio_ninos, hora_fin_ninos,
      dia_reunion_padres, hora_inicio_padres, hora_fin_padres
    } = req.body;

    // Validación estrella 🌟: Evitar cruces de horarios del catequista en cualquier parroquia
    const sqlCruceHorarios = `
      SELECT g.nombre_grupo, p.nombre AS parroquia_nombre 
      FROM grupos_catequesis g
      JOIN periodos_catequesis per ON g.periodo_id = per.id
      JOIN parroquias p ON per.parroquia_id = p.id
      WHERE g.catequista_id = ? 
      AND g.activo = 1
      AND g.dia_reunion_ninos = ?
      AND (
        (g.hora_inicio_ninos < ? AND g.hora_fin_ninos > ?) -- El nuevo horario se cruza con uno existente
      )
    `;
    
    // Validamos el horario de los niños
    const [cruceNinos] = await db.execute(sqlCruceHorarios, [
      catequista_id, dia_reunion_ninos, hora_fin_ninos, hora_inicio_ninos
    ]);

    if (cruceNinos.length > 0) {
      return res.status(400).json({ 
        message: `❌ Error de colisión: El catequista ya imparte el grupo "${cruceNinos[0].nombre_grupo}" en la ${cruceNinos[0].parroquia_nombre} en ese mismo horario.` 
      });
    }

    // Si todo está libre, creamos el grupo
    const sqlInsert = `
      INSERT INTO grupos_catequesis 
      (periodo_id, nombre_grupo, catequista_id, dia_reunion_ninos, hora_inicio_ninos, hora_fin_ninos, dia_reunion_padres, hora_inicio_padres, hora_fin_padres, creado_por) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(sqlInsert, [
      periodo_id, nombre_grupo, catequista_id, 
      dia_reunion_ninos, hora_inicio_ninos, hora_fin_ninos,
      dia_reunion_padres || null, hora_inicio_padres || null, hora_fin_padres || null,
      req.user.username
    ]);

    res.status(201).json({ message: "✅ Grupo creado exitosamente.", id: result.insertId });

  } catch (error) {
    console.error("Error al crear grupo:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

// ==========================================
// 3. OBTENER LISTA DE CATEQUISTAS DE MI PARROQUIA
// ==========================================
router.get('/catequistas', authMiddleware, async (req, res) => {
  try {
    const { parroquia_id } = req.user;

    const sql = `
      SELECT c.id AS catequista_id, f.nombre, f.apellido, f.documento_identidad, 
             c.es_certificado, c.ruta_certificado
      FROM catequistas c
      JOIN feligreses f ON c.feligres_id = f.id
      JOIN catequistas_parroquias cp ON c.id = cp.catequista_id
      WHERE cp.parroquia_id = ? AND c.activo = 1 AND cp.activo = 1
      ORDER BY f.apellido ASC
    `;

    const [catequistas] = await db.execute(sql, [parroquia_id]);
    res.json(catequistas);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener la lista de catequistas." });
  }
});

module.exports = router;

// ==========================================
// 4. OBTENER PERIODOS ACTIVOS (Gestiones)
// ==========================================
router.get('/periodos', authMiddleware, async (req, res) => {
  try {
    const { parroquia_id } = req.user;
    const [periodos] = await db.execute(
      "SELECT * FROM periodos_catequesis WHERE parroquia_id = ? AND activo = 1 ORDER BY gestion DESC, tipo_sacramento ASC",
      [parroquia_id]
    );
    res.json(periodos);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los periodos de catequesis." });
  }
});

// ==========================================
// 5. OBTENER GRUPOS DE CATEQUESIS
// ==========================================
router.get('/grupos', authMiddleware, async (req, res) => {
  try {
    const { parroquia_id } = req.user;
    const sql = `
      SELECT g.id, g.nombre_grupo, g.dia_reunion_ninos, g.hora_inicio_ninos, g.hora_fin_ninos,
             per.gestion, per.tipo_sacramento,
             CONCAT(f.nombre, ' ', f.apellido) AS catequista_nombre
      FROM grupos_catequesis g
      JOIN periodos_catequesis per ON g.periodo_id = per.id
      JOIN catequistas c ON g.catequista_id = c.id
      JOIN feligreses f ON c.feligres_id = f.id
      WHERE per.parroquia_id = ? AND g.activo = 1
      ORDER BY per.gestion DESC, g.nombre_grupo ASC
    `;
    const [grupos] = await db.execute(sql, [parroquia_id]);
    res.json(grupos);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los grupos." });
  }
});

// ==========================================
// 6. INSCRIBIR A UN ALUMNO EN UN GRUPO
// ==========================================
router.post('/inscripciones', authMiddleware, async (req, res) => {
  try {
    const { grupo_id, feligres_id, tutor_principal_id, tutor_secundario_id } = req.body;

    // 1. Validar que el alumno no sea también su propio tutor
    if (feligres_id === tutor_principal_id || feligres_id === tutor_secundario_id) {
      return res.status(400).json({ message: "❌ El alumno no puede ser su propio tutor." });
    }

    // 2. Validar que no se repitan los tutores
    if (tutor_principal_id && tutor_principal_id === tutor_secundario_id) {
      return res.status(400).json({ message: "❌ El tutor principal y secundario no pueden ser la misma persona." });
    }

    // 3. Validar si el alumno ya está inscrito en este grupo
    const [existente] = await db.execute(
      "SELECT id FROM inscripciones_cursos WHERE grupo_id = ? AND feligres_id = ? AND activo = 1",
      [grupo_id, feligres_id]
    );

    if (existente.length > 0) {
      return res.status(400).json({ message: "⚠️ Este feligrés ya se encuentra inscrito en este grupo." });
    }

    // 4. Insertar la inscripción
    const sqlInsert = `
      INSERT INTO inscripciones_cursos 
      (grupo_id, feligres_id, tutor_principal_id, tutor_secundario_id, creado_por) 
      VALUES (?, ?, ?, ?, ?)
    `;

    await db.execute(sqlInsert, [
      grupo_id, 
      feligres_id, 
      tutor_principal_id || null, 
      tutor_secundario_id || null, 
      req.user.username
    ]);

    res.status(201).json({ message: "✅ Alumno inscrito correctamente." });

  } catch (error) {
    console.error("Error en inscripción:", error);
    res.status(500).json({ message: "Error interno al procesar la inscripción." });
  }
});

// ==========================================
// 7. OBTENER LISTA DE INSCRITOS POR GRUPO
// ==========================================
router.get('/inscripciones/:grupo_id', authMiddleware, async (req, res) => {
  try {
    const { grupo_id } = req.params;

    const sql = `
      SELECT 
        i.id AS inscripcion_id, 
        i.estado_curso, 
        i.creado_en AS fecha_inscripcion,
        CONCAT(a.nombre, ' ', a.apellido) AS alumno_nombre,
        a.documento_identidad AS alumno_ci,
        CONCAT(t1.nombre, ' ', t1.apellido) AS tutor1_nombre,
        CONCAT(t2.nombre, ' ', t2.apellido) AS tutor2_nombre
      FROM inscripciones_cursos i
      JOIN feligreses a ON i.feligres_id = a.id
      LEFT JOIN feligreses t1 ON i.tutor_principal_id = t1.id
      LEFT JOIN feligreses t2 ON i.tutor_secundario_id = t2.id
      WHERE i.grupo_id = ? AND i.activo = 1
      ORDER BY a.apellido ASC
    `;

    const [inscritos] = await db.execute(sql, [grupo_id]);
    res.json(inscritos);
  } catch (error) {
    console.error("Error al obtener inscritos:", error);
    res.status(500).json({ message: "Error al obtener la lista de inscritos." });
  }
});

// ==========================================
// 8. OBTENER LISTA DE ASISTENCIA (O PLANILLA VACÍA)
// ==========================================
router.get('/asistencia/:grupo_id', authMiddleware, async (req, res) => {
  try {
    const { grupo_id } = req.params;
    const { fecha_clase, tipo_sesion } = req.query;

    if (!fecha_clase || !tipo_sesion) {
      return res.status(400).json({ message: "Faltan parámetros de fecha o tipo de sesión." });
    }

    // Esta consulta mágica une a los inscritos con su asistencia de ESE día específico.
    // Si no hay asistencia ese día, los campos de "control_asistencias" devolverán NULL
    const sql = `
      SELECT 
        i.id AS inscripcion_id,
        CONCAT(a.nombre, ' ', a.apellido) AS alumno_nombre,
        CONCAT(t.nombre, ' ', t.apellido) AS tutor_nombre,
        c.id AS asistencia_id,
        c.estado_asistencia,
        c.observacion
      FROM inscripciones_cursos i
      JOIN feligreses a ON i.feligres_id = a.id
      LEFT JOIN feligreses t ON i.tutor_principal_id = t.id
      LEFT JOIN control_asistencias c 
        ON i.id = c.inscripcion_id 
        AND c.fecha_clase = ? 
        AND c.tipo_sesion = ?
      WHERE i.grupo_id = ? AND i.activo = 1
      ORDER BY a.apellido ASC
    `;

    const [planilla] = await db.execute(sql, [fecha_clase, tipo_sesion, grupo_id]);
    
    // Mapeamos para que, si no hay registro previo, por defecto todos estén "Presente"
    const planillaFormateada = planilla.map(row => ({
      ...row,
      estado_asistencia: row.estado_asistencia || 'Presente',
      observacion: row.observacion || ''
    }));

    res.json(planillaFormateada);
  } catch (error) {
    console.error("Error al obtener planilla:", error);
    res.status(500).json({ message: "Error al cargar la planilla de asistencia." });
  }
});

// ==========================================
// 9. GUARDAR O ACTUALIZAR ASISTENCIA EN LOTE
// ==========================================
router.post('/asistencia', authMiddleware, async (req, res) => {
  try {
    // asistencias es un array de objetos: [{ inscripcion_id, asistencia_id, estado_asistencia, observacion }]
    const { fecha_clase, tipo_sesion, asistencias } = req.body;
    const usuario = req.user.username;

    // Usamos una transacción para asegurar que todos se guarden o ninguno
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      for (const reg of asistencias) {
        if (reg.asistencia_id) {
          // Ya existía, lo actualizamos
          await connection.execute(
            "UPDATE control_asistencias SET estado_asistencia = ?, observacion = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?",
            [reg.estado_asistencia, reg.observacion, reg.asistencia_id]
          );
        } else {
          // Es la primera vez que se toma lista a este alumno en este día
          await connection.execute(
            "INSERT INTO control_asistencias (inscripcion_id, fecha_clase, tipo_sesion, estado_asistencia, observacion, creado_por) VALUES (?, ?, ?, ?, ?, ?)",
            [reg.inscripcion_id, fecha_clase, tipo_sesion, reg.estado_asistencia, reg.observacion, usuario]
          );
        }
      }
      await connection.commit();
      res.json({ message: "✅ Asistencia guardada correctamente." });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error("Error al guardar asistencia:", error);
    res.status(500).json({ message: "Error al guardar los registros de asistencia." });
  }
});