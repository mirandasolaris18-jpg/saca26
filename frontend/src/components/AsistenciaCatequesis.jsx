import React, { useState, useEffect } from "react";
import { fetchGrupos, fetchPlanillaAsistencia, saveAsistencia } from "../services/catequesisService";

export default function AsistenciaCatequesis({ onVolver }) {
  const [grupos, setGrupos] = useState([]);
  const [cargando, setCargando] = useState(false);
  
  // Controles de búsqueda
  const [filtro, setFiltro] = useState({
    grupo_id: "",
    fecha_clase: new Date().toISOString().split('T')[0], // Fecha de hoy por defecto
    tipo_sesion: "Sesión Alumno"
  });

  const [planilla, setPlanilla] = useState([]);

  useEffect(() => {
    fetchGrupos().then(setGrupos).catch(console.error);
  }, []);

  const handleCargarPlanilla = async (e) => {
    e.preventDefault();
    if (!filtro.grupo_id) return alert("Selecciona un grupo primero");

    setCargando(true);
    try {
      const data = await fetchPlanillaAsistencia(filtro.grupo_id, filtro.fecha_clase, filtro.tipo_sesion);
      setPlanilla(data);
      if(data.length === 0) alert("Este grupo no tiene alumnos inscritos.");
    } catch (error) {
      alert("Error al cargar la planilla.");
    } finally {
      setCargando(false);
    }
  };

  // Actualiza el estado de un alumno en la tabla interactiva
  const handleEstadoChange = (inscripcion_id, campo, valor) => {
    const nuevaPlanilla = planilla.map(row => {
      if (row.inscripcion_id === inscripcion_id) {
        return { ...row, [campo]: valor };
      }
      return row;
    });
    setPlanilla(nuevaPlanilla);
  };

  const handleGuardar = async () => {
    if (planilla.length === 0) return;
    
    try {
      setCargando(true);
      const payload = {
        fecha_clase: filtro.fecha_clase,
        tipo_sesion: filtro.tipo_sesion,
        asistencias: planilla
      };
      await saveAsistencia(payload);
      alert("✅ Planilla guardada exitosamente.");
    } catch (error) {
      alert(`❌ ${error.message}`);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <button onClick={onVolver} className="text-sm text-emerald-700 font-semibold hover:underline">← Volver al Panel</button>
          <h2 className="text-2xl font-bold text-emerald-800 mt-1 flex items-center gap-2">
            <span className="text-3xl">✅</span> Control de Asistencia
          </h2>
        </div>
      </div>

      {/* Barra de Filtros para generar la Planilla */}
      <form onSubmit={handleCargarPlanilla} className="bg-gray-50 p-5 rounded-lg border border-gray-200 mb-6 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[250px]">
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Grupo / Curso *</label>
          <select 
            required 
            className="w-full px-3 py-2 border rounded focus:ring-1 focus:ring-emerald-500 outline-none text-sm bg-white"
            value={filtro.grupo_id}
            onChange={(e) => setFiltro({...filtro, grupo_id: e.target.value})}
          >
            <option value="">-- Seleccionar Grupo --</option>
            {grupos.map(g => (
              <option key={g.id} value={g.id}>{g.gestion} - {g.nombre_grupo} ({g.catequista_nombre})</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Fecha de la Sesión *</label>
          <input 
            type="date" 
            required
            className="w-full px-3 py-2 border rounded outline-none text-sm"
            value={filtro.fecha_clase}
            onChange={(e) => setFiltro({...filtro, fecha_clase: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tipo de Reunión *</label>
          <select 
            className="w-full px-3 py-2 border rounded outline-none text-sm bg-white"
            value={filtro.tipo_sesion}
            onChange={(e) => setFiltro({...filtro, tipo_sesion: e.target.value})}
          >
            <option value="Sesión Alumno">Sesión de Niños/Jóvenes</option>
            <option value="Sesión Padre">Sesión de Padres/Tutores</option>
          </select>
        </div>

        <button type="submit" className="px-5 py-2 bg-gray-800 text-white font-bold rounded shadow hover:bg-gray-900 transition-colors">
          Cargar Lista
        </button>
      </form>

      {/* Planilla Interactiva */}
      {planilla.length > 0 && (
        <div className="border border-emerald-200 rounded-lg overflow-hidden">
          <div className="bg-emerald-600 text-white px-4 py-3 flex justify-between items-center">
            <h3 className="font-bold tracking-wide">Pase de Lista: {filtro.fecha_clase}</h3>
            <span className="text-sm bg-emerald-800 px-3 py-1 rounded-full">{planilla.length} inscritos</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse bg-white">
              <thead>
                <tr className="bg-gray-100 text-gray-600 text-xs uppercase border-b border-gray-200">
                  <th className="p-3 w-10 text-center">Nº</th>
                  <th className="p-3">Nombre ({filtro.tipo_sesion === 'Sesión Alumno' ? 'Alumno' : 'Tutor'})</th>
                  <th className="p-3 text-center min-w-[260px]">Estado de Asistencia</th>
                  <th className="p-3">Observación (Opcional)</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100">
                {planilla.map((row, index) => (
                  <tr key={row.inscripcion_id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="p-3 text-center font-mono text-gray-400">{index + 1}</td>
                    <td className="p-3 font-bold text-gray-800 uppercase">
                      {filtro.tipo_sesion === 'Sesión Alumno' ? row.alumno_nombre : (row.tutor_nombre || 'Sin tutor asignado')}
                    </td>
                    <td className="p-3 text-center">
                      <div className="inline-flex rounded-md shadow-sm" role="group">
                        <button
                          type="button"
                          onClick={() => handleEstadoChange(row.inscripcion_id, 'estado_asistencia', 'Presente')}
                          className={`px-3 py-1 text-xs font-bold rounded-l-lg border ${row.estado_asistencia === 'Presente' ? 'bg-green-500 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-green-50'}`}
                        >
                          Presente
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEstadoChange(row.inscripcion_id, 'estado_asistencia', 'Ausente')}
                          className={`px-3 py-1 text-xs font-bold border-t border-b ${row.estado_asistencia === 'Ausente' ? 'bg-red-500 text-white border-red-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-red-50'}`}
                        >
                          Ausente
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEstadoChange(row.inscripcion_id, 'estado_asistencia', 'Licencia')}
                          className={`px-3 py-1 text-xs font-bold rounded-r-lg border ${row.estado_asistencia === 'Licencia' ? 'bg-yellow-400 text-gray-900 border-yellow-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-yellow-50'}`}
                        >
                          Licencia
                        </button>
                      </div>
                    </td>
                    <td className="p-3">
                      <input 
                        type="text" 
                        placeholder="Motivo de falta, atraso..."
                        value={row.observacion}
                        onChange={(e) => handleEstadoChange(row.inscripcion_id, 'observacion', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-200 rounded outline-none focus:border-emerald-400"
                        disabled={row.estado_asistencia === 'Presente' && !row.observacion} // Sugerencia de UX
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-end">
            <button 
              onClick={handleGuardar}
              disabled={cargando}
              className={`px-6 py-2 text-white font-bold rounded-lg shadow transition-colors ${cargando ? 'bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}
            >
              {cargando ? 'Guardando...' : '💾 Guardar Asistencia'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}