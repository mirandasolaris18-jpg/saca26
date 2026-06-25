import React, { useState } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  // 1. Buscamos si ya hay un usuario guardado al recargar la página
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('usuario');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // 2. Definimos qué pantalla mostrar (login o dashboard)
  const [screen, setScreen] = useState(() => {
    const savedUser = localStorage.getItem('usuario');
    return savedUser ? 'dashboard' : 'login';
  });

  // 3. Función que se ejecuta cuando el Login es exitoso
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    // Cambiamos la pantalla al panel principal
    setScreen('dashboard'); 
  };

  return (
    <div style={{ margin: 0, padding: 0, boxSizing: 'border-box' }}>
      {/* Renderizado condicional de las pantallas */}
      {screen === 'login' && <Login onLoginSuccess={handleLoginSuccess} />}
      {screen === 'dashboard' && <Dashboard user={user} />}
    </div>
  );
}

export default App;