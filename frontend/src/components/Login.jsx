import React, { useState } from 'react';

export default function Login({ onLoginSuccess }) {
  const [darkMode, setDarkMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      // 🔍 DIAGNÓSTICO: Esto te mostrará en la consola del navegador exactamente qué responde tu backend
      console.log("Respuesta completa del Backend al iniciar sesión:", data);

      if (!response.ok) {
        alert(`❌ Error: ${data.message || 'Credenciales incorrectas'}`);
        return;
      }

      // 🚨 VALIDACIÓN CRÍTICA: Verificar si el backend realmente envió la propiedad "token"
      // A veces el backend lo envía con otro nombre como 'accessToken', 'jwt' o dentro de 'data.user.token'
      if (!data.token) {
        console.error("🚨 Error de estructura: El backend respondió con éxito pero NO incluyó la propiedad 'token'. Revisa la consola para ver qué llegó.");
        alert("❌ Error interno: El servidor no envió un token de acceso válido. Avisa al administrador.");
        return;
      }

      // Si pasa la validación, guardamos con total seguridad
      alert(`🎉 ¡Bienvenido de nuevo, ${data.nombre_completo || username}!`);

      // Guardar el token JWT en localStorage
      localStorage.setItem('token', data.token);

      // Guardar también los datos del usuario
      localStorage.setItem('usuario', JSON.stringify(data));

      // Notificamos al App.jsx
      if (onLoginSuccess) {
        onLoginSuccess(data);
      }

    } catch (error) {
      console.error('Error de conexión:', error);
      alert('❌ No se pudo conectar con el servidor. ¿Está encendido el Backend?');
    }
  };

  return (
    <div className={`min-h-screen flex flex-col justify-center items-center transition-colors duration-300 ${
      darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'
    }`}>
      
      <button 
        onClick={() => setDarkMode(!darkMode)}
        className="absolute top-5 right-5 p-2 rounded-full border transition-all hover:scale-110 shadow-md bg-white dark:bg-gray-800 cursor-pointer"
        title="Cambiar tema"
      >
        {darkMode ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}
      </button>

      <div className={`w-full max-w-md p-8 rounded-2xl shadow-2xl border transition-all duration-300 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        
        <div className="flex justify-center mb-4">
          <img 
            src="logo.png" 
            alt="Logo Parroquia" 
            className="h-24 w-auto object-contain drop-shadow-md"
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/100?text=⛪"; 
            }}
          />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-2">
            Bienvenido al sistema de sacramentos
          </h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Por favor, introduce tus credenciales de acceso
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
              Usuario o Correo
            </label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ej: secretaria_maria"
              className={`w-full px-4 py-3 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-amber-500 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
              }`}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
              Contraseña
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full px-4 py-3 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-amber-500 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
              }`}
              required
            />
          </div>

          <button 
            type="submit"
            className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl shadow-lg transition-all transform active:scale-95 mt-2 cursor-pointer"
          >
            Iniciar Sesión
          </button>
        </form>
      </div>

      <footer className="mt-8 text-xs text-gray-400">
        &copy; 2026 Diócesis de Oruro. Todos los derechos reservados.
      </footer>
    </div>
  );
}