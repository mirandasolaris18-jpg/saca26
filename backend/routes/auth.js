// routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../db'); 

// Controlador de login convertido en ruta POST
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // 🛠️ MODIFICADO: Ahora traemos también el nivel jerárquico desde la tabla de roles
    const sqlLogin = `
      SELECT u.*, r.nivel_jerarquico, p.nombre AS parroquia_nombre 
      FROM usuarios u 
      LEFT JOIN roles r ON u.rol_id = r.id 
      LEFT JOIN parroquias p ON u.parroquia_id = p.id
      WHERE u.username = ? AND u.activo = 1
    `;
    const [rows] = await db.query(sqlLogin, [username]);
    
    if (rows.length === 0) {
      return res.status(401).json({ message: '❌ Usuario no encontrado o inactivo' });
    }

    const usuario = rows[0];

    // Validar contraseña
    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) {
      return res.status(401).json({ message: '❌ Contraseña incorrecta' });
    }

    // 🛠️ MODIFICADO: Generar token JWT con los nuevos datos de jerarquía y parroquia
    const token = jwt.sign(
      { 
        id: usuario.id, 
        rol_id: usuario.rol_id,
        nombre: usuario.username,                  // Para la auditoría (quien creó el registro)
        parroquia_id: usuario.parroquia_id,        // Para el autollenado de sacramentos
        nivel_jerarquico: usuario.nivel_jerarquico // Para los permisos de reportes y listados
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '8h' } // 🛠️ Aumentado a 8 horas para cubrir la jornada laboral
    );

    // Responder con token y datos del usuario al Frontend
    res.json({
      token,
      nombre_completo: usuario.nombre_completo,
      cargo: usuario.cargo,
      id: usuario.id,
      parroquia_id: usuario.parroquia_id,
      nivel_jerarquico: usuario.nivel_jerarquico,
      parroquia_nombre: usuario.parroquia_nombre // 🛠️ Añadimos el nombre aquí
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: '❌ Error interno del servidor' });
  }
});

module.exports = router;