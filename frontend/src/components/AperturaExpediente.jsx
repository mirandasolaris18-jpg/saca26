// src/components/AperturaExpediente.jsx
import React, { useState, useEffect } from 'react';
import { fetchExpedientes, programarMatrimonio, saveIntervinientes, cambiarEstadoExpediente, trasladarExpediente } from '../services/expedientesService';
import { fetchFeligreses } from '../services/feligresesService';
import { fetchParroquias } from '../services/parroquiasService';
import DigitalizacionDocumentos from './DigitalizacionDocumentos'; // Asegúrate de importar el nuevo componente

// Función auxiliar para calcular edad
const calcularEdad = (fechaNac) => {
  if(!fechaNac) return '___';
  const diff = Date.now() - new Date(fechaNac).getTime();
  return Math.abs(new Date(diff).getUTCFullYear() - 1970);
};

export default function AperturaExpediente({ onVolver, user }) {
  const [view, setView] = useState('listado'); 
  const [expedienteSeleccionado, setExpedienteSeleccionado] = useState(null);
  const [expedientes, setExpedientes] = useState([]);
  const [feligreses, setFeligreses] = useState([]);
  const [parroquias, setParroquias] = useState([]);
  
  const [modalTraslado, setModalTraslado] = useState({ show: false, expedienteId: null });
  const [busquedaParroquia, setBusquedaParroquia] = useState('');
  const [parroquiaDestinoSeleccionada, setParroquiaDestinoSeleccionada] = useState('');

  // --- ESTADOS PARA BÚSQUEDA ---
  const [searchPN, setSearchPN] = useState(''); const [showPN, setShowPN] = useState(false);
  const [searchMN, setSearchMN] = useState(''); const [showMN, setShowMN] = useState(false);
  const [searchPNa, setSearchPNa] = useState(''); const [showPNa, setShowPNa] = useState(false);
  const [searchMNa, setSearchMNa] = useState(''); const [showMNa, setShowMNa] = useState(false);
  const [searchPad, setSearchPad] = useState(''); const [showPad, setShowPad] = useState(false);
  const [searchMad, setSearchMad] = useState(''); const [showMad, setShowMad] = useState(false);
  const [searchT1, setSearchT1] = useState(''); const [showT1, setShowT1] = useState(false);
  const [searchT2, setSearchT2] = useState(''); const [showT2, setShowT2] = useState(false);

  const [cargando, setCargando] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [datosImpresionSimple, setDatosImpresionSimple] = useState(null);
  const [datosImpresionOficial, setDatosImpresionOficial] = useState(null);

  const [form, setForm] = useState({ novio_id: '', novia_id: '', fecha_boda_programada: '' });
  const [intervinientes, setIntervinientes] = useState({
    padre_novio: '', madre_novio: '', padre_novia: '', madre_novia: '', padrino: '', madrina: '', testigo_1: '', testigo_2: ''
  });

  const hoy = new Date();
  hoy.setDate(hoy.getDate() + 30);
  const minDate = hoy.toISOString().split('T')[0];

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [listaExpedientes, listaFeligreses, listaParroquias] = await Promise.all([
        fetchExpedientes(), fetchFeligreses(), fetchParroquias()
      ]);
      setExpedientes(listaExpedientes);
      setFeligreses(listaFeligreses);
      setParroquias(listaParroquias);
    } catch (error) { console.error(error); } finally { setCargando(false); }
  };

  useEffect(() => { cargarDatos(); }, []);

  const hombres = feligreses.filter(f => f.genero === 'Masculino' || f.genero === 'M');
  const mujeres = feligreses.filter(f => f.genero === 'Femenino' || f.genero === 'F');
  const hombresCasados = hombres.filter(f => f.fecha_matrimonio);
  const mujeresCasadas = mujeres.filter(f => f.fecha_matrimonio);
  const parroquiasFiltradas = parroquias.filter(p => `${p.nombre} ${p.diocesis || ''}`.toLowerCase().includes(busquedaParroquia.toLowerCase()));

  const cargarIntervinientesDB = async (expedienteId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/expedientes/${expedienteId}/intervinientes`, { headers: { "Authorization": `Bearer ${token}` } });
      const data = await res.json();
      
      const bdInterv = { padre_novio: '', madre_novio: '', padre_novia: '', madre_novia: '', padrino: '', madrina: '', testigo_1: '', testigo_2: '' };
      data.forEach(item => {
        const key = item.rol.toLowerCase().replace(' ', '_');
        bdInterv[key] = item.feligres_id.toString();
        const nombreCompleto = `${item.apellido} ${item.nombre}`;
        if(key === 'padre_novio') setSearchPN(nombreCompleto);
        if(key === 'madre_novio') setSearchMN(nombreCompleto);
        if(key === 'padre_novia') setSearchPNa(nombreCompleto);
        if(key === 'madre_novia') setSearchMNa(nombreCompleto);
        if(key === 'padrino') setSearchPad(nombreCompleto);
        if(key === 'madrina') setSearchMad(nombreCompleto);
        if(key === 'testigo_1') setSearchT1(nombreCompleto);
        if(key === 'testigo_2') setSearchT2(nombreCompleto);
      });
      setIntervinientes(bdInterv);
    } catch (err) { console.error("Error", err); }
  };

  const handleImprimirOficial = async (expedienteId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/expedientes/${expedienteId}/impresion`, { headers: { "Authorization": `Bearer ${token}` } });
      if(!res.ok) throw new Error("Asegúrese de haber guardado los intervinientes primero.");
      const data = await res.json();
      
      const invMap = {};
      data.intervinientes.forEach(i => invMap[i.rol] = i);
      data.intervinientes_map = invMap;
      
      setDatosImpresionOficial(data);
      setTimeout(() => { window.print(); setDatosImpresionOficial(null); }, 800);
    } catch (err) { alert(`❌ No se puede imprimir: ${err.message}`); }
  };

  const handleSelectInterviniente = (rol, value) => {
    if (!value) { setIntervinientes({ ...intervinientes, [rol]: value }); return; }
    const persona = feligreses.find(f => f.id === parseInt(value));

    if (rol === 'padrino' || rol === 'madrina') {
      if (!persona.fecha_matrimonio) return alert("❌ Selección bloqueada: Esta persona no registra un matrimonio válido.");
    }
    if (rol === 'padre_novio' && value === intervinientes.padre_novia) return alert("⚠️ El padre del novio no puede ser el mismo padre de la novia.");
    if (rol === 'padre_novia' && value === intervinientes.padre_novio) return alert("⚠️ El padre de la novia no puede ser el mismo padre del novio.");
    if (rol === 'madre_novio' && value === intervinientes.madre_novia) return alert("⚠️ La madre del novio no puede ser la misma madre de la novia.");
    if (rol === 'madre_novia' && value === intervinientes.madre_novio) return alert("⚠️ La madre de la novia no puede ser la misma madre del novio.");

    setIntervinientes({ ...intervinientes, [rol]: value });
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmitNuevo = async (e) => {
    e.preventDefault();
    if (form.novio_id === form.novia_id) return alert("⚠️ Los contrayentes no pueden ser la misma persona.");
    try {
      await programarMatrimonio(form);
      alert("✅ Expediente aperturado.");
      setMostrarModal(false);
      setForm({ novio_id: '', novia_id: '', fecha_boda_programada: '' });
      cargarDatos();
    } catch (error) { alert(`❌ ${error.message}`); }
  };

  const handleGuardarIntervinientes = async () => {
    try {
      const lista = Object.entries(intervinientes).filter(([_, id]) => id !== '').map(([rol, id]) => ({
          rol: rol.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          feligres_id: id
        }));
      await saveIntervinientes(expedienteSeleccionado.id, lista);
      alert("✅ Intervinientes guardados exitosamente.");
      setView('listado');
      cargarDatos();
    } catch (error) { alert("❌ " + error.message); }
  };

  const handleCambiarEstado = async (id, estadoActual) => {
    if(!window.confirm(`¿Desea cambiar el estado del trámite a: ${estadoActual}?`)) return;
    try { await cambiarEstadoExpediente(id, estadoActual); cargarDatos(); } catch(error) { alert("❌ " + error.message); }
  };

  const confirmarTraslado = async (e) => {
    e.preventDefault();
    if(!parroquiaDestinoSeleccionada) return alert("⚠️ Debe seleccionar una parroquia.");
    try {
      await trasladarExpediente(modalTraslado.expedienteId, parseInt(parroquiaDestinoSeleccionada));
      setModalTraslado({ show: false, expedienteId: null });
      cargarDatos();
    } catch(error) { alert("❌ " + error.message); }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-6 print:hidden">
        {view === 'listado' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-emerald-800">💍 Expedientes Matrimoniales</h2>
              <button onClick={() => setMostrarModal(true)} className="px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800">+ Iniciar Nuevo Trámite</button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 mt-4 pb-24">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-emerald-50 text-emerald-800 text-sm border-b border-emerald-200">
                    <th className="p-3 w-16 text-center">Nº</th>
                    <th className="p-3">Contrayentes</th>
                    <th className="p-3 text-center">Fecha de Boda</th>
                    <th className="p-3 text-center">Estado</th>
                    <th className="p-3 text-center">Gestión / Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-100">
                  {expedientes.length > 0 ? (
                    expedientes.map((exp) => {
                      // VERIFICACIÓN DINÁMICA DE SACRAMENTOS
                      const faltantesNovio = [];
                      if (!exp.novio_bautizado) faltantesNovio.push("Bautizo");
                      if (!exp.novio_confirmado) faltantesNovio.push("Confirmación");

                      const faltantesNovia = [];
                      if (!exp.novia_bautizada) faltantesNovia.push("Bautizo");
                      if (!exp.novia_confirmada) faltantesNovia.push("Confirmación");

                      const sacramentosFaltantesStr = [
                        ...(faltantesNovio.length ? [`Novio: ${faltantesNovio.join(' y ')}`] : []),
                        ...(faltantesNovia.length ? [`Novia: ${faltantesNovia.join(' y ')}`] : [])
                      ].join(" | ");

                      const listoParaCompletar = faltantesNovio.length === 0 && faltantesNovia.length === 0 && exp.total_intervinientes >= 8;

                      return (
                        <tr key={exp.id} className={`hover:bg-gray-50 ${exp.estado_tramite === 'Cancelado' ? 'opacity-50' : ''}`}>
                          <td className="p-3 font-bold text-gray-500 text-center">#{exp.id}</td>
                          <td className="p-3">
                            <div className="uppercase font-semibold text-blue-800">{exp.novio_nombre} {exp.novio_apellido}</div>
                            <div className="uppercase font-semibold text-pink-800">{exp.novia_nombre} {exp.novia_apellido}</div>
                            {/* ALERTA ROJA DE SACRAMENTOS */}
                            {sacramentosFaltantesStr && (
                              <div className="mt-1 text-[10px] text-red-600 font-bold bg-red-50 p-1 rounded border border-red-200">
                                ❌ Sacramentos faltantes: {sacramentosFaltantesStr}
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-center font-bold">{new Date(exp.fecha_boda_programada).toLocaleDateString('es-ES')}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${exp.estado_tramite === 'Cancelado' ? 'bg-red-100 text-red-800' : exp.estado_tramite === 'Completado' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>
                              {exp.estado_tramite}
                            </span>
                          </td>
                          <td className="p-3 text-center space-y-2 w-48">
                            
                            {/* BOTÓN: LLENAR DATOS (Solo si no está completado) */}
                            {exp.estado_tramite === 'En Curso' && (
                              <button onClick={() => { setExpedienteSeleccionado(exp); cargarIntervinientesDB(exp.id); setView('intervinientes'); }} className="w-full px-2 py-1 bg-emerald-600 text-white text-xs font-bold rounded">
                                Llenar Datos
                              </button>
                            )}

                            {/* BOTÓN: COMPLETAR (Solo si cumple los requisitos) */}
                            {exp.estado_tramite === 'En Curso' && listoParaCompletar && (
                              <button onClick={() => handleCambiarEstado(exp.id, 'Completado')} className="w-full px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 animate-pulse">
                                ⭐ Marcar Completado
                              </button>
                            )}

                            {/* MENÚ COMPLETADO: IMPRESIÓN Y REDIRECCIONES */}
                            {exp.estado_tramite === 'Completado' && (
                              <div className="space-y-1">
                                <button onClick={() => handleImprimirOficial(exp.id)} className="w-full px-2 py-1 bg-gray-800 text-white text-xs font-bold rounded">
                                  🖨️ Imprimir Expediente
                                </button>
                                <button onClick={() => { setExpedienteSeleccionado(exp); setView('digitalizacion'); }} className="w-full px-2 py-1 border border-blue-600 text-blue-700 text-[10px] font-bold rounded hover:bg-blue-50">
                                  2.3.3 Digitalizar Docs
                                </button>
                                <button onClick={() => { setExpedienteSeleccionado(exp); setView('celebracion'); }} className="w-full px-2 py-1 border border-amber-600 text-amber-700 text-[10px] font-bold rounded hover:bg-amber-50">
                                  2.3.6 Actas y Celebración
                                </button>
                              </div>
                            )}

                            {/* IMPRIMIR DESHABILITADO */}
                            {exp.estado_tramite === 'En Curso' && (
                              <button disabled className="w-full px-2 py-1 bg-gray-300 text-gray-500 text-xs font-bold rounded cursor-not-allowed">
                                🖨️ Imprimir (Incompleto)
                              </button>
                            )}
                            
                            <div className="flex justify-center gap-2 pt-1 border-t">
                              {exp.estado_tramite !== 'Cancelado' && exp.estado_tramite !== 'Trasladado' && (
                                <>
                                  {exp.estado_tramite !== 'Completado' && <button onClick={() => handleCambiarEstado(exp.id, 'Suspendido')} title="Suspender" className="text-amber-600 text-lg">⏸️</button>}
                                  <button onClick={() => { setModalTraslado({ show: true, expedienteId: exp.id }); }} title="Trasladar" className="text-purple-600 text-lg">📨</button>
                                  <button onClick={() => handleCambiarEstado(exp.id, 'Cancelado')} title="Cancelar" className="text-red-600 text-lg">❌</button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (<tr><td colSpan="5" className="p-6 text-center text-gray-500">No hay expedientes.</td></tr>)}
                </tbody>
              </table>
            </div>
            
            {/* MODAL TRASLADO OMITIDO POR BREVEDAD */}
          </>
        )}

        {/* VISTA 2.3.3: DIGITALIZACIÓN */}
        {view === 'digitalizacion' && (
           <DigitalizacionDocumentos expediente={expedienteSeleccionado} onVolver={() => setView('listado')} />
        )}

        {/* VISTA 2.3.6: ACTAS Y CELEBRACIÓN */}
        {view === 'celebracion' && (
           <div className="p-12 text-center">
              <button onClick={() => setView('listado')} className="mb-4 text-gray-500 font-bold hover:text-amber-700">← Volver al listado</button>
              <h2 className="text-2xl font-bold text-amber-800">🎉 Módulo 2.3.6: Actas y Celebración</h2>
              <p className="text-gray-600 mt-2">Expediente #{expedienteSeleccionado?.id}</p>
              <p className="text-gray-500 mt-4 italic">Esta vista debe ser construida en tu enrutador principal para manejar las actas.</p>
           </div>
        )}

        {/* VISTA: ASIGNACIÓN DE INTERVINIENTES */}
        {view === 'intervinientes' && (
          <div className="animate-fade-in">
            <button onClick={() => setView('listado')} className="mb-4 text-gray-500 font-bold">← Volver</button>
            <h2 className="text-xl font-bold mb-2">Paso 2: Asignar Intervinientes Obligatorios</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              
              {/* PADRE NOVIO */}
              <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-200">
                <label className="block text-xs font-bold uppercase mb-2 text-blue-900">👨‍👦 Padre Novio</label>
                <input type="text" className="w-full border p-2 rounded text-sm bg-white outline-none" value={searchPN} onChange={(e) => { setSearchPN(e.target.value); setShowPN(true); handleSelectInterviniente('padre_novio', ''); }} onFocus={() => setShowPN(true)} onBlur={() => setTimeout(() => setShowPN(false), 200)} />
                {showPN && <ul className="absolute z-10 w-48 bg-white border rounded shadow-xl text-sm">{hombres.filter(f => `${f.apellido} ${f.nombre}`.toLowerCase().includes(searchPN.toLowerCase())).map(f => <li key={f.id} className="p-2 hover:bg-blue-100 cursor-pointer" onClick={() => { handleSelectInterviniente('padre_novio', f.id); setSearchPN(`${f.apellido} ${f.nombre}`); setShowPN(false); }}>{f.apellido} {f.nombre}</li>)}</ul>}
              </div>

              {/* MADRE NOVIO */}
              <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-200">
                <label className="block text-xs font-bold uppercase mb-2 text-blue-900">👩‍👦 Madre Novio</label>
                <input type="text" className="w-full border p-2 rounded text-sm bg-white outline-none" value={searchMN} onChange={(e) => { setSearchMN(e.target.value); setShowMN(true); handleSelectInterviniente('madre_novio', ''); }} onFocus={() => setShowMN(true)} onBlur={() => setTimeout(() => setShowMN(false), 200)} />
                {showMN && <ul className="absolute z-10 w-48 bg-white border rounded shadow-xl text-sm">{mujeres.filter(f => `${f.apellido} ${f.nombre}`.toLowerCase().includes(searchMN.toLowerCase())).map(f => <li key={f.id} className="p-2 hover:bg-blue-100 cursor-pointer" onClick={() => { handleSelectInterviniente('madre_novio', f.id); setSearchMN(`${f.apellido} ${f.nombre}`); setShowMN(false); }}>{f.apellido} {f.nombre}</li>)}</ul>}
              </div>

              {/* PADRE NOVIA */}
              <div className="bg-pink-50/50 p-4 rounded-lg border border-pink-200">
                <label className="block text-xs font-bold uppercase mb-2 text-pink-900">👨‍👧 Padre Novia</label>
                <input type="text" className="w-full border p-2 rounded text-sm bg-white outline-none" value={searchPNa} onChange={(e) => { setSearchPNa(e.target.value); setShowPNa(true); handleSelectInterviniente('padre_novia', ''); }} onFocus={() => setShowPNa(true)} onBlur={() => setTimeout(() => setShowPNa(false), 200)} />
                {showPNa && <ul className="absolute z-10 w-48 bg-white border rounded shadow-xl text-sm">{hombres.filter(f => `${f.apellido} ${f.nombre}`.toLowerCase().includes(searchPNa.toLowerCase())).map(f => <li key={f.id} className="p-2 hover:bg-pink-100 cursor-pointer" onClick={() => { handleSelectInterviniente('padre_novia', f.id); setSearchPNa(`${f.apellido} ${f.nombre}`); setShowPNa(false); }}>{f.apellido} {f.nombre}</li>)}</ul>}
              </div>

              {/* MADRE NOVIA */}
              <div className="bg-pink-50/50 p-4 rounded-lg border border-pink-200">
                <label className="block text-xs font-bold uppercase mb-2 text-pink-900">👩‍👧 Madre Novia</label>
                <input type="text" className="w-full border p-2 rounded text-sm bg-white outline-none" value={searchMNa} onChange={(e) => { setSearchMNa(e.target.value); setShowMNa(true); handleSelectInterviniente('madre_novia', ''); }} onFocus={() => setShowMNa(true)} onBlur={() => setTimeout(() => setShowMNa(false), 200)} />
                {showMNa && <ul className="absolute z-10 w-48 bg-white border rounded shadow-xl text-sm">{mujeres.filter(f => `${f.apellido} ${f.nombre}`.toLowerCase().includes(searchMNa.toLowerCase())).map(f => <li key={f.id} className="p-2 hover:bg-pink-100 cursor-pointer" onClick={() => { handleSelectInterviniente('madre_novia', f.id); setSearchMNa(`${f.apellido} ${f.nombre}`); setShowMNa(false); }}>{f.apellido} {f.nombre}</li>)}</ul>}
              </div>

              {/* PADRINO */}
              <div className="bg-emerald-50/40 p-4 rounded-lg border border-emerald-200">
                <label className="block text-xs font-bold uppercase mb-2 text-emerald-900">👑 Padrino (Casado)</label>
                <input type="text" className="w-full border p-2 rounded text-sm bg-white outline-none" value={searchPad} onChange={(e) => { setSearchPad(e.target.value); setShowPad(true); handleSelectInterviniente('padrino', ''); }} onFocus={() => setShowPad(true)} onBlur={() => setTimeout(() => setShowPad(false), 200)} />
                {showPad && <ul className="absolute z-10 w-48 bg-white border rounded shadow-xl text-sm">{hombresCasados.filter(f => `${f.apellido} ${f.nombre}`.toLowerCase().includes(searchPad.toLowerCase())).map(f => <li key={f.id} className="p-2 hover:bg-emerald-100 cursor-pointer" onClick={() => { handleSelectInterviniente('padrino', f.id); setSearchPad(`${f.apellido} ${f.nombre}`); setShowPad(false); }}>{f.apellido} {f.nombre}</li>)}</ul>}
              </div>

              {/* MADRINA */}
              <div className="bg-emerald-50/40 p-4 rounded-lg border border-emerald-200">
                <label className="block text-xs font-bold uppercase mb-2 text-emerald-900">👑 Madrina (Casada)</label>
                <input type="text" className="w-full border p-2 rounded text-sm bg-white outline-none" value={searchMad} onChange={(e) => { setSearchMad(e.target.value); setShowMad(true); handleSelectInterviniente('madrina', ''); }} onFocus={() => setShowMad(true)} onBlur={() => setTimeout(() => setShowMad(false), 200)} />
                {showMad && <ul className="absolute z-10 w-48 bg-white border rounded shadow-xl text-sm">{mujeresCasadas.filter(f => `${f.apellido} ${f.nombre}`.toLowerCase().includes(searchMad.toLowerCase())).map(f => <li key={f.id} className="p-2 hover:bg-emerald-100 cursor-pointer" onClick={() => { handleSelectInterviniente('madrina', f.id); setSearchMad(`${f.apellido} ${f.nombre}`); setShowMad(false); }}>{f.apellido} {f.nombre}</li>)}</ul>}
              </div>

              {/* TESTIGO 1 */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-xs font-bold uppercase mb-2 text-gray-700">📜 Testigo 1</label>
                <input type="text" className="w-full border p-2 rounded text-sm bg-white outline-none" value={searchT1} onChange={(e) => { setSearchT1(e.target.value); setShowT1(true); handleSelectInterviniente('testigo_1', ''); }} onFocus={() => setShowT1(true)} onBlur={() => setTimeout(() => setShowT1(false), 200)} />
                {showT1 && <ul className="absolute z-10 w-48 bg-white border rounded shadow-xl text-sm">{feligreses.filter(f => `${f.apellido} ${f.nombre}`.toLowerCase().includes(searchT1.toLowerCase())).map(f => <li key={f.id} className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => { handleSelectInterviniente('testigo_1', f.id); setSearchT1(`${f.apellido} ${f.nombre}`); setShowT1(false); }}>{f.apellido} {f.nombre}</li>)}</ul>}
              </div>

              {/* TESTIGO 2 */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-xs font-bold uppercase mb-2 text-gray-700">📜 Testigo 2</label>
                <input type="text" className="w-full border p-2 rounded text-sm bg-white outline-none" value={searchT2} onChange={(e) => { setSearchT2(e.target.value); setShowT2(true); handleSelectInterviniente('testigo_2', ''); }} onFocus={() => setShowT2(true)} onBlur={() => setTimeout(() => setShowT2(false), 200)} />
                {showT2 && <ul className="absolute z-10 w-48 bg-white border rounded shadow-xl text-sm">{feligreses.filter(f => `${f.apellido} ${f.nombre}`.toLowerCase().includes(searchT2.toLowerCase())).map(f => <li key={f.id} className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => { handleSelectInterviniente('testigo_2', f.id); setSearchT2(`${f.apellido} ${f.nombre}`); setShowT2(false); }}>{f.apellido} {f.nombre}</li>)}</ul>}
              </div>

            </div>
            <div className="mt-8 flex justify-end gap-3 pt-4 border-t"><button onClick={handleGuardarIntervinientes} className="px-6 py-2 bg-emerald-700 text-white rounded-lg font-bold hover:bg-emerald-800">Guardar Intervinientes</button></div>
          </div>
        )}
      </div>

      {/* ================= IMPRESIÓN COMPLETA DEL EXPEDIENTE OFICIAL ================= */}
      {datosImpresionOficial && (
        <div className="hidden print:block font-serif text-black w-full bg-white h-screen px-12 py-8">
          
          <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
            <div className="text-left">
              <h2 className="text-xl font-bold uppercase">{datosImpresionOficial.diocesis || 'Diócesis de Oruro'}</h2>
              <h3 className="text-lg uppercase">{datosImpresionOficial.parroquia_nombre}</h3>
            </div>
            <div className="text-right">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=Expediente_Nro_${datosImpresionOficial.expediente_id}_Parroquia_${datosImpresionOficial.parroquia_id}`} alt="QR Code Validación" className="w-24 h-24 object-contain border p-1" />
              <p className="text-[10px] text-gray-500 mt-1">Validez Canónica</p>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold uppercase tracking-widest border-2 border-black inline-block px-6 py-2">Expediente Matrimonial</h1>
            <p className="mt-2 text-sm italic">Registro oficial previo a la celebración del Sacramento del Matrimonio.</p>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-bold uppercase bg-gray-200 px-2 py-1 border border-black mb-3">1. Datos de los Contrayentes</h3>
            <div className="grid grid-cols-2 gap-8 text-sm pl-2">
              <div>
                <p className="font-bold border-b border-gray-400 mb-2">EL NOVIO</p>
                <p><b>Nombre:</b> {datosImpresionOficial.novio_nombre} {datosImpresionOficial.novio_apellido}</p>
                <p><b>Edad:</b> {calcularEdad(datosImpresionOficial.novio_nacimiento)} años</p>
                <p className="mt-2"><b>Bautizado en:</b> {datosImpresionOficial.sacramentos_novio.bautizo_parroquia || '___'} <br/> <b>Fecha:</b> {datosImpresionOficial.sacramentos_novio.bautizo_fecha ? new Date(datosImpresionOficial.sacramentos_novio.bautizo_fecha).toLocaleDateString('es-ES') : '___'}</p>
                <p className="mt-1"><b>Confirmado en:</b> {datosImpresionOficial.sacramentos_novio.conf_parroquia || '___'} <br/> <b>Fecha:</b> {datosImpresionOficial.sacramentos_novio.conf_fecha ? new Date(datosImpresionOficial.sacramentos_novio.conf_fecha).toLocaleDateString('es-ES') : '___'}</p>
              </div>
              <div>
                <p className="font-bold border-b border-gray-400 mb-2">LA NOVIA</p>
                <p><b>Nombre:</b> {datosImpresionOficial.novia_nombre} {datosImpresionOficial.novia_apellido}</p>
                <p><b>Edad:</b> {calcularEdad(datosImpresionOficial.novia_nacimiento)} años</p>
                <p className="mt-2"><b>Bautizada en:</b> {datosImpresionOficial.sacramentos_novia.bautizo_parroquia || '___'} <br/> <b>Fecha:</b> {datosImpresionOficial.sacramentos_novia.bautizo_fecha ? new Date(datosImpresionOficial.sacramentos_novia.bautizo_fecha).toLocaleDateString('es-ES') : '___'}</p>
                <p className="mt-1"><b>Confirmada en:</b> {datosImpresionOficial.sacramentos_novia.conf_parroquia || '___'} <br/> <b>Fecha:</b> {datosImpresionOficial.sacramentos_novia.conf_fecha ? new Date(datosImpresionOficial.sacramentos_novia.conf_fecha).toLocaleDateString('es-ES') : '___'}</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-bold uppercase bg-gray-200 px-2 py-1 border border-black mb-3">2. Padres, Padrinos y Testigos</h3>
            <div className="grid grid-cols-2 gap-4 text-sm pl-2">
              <p><b>Padre del Novio:</b> {datosImpresionOficial.intervinientes_map['Padre Novio'] ? `${datosImpresionOficial.intervinientes_map['Padre Novio'].nombre} ${datosImpresionOficial.intervinientes_map['Padre Novio'].apellido}` : '______________________'}</p>
              <p><b>Madre del Novio:</b> {datosImpresionOficial.intervinientes_map['Madre Novio'] ? `${datosImpresionOficial.intervinientes_map['Madre Novio'].nombre} ${datosImpresionOficial.intervinientes_map['Madre Novio'].apellido}` : '______________________'}</p>
              <p><b>Padre de la Novia:</b> {datosImpresionOficial.intervinientes_map['Padre Novia'] ? `${datosImpresionOficial.intervinientes_map['Padre Novia'].nombre} ${datosImpresionOficial.intervinientes_map['Padre Novia'].apellido}` : '______________________'}</p>
              <p><b>Madre de la Novia:</b> {datosImpresionOficial.intervinientes_map['Madre Novia'] ? `${datosImpresionOficial.intervinientes_map['Madre Novia'].nombre} ${datosImpresionOficial.intervinientes_map['Madre Novia'].apellido}` : '______________________'}</p>
            </div>
            <div className="mt-4 border border-dashed border-gray-400 p-3 bg-gray-50/50">
              <p className="text-sm">
                <b>Padrinos de Boda:</b> <br/>
                Sr. {datosImpresionOficial.intervinientes_map['Padrino'] ? `${datosImpresionOficial.intervinientes_map['Padrino'].nombre} ${datosImpresionOficial.intervinientes_map['Padrino'].apellido}` : '______________________'} y Sra. {datosImpresionOficial.intervinientes_map['Madrina'] ? `${datosImpresionOficial.intervinientes_map['Madrina'].nombre} ${datosImpresionOficial.intervinientes_map['Madrina'].apellido}` : '______________________'}.<br/>
                <i>(Contrajeron matrimonio eclesiástico el: {datosImpresionOficial.intervinientes_map['Padrino']?.fecha_matrimonio_padrinos ? new Date(datosImpresionOficial.intervinientes_map['Padrino'].fecha_matrimonio_padrinos).toLocaleDateString('es-ES') : '___'})</i>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm pl-2 mt-4">
              <p><b>Testigo 1:</b> {datosImpresionOficial.intervinientes_map['Testigo 1'] ? `${datosImpresionOficial.intervinientes_map['Testigo 1'].nombre} ${datosImpresionOficial.intervinientes_map['Testigo 1'].apellido}` : '______________________'}</p>
              <p><b>Testigo 2:</b> {datosImpresionOficial.intervinientes_map['Testigo 2'] ? `${datosImpresionOficial.intervinientes_map['Testigo 2'].nombre} ${datosImpresionOficial.intervinientes_map['Testigo 2'].apellido}` : '______________________'}</p>
            </div>
          </div>

          <div className="mb-12">
            <h3 className="text-sm font-bold uppercase bg-gray-200 px-2 py-1 border border-black mb-3">3. Celebración Oficial</h3>
            <div className="grid grid-cols-2 gap-4 text-base pl-2">
              <p><b>Fecha de Boda Programada:</b> <br/><span className="font-bold text-lg">{new Date(datosImpresionOficial.fecha_boda_programada).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></p>
              <p><b>Sacerdote / Párroco asignado:</b> <br/><span className="font-bold italic">{datosImpresionOficial.parroco}</span></p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8 text-center mt-24">
            <div>
              <div className="border-b border-black w-3/4 mx-auto mb-2"></div>
              <p className="text-xs font-bold uppercase">Firma del Novio</p>
            </div>
            <div>
              <div className="border-b border-black w-3/4 mx-auto mb-2"></div>
              <p className="text-xs font-bold uppercase">Sello y Firma del Párroco</p>
            </div>
            <div>
              <div className="border-b border-black w-3/4 mx-auto mb-2"></div>
              <p className="text-xs font-bold uppercase">Firma de la Novia</p>
            </div>
          </div>

          <div className="fixed bottom-4 right-8 text-[10px] text-gray-500 text-right">
            <p>Documento generado el: {new Date().toLocaleString('es-ES')}</p>
            <p>Impreso por: <b>{user?.nombre_completo || 'Secretaría Parroquial'}</b></p>
            <p>Reimpresión autorizada.</p>
          </div>
        </div>
      )}
    </>
  );
}