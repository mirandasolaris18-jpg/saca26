// routes/reportes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const db = require('../db');

router.get('/resumen', authMiddleware, async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const { nivel_jerarquico, parroquia_id } = req.user;

    let filtroSacramentos = " WHERE activo = 1";
    let paramsSacramentos = [];

    // Filtro por parroquia si el usuario es de nivel 3 (Secretaria/Usuario Normal)
    if (nivel_jerarquico === 3) {
      filtroSacramentos += " AND parroquia_id = ?";
      paramsSacramentos.push(parroquia_id);
    }

    // Filtro por fechas
    if (fecha_inicio && fecha_fin) {
      filtroSacramentos += " AND DATE(creado_en) BETWEEN ? AND ?";
      paramsSacramentos.push(fecha_inicio, fecha_fin);
    }

    // Consultas para obtener los conteos
    const queryBautizos = `SELECT COUNT(*) AS total FROM bautizos ${filtroSacramentos}`;
    const queryConfirmaciones = `SELECT COUNT(*) AS total FROM confirmaciones ${filtroSacramentos}`;
    const queryMatrimonios = `SELECT COUNT(*) AS total FROM matrimonios ${filtroSacramentos}`;
    
    // Los feligreses son globales, pero podemos filtrarlos por fecha de registro
    let filtroFeligreses = " WHERE activo = 1";
    let paramsFeligreses = [];
    if (fecha_inicio && fecha_fin) {
      filtroFeligreses += " AND DATE(creado_en) BETWEEN ? AND ?";
      paramsFeligreses.push(fecha_inicio, fecha_fin);
    }
    const queryFeligreses = `SELECT COUNT(*) AS total FROM feligreses ${filtroFeligreses}`;

    // Ejecutar todas las consultas en paralelo para mayor velocidad
    const [
      [resBautizos], [resConfirmaciones], [resMatrimonios], [resFeligreses]
    ] = await Promise.all([
      db.execute(queryBautizos, paramsSacramentos),
      db.execute(queryConfirmaciones, paramsSacramentos),
      db.execute(queryMatrimonios, paramsSacramentos),
      db.execute(queryFeligreses, paramsFeligreses)
    ]);

    // Devolver el objeto con los totales
    res.json({
      bautizos: resBautizos[0].total,
      confirmaciones: resConfirmaciones[0].total,
      matrimonios: resMatrimonios[0].total,
      feligreses: resFeligreses[0].total
    });

  } catch (error) {
    console.error("Error al generar el reporte:", error);
    res.status(500).json({ message: "Error interno al generar las estadísticas." });
  }
});

module.exports = router;