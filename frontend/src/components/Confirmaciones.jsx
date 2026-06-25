import React, { useState, useEffect } from "react";
import { fetchRecursosConfirmacion, createConfirmacion, fetchConfirmaciones } from "../services/confirmacionesService";
import { jsPDF } from "jspdf";

export default function Confirmaciones({ onVolver }) {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [confirmacionExitosa, setConfirmacionExitosa] = useState(false);
  const [datosImpresion, setDatosImpresion] = useState(null);
  
  const [listaConfirmaciones, setListaConfirmaciones] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [recursos, setRecursos] = useState({ parroquias: [], sacerdotes: [], feligreses: [] });

  // 🛠️ CORREGIDO: Eliminamos parroquia_id del estado inicial
  const [form, setForm] = useState({
    feligres_id: "", padrino_id: "", madrina_id: "", fecha_confirmacion: "", 
    sacerdote_id: "", numero_libro: "", pagina_libro: "", seccion_libro: ""
  });

  const cargarDatos = async (termino = "") => {
    try {
      const rec = await fetchRecursosConfirmacion();
      setRecursos(rec);
      const hist = await fetchConfirmaciones(termino);
      setListaConfirmaciones(hist);
    } catch (error) {
      console.error("Error cargando datos:", error);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 🛡️ Validaciones Locales Actualizadas
    if (!form.padrino_id && !form.madrina_id) {
      alert("❌ Por favor seleccione al menos un Padrino o una Madrina."); return;
    }

    if (form.feligres_id === form.padrino_id || form.feligres_id === form.madrina_id) {
      alert("❌ El confirmado no puede ser su propio padrino o madrina."); return;
    }

    try {
      await createConfirmacion(form);
      
      const nombreConfirmado = recursos.feligreses.find(f => f.id == form.feligres_id)?.nombre_completo || "";
      const nombrePadrino = form.padrino_id ? recursos.feligreses.find(f => f.id == form.padrino_id)?.nombre_completo : null;
      const nombreMadrina = form.madrina_id ? recursos.feligreses.find(f => f.id == form.madrina_id)?.nombre_completo : null;
      
      // Unimos los nombres si hay dos, o mostramos uno solo
      const arrSponsors = [];
      if (nombrePadrino) arrSponsors.push(nombrePadrino);
      if (nombreMadrina) arrSponsors.push(nombreMadrina);
      const sponsorFinal = arrSponsors.join(" y "); // "Padrino y Madrina"

      // 🛠️ CORREGIDO: Extraemos al usuario actual para sacar el nombre de su parroquia
      const usuarioActual = JSON.parse(localStorage.getItem('usuario') || '{}');
      const nombreSacerdote = recursos.sacerdotes.find(s => s.id == form.sacerdote_id)?.nombre_completo || "";

      setDatosImpresion({
        confirmado: nombreConfirmado,
        sponsor: sponsorFinal,
        // 🛠️ Asignamos la parroquia desde el localStorage
        parroquia: usuarioActual.parroquia_nombre || "Parroquia No Asignada",
        sacerdote: nombreSacerdote,
        fecha: form.fecha_confirmacion,
        libro: form.numero_libro,
        pagina: form.pagina_libro,
        seccion: form.seccion_libro
      });

      setMostrarModal(false);
      setConfirmacionExitosa(true);
      cargarDatos();
      
      // 🛠️ CORREGIDO: Quitamos parroquia_id del reinicio del formulario
      setForm({ feligres_id: "", padrino_id: "", madrina_id: "", fecha_confirmacion: "", sacerdote_id: "", numero_libro: "", pagina_libro: "", seccion_libro: "" });
    } catch (error) {
      alert(error.message); 
    }
  };

  const generarPDF = (datos) => {
    const doc = new jsPDF();
    doc.setLineWidth(1); doc.rect(10, 10, 190, 277); doc.rect(12, 12, 186, 273);
    
    doc.setFontSize(24); doc.setFont("times", "bold"); doc.setTextColor(178, 34, 34); // Rojo oscuro
    doc.text("CERTIFICADO DE CONFIRMACIÓN", 105, 40, { align: "center" });
    
    doc.setFontSize(14); doc.setTextColor(0, 0, 0);
    doc.text(datos.parroquia.toUpperCase(), 105, 55, { align: "center" });

    doc.setFontSize(12); doc.setFont("times", "normal");
    doc.text(`Por el presente certificamos que el día ${datos.fecha},`, 105, 80, { align: "center" });
    doc.text("recibió el Sacramento de la Confirmación:", 105, 90, { align: "center" });
    
    doc.setFontSize(22); doc.setFont("times", "bold");
    doc.text(datos.confirmado.toUpperCase(), 105, 110, { align: "center" });

    doc.setFontSize(12); doc.setFont("times", "normal");
    doc.text(`Padrino/Madrina:  ${datos.sponsor}`, 30, 140);
    doc.text(`Ministro:              ${datos.sacerdote}`, 30, 155);

    doc.setFont("times", "italic");
    doc.text(`Registrado en el Libro N° ${datos.libro}, Página ${datos.pagina}, Sección ${datos.seccion}.`, 105, 200, { align: "center" });

    doc.line(60, 240, 150, 240);
    doc.setFont("times", "normal"); doc.text("Firma del Obispo / Párroco", 105, 250, { align: "center" });
    
    doc.save(`Certificado_Confirmacion_${datos.confirmado.replace(/\s+/g, '_')}.pdf`);
  };

  const handleReimprimirTabla = (c) => {
    generarPDF({
      confirmado: `${c.confirmado_apellido} ${c.confirmado_nombre}`,
      parroquia: c.parroquia_nombre,
      sacerdote: c.sacerdote_nombre,
      fecha: c.fecha_confirmacion,
      libro: c.numero_libro,
      pagina: c.pagina_libro,
      seccion: c.seccion_libro,
      sponsor: "Registrado en sistema"
    });
  };

  // 🛠️ NUEVA FUNCIÓN: Formatea el texto de los feligreses con emojis e info extra
  const renderOpcionFeligres = (f, esPrincipal = false) => {
    if (f.ya_lo_tiene === 1) {
      // Formateamos la fecha si existe (evita errores si es null)
      const fechaFormat = f.fecha_sacramento ? new Date(f.fecha_sacramento).toLocaleDateString() : '';
      const texto = `🔴 [YA CONFIRMADO] ${f.nombre_completo} - ${f.parroquia_sacramento} (${fechaFormat})`;
      
      // Si es el confirmado principal, bloqueamos la opción
      return <option key={f.id} value={f.id} disabled={esPrincipal}>{texto}</option>;
    }
    return <option key={f.id} value={f.id}>🟢 {f.nombre_completo} {f.documento_identidad ? `(CI: ${f.documento_identidad})` : ''}</option>;
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <button onClick={onVolver} className="text-sm text-red-700 font-semibold hover:underline">← Volver al Panel</button>
          <h2 className="text-2xl font-bold text-gray-900">Módulo de Confirmaciones</h2>
        </div>
        <button onClick={() => setMostrarModal(true)} className="px-4 py-2 bg-red-700 text-white font-semibold rounded-lg text-sm hover:bg-red-800">
          + Registrar Nueva Acta
        </button>
      </div>

      <input 
        type="text" placeholder="🔍 Buscar por nombre o CI..." 
        className="w-full p-2 border border-gray-300 rounded-lg mb-4"
        value={busqueda} onChange={(e) => { setBusqueda(e.target.value); cargarDatos(e.target.value); }}
      />

      <table className="w-full text-sm text-left border border-gray-200">
        <thead className="bg-gray-100 uppercase text-xs font-bold text-gray-700">
          <tr><th className="p-3">Confirmado</th><th className="p-3">Fecha</th><th className="p-3 text-center">Acciones</th></tr>
        </thead>
        <tbody>
          {listaConfirmaciones.map(c => (
            <tr key={c.id} className="border-b hover:bg-gray-50">
              <td className="p-3 font-medium">{c.confirmado_apellido} {c.confirmado_nombre}</td>
              <td className="p-3">{c.fecha_confirmacion}</td>
              <td className="p-3 text-center">
                <button onClick={() => handleReimprimirTabla(c)} className="text-blue-600 font-bold hover:underline">🖨️ Reimprimir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {mostrarModal && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-red-800 mb-4 border-b pb-2">Nueva Acta de Confirmación</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                <label className="block text-xs font-bold text-red-800 uppercase mb-1">Feligrés a Confirmar *</label>
                <select name="feligres_id" required value={form.feligres_id} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                  <option value="">-- Seleccionar Feligrés --</option>
                  {/* 🛠️ APLICADO: Bloquea a los que ya están confirmados */}
                  {recursos.feligreses.map(f => renderOpcionFeligres(f, true))}
                </select>
              </div>

              <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                <p className="text-xs text-gray-500 mb-2 italic">⚠️ Seleccione al menos a uno (Padrino o Madrina). El seleccionado DEBE estar bautizado en el sistema.</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Padrino</label>
                    <select name="padrino_id" value={form.padrino_id} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                      <option value="">-- No registra --</option>
                      {/* 🛠️ APLICADO: No bloquea a los que ya están confirmados (pueden ser padrinos) */}
                      {recursos.feligreses.map(f => renderOpcionFeligres(f, false))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Madrina</label>
                    <select name="madrina_id" value={form.madrina_id} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                      <option value="">-- No registra --</option>
                      {/* 🛠️ APLICADO: No bloquea a los que ya están confirmados (pueden ser padrinos) */}
                      {recursos.feligreses.map(f => renderOpcionFeligres(f, false))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Fecha *</label>
                  <input type="date" name="fecha_confirmacion" required value={form.fecha_confirmacion} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Obispo/Sacerdote *</label>
                  <select name="sacerdote_id" required value={form.sacerdote_id} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value="">-- Seleccionar --</option>
                    {recursos.sacerdotes.map(s => <option key={s.id} value={s.id}>{s.nombre_completo}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nº Libro *</label>
                  <input type="text" name="numero_libro" required value={form.numero_libro} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Página *</label>
                  <input type="text" name="pagina_libro" required value={form.pagina_libro} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Sección *</label>
                  <input type="text" name="seccion_libro" required value={form.seccion_libro} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setMostrarModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-red-700 text-white text-sm font-semibold rounded-lg hover:bg-red-800">Guardar Acta</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmacionExitosa && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/60 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-8 text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">✅</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">¡Acta Registrada!</h3>
            <div className="flex flex-col gap-3 mt-4">
              <button onClick={() => { generarPDF(datosImpresion); setConfirmacionExitosa(false); }} className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md">🖨️ Imprimir Certificado</button>
              <button onClick={() => setConfirmacionExitosa(false)} className="w-full py-2 bg-gray-100 font-semibold rounded-lg">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}