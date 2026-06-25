// index.js
require('dotenv').config(); 
const express = require('express');
const cors = require('cors');

// Importar rutas
const authRoutes = require('./routes/auth');          
const feligresesRoutes = require('./routes/feligreses'); 
const bautizosRoutes = require('./routes/bautizos');    
const confirmacionesRoutes = require('./routes/confirmaciones'); // 🛠️ 1. AGREGAR ESTA LÍNEA
const matrimoniosRoutes = require('./routes/matrimonios');
const reportesRoutes = require('./routes/reportes');

const app = express();

// --- Middlewares globales ---
app.use(cors());              
app.use(express.json());      

// --- Rutas públicas ---
app.use('/api/auth', authRoutes); 

// --- Rutas protegidas ---
app.use('/api/feligreses', feligresesRoutes); 
app.use('/api/bautizos', bautizosRoutes);     
app.use('/api/confirmaciones', confirmacionesRoutes); // 🛠️ 2. AGREGAR ESTA LÍNEA
app.use('/api/matrimonios', matrimoniosRoutes);
app.use('/api/reportes', reportesRoutes); //


// --- Servidor ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});