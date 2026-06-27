import React, { useState, useEffect } from "react";
import { fetchCatequistas, createCatequista, fetchFeligresesParaCatequistas } from "../services/catequesisService";

export default function Catequistas({ onVolver }) {
  const [catequistas, setCatequistas] = useState([]);
  const [feligreses, setFeligreses] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  
  const [mostrarModal, setMostrarModal] = useState(false);
  const [cargando, setCargando] = useState(false);

  const [form, setForm] = useState({
    feligres_id: "",
    es_certificado: false,
    ruta_certificado: "" // Aquí simularemos el nombre del archivo
  });

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const listaCatequistas = await fetchCatequistas();
      setCatequistas(listaCatequistas);
      
      const listaFeligreses = await fetchFeligresesParaCatequistas();
      // Si tu backend devuelve { data: [...] } ajusta esto a listaFeligreses.data
      setFeligreses(Array.isArray(listaFeligreses) ? listaFeligreses : listaFeligreses.data || []);
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
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value
    });
  };

  // Manejo simulado del archivo (Para mantener el formato JSON actual)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({ ...form, ruta_certificado: file.name });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.feligres_id) {
      return alert("⚠️ Debes seleccionar un feligrés para asignarlo como catequista.");
    }

    try {
      // Convertimos el booleano a 1 o 0 para MySQL
      const payload = {
        ...form,
        es_certificado: form.es_certificado ? 1 : 0
      };

      await createCatequista(payload);
      alert("✅ Catequista registrado correctamente.");
      setMostrarModal(false);
      
      // Limpiar formulario
      setForm({ feligres_id: "", es_certificado: false, ruta_certificado: "" });
      
      // Recargar tabla
      cargarDatos();
    } catch (error) {
      alert(`${error.message}`);
    }
  };

  // Filtrado en tiempo real en la tabla
  const catequistasFiltrados = catequistas.filter(c => 
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    c.apellido.toLowerCase().includes(busqueda.toLowerCase()) ||
    (c.documento_identidad && c.documento_identidad.includes(busqueda))
  );

  return (
    <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-6 animate-fade-in">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <button onClick={onVolver} className="text-sm text-emerald-700 font-semibold hover:underline">← Volver al Panel</button>
          <h2 className="text-2xl font-bold text-emerald-800 mt-1 flex items-center gap-2">
            <span className="text-3xl">👨‍🏫</span> Gestión de Catequistas
          </h2>
        </div>
        <button 
          onClick={() => setMostrarModal(true)} 
          className="px-4 py-2 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 transition-colors shadow-sm"
        >
          + Designar Catequista
        </button>
      </div>

      {/* Buscador */}
      <div className="mb-6">
        <input 
          type="text" 
          placeholder="🔍 Buscar catequista por nombre, apellido o CI..." 
          className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-emerald-50 text-emerald-800 text-sm border-b border-emerald-200">
              <th className="p-3">ID</th>
              <th className="p-3">Nombre Completo</th>
              <th className="p-3">Doc. Identidad</th>
              <th className="p-3 text-center">Estado Obispado</th>
              <th className="p-3 text-center">Archivo Adjunto</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
            {cargando ? (
              <tr><td colSpan="5" className="p-6 text-center text-emerald-600 font-bold animate-pulse">Cargando plantel docente...</td></tr>
            ) : catequistasFiltrados.length > 0 ? (
              catequistasFiltrados.map((c) => (
                <tr key={c.catequista_id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-3 font-mono text-xs">{c.catequista_id}</td>
                  <td className="p-3 font-semibold uppercase">{c.nombre} {c.apellido}</td>
                  <td className="p-3">{c.documento_identidad || 'S/N'}</td>
                  <td className="p-3 text-center">
                    {c.es_certificado === 1 
                      ? <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">✅ Certificado</span>
                      : <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">⏳ Pendiente</span>
                    }
                  </td>
                  <td className="p-3 text-center text-xs">
                    {c.ruta_certificado 
                      ? <span className="text-blue-600 font-semibold flex items-center justify-center gap-1">📄 {c.ruta_certificado}</span> 
                      : <span className="text-gray-400 italic">Sin documento</span>}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" className="p-6 text-center text-gray-500 italic">No hay catequistas registrados en esta parroquia.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Registro */}
      {mostrarModal && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/60 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 relative">
            <button onClick={() => setMostrarModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl font-bold">×</button>
            <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Designar Nuevo Catequista</h3>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Selección del Feligrés */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <label className="block text-xs font-bold text-blue-900 uppercase mb-2">Seleccionar de la Comunidad *</label>
                <select 
                  name="feligres_id" 
                  required 
                  value={form.feligres_id} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white"
                >
                  <option value="">-- Buscar feligrés registrado --</option>
                  {feligreses.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.apellido} {f.nombre} {f.documento_identidad ? `(CI: ${f.documento_identidad})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-blue-700 mt-1 italic">Si la persona no aparece, primero debe ser registrada en el Módulo de Feligreses.</p>
              </div>

              {/* Aval del Obispado */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="flex items-center gap-2 cursor-pointer mb-4">
                  <input 
                    type="checkbox" 
                    name="es_certificado"
                    checked={form.es_certificado}
                    onChange={handleChange}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm font-bold text-gray-700">¿Cuenta con aval/curso del Obispado?</span>
                </label>

                {/* Subida de Archivo (Se muestra solo si marca que sí está certificado) */}
                {form.es_certificado && (
                  <div className="animate-fade-in pl-6 border-l-2 border-emerald-400">
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Adjuntar Certificado (Opcional)</label>
                    <input 
                      type="file" 
                      accept=".pdf, image/jpeg, image/png"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setMostrarModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-300">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800">Guardar Designación</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}