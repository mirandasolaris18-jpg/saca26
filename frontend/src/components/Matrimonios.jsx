import React, { useState, useEffect } from "react";
import { fetchRecursosMatrimonio, createMatrimonio, fetchMatrimonios } from "../services/matrimoniosService";
import { jsPDF } from "jspdf";

export default function Matrimonios({ onVolver }) {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [matrimonioExitoso, setMatrimonioExitoso] = useState(false);
  const [datosImpresion, setDatosImpresion] = useState(null);
  
  const [listaMatrimonios, setListaMatrimonios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [recursos, setRecursos] = useState({ parroquias: [], sacerdotes: [], feligreses: [] });

  const [form, setForm] = useState({
    esposo_id: "", esposa_id: "", padrino_id: "", madrina_id: "", 
    testigo1_id: "", testigo2_id: "", fecha_matrimonio: "", 
    sacerdote_id: "", numero_libro: "", pagina_libro: "", seccion_libro: ""
  });

  const cargarDatos = async (termino = "") => {
    try {
      const rec = await fetchRecursosMatrimonio();
      if (rec && rec.feligreses) {
        setRecursos(rec);
      }

      const hist = await fetchMatrimonios(termino);
      
      if (Array.isArray(hist)) {
        setListaMatrimonios(hist);
      } else if (hist && Array.isArray(hist.data)) {
        setListaMatrimonios(hist.data);
      } else {
        setListaMatrimonios([]);
      }
    } catch (error) {
      console.error("Error cargando datos de matrimonios:", error);
      setListaMatrimonios([]);
    }
  };

  useEffect(() => { cargarDatos(); }, [busqueda]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (form.esposo_id === form.esposa_id) {
      alert("❌ Error: El esposo y la esposa no pueden ser la misma persona.");
      return;
    }

    try {
      const payloadParaBackend = {
        novio_id: form.esposo_id,
        novia_id: form.esposa_id,
        padrino_id: form.padrino_id || null,
        madrina_id: form.madrina_id || null,
        testigo1_id: form.testigo1_id,
        testigo2_id: form.testigo2_id,
        fecha_matrimonio: form.fecha_matrimonio,
        sacerdote_id: form.sacerdote_id,
        numero_libro: form.numero_libro,
        pagina_libro: form.pagina_libro,
        seccion_libro: form.seccion_libro
      };

      await createMatrimonio(payloadParaBackend);
      
      const f = recursos.feligreses;
      const getNombre = (id) => f.find(x => x.id == id)?.nombre_completo || "---";
      
      const usuarioActual = JSON.parse(localStorage.getItem('usuario') || '{}');

      setDatosImpresion({
        esposo: getNombre(form.esposo_id),
        esposa: getNombre(form.esposa_id),
        testigo1: getNombre(form.testigo1_id),
        testigo2: getNombre(form.testigo2_id),
        padrino: form.padrino_id ? getNombre(form.padrino_id) : "No registra",
        madrina: form.madrina_id ? getNombre(form.madrina_id) : "No registra",
        parroquia: usuarioActual.parroquia_nombre || "Parroquia No Asignada", 
        sacerdote: recursos.sacerdotes.find(s => s.id == form.sacerdote_id)?.nombre_completo || "",
        fecha: form.fecha_matrimonio,
        libro: form.numero_libro,
        pagina: form.pagina_libro,
        seccion: form.seccion_libro
      });

      setMostrarModal(false);
      setMatrimonioExitoso(true);
      cargarDatos(); 
      
      setForm({ esposo_id: "", esposa_id: "", padrino_id: "", madrina_id: "", testigo1_id: "", testigo2_id: "", fecha_matrimonio: "", sacerdote_id: "", numero_libro: "", pagina_libro: "", seccion_libro: "" });
    } catch (error) {
      alert(`❌ ${error.message}`); 
    }
  };

  const generarPDF = (datos) => {
    const doc = new jsPDF();
    
    doc.setLineWidth(1); doc.rect(10, 10, 190, 277); 
    doc.setLineWidth(0.5); doc.rect(12, 12, 186, 273);
    
    doc.setFontSize(26); doc.setFont("times", "bold"); doc.setTextColor(6, 95, 70); 
    doc.text("CERTIFICADO DE MATRIMONIO", 105, 40, { align: "center" });
    
    doc.setFontSize(14); doc.setTextColor(0, 0, 0);
    doc.text(datos.parroquia.toUpperCase(), 105, 55, { align: "center" });

    doc.setFontSize(12); doc.setFont("times", "normal");
    doc.text(`Certificamos que en esta Parroquia, el día ${datos.fecha},`, 105, 75, { align: "center" });
    doc.text("unieron sus vidas bajo el Santo Vínculo del Matrimonio:", 105, 83, { align: "center" });
    
    doc.setFontSize(11); doc.setFont("times", "italic"); doc.setTextColor(100, 100, 100);
    doc.text("ÉL:", 35, 105);
    doc.setFontSize(18); doc.setFont("times", "bold"); doc.setTextColor(0, 0, 0);
    doc.text(datos.esposo.toUpperCase(), 35, 115);

    doc.setFontSize(14); doc.setFont("times", "italic"); doc.setTextColor(6, 95, 70);
    doc.text("con", 105, 128, { align: "center" });

    doc.setFontSize(11); doc.setFont("times", "italic"); doc.setTextColor(100, 100, 100);
    doc.text("ELLA:", 35, 142);
    doc.setFontSize(18); doc.setFont("times", "bold"); doc.setTextColor(0, 0, 0);
    doc.text(datos.esposa.toUpperCase(), 35, 152);

    doc.setFontSize(12); doc.setFont("times", "normal");
    doc.text(`Padrino:        ${datos.padrino}`, 35, 175);
    doc.text(`Madrina:       ${datos.madrina}`, 35, 185);
    doc.text(`Celebrante:    ${datos.sacerdote}`, 35, 195);

    doc.setFont("times", "italic"); doc.setTextColor(80, 80, 80);
    doc.text(`Esta acta nupcial se encuentra registrada de forma legal en el`, 105, 218, { align: "center" });
    doc.text(`Libro N° ${datos.libro}, Página ${datos.pagina}, Sección ${datos.seccion}.`, 105, 226, { align: "center" });

    doc.line(60, 255, 150, 255);
    doc.setFontSize(11); doc.setFont("times", "normal"); doc.setTextColor(0, 0, 0);
    doc.text("Firma del Párroco Celebrante", 105, 263, { align: "center" });
    
    const esposoNombre = datos.esposo.split(' ')[0] || 'Esposo';
    const esposaNombre = datos.esposa.split(' ')[0] || 'Esposa';
    doc.save(`Certificado_Matrimonio_${esposoNombre}_y_${esposaNombre}.pdf`);
  };

  const handleReimprimirTabla = (m) => {
    generarPDF({
      esposo: m.esposo_nombre,
      esposa: m.esposa_nombre,
      padrino: "Verificado en sistema",
      madrina: "Verificado en sistema",
      parroquia: m.parroquia_nombre,
      sacerdote: m.sacerdote_nombre,
      fecha: m.fecha_matrimonio,
      libro: m.numero_libro,
      pagina: m.pagina_libro,
      seccion: m.seccion_libro
    });
  };

  const renderOpcionFeligres = (f, esPrincipal = false) => {
    if (f.ya_lo_tiene === 1) {
      const fechaFormat = f.fecha_sacramento ? new Date(f.fecha_sacramento).toLocaleDateString() : '';
      const texto = `🔴 [YA CASADO/A] ${f.nombre_completo} - ${f.parroquia_sacramento} (${fechaFormat})`;
      return <option key={f.id} value={f.id} disabled={esPrincipal}>{texto}</option>;
    }
    return <option key={f.id} value={f.id}>🟢 {f.nombre_completo} {f.documento_identidad ? `(CI: ${f.documento_identidad})` : ''}</option>;
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-200">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <button onClick={onVolver} className="text-sm text-emerald-700 font-semibold hover:underline cursor-pointer">← Volver al Panel</button>
          <h2 className="text-2xl font-bold text-gray-900">Módulo de Matrimonios</h2>
        </div>
        <button onClick={() => setMostrarModal(true)} className="px-4 py-2 bg-emerald-700 text-white font-semibold rounded-lg text-sm hover:bg-emerald-800 transition-colors cursor-pointer">
          + Registrar Acta Matrimonial
        </button>
      </div>

      {/* Buscador */}
      <input 
        type="text" 
        placeholder="🔍 Buscar por apellidos de los esposos..." 
        className="w-full p-2 border border-gray-300 rounded-lg mb-4 text-sm focus:outline-emerald-500"
        value={busqueda} 
        onChange={(e) => setBusqueda(e.target.value)}
      />

      {/* Tabla Histórica */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-gray-100 uppercase text-xs font-bold text-gray-700 border-b border-gray-200">
            <tr>
              <th className="p-3">Esposo (Él)</th>
              <th className="p-3">Esposa (Ella)</th>
              <th className="p-3">Fecha de Unión</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {listaMatrimonios && listaMatrimonios.length > 0 ? (
              listaMatrimonios.map(m => (
                <tr key={m.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="p-3 font-medium text-blue-900">{m.esposo_nombre}</td>
                  <td className="p-3 font-medium text-pink-900">{m.esposa_nombre}</td>
                  <td className="p-3 text-gray-600">{m.fecha_matrimonio}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => handleReimprimirTabla(m)} className="text-emerald-600 font-bold hover:underline cursor-pointer">🖨️ Reimprimir Certificado</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="4" className="p-4 text-center text-gray-400 italic">No se encontraron actas de matrimonios registradas.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Formulario */}
      {mostrarModal && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-emerald-800 mb-4 border-b pb-2">Nueva Acta Canónica de Matrimonio</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                <div>
                  <label className="block text-xs font-bold text-blue-900 uppercase mb-1">Esposo (Contrayente Varón) *</label>
                  <select name="esposo_id" required value={form.esposo_id} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-emerald-500">
                    <option value="">-- Seleccionar Esposo --</option>
                    {recursos?.feligreses?.map(f => renderOpcionFeligres(f, true))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-pink-900 uppercase mb-1">Esposa (Contrayente Mujer) *</label>
                  <select name="esposa_id" required value={form.esposa_id} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-emerald-500">
                    <option value="">-- Seleccionar Esposa --</option>
                    {recursos?.feligreses?.map(f => renderOpcionFeligres(f, true))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Padrino de Boda</label>
                  <select name="padrino_id" value={form.padrino_id} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value="">-- No registra o Testigo --</option>
                    {recursos?.feligreses?.map(f => renderOpcionFeligres(f, false))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Madrina de Boda</label>
                  <select name="madrina_id" value={form.madrina_id} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value="">-- No registra o Testigo --</option>
                    {recursos?.feligreses?.map(f => renderOpcionFeligres(f, false))}
                  </select>
                </div>
              </div>

              {/* 🛠️ AQUI ESTÁN LOS TESTIGOS DE VUELTA DENTRO DEL FORMULARIO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Testigo 1 *</label>
                  <select name="testigo1_id" required value={form.testigo1_id} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value="">-- Seleccionar Testigo 1 --</option>
                    {recursos?.feligreses?.map(f => renderOpcionFeligres(f, false))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Testigo 2 *</label>
                  <select name="testigo2_id" required value={form.testigo2_id} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value="">-- Seleccionar Testigo 2 --</option>
                    {recursos?.feligreses?.map(f => renderOpcionFeligres(f, false))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Fecha de Boda *</label>
                  <input type="date" name="fecha_matrimonio" required value={form.fecha_matrimonio} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Sacerdote Celebrante *</label>
                  <select name="sacerdote_id" required value={form.sacerdote_id} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value="">-- Seleccionar Sacerdote --</option>
                    {recursos?.sacerdotes?.map(s => <option key={s.id} value={s.id}>{s.nombre_completo}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nº Libro *</label>
                  <input type="text" name="numero_libro" placeholder="Ej: 4" required value={form.numero_libro} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Página *</label>
                  <input type="text" name="pagina_libro" placeholder="Ej: 152" required value={form.pagina_libro} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Sección *</label>
                  <input type="text" name="seccion_libro" placeholder="Ej: Matrimonios" required value={form.seccion_libro} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setMostrarModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg cursor-pointer">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 transition-colors cursor-pointer">Guardar Acta</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Éxito */}
      {matrimonioExitoso && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/60 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">💍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">¡Matrimonio Registrado!</h3>
            <p className="text-sm text-gray-500 mb-4">El acta nupcial ha pasado todos los controles canónicos del sistema con éxito.</p>
            <div className="flex flex-col gap-3 mt-4">
              <button onClick={() => { generarPDF(datosImpresion); setMatrimonioExitoso(false); }} className="w-full py-3 bg-emerald-600 text-white font-bold rounded-lg shadow-md hover:bg-emerald-700 transition-all cursor-pointer">🖨️ Imprimir Certificado</button>
              <button onClick={() => setMatrimonioExitoso(false)} className="w-full py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg cursor-pointer">Cerrar Ventana</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}