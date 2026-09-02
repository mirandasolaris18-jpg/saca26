import React, { useState } from 'react';

// --- IMPORTACIONES DE MÓDULOS ---
import Feligreses from './Feligreses';   
import Bautizos from './Bautizos';
import Confirmaciones from './Confirmaciones'; 
// Importamos AperturaExpediente que ahora gestionará TODO el flujo de matrimonios
import AperturaExpediente from './AperturaExpediente';
import Catequistas from './Catequistas';
import Reportes from './Reportes'; 
// Rescatamos el componente huérfano
import AsistenciaCatequesis from './AsistenciaCatequesis';

export default function Dashboard({ user }) {
  const [vista, setVista] = useState('inicio'); 
  const [menusAbiertos, setMenusAbiertos] = useState({});

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload(); 
  };

  const toggleMenu = (id) => {
    setMenusAbiertos(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // =========================================================================
  // 📚 ESTRUCTURA DEL MENÚ LATERAL (SIDEBAR) ACTUALIZADO
  // =========================================================================
  const menuEstructura = [
    { id: 'feligreses', titulo: '1. Feligreses', icono: '👥' },
    { 
      id: 'menu_sacramentos', titulo: '2. Sacramentos', icono: '🕊️',
      hijos: [
        { id: 'bautizos', titulo: '2.1 Bautizos' },
        { id: 'confirmaciones', titulo: '2.2 Confirmaciones' },
        // FLUJO 1: Matrimonios simplificado. Sin submenús.
        { id: 'apertura_expediente', titulo: '2.3 Matrimonios' }
      ]
    },
    {
      id: 'menu_catequistas', titulo: '3. Catequistas', icono: '👨‍🏫',
      hijos: [
        { id: 'catequistas', titulo: '3.1 Registro de catequistas' },
        { id: 'imprimir_catequistas', titulo: '3.2 Imprimir certificado' }
      ]
    },
    {
      id: 'menu_catequesis', titulo: '4. Catequesis', icono: '📖',
      hijos: [
        {
          id: 'menu_primera_comunion', titulo: '4.1 Primera Comunión',
          hijos: [
            { id: 'inscripciones_comunion', titulo: '4.1.1 Inscripciones' },
            { id: 'grupos_comunion', titulo: '4.1.2 Asignación de grupos' },
            { id: 'asig_catequistas_comunion', titulo: '4.1.3 Asignación de catequistas' },
            { id: 'asistencia_ninos_comunion', titulo: '4.1.4 Asistencia niños' },
            { id: 'asistencia_papas_comunion', titulo: '4.1.5 Asistencia papás' },
            { id: 'asistencia_general_comunion', titulo: '4.1.6 Asistencia general' },
            { id: 'imprimir_comunion', titulo: '4.1.7 Imprimir constancia' }
          ]
        },
        {
          id: 'menu_confirmacion_curso', titulo: '4.2 Confirmación',
          hijos: [
            { id: 'inscripciones_conf', titulo: '4.2.1 Inscripciones' },
            { id: 'grupos_conf', titulo: '4.2.2 Asignación de grupos' },
            { id: 'asig_catequistas_conf', titulo: '4.2.3 Asignación de catequistas' },
            { id: 'asistencia_general_conf', titulo: '4.2.4 Asistencia general' },
            { id: 'registrar_conf', titulo: '4.2.5 Registrar sacramento' }
          ]
        }
      ]
    },
    {
      id: 'menu_musicos', titulo: '5. Músicos', icono: '🎸',
      hijos: [
        { id: 'registro_musicos', titulo: '5.1 Registro de músicos' },
        { id: 'imprimir_musicos', titulo: '5.2 Imprimir certificado' }
      ]
    },
    {
      id: 'menu_monaguillos', titulo: '6. Monaguillos', icono: '🔔',
      hijos: [
        { id: 'registro_monaguillos', titulo: '6.1 Registro de monaguillos' },
        { id: 'imprimir_monaguillos', titulo: '6.2 Imprimir certificado' }
      ]
    },
    {
      id: 'menu_reimpresion', titulo: '7. Reimpresiones', icono: '🖨️',
      hijos: [
        { id: 'reimpresion_bautizo', titulo: '7.1 Certificado de Bautizo' },
        { id: 'reimpresion_confirmacion', titulo: '7.2 Certificado de Confirmación' },
        { id: 'reimpresion_matrimonio', titulo: '7.3 Certificado de Matrimonio' },
        { id: 'reimpresion_acta_matrimonio', titulo: '7.4 Acta de Matrimonio' }
      ]
    },
    { id: 'acerca_de', titulo: '8. Acerca de...', icono: 'ℹ️' },
    {
      id: 'menu_analitica', titulo: '9. Análisis de Datos (BI)', icono: '📈',
      hijos: [
        { id: 'dashboard_gerencial', titulo: '9.1 Panel Gerencial (Resumen)' },
        { id: 'analisis_sacramentos', titulo: '9.2 Tendencias Sacramentales' },
        { id: 'analisis_catequesis', titulo: '9.3 Rendimiento de Catequesis' },
        { id: 'analisis_demografico', titulo: '9.4 Demografía y Comunidad' },
        { id: 'analisis_administrativo', titulo: '9.5 Carga Administrativa' }
      ]
    }
  ];

  // =========================================================================
  // 🖥️ RENDERIZADOR DEL MENÚ RECURSIVO
  // =========================================================================
  const renderizarMenu = (items, nivel = 0) => {
    return items.map((item) => {
      const tieneHijos = item.hijos && item.hijos.length > 0;
      const estaAbierto = menusAbiertos[item.id];
      const estaActivo = vista === item.id;

      return (
        <div key={item.id} className="w-full">
          <div 
            onClick={() => tieneHijos ? toggleMenu(item.id) : setVista(item.id)}
            className={`flex items-center justify-between cursor-pointer px-4 py-2 text-sm select-none transition-colors
              ${nivel === 0 ? 'mt-1 font-semibold text-emerald-100 hover:bg-emerald-800' : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'}
              ${estaActivo && !tieneHijos ? 'bg-emerald-700 text-white border-l-4 border-amber-400' : 'border-l-4 border-transparent'}
            `}
            style={{ paddingLeft: `${(nivel * 1) + 1}rem` }}
          >
            <div className="flex items-center gap-2 truncate">
              {item.icono && <span>{item.icono}</span>}
              <span className="truncate">{item.titulo}</span>
            </div>
            {tieneHijos && (
              <span className="text-xs transition-transform duration-200" style={{ transform: estaAbierto ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
            )}
          </div>
          
          {/* Renderizar Hijos si está desplegado */}
          {tieneHijos && estaAbierto && (
            <div className="bg-emerald-900/40 py-1">
              {renderizarMenu(item.hijos, nivel + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  // =========================================================================
  // 📺 RENDERIZADOR DEL CONTENIDO PRINCIPAL
  // =========================================================================
  const ComponenteEnConstruccion = ({ nombre }) => (
    <div className="flex flex-col items-center justify-center h-full text-gray-400 mt-20 animate-fade-in">
      <div className="text-6xl mb-4">🚧</div>
      <h2 className="text-2xl font-bold text-gray-700 mb-2">Módulo en Desarrollo</h2>
      <p>La vista para <strong>{nombre}</strong> se programará en el próximo paso.</p>
    </div>
  );

  const renderizarVista = () => {
    switch(vista) {
      case 'inicio': 
        return (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-emerald-100 text-center animate-fade-in">
            <h2 className="text-3xl font-bold text-emerald-800 mb-4">Bienvenido al Sistema Parroquial</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Utiliza el menú lateral izquierdo para navegar entre los diferentes módulos de administración. 
              Puedes expandir las categorías para encontrar funciones específicas de catequesis, sacramentos y reportes.
            </p>
          </div>
        );
      case 'feligreses': return <Feligreses onVolver={() => setVista('inicio')} />;
      case 'bautizos': return <Bautizos onVolver={() => setVista('inicio')} />;
      case 'confirmaciones': return <Confirmaciones onVolver={() => setVista('inicio')} />;
      
      // Conectamos el Expediente a Matrimonios y pasamos el usuario
      case 'apertura_expediente': return <AperturaExpediente onVolver={() => setVista('inicio')} user={user} />;
      
      case 'catequistas': return <Catequistas onVolver={() => setVista('inicio')} />;
      case 'reportes': return <Reportes onVolver={() => setVista('inicio')} />;
      
      // Conectamos Asistencia de Catequesis
      case 'asistencia_ninos_comunion':
      case 'asistencia_papas_comunion':
      case 'asistencia_general_comunion':
      case 'asistencia_general_conf':
        return <AsistenciaCatequesis onVolver={() => setVista('inicio')} />;
      
      default:
        const tituloMenu = menuEstructura.flatMap(m => m.hijos ? [m, ...m.hijos.flatMap(h => h.hijos ? [h, ...h.hijos] : h)] : m).find(x => x.id === vista)?.titulo || vista;
        return <ComponenteEnConstruccion nombre={tituloMenu} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-800 overflow-hidden">
      
      {/* ================= BARRA LATERAL (SIDEBAR) ================= */}
      <aside className="w-72 bg-emerald-900 text-white flex flex-col shadow-xl z-20 flex-shrink-0 transition-all">
        {/* Cabecera del Sidebar */}
        <div className="px-6 py-5 border-b border-emerald-800 flex items-center gap-3">
          <span className="text-3xl">⛪</span>
          <div>
            <h1 className="text-lg font-bold tracking-tight leading-tight">Sistema<br/>Sacramentos</h1>
          </div>
        </div>

        {/* Menú Scrollable */}
        <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          {renderizarMenu(menuEstructura)}
        </nav>

        {/* Pie del Sidebar (Usuario) */}
        <div className="p-4 border-t border-emerald-800 bg-emerald-950">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center font-bold">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{user?.nombre_completo || user?.username}</p>
              <p className="text-xs text-emerald-400 truncate">{user?.parroquia_nombre || 'Diócesis Central'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="w-full py-2 bg-red-500/20 text-red-200 rounded text-xs font-bold hover:bg-red-500 hover:text-white transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ================= CONTENIDO PRINCIPAL ================= */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-gray-50/50">
        <div className="flex-1 overflow-y-auto p-8">
          {renderizarVista()}
        </div>
      </main>

    </div>
  );
}