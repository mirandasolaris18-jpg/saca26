require('dotenv').config(); 
const express = require('express');
const cors = require('cors');

// 1. Importar todas las rutas
const authRoutes = require('./routes/auth');          
const feligresesRoutes = require('./routes/feligreses'); 
const bautizosRoutes = require('./routes/bautizos');    
const confirmacionesRoutes = require('./routes/confirmaciones');
const matrimoniosRoutes = require('./routes/matrimonios');
const reportesRoutes = require('./routes/reportes');
const expedientesRoutes = require('./routes/expedientes'); 

const app = express();

// 2. Middlewares globales (¡MUY IMPORTANTE: SIEMPRE ANTES DE LAS RUTAS!)
app.use(cors());              
app.use(express.json());      

// Logger para ver qué pasa en la consola
app.use((req, res, next) => {
  console.log(`Petición recibida: ${req.method} ${req.url}`);
  next();
});

// 3. Rutas públicas
app.use('/api/auth', authRoutes); 

// 4. Rutas protegidas (Requieren Token)
app.use('/api/feligreses', feligresesRoutes); 
app.use('/api/bautizos', bautizosRoutes);     
app.use('/api/confirmaciones', confirmacionesRoutes);
app.use('/api/matrimonios', matrimoniosRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/expedientes', expedientesRoutes); // 👈 LOS INTERVINIENTES VIVEN AQUÍ ADENTRO

// 5. Encender el Servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});