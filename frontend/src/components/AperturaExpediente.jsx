// src/components/AperturaExpediente.jsx
import React, { useState, useEffect } from 'react';
import { fetchExpedientes, programarMatrimonio } from '../services/expedientesService';

export default function AperturaExpediente({ onVolver }) {
  const [expedientes, setExpedientes] = useState([]);
  const [feligreses, setFeligreses] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);

  const [form, setForm] = useState({
    novio_id: '',
    novia_id: '',
    fecha_boda_programada: ''
  });

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const listaExpedientes = await fetchExpedientes();
      setExpedientes(listaExpedientes);

      // Datos de prueba temporales para el selector.
      // Cuando conectes tu fetchFeligreses real, reemplaza esto.
      setFeligreses([
        { id: 1, nombre: 'Carlos', apellido: 'Mamani', genero: 'M', documento_identidad: '1234567' },
        { id: 2, nombre: 'Ana', apellido: 'Pérez', genero: 'F', documento_identidad: '7654321' },
      ]);
    } catch (error) {
      console.error(error);
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
    if (form.novio_id === form.novia_id) {
      return alert("⚠️ Los contrayentes no pueden ser la misma persona.");
    }
    try {
      await programarMatrimonio(form);
      alert("✅ Expediente matrimonial aperturado con éxito.");
      setMostrarModal(false);
      setForm({ novio_id: '', novia_id: '', fecha_boda_programada: '' });
      cargarDatos();
    } catch (error) {
      alert(`❌ ${error.message}`);
    }
  };

  const hombres = feligreses.filter(f => f.genero === 'M' || !f.genero);
  const mujeres = feligreses.filter(f => f.genero === 'F' || !f.genero);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-emerald-800 mt-1 flex items-center gap-2">
            <span className="text-3xl">💍</span> Apertura de Expedientes Matrimoniales
          </h2>
          <p className="text-gray-500 text-sm mt-1">Paso 1: Agenda de fecha e inicio del trámite.</p>
        </div>
        <button 
          onClick={() => setMostrarModal(true)} 
          className="px-4 py-2 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 transition-colors shadow-sm"
        >
          + Iniciar Nuevo Trámite
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 mt-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-emerald-50 text-emerald-800 text-sm border-b border-emerald-200">
              <th className="p-3 w-16 text-center">Nº Exp.</th>
              <th className="p-3">Contrayente (Novio)</th>
              <th className="p-3">Contrayente (Novia)</th>
              <th className="p-3 text-center">Fecha de Boda</th>
              <th className="p-3 text-center">Estado del Trámite</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
            {cargando ? (
              <tr><td colSpan="6" className="p-6 text-center text-emerald-600 font-bold">Cargando expedientes...</td></tr>
            ) : expedientes.length > 0 ? (
              expedientes.map((exp) => (
                <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-3 font-mono text-xs text-center font-bold text-gray-500">#{exp.id}</td>
                  <td className="p-3 font-semibold uppercase">{exp.novio_nombre}</td>
                  <td className="p-3 font-semibold uppercase">{exp.novia_nombre}</td>
                  <td className="p-3 text-center font-bold text-emerald-700">
                    {new Date(exp.fecha_boda_programada).toLocaleDateString('es-ES')}
                  </td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                      {exp.estado_tramite}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button className="text-emerald-600 font-semibold hover:underline text-xs cursor-pointer">
                      Continuar Trámite →
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="6" className="p-6 text-center text-gray-500 italic">No hay expedientes en curso.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {mostrarModal && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/60 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 relative">
            <button onClick={() => setMostrarModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl font-bold cursor-pointer">×</button>
            <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Agendar Nueva Boda</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <label className="block text-xs font-bold text-blue-900 uppercase mb-2">1. Seleccionar Novio *</label>
                  <select 
                    name="novio_id" required value={form.novio_id} onChange={handleChange} 
                    className="w-full px-3 py-2 border border-blue-300 rounded outline-none text-sm bg-white"
                  >
                    <option value="">-- Buscar feligrés --</option>
                    {hombres.map(f => (
                      <option key={f.id} value={f.id}>{f.apellido} {f.nombre} (CI: {f.documento_identidad})</option>
                    ))}
                  </select>
                </div>

                <div className="bg-pink-50 p-4 rounded-lg border border-pink-100">
                  <label className="block text-xs font-bold text-pink-900 uppercase mb-2">2. Seleccionar Novia *</label>
                  <select 
                    name="novia_id" required value={form.novia_id} onChange={handleChange} 
                    className="w-full px-3 py-2 border border-pink-300 rounded outline-none text-sm bg-white"
                  >
                    <option value="">-- Buscar feligresa --</option>
                    {mujeres.map(f => (
                      <option key={f.id} value={f.id}>{f.apellido} {f.nombre} (CI: {f.documento_identidad})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 w-full md:w-1/2 mx-auto">
                <label className="block text-xs font-bold text-emerald-900 uppercase mb-2 text-center">3. Fecha Programada *</label>
                <input 
                  type="date" name="fecha_boda_programada" required value={form.fecha_boda_programada} onChange={handleChange} 
                  className="w-full px-3 py-2 border border-emerald-300 rounded outline-none text-sm text-center"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setMostrarModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-300 cursor-pointer">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 cursor-pointer">Abrir Expediente</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}