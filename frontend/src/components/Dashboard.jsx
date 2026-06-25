import React, { useState } from 'react'; 
import Feligreses from './Feligreses';   
import Bautizos from './Bautizos';
import Confirmaciones from './Confirmaciones'; 
import Matrimonios from './Matrimonios';
import Reportes from './Reportes'; // Importación del nuevo módulo

export default function Dashboard({ user }) {
  const [vista, setVista] = useState('inicio'); 

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload(); 
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
      
      {/* Barra de Navegación superior */}
      <nav className="flex justify-between items-center bg-white px-8 py-4 shadow-sm border-b border-gray-200">
        <div 
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => setVista('inicio')} 
        >
          <span className="text-3xl">⛪</span>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Sistema de Sacramentos</h1>
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <div className="text-right mr-2 border-r pr-4 border-gray-200">
              <p className="text-sm text-gray-600 font-medium">
                Hola, <span className="font-bold text-gray-900">{user.nombre_completo || user.username}</span>
              </p>
              {/* Etiqueta de la Parroquia */}
              <p className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1 border border-emerald-200">
                ⛪ {user.parroquia_nombre ? user.parroquia_nombre : 'Administración Diocesana'}
              </p>
            </div>
          )}
          <button 
            onClick={handleLogout} 
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold text-sm hover:bg-red-700 transition-colors shadow-sm cursor-pointer"
          >
            Cerrar Sesión
          </button>
        </div>
      </nav>

      {/* Contenido Principal */}
      <main className="p-8 max-w-7xl mx-auto">
        {vista === 'inicio' ? (
          <>
            {/* Encabezado de Bienvenida */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Panel de Control</h2>
              <p className="text-gray-600 mt-1">Selecciona un módulo administrativo para gestionar los registros parroquiales.</p>
            </div>

            {/* Grid de Módulos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Tarjeta 1: Feligreses */}
              <div 
                onClick={() => setVista('feligreses')} 
                className="bg-white p-6 rounded-xl shadow-xs border border-gray-200 hover:shadow-md hover:border-amber-500 transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center text-2xl group-hover:bg-amber-100 transition-colors">👥</div>
                <h3 className="text-lg font-bold text-gray-900 mt-4 mb-2 group-hover:text-amber-600 transition-colors">Feligreses</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Gestión de datos de feligreses, documentos de identidad, información de contacto y búsqueda general.
                </p>
              </div>

              {/* Tarjeta 2: Bautizos */}
              <div 
                onClick={() => setVista('bautizos')} 
                className="bg-white p-6 rounded-xl shadow-xs border border-gray-200 hover:shadow-md hover:border-blue-500 transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-2xl group-hover:bg-blue-100 transition-colors">💧</div>
                <h3 className="text-lg font-bold text-gray-900 mt-4 mb-2 group-hover:text-blue-600 transition-colors">Bautizos</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Registro de actas de bautizo, asignación de padres, padrinos, ministros y datos de libros de registro.
                </p>
              </div>

              {/* Tarjeta 3: Confirmaciones */}
              <div 
                onClick={() => setVista('confirmaciones')} 
                className="bg-white p-6 rounded-xl shadow-xs border border-gray-200 hover:shadow-md hover:border-red-500 transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center text-2xl group-hover:bg-red-100 transition-colors">🔥</div>
                <h3 className="text-lg font-bold text-gray-900 mt-4 mb-2 group-hover:text-red-600 transition-colors">Confirmaciones</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Administración de actas de confirmación, control de padrinos, madrinas y libros de registro canónico.
                </p>
              </div>

              {/* Tarjeta 4: Matrimonios */}
              <div 
                onClick={() => setVista('matrimonios')} 
                className="bg-white p-6 rounded-xl shadow-xs border border-gray-200 hover:shadow-md hover:border-emerald-500 transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center text-2xl group-hover:bg-emerald-100 transition-colors">💍</div>
                <h3 className="text-lg font-bold text-gray-900 mt-4 mb-2 group-hover:text-emerald-600 transition-colors">Matrimonios</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Verificación de novios, testigos, expedientes matrimoniales y actas nupciales.
                </p>
              </div>

              {/* Tarjeta 5: Reportes Estadísticos */}
              <div 
                onClick={() => setVista('reportes')} 
                className="bg-white p-6 rounded-xl shadow-xs border border-gray-200 hover:shadow-md hover:border-indigo-500 transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-2xl group-hover:bg-indigo-100 transition-colors">📊</div>
                <h3 className="text-lg font-bold text-gray-900 mt-4 mb-2 group-hover:text-indigo-600 transition-colors">Reportes y Estadísticas</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Generación de reportes periódicos, exportación de datos, control de logs y balances sacramentales.
                </p>
              </div>

            </div>
          </>
        ) : (
          /* Renderizado dinámico de los componentes */
          <>
            {vista === 'feligreses' && <Feligreses onVolver={() => setVista('inicio')} />}
            {vista === 'bautizos' && <Bautizos onVolver={() => setVista('inicio')} />}
            {vista === 'confirmaciones' && <Confirmaciones onVolver={() => setVista('inicio')} />}
            {vista === 'matrimonios' && <Matrimonios onVolver={() => setVista('inicio')} />}
            {vista === 'reportes' && <Reportes onVolver={() => setVista('inicio')} />}
          </>
        )}
      </main>
    </div>
  );
}