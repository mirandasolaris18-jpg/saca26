import React, { useState, useEffect } from 'react';
import { fetchExpedientes, programarMatrimonio } from '../services/expedientesService';
import { fetchFeligreses } from '../services/feligresesService';

export default function AperturaExpediente({ onVolver, user }) {
  const [expedientes, setExpedientes] = useState([]);
  const [feligreses, setFeligreses] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  
  // Estado para los datos de impresión
  const [datosImpresion, setDatosImpresion] = useState(null);

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

      const listaFeligreses = await fetchFeligreses();
      setFeligreses(listaFeligreses);
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
      alert("✅ Expediente matrimonial aperturado con éxito. Se preparará el comprobante de reserva.");
      
      // Preparar datos para imprimir antes de limpiar el formulario
      const novioObj = hombres.find(h => h.id === parseInt(form.novio_id));
      const noviaObj = mujeres.find(m => m.id === parseInt(form.novia_id));
      
      setDatosImpresion({
        novio: `${novioObj?.nombre} ${novioObj?.apellido}`,
        novia: `${noviaObj?.nombre} ${noviaObj?.apellido}`,
        fechaBoda: form.fecha_boda_programada,
        fechaReserva: new Date().toLocaleDateString('es-ES')
      });

      setMostrarModal(false);
      setForm({ novio_id: '', novia_id: '', fecha_boda_programada: '' });
      cargarDatos();

      // Disparar la ventana de impresión tras un breve retardo para renderizar
      setTimeout(() => {
        window.print();
        setDatosImpresion(null); // Limpiar después de imprimir
      }, 500);

    } catch (error) {
      alert(`❌ ${error.message}`);
    }
  };

  const hombres = feligreses.filter(f => f.genero === 'Masculino' || f.genero === 'M' || !f.genero);
  const mujeres = feligreses.filter(f => f.genero === 'Femenino' || f.genero === 'F' || !f.genero);

  // Obtener objetos seleccionados para verificar sacramentos
  const novioSeleccionado = hombres.find(h => h.id === parseInt(form.novio_id));
  const noviaSeleccionada = mujeres.find(m => m.id === parseInt(form.novia_id));

  // Función auxiliar para renderizar advertencias
  const renderAdvertenciaSacramentos = (persona) => {
    if (!persona) return null;
    const faltan = [];
    if (!persona.bautizado) faltan.push("Bautizo");
    if (!persona.confirmado) faltan.push("Confirmación");
    
    if (faltan.length > 0) {
      return (
        <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200 animate-fade-in">
          ⚠️ <strong>Atención:</strong> {persona.nombre} {persona.apellido} no cuenta con los sacramentos de: <b>{faltan.join(" y ")}</b>. <br/>
          <span className="text-[10px] text-gray-600">Puede continuar con la reserva, pero deberá regularizar esto en el proceso.</span>
        </div>
      );
    }
    return <div className="mt-2 text-xs text-emerald-600 font-semibold">✅ Cuenta con sacramentos base.</div>;
  };

  return (
    <>
      {/* =========================================================
          VISTA NORMAL DEL SISTEMA (Se oculta al imprimir)
      ========================================================= */}
      <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-6 animate-fade-in print:hidden">
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

        {/* Tabla de Expedientes */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 mt-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-emerald-50 text-emerald-800 text-sm border-b border-emerald-200">
                <th className="p-3 w-16 text-center">Nº Exp.</th>
                <th className="p-3">Contrayente (Novio)</th>
                <th className="p-3">Contrayente (Novia)</th>
                <th className="p-3 text-center">Fecha de Boda</th>
                <th className="p-3 text-center">Estado</th>
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

        {/* Modal de Reserva */}
        {mostrarModal && (
          <div className="fixed top-0 left-0 w-full h-full bg-black/60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl p-6 relative max-h-[95vh] overflow-y-auto custom-scrollbar">
              <button onClick={() => setMostrarModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl font-bold cursor-pointer">×</button>
              <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Agendar Nueva Boda</h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* NOVIO */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex flex-col justify-between">
                    <div>
                      <label className="block text-xs font-bold text-blue-900 uppercase mb-2">1. Seleccionar Novio *</label>
                      <select 
                        name="novio_id" required value={form.novio_id} onChange={handleChange} 
                        className="w-full px-3 py-2 border border-blue-300 rounded outline-none text-sm bg-white font-semibold"
                      >
                        <option value="">-- Buscar feligrés --</option>
                        {hombres.map(f => (
                          <option key={f.id} value={f.id}>{f.apellido} {f.nombre} (CI: {f.documento_identidad})</option>
                        ))}
                      </select>
                    </div>
                    {/* Alerta dinámica de sacramentos del novio */}
                    {renderAdvertenciaSacramentos(novioSeleccionado)}
                  </div>

                  {/* NOVIA */}
                  <div className="bg-pink-50 p-4 rounded-lg border border-pink-100 flex flex-col justify-between">
                    <div>
                      <label className="block text-xs font-bold text-pink-900 uppercase mb-2">2. Seleccionar Novia *</label>
                      <select 
                        name="novia_id" required value={form.novia_id} onChange={handleChange} 
                        className="w-full px-3 py-2 border border-pink-300 rounded outline-none text-sm bg-white font-semibold"
                      >
                        <option value="">-- Buscar feligresa --</option>
                        {mujeres.map(f => (
                          <option key={f.id} value={f.id}>{f.apellido} {f.nombre} (CI: {f.documento_identidad})</option>
                        ))}
                      </select>
                    </div>
                    {/* Alerta dinámica de sacramentos de la novia */}
                    {renderAdvertenciaSacramentos(noviaSeleccionada)}
                  </div>
                </div>

                {/* FECHA */}
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 w-full md:w-1/2 mx-auto">
                  <label className="block text-xs font-bold text-emerald-900 uppercase mb-2 text-center">3. Fecha Programada *</label>
                  <input 
                    type="date" name="fecha_boda_programada" required value={form.fecha_boda_programada} onChange={handleChange} 
                    className="w-full px-3 py-2 border border-emerald-300 rounded outline-none text-sm text-center font-bold text-emerald-900"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button type="button" onClick={() => setMostrarModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-300 cursor-pointer">Cancelar</button>
                  <button type="submit" className="px-4 py-2 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 cursor-pointer flex items-center gap-2">
                    <span>💾</span> Guardar e Imprimir Comprobante
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================
          COMPROBANTE DE IMPRESIÓN (Solo visible al imprimir)
      ========================================================= */}
      {datosImpresion && (
        <div className="hidden print:block font-sans text-black w-full bg-white h-screen">
          {/* Usamos un grid para dividir la hoja en dos copias (Media carta cada una) */}
          <div className="grid grid-rows-2 h-full py-4 gap-8 max-w-[21.5cm] mx-auto">
            
            {/* Copia 1: Parroquia */}
            <div className="border-2 border-dashed border-gray-400 p-8 flex flex-col justify-between relative rounded-xl">
              <div className="absolute top-2 right-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Copia: Parroquia</div>
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold uppercase">{user?.parroquia_nombre || 'Parroquia Central'}</h1>
                <h2 className="text-lg font-semibold border-b-2 border-black inline-block pb-1 mt-2">Constancia de Reserva de Matrimonio</h2>
              </div>
              
              <div className="space-y-4 text-sm">
                <p>Por la presente se hace constar que se ha iniciado el trámite de expediente matrimonial para los contrayentes:</p>
                <div className="pl-4 border-l-4 border-gray-800 space-y-2 py-2 text-base font-bold uppercase">
                  <p>NOVIO: <span className="font-normal">{datosImpresion.novio}</span></p>
                  <p>NOVIA: <span className="font-normal">{datosImpresion.novia}</span></p>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 bg-gray-100 p-3 rounded">
                  <p><strong>Fecha Programada de la Boda:</strong> <br/> <span className="text-lg font-bold">{new Date(datosImpresion.fechaBoda).toLocaleDateString('es-ES')}</span></p>
                  <p><strong>Fecha de Registro en Sistema:</strong> <br/> {datosImpresion.fechaReserva}</p>
                </div>
                <p className="text-xs italic text-justify mt-2">
                  * La celebración del matrimonio queda sujeta a la presentación de la totalidad de los documentos requeridos y la aprobación del cursillo prematrimonial.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8 text-center mt-12">
                <div>
                  <div className="border-b border-black w-3/4 mx-auto mb-2"></div>
                  <p className="text-xs font-bold uppercase">Firma del Contrayente</p>
                </div>
                <div>
                  <div className="border-b border-black w-3/4 mx-auto mb-2"></div>
                  <p className="text-xs font-bold uppercase">Firma Secretaría Parroquial</p>
                </div>
              </div>
            </div>

            {/* Copia 2: Novios */}
            <div className="border-2 border-dashed border-gray-400 p-8 flex flex-col justify-between relative rounded-xl">
              <div className="absolute top-2 right-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Copia: Novios</div>
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold uppercase">{user?.parroquia_nombre || 'Parroquia Central'}</h1>
                <h2 className="text-lg font-semibold border-b-2 border-black inline-block pb-1 mt-2">Constancia de Reserva de Matrimonio</h2>
              </div>
              
              <div className="space-y-4 text-sm">
                <p>Por la presente se hace constar que se ha iniciado el trámite de expediente matrimonial para los contrayentes:</p>
                <div className="pl-4 border-l-4 border-gray-800 space-y-2 py-2 text-base font-bold uppercase">
                  <p>NOVIO: <span className="font-normal">{datosImpresion.novio}</span></p>
                  <p>NOVIA: <span className="font-normal">{datosImpresion.novia}</span></p>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 bg-gray-100 p-3 rounded">
                  <p><strong>Fecha Programada de la Boda:</strong> <br/> <span className="text-lg font-bold">{new Date(datosImpresion.fechaBoda).toLocaleDateString('es-ES')}</span></p>
                  <p><strong>Fecha de Registro en Sistema:</strong> <br/> {datosImpresion.fechaReserva}</p>
                </div>
                <p className="text-xs italic text-justify mt-2">
                  * La celebración del matrimonio queda sujeta a la presentación de la totalidad de los documentos requeridos y la aprobación del cursillo prematrimonial.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8 text-center mt-12">
                <div>
                  <div className="border-b border-black w-3/4 mx-auto mb-2"></div>
                  <p className="text-xs font-bold uppercase">Firma del Contrayente</p>
                </div>
                <div>
                  <div className="border-b border-black w-3/4 mx-auto mb-2"></div>
                  <p className="text-xs font-bold uppercase">Firma Secretaría Parroquial</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}