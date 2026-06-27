import React, { useState, useEffect } from "react";
import { fetchGrupos, fetchFeligresesParaCatequistas, createInscripcion, fetchInscritosPorGrupo } from "../services/catequesisService";

export default function InscripcionesCatequesis({ onVolver }) {
  const [grupos, setGrupos] = useState([]);
  const [feligreses, setFeligreses] = useState([]);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState("");
  const [inscritos, setInscritos] = useState([]);
  
  const [mostrarModal, setMostrarModal] = useState(false);
  const [cargando, setCargando] = useState(false);

  const [form, setForm] = useState({
    feligres_id: "",
    tutor_principal_id: "",
    tutor_secundario_id: ""
  });

  // Carga inicial de Grupos y Personas
  useEffect(() => {
    const cargarInicial = async () => {
      try {
        const listaGrupos = await fetchGrupos();
        const listaFeligreses = await fetchFeligresesParaCatequistas();
        setGrupos(listaGrupos);
        setFeligreses(Array.isArray(listaFeligreses) ? listaFeligreses : listaFeligreses.data || []);
      } catch (error) {
        console.error("Error:", error);
      }
    };
    cargarInicial();
  }, []);

  // Cargar lista de inscritos cada vez que se cambia de grupo
  useEffect(() => {
    if (grupoSeleccionado) {
      cargarInscritos(grupoSeleccionado);
    } else {
      setInscritos([]);
    }
  }, [grupoSeleccionado]);

  const cargarInscritos = async (grupoId) => {
    setCargando(true);
    try {
      const lista = await fetchInscritosPorGrupo(grupoId);
      setInscritos(lista);
    } catch (error) {
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!grupoSeleccionado) return alert("Seleccione un grupo primero.");

    try {
      await createInscripcion({ ...form, grupo_id: grupoSeleccionado });
      alert("✅ Inscripción realizada con éxito.");
      setMostrarModal(false);
      setForm({ feligres_id: "", tutor_principal_id: "", tutor_secundario_id: "" });
      cargarInscritos(grupoSeleccionado); // Recargar la tabla
    } catch (error) {
      alert(`${error.message}`);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <button onClick={onVolver} className="text-sm text-emerald-700 font-semibold hover:underline">← Volver al Panel</button>
          <h2 className="text-2xl font-bold text-emerald-800 mt-1 flex items-center gap-2">
            <span className="text-3xl">📝</span> Inscripciones a Catequesis
          </h2>
        </div>
      </div>

      {/* Selector de Grupo */}
      <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 mb-6 flex items-end gap-4">
        <div className="flex-1 max-w-md">
          <label className="block text-sm font-bold text-gray-700 uppercase mb-2">1. Seleccionar Grupo / Curso</label>
          <select 
            className="w-full px-4 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
            value={grupoSeleccionado}
            onChange={(e) => setGrupoSeleccionado(e.target.value)}
          >
            <option value="">-- Elija un grupo para gestionar --</option>
            {grupos.map(g => (
              <option key={g.id} value={g.id}>
                {g.gestion} - {g.tipo_sacramento} | {g.nombre_grupo} (Guía: {g.catequista_nombre})
              </option>
            ))}
          </select>
        </div>

        {grupoSeleccionado && (
          <button 
            onClick={() => setMostrarModal(true)}
            className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-lg shadow hover:bg-emerald-700 transition-colors"
          >
            + Inscribir Alumno
          </button>
        )}
      </div>

      {/* Tabla de Inscritos (Solo se muestra si hay un grupo seleccionado) */}
      {grupoSeleccionado && (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-emerald-50 text-emerald-900 text-sm border-b border-emerald-200">
                <th className="p-3">ID Insc.</th>
                <th className="p-3">Alumno / Catecúmeno</th>
                <th className="p-3">Tutor Principal</th>
                <th className="p-3">Tutor Secundario</th>
                <th className="p-3 text-center">Estado</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
              {cargando ? (
                <tr><td colSpan="6" className="p-6 text-center text-emerald-600 font-bold animate-pulse">Cargando lista de clase...</td></tr>
              ) : inscritos.length > 0 ? (
                inscritos.map((i) => (
                  <tr key={i.inscripcion_id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 font-mono text-xs">{i.inscripcion_id}</td>
                    <td className="p-3 font-bold text-gray-900 uppercase">{i.alumno_nombre}</td>
                    <td className="p-3">{i.tutor1_nombre || <span className="text-gray-400 italic">No asignado</span>}</td>
                    <td className="p-3">{i.tutor2_nombre || <span className="text-gray-400 italic">No asignado</span>}</td>
                    <td className="p-3 text-center">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold">
                        {i.estado_curso}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button className="text-red-500 font-semibold hover:underline" title="Dar de baja">Retirar</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className="p-6 text-center text-gray-500 italic">Este grupo aún no tiene alumnos inscritos.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Inscripción */}
      {mostrarModal && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/60 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 relative">
            <button onClick={() => setMostrarModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl font-bold">×</button>
            <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Formulario de Inscripción</h3>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                <label className="block text-xs font-bold text-emerald-900 uppercase mb-2">Alumno a Inscribir *</label>
                <select name="feligres_id" required value={form.feligres_id} onChange={handleChange} className="w-full px-3 py-2 border rounded focus:ring-1 focus:ring-emerald-500 outline-none text-sm bg-white">
                  <option value="">-- Buscar feligrés --</option>
                  {feligreses.map(f => <option key={f.id} value={f.id}>{f.apellido} {f.nombre} {f.documento_identidad ? `(CI: ${f.documento_identidad})` : ''}</option>)}
                </select>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 space-y-4">
                <h4 className="font-bold text-orange-900 text-sm border-b border-orange-200 pb-1">Datos de los Padres / Tutores</h4>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tutor Principal (Obligatorio) *</label>
                  <select name="tutor_principal_id" required value={form.tutor_principal_id} onChange={handleChange} className="w-full px-3 py-2 border rounded outline-none text-sm bg-white">
                    <option value="">-- Seleccionar --</option>
                    {feligreses.map(f => <option key={f.id} value={f.id}>{f.apellido} {f.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tutor Secundario (Opcional)</label>
                  <select name="tutor_secundario_id" value={form.tutor_secundario_id} onChange={handleChange} className="w-full px-3 py-2 border rounded outline-none text-sm bg-white">
                    <option value="">-- Ninguno --</option>
                    {feligreses.map(f => <option key={f.id} value={f.id}>{f.apellido} {f.nombre}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setMostrarModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-300">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800">Confirmar Inscripción</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}