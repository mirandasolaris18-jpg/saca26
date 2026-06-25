import React, { useState, useEffect } from "react";
import { fetchRecursosBautizo, createBautizo, fetchBautizos } from "../services/bautizosService";
import { jsPDF } from "jspdf"; 

export default function Bautizos({ onVolver }) {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [bautizoExitoso, setBautizoExitoso] = useState(false); 
  const [datosImpresion, setDatosImpresion] = useState(null); 
  
  // Estados para la Tabla y Búsqueda
  const [listaBautizos, setListaBautizos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  
  const [recursos, setRecursos] = useState({
    parroquias: [],
    sacerdotes: [],
    feligreses: []
  });

  // 🛠️ CORREGIDO: Eliminamos parroquia_id del estado
  const [form, setForm] = useState({
    feligres_id: "", padre_id: "", madre_id: "", padrino_id: "", madrina_id: "",
    fecha_bautizo: "", sacerdote_id: "", numero_libro: "", pagina_libro: "", seccion_libro: ""
  });

  const cargarDatos = async (termino = "") => {
    try {
      const rec = await fetchRecursosBautizo();
      if (rec && rec.feligreses) setRecursos(rec);

      const hist = await fetchBautizos(termino);
      
      // 🛡️ VALIDACIÓN DEFENSIVA PARA LA TABLA
      if (Array.isArray(hist)) {
        setListaBautizos(hist);
      } else if (hist && Array.isArray(hist.data)) {
        setListaBautizos(hist.data);
      } else {
        setListaBautizos([]);
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
      setListaBautizos([]);
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

    const { feligres_id, padre_id, madre_id, padrino_id, madrina_id } = form;
    
    // 🛡️ VALIDACIÓN UNIVERSITARIA
    if (
      (padre_id && feligres_id === padre_id) ||
      (madre_id && feligres_id === madre_id) ||
      (padrino_id && feligres_id === padrino_id) ||
      (madrina_id && feligres_id === madrina_id)
    ) {
      alert("❌ Validación fallida: El feligrés que se bautiza no puede ser seleccionado como su propio padre, madre, padrino o madrina.");
      return; 
    }

    try {
      await createBautizo(form);

      // Rescatar los nombres reales de las listas antes de limpiar el formulario para el PDF
      const nombreBautizado = recursos.feligreses.find(f => f.id == form.feligres_id)?.nombre_completo || "";
      const nombrePadre = recursos.feligreses.find(f => f.id == form.padre_id)?.nombre_completo || "---";
      const nombreMadre = recursos.feligreses.find(f => f.id == form.madre_id)?.nombre_completo || "---";
      const nombrePadrino = recursos.feligreses.find(f => f.id == form.padrino_id)?.nombre_completo || "---";
      const nombreMadrina = recursos.feligreses.find(f => f.id == form.madrina_id)?.nombre_completo || "---";
      const nombreSacerdote = recursos.sacerdotes.find(s => s.id == form.sacerdote_id)?.nombre_completo || "";

      // 🛠️ CORREGIDO: Extraemos al usuario actual para sacar el nombre de su parroquia
      const usuarioActual = JSON.parse(localStorage.getItem('usuario') || '{}');

      setDatosImpresion({
        bautizado: nombreBautizado,
        padre: nombrePadre,
        madre: nombreMadre,
        padrino: nombrePadrino,
        madrina: nombreMadrina,
        // 🛠️ Asignamos la parroquia correctamente
        parroquia: usuarioActual.parroquia_nombre || "Parroquia No Asignada",
        sacerdote: nombreSacerdote,
        fecha: form.fecha_bautizo,
        libro: form.numero_libro,
        pagina: form.pagina_libro,
        seccion: form.seccion_libro
      });

      setMostrarModal(false); 
      setBautizoExitoso(true); 
      cargarDatos(); // Refrescamos la tabla automáticamente
      
      setForm({
        feligres_id: "", padre_id: "", madre_id: "", padrino_id: "", madrina_id: "",
        fecha_bautizo: "", sacerdote_id: "", numero_libro: "", pagina_libro: "", seccion_libro: ""
      });
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  // Función para imprimir PDF con diseño formal
  const generarPDF = (datos) => {
    const doc = new jsPDF();

    // Bordes decorativos
    doc.setLineWidth(1);
    doc.rect(10, 10, 190, 277); 
    doc.rect(12, 12, 186, 273); 

    // Título Principal
    doc.setFontSize(24);
    doc.setFont("times", "bold");
    doc.setTextColor(184, 134, 11); // Color dorado
    doc.text("CERTIFICADO DE BAUTISMO", 105, 40, { align: "center" });

    // Parroquia
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(datos.parroquia.toUpperCase(), 105, 55, { align: "center" });

    // Texto de introducción
    doc.setFontSize(12);
    doc.setFont("times", "normal");
    doc.text(`Por el presente documento se certifica que el día ${datos.fecha},`, 105, 80, { align: "center" });
    doc.text("recibió el Sacramento del Bautismo:", 105, 90, { align: "center" });

    // Nombre del Bautizado
    doc.setFontSize(22);
    doc.setFont("times", "bold");
    doc.text(datos.bautizado.toUpperCase(), 105, 110, { align: "center" });

    // Datos Adicionales
    doc.setFontSize(12);
    doc.setFont("times", "normal");
    doc.text(`Hijo/a de:  ${datos.padre}`, 30, 135);
    doc.text(`Y de:         ${datos.madre}`, 30, 145);
    doc.text(`Padrino:    ${datos.padrino}`, 30, 165);
    doc.text(`Madrina:   ${datos.madrina}`, 30, 175);
    doc.text(`Ministro:   ${datos.sacerdote}`, 30, 195);

    // Datos del libro
    doc.setFont("times", "italic");
    doc.text(`Registrado en el Libro N° ${datos.libro}, Página ${datos.pagina}, Sección ${datos.seccion}.`, 105, 220, { align: "center" });

    // Líneas de firma
    doc.setLineWidth(0.5);
    doc.line(60, 250, 150, 250);
    doc.setFont("times", "normal");
    doc.text("Firma del Párroco y Sello Parroquial", 105, 260, { align: "center" });

    // Guardar el archivo
    doc.save(`Certificado_Bautismo_${datos.bautizado.replace(/\s+/g, '_')}.pdf`);
  };

  // Botón del Modal de Éxito
  const handleImprimirReciente = () => {
    if (datosImpresion) {
      generarPDF(datosImpresion);
      setBautizoExitoso(false);
    }
  };

  // Botón de la Tabla (Reimprimir)
  const handleReimprimirTabla = (b) => {
    const datosAdaptados = {
      bautizado: `${b.bautizado_apellido} ${b.bautizado_nombre}`,
      padre: "Registrado en expediente", 
      madre: "Registrado en expediente",
      padrino: "Registrado en expediente",
      madrina: "Registrado en expediente",
      parroquia: b.parroquia_nombre || "",
      sacerdote: b.sacerdote_nombre || "",
      fecha: b.fecha_bautizo,
      libro: b.numero_libro,
      pagina: b.pagina_libro,
      seccion: b.seccion_libro
    };
    generarPDF(datosAdaptados);
  };
// 🛠️ NUEVA FUNCIÓN: Dibuja las opciones del select con formato e información
  const renderOpcionFeligres = (f, esPrincipal = false) => {
    if (f.ya_lo_tiene === 1) {
      // Formateamos la fecha si existe
      const fechaFormat = f.fecha_sacramento ? new Date(f.fecha_sacramento).toLocaleDateString() : '';
      const texto = `🔴 [YA BAUTIZADO] ${f.nombre_completo} - ${f.parroquia_sacramento} (${fechaFormat})`;
      
      // Si es para el Bautizado principal, lo bloqueamos. Si es para Padre/Padrino, lo dejamos elegible.
      return <option key={f.id} value={f.id} disabled={esPrincipal}>{texto}</option>;
    }
    // Si no está bautizado, sale en verde
    return <option key={f.id} value={f.id}>🟢 {f.nombre_completo} {f.documento_identidad ? `(CI: ${f.documento_identidad})` : ''}</option>;
  };
  return (
    <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-200">
      
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <button onClick={onVolver} className="text-sm text-amber-600 font-semibold hover:underline mb-1 cursor-pointer">
            ← Volver al Panel
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Módulo de Bautizos</h2>
        </div>
        <button onClick={() => setMostrarModal(true)} className="px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg text-sm hover:bg-amber-700 cursor-pointer">
          + Registrar Nueva Acta
        </button>
      </div>

      {/* TABLA DE HISTORIAL CON BUSCADOR */}
      <div className="mt-6">
        <input 
          type="text" 
          placeholder="🔍 Buscar por nombre o CI..." 
          className="w-full p-2 border border-gray-300 rounded-lg mb-4"
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); cargarDatos(e.target.value); }}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border border-gray-200">
            <thead className="bg-gray-100 uppercase text-xs font-bold text-gray-700">
              <tr>
                <th className="p-3">Bautizado</th>
                <th className="p-3">Fecha</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {listaBautizos.length > 0 ? (
                listaBautizos.map(b => (
                  <tr key={b.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{b.bautizado_apellido} {b.bautizado_nombre}</td>
                    <td className="p-3">{b.fecha_bautizo}</td>
                    <td className="p-3 text-center">
                      <button 
                        onClick={() => handleReimprimirTabla(b)} 
                        className="text-blue-600 font-bold hover:underline cursor-pointer"
                      >
                        🖨️ Reimprimir
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="p-4 text-center text-gray-500">No se encontraron registros.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE REGISTRO */}
      {mostrarModal && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Nueva Acta de Bautizo</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <label className="block text-xs font-bold text-blue-800 uppercase mb-1">Feligrés a Bautizar *</label>
                <select name="feligres_id" required value={form.feligres_id} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                  <option value="">-- Seleccionar Feligrés --</option>
                  {recursos.feligreses.map(f => renderOpcionFeligres(f, false))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Padre</label>
                  <select name="padre_id" value={form.padre_id} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value="">-- No registra / Desconocido --</option>
                    {recursos.feligreses.map(f => <option key={f.id} value={f.id}>{f.nombre_completo}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Madre</label>
                  <select name="madre_id" value={form.madre_id} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value="">-- No registra / Desconocida --</option>
                    {recursos.feligreses.map(f => <option key={f.id} value={f.id}>{f.nombre_completo}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Padrino</label>
                  <select name="padrino_id" value={form.padrino_id} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value="">-- No registra --</option>
                    {recursos.feligreses.map(f => <option key={f.id} value={f.id}>{f.nombre_completo}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Madrina</label>
                  <select name="madrina_id" value={form.madrina_id} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value="">-- No registra --</option>
                    {recursos.feligreses.map(f => <option key={f.id} value={f.id}>{f.nombre_completo}</option>)}
                  </select>
                </div>
              </div>

              {/* 🛠️ CORREGIDO: Reducido a grid-cols-2 porque quitamos la parroquia */}
              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Fecha *</label>
                  <input type="date" name="fecha_bautizo" required value={form.fecha_bautizo} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Sacerdote *</label>
                  <select name="sacerdote_id" required value={form.sacerdote_id} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value="">-- Seleccionar --</option>
                    {recursos.sacerdotes.map(s => <option key={s.id} value={s.id}>{s.nombre_completo}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nº de Libro *</label>
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
                <button type="button" onClick={() => setMostrarModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg cursor-pointer">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 cursor-pointer">Guardar Acta</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE ÉXITO E IMPRESIÓN */}
      {bautizoExitoso && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/60 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-8 text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
              ✅
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">¡Bautizo Registrado!</h3>
            <p className="text-sm text-gray-500 mb-6">El acta se ha guardado correctamente en la base de datos.</p>
            
            <div className="flex flex-col gap-3">
              <button onClick={handleImprimirReciente} className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md flex items-center justify-center gap-2 cursor-pointer">
                🖨️ Imprimir Certificado
              </button>
              <button onClick={() => setBautizoExitoso(false)} className="w-full py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 cursor-pointer">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}