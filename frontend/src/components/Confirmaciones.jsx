import React, { useState, useEffect } from "react";
import { fetchRecursosConfirmacion, createConfirmacion, fetchConfirmaciones } from "../services/confirmacionesService";
import { jsPDF } from "jspdf";

// --- UTILIDADES PARA FECHAS LITERALES ---
const numALetrasDia = (num) => {
  const dias = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve", "treinta", "treinta y uno"];
  return dias[parseInt(num, 10)] || num;
};

const numALetrasAno = (num) => {
  const anos = { 2020: "dos mil veinte", 2021: "dos mil veintiuno", 2022: "dos mil veintidós", 2023: "dos mil veintitrés", 2024: "dos mil veinticuatro", 2025: "dos mil veinticinco", 2026: "dos mil veintiséis", 2027: "dos mil veintisiete", 2028: "dos mil veintiocho", 2029: "dos mil veintinueve", 2030: "dos mil treinta" };
  return anos[parseInt(num, 10)] || num;
};

const formatearFechaLiteral = (fechaStr) => {
  if (!fechaStr) return { diaLit: "___", mesLit: "___", anoLit: "___" };
  try {
    const soloFecha = fechaStr.split('T')[0];
    const [year, month, day] = soloFecha.split('-');
    
    if (!year || !month || !day) return { diaLit: "___", mesLit: "___", anoLit: "___" };
    
    const fecha = new Date(year, month - 1, day);
    
    const diaLit = numALetrasDia(fecha.getDate());
    const mesLit = fecha.toLocaleDateString('es-ES', { month: 'long' });
    const anoLit = numALetrasAno(fecha.getFullYear());
    
    return { diaLit, mesLit, anoLit };
  } catch (error) {
    return { diaLit: "___", mesLit: "___", anoLit: "___" };
  }
};

export default function Confirmaciones({ onVolver }) {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [confirmacionExitosa, setConfirmacionExitosa] = useState(false);
  const [datosImpresion, setDatosImpresion] = useState(null);
  
  const [listaConfirmaciones, setListaConfirmaciones] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [recursos, setRecursos] = useState({ parroquias: [], sacerdotes: [], feligreses: [] });

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
    
    if (!form.padrino_id && !form.madrina_id) {
      alert("❌ Por favor seleccione al menos un Padrino o una Madrina."); return;
    }

    if (form.feligres_id === form.padrino_id || form.feligres_id === form.madrina_id) {
      alert("❌ El confirmado no puede ser su propio padrino o madrina."); return;
    }

    try {
      await createConfirmacion(form);
      
      const feligresObj = recursos.feligreses.find(f => f.id == form.feligres_id);
      const nombreConfirmadoCompleto = feligresObj?.nombre_completo || "";
      const nombreConfirmadoSolo = feligresObj?.nombre || "";
      
      // Ajuste: Buscar variaciones del nombre del campo de bautizo que pueda enviar tu BD
      const parroquiaBautizo = feligresObj?.bautizo_parroquia || feligresObj?.parroquia_bautizo || "_________________";
      const fechaBautizo = feligresObj?.bautizo_fecha || feligresObj?.fecha_bautizo || "";

      let nombreSponsor = "---";
      let prefijoSponsor = "fue padrino";
      if (form.padrino_id) {
        nombreSponsor = recursos.feligreses.find(f => f.id == form.padrino_id)?.nombre_completo || "---";
        prefijoSponsor = "fue padrino";
      } else if (form.madrina_id) {
        nombreSponsor = recursos.feligreses.find(f => f.id == form.madrina_id)?.nombre_completo || "---";
        prefijoSponsor = "fue madrina";
      }
      
      const usuarioActual = JSON.parse(localStorage.getItem('usuario') || '{}');
      const nombreSacerdote = recursos.sacerdotes.find(s => s.id == form.sacerdote_id)?.nombre_completo || "";
      
      const numeroSerie = Math.floor(Math.random() * 10000).toString().padStart(5, '0');

      setDatosImpresion({
        serie: numeroSerie,
        confirmado_completo: nombreConfirmadoCompleto,
        confirmado_nombre: nombreConfirmadoSolo,
        parroquia_bautizo: parroquiaBautizo,
        fecha_bautizo: fechaBautizo,
        sponsor_nombre: nombreSponsor,
        sponsor_prefijo: prefijoSponsor,
        parroquia: usuarioActual.parroquia_nombre || "Parroquia No Asignada",
        sacerdote: nombreSacerdote,
        fecha_confirmacion: form.fecha_confirmacion,
        libro: form.numero_libro,
        pagina: form.pagina_libro,
        seccion: form.seccion_libro,
        obispo: "Mons. Krzysztof Bialasik"
      });

      setMostrarModal(false);
      setConfirmacionExitosa(true);
      cargarDatos();
      
      setForm({ feligres_id: "", padrino_id: "", madrina_id: "", fecha_confirmacion: "", sacerdote_id: "", numero_libro: "", pagina_libro: "", seccion_libro: "" });
    } catch (error) {
      alert(error.message); 
    }
  };

  const generarPDF = (datos) => {
    const doc = new jsPDF();

    // --- ENCABEZADO ---
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(15, 15, 25, 30);
    doc.setFontSize(8);
    doc.text("LOGO", 27.5, 30, { align: "center" });

    doc.setFontSize(14);
    doc.setFont("times", "bold");
    doc.text("DIÓCESIS DE ORURO BOLIVIA", 105, 25, { align: "center" });

    doc.setFontSize(20);
    doc.text("CERTIFICADO DE CONFIRMACIÓN", 105, 35, { align: "center" });

    doc.setFontSize(12);
    doc.setTextColor(200, 0, 0); 
    doc.text(`N° ${datos.serie || "00000"}`, 195, 25, { align: "right" });
    doc.setTextColor(0, 0, 0); 

    // --- DATOS DEL PÁRROCO ---
    doc.setFont("times", "normal");
    doc.setFontSize(12);
    doc.text(`IGLESIA PARROQUIAL DE ${datos.parroquia.toUpperCase()}`, 15, 60);
    doc.text(`El presbítero ${datos.sacerdote}, de la mencionada parroquia:`, 15, 70);

    // --- CERTIFICACIÓN ---
    doc.setFont("times", "bold");
    doc.text("CERTIFICA:", 15, 85);
    
    doc.setFont("times", "normal");
    doc.text(`Que en el libro ${datos.libro} en la página N° ${datos.pagina} se halla inscrita la partida de confirmación de:`, 15, 95);

    doc.setFontSize(18);
    doc.setFont("times", "bold");
    doc.text(datos.confirmado_completo.toUpperCase(), 105, 110, { align: "center" });

    // --- CONVERSIÓN DE FECHAS ---
    const confLit = formatearFechaLiteral(datos.fecha_confirmacion);
    const bautLit = formatearFechaLiteral(datos.fecha_bautizo);

    // --- PÁRRAFO PRINCIPAL (JUSTIFICADO Y DOBLE INTERLINEADO) ---
    doc.setFontSize(12);
    doc.setFont("times", "normal");
    
    const parrafo = `En la parroquia de: ${datos.parroquia}, el día ${confLit.diaLit} del mes de: ${confLit.mesLit}, del año: ${confLit.anoLit}, yo el párroco confirmé a: ${datos.confirmado_nombre}. Quien fue bautizado(a) en la parroquia de: ${datos.parroquia_bautizo}, el día ${bautLit.diaLit} de ${bautLit.mesLit} de ${bautLit.anoLit}, ${datos.sponsor_prefijo} ${datos.sponsor_nombre}, de lo que como párroco doy fe ${datos.obispo}.`;

    const yParrafo = 125;
    
    doc.text(parrafo, 15, yParrafo, { 
      maxWidth: 180, 
      align: "justify", 
      lineHeightFactor: 2.0 
    });

    // --- COPIA FIEL Y FECHA ---
    const lineasParrafo = doc.splitTextToSize(parrafo, 180);
    const yCopia = yParrafo + (lineasParrafo.length * 8.5) + 15; 
    
    doc.text("Es copia fiel del original.", 105, yCopia, { align: "center" });

    const hoy = new Date();
    const mesHoyLit = hoy.toLocaleDateString('es-ES', { month: 'long' });
    const fechaImpresion = `Oruro, ${hoy.getDate()} de ${mesHoyLit} de ${hoy.getFullYear()}`;
    doc.text(fechaImpresion, 105, yCopia + 10, { align: "center" });

    // --- FIRMA ---
    const yFirma = yCopia + 45;
    doc.setLineWidth(0.5);
    doc.line(75, yFirma, 135, yFirma);
    doc.setFont("times", "bold");
    doc.text("Firma y Sello del Sacerdote", 105, yFirma + 5, { align: "center" });

    // --- PIE DE PÁGINA ---
    doc.setFontSize(9);
    doc.setFont("times", "italic");
    doc.setTextColor(100, 100, 100);
    doc.text("Propiedad exclusiva de la Diócesis de Oruro. Prohibida su alteración a estos datos oficiales.", 105, 285, { align: "center" });
    
    doc.save(`Certificado_Confirmacion_${datos.confirmado_completo.replace(/\s+/g, '_')}.pdf`);
  };

  const handleImprimirReciente = () => {
    if (datosImpresion) {
      generarPDF(datosImpresion);
      setConfirmacionExitosa(false);
    }
  };

  const handleReimprimirTabla = (c) => {
    // Al reimprimir desde la tabla, buscamos las variables extraídas de la DB
    const datosAdaptados = {
      serie: "RE-" + c.id,
      confirmado_completo: `${c.confirmado_apellido} ${c.confirmado_nombre}`,
      confirmado_nombre: c.confirmado_nombre,
      parroquia_bautizo: c.bautizo_parroquia || c.parroquia_bautizo || "_________________",
      fecha_bautizo: c.bautizo_fecha || c.fecha_bautizo || "",
      sponsor_nombre: "Registrado en libro",
      sponsor_prefijo: "fue padrino/madrina",
      parroquia: c.parroquia_nombre || "",
      sacerdote: c.sacerdote_nombre || "",
      fecha_confirmacion: c.fecha_confirmacion,
      libro: c.numero_libro,
      pagina: c.pagina_libro,
      seccion: c.seccion_libro,
      obispo: "Mons. Krzysztof Bialasik"
    };
    generarPDF(datosAdaptados);
  };

  const renderOpcionFeligres = (f, esPrincipal = false) => {
    if (f.ya_lo_tiene === 1) {
      const fechaFormat = f.fecha_sacramento ? new Date(f.fecha_sacramento).toLocaleDateString() : '';
      const texto = `🔴 [YA CONFIRMADO] ${f.nombre_completo} - ${f.parroquia_sacramento} (${fechaFormat})`;
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
          + Nuevo Registro
        </button>
      </div>

      <input 
        type="text" placeholder="🔍 Buscar por nombre o CI..." 
        className="w-full p-2 border border-gray-300 rounded-lg mb-4"
        value={busqueda} onChange={(e) => { setBusqueda(e.target.value); cargarDatos(e.target.value); }}
      />

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border border-gray-200">
          <thead className="bg-gray-100 uppercase text-xs font-bold text-gray-700">
            <tr><th className="p-3">Confirmado</th><th className="p-3">Fecha</th><th className="p-3 text-center">Acciones</th></tr>
          </thead>
          <tbody>
            {listaConfirmaciones.length > 0 ? (
              listaConfirmaciones.map(c => (
                <tr key={c.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{c.confirmado_apellido} {c.confirmado_nombre}</td>
                  <td className="p-3">{c.fecha_confirmacion}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => handleReimprimirTabla(c)} className="text-blue-600 font-bold hover:underline">🖨️ Reimprimir</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="3" className="p-4 text-center text-gray-500">No se encontraron registros.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {mostrarModal && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-red-800 mb-4 border-b pb-2">Nuevo registro de Confirmación</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                <label className="block text-xs font-bold text-red-800 uppercase mb-1">Feligrés a Confirmar *</label>
                <select name="feligres_id" required value={form.feligres_id} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                  <option value="">-- Seleccionar Feligrés --</option>
                  {recursos.feligreses.map(f => renderOpcionFeligres(f, true))}
                </select>
              </div>

              <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                <p className="text-xs text-gray-500 mb-2 italic">⚠️ Seleccione solo un Padrino o una Madrina.</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Padrino</label>
                    <select name="padrino_id" value={form.padrino_id} onChange={handleChange} disabled={form.madrina_id !== ""} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white disabled:bg-gray-200">
                      <option value="">-- No registra --</option>
                      {recursos.feligreses.map(f => renderOpcionFeligres(f, false))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Madrina</label>
                    <select name="madrina_id" value={form.madrina_id} onChange={handleChange} disabled={form.padrino_id !== ""} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white disabled:bg-gray-200">
                      <option value="">-- No registra --</option>
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
              <button onClick={handleImprimirReciente} className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md">🖨️ Imprimir Certificado</button>
              <button onClick={() => setConfirmacionExitosa(false)} className="w-full py-2 bg-gray-100 font-semibold rounded-lg">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}