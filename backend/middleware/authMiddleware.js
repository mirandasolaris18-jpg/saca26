// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.header('Authorization');
    console.log("Header recibido:", authHeader); // Para ver en tu consola si llega el token

    if (!authHeader) return res.status(401).json({ message: "Token no proporcionado" });

    try {
        const token = authHeader.split(' ')[1];
        // 🛠️ CORREGIDO: Ahora usa JWT_SECRET, igual que en el login
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        console.log("Error detallado del JWT:", err.message);
        res.status(403).json({ message: "Token inválido o expirado" });
    }
};