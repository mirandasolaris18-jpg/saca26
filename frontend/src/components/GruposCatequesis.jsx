import React, { useState, useEffect } from "react";
import { fetchGrupos, fetchPeriodos, fetchCatequistas, createGrupo } from "../services/catequesisService";

export default function GruposCatequesis({ onVolver }) {
  const [grupos, setGrupos] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [catequistas, setCatequistas] = useState([]);
  
  const [mostrarModal, setMostrarModal] = useState(false);
  const [cargando, setCargando] = useState(false);

  const [form, setForm] = useState({
    periodo_id: "",
    nombre_grupo: "",
    catequista_id: "",
    dia_reunion_ninos: "",
    hora_inicio_ninos: "",
    hora_fin_ninos: "",
    dia_reunion_padres: "",
    hora_inicio_padres: "",
    hora_fin_padres: ""
  });

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [listaGrupos, listaPeriodos, listaCatequistas] = await Promise.all([
        fetchGrupos(),
        fetchPeriodos(),
        fetchCatequistas()
      ]);
      setGrupos(listaGrupos);
      setPeriodos(listaPeriodos);
      setCatequistas(listaCatequistas);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.hora_inicio_ninos >= form.hora_fin_ninos) {
      return alert("⚠️ La hora de fin debe ser mayor a la hora de inicio.");
    }

    try {
      await createGrupo(form);
      alert("✅ Grupo de catequesis creado exitosamente.");
      setMostrarModal(false);
      setForm({
        periodo_id: "", nombre_grupo: "", catequista_id: "",
        dia_reunion_ninos: "", hora_inicio_ninos: "", hora_fin_ninos: "",
        dia_reunion_padres: "", hora_inicio_padres: "", hora_fin_padres: ""
      });
      cargarDatos();
    } catch (error) {
      // Aquí saltará la alerta si el backend detecta el CRUCE DE HORARIOS
      alert(`${error.message}`);
    }
  };

  const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <button onClick={onVolver} className="text-sm text-emerald-700 font-semibold hover:underline">← Volver al Panel</button>
          <h2 className="text-2xl font-bold text-emerald-800 mt-1 flex items-center gap-2">
            <span className="text-3xl">⛪</span> Grupos y Horarios
          </h2>
        </div>
        <button 
          onClick={() => setMostrarModal(true)} 
          className="px-4 py-2 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 shadow-sm"
        >
          + Aperturar Nuevo Grupo
        </button>
      </div>

      {/* Tabla de Grupos Activos */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-emerald-50 text-emerald-800 text-sm border-b border-emerald-200">
              <th className="p-3">Gestión / Sacramento</th>
              <th className="p-3">Nombre del Grupo</th>
              <th className="p-3">Catequista Asignado</th>
              <th className="p-3">Horario (Niños/Jóvenes)</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
            {cargando ? (
              <tr><td colSpan="5" className="p-6 text-center text-emerald-600 font-bold animate-pulse">Cargando grupos...</td></tr>
            ) : grupos.length > 0 ? (
              grupos.map((g) => (
                <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-3 font-semibold">{g.gestion} - {g.tipo_sacramento}</td>
                  <td className="p-3 font-bold text-blue-900">{g.nombre_grupo}</td>
                  <td className="p-3 uppercase">{g.catequista_nombre}</td>
                  <td className="p-3">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold mr-2">{g.dia_reunion_ninos}</span>
                    {g.hora_inicio_ninos.slice(0,5)} a {g.hora_fin_ninos.slice(0,5)}
                  </td>
                  <td className="p-3 text-center">
                    <button className="text-emerald-600 font-semibold hover:underline">Ver Inscritos</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" className="p-6 text-center text-gray-500 italic">No hay grupos aperturados aún.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal para Crear Grupo */}
      {mostrarModal && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/60 flex justify-center items-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 relative my-auto">
            <button onClick={() => setMostrarModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl font-bold">×</button>
            <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Configurar Grupo de Catequesis</h3>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Periodo (Gestión) *</label>
                  <select name="periodo_id" required value={form.periodo_id} onChange={handleChange} className="w-full px-3 py-2 border rounded focus:ring-1 focus:ring-emerald-500 outline-none text-sm bg-white">
                    <option value="">-- Seleccionar Periodo --</option>
                    {periodos.map(p => <option key={p.id} value={p.id}>{p.gestion} - {p.tipo_sacramento}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Catequista Guía *</label>
                  <select name="catequista_id" required value={form.catequista_id} onChange={handleChange} className="w-full px-3 py-2 border rounded focus:ring-1 focus:ring-emerald-500 outline-none text-sm bg-white">
                    <option value="">-- Seleccionar Catequista --</option>
                    {catequistas.map(c => <option key={c.catequista_id} value={c.catequista_id}>{c.nombre} {c.apellido}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nombre Identificador del Grupo *</label>
                <input type="text" name="nombre_grupo" placeholder="Ej: Grupo San Juan Bautista" required value={form.nombre_grupo} onChange={handleChange} className="w-full px-3 py-2 border rounded focus:ring-1 focus:ring-emerald-500 outline-none text-sm" />
              </div>

              {/* Horarios Alumnos */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h4 className="font-bold text-blue-800 text-sm mb-3">Horario de Clases (Niños/Jóvenes)</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Día *</label>
                    <select name="dia_reunion_ninos" required value={form.dia_reunion_ninos} onChange={handleChange} className="w-full px-3 py-2 border rounded outline-none text-sm">
                      <option value="">Seleccionar...</option>
                      {diasSemana.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Hora Inicio *</label>
                    <input type="time" name="hora_inicio_ninos" required value={form.hora_inicio_ninos} onChange={handleChange} className="w-full px-3 py-2 border rounded outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Hora Fin *</label>
                    <input type="time" name="hora_fin_ninos" required value={form.hora_fin_ninos} onChange={handleChange} className="w-full px-3 py-2 border rounded outline-none text-sm" />
                  </div>
                </div>
              </div>

              {/* Horarios Padres */}
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                <h4 className="font-bold text-orange-800 text-sm mb-3">Horario de Reunión (Padres / Tutores) - Opcional</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Día</label>
                    <select name="dia_reunion_padres" value={form.dia_reunion_padres} onChange={handleChange} className="w-full px-3 py-2 border rounded outline-none text-sm">
                      <option value="">No aplica...</option>
                      {diasSemana.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Hora Inicio</label>
                    <input type="time" name="hora_inicio_padres" value={form.hora_inicio_padres} onChange={handleChange} className="w-full px-3 py-2 border rounded outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Hora Fin</label>
                    <input type="time" name="hora_fin_padres" value={form.hora_fin_padres} onChange={handleChange} className="w-full px-3 py-2 border rounded outline-none text-sm" />
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setMostrarModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-300">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800">Guardar Grupo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}