import React, { useState, useEffect } from "react";
import { fetchRecursosBautizo, createBautizo, fetchBautizos } from "../services/bautizosService";
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
    // 1. Limpiamos la hora por si viene en formato ISO (ej: 2024-10-15T00:00:00.000Z)
    const soloFecha = fechaStr.split('T')[0];
    const [year, month, day] = soloFecha.split('-');
    
    if (!year || !month || !day) return { diaLit: "___", mesLit: "___", anoLit: "___" };
    
    // 2. Creamos la fecha usando año, mes (0-indexado) y día
    const fecha = new Date(year, month - 1, day);
    
    const diaLit = numALetrasDia(fecha.getDate());
    const mesLit = fecha.toLocaleDateString('es-ES', { month: 'long' });
    const anoLit = numALetrasAno(fecha.getFullYear());
    
    return { diaLit, mesLit, anoLit };
  } catch (error) {
    return { diaLit: "___", mesLit: "___", anoLit: "___" };
  }
};

export default function Bautizos({ onVolver }) {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [bautizoExitoso, setBautizoExitoso] = useState(false); 
  const [datosImpresion, setDatosImpresion] = useState(null); 
  
  const [listaBautizos, setListaBautizos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  
  const [recursos, setRecursos] = useState({
    parroquias: [],
    sacerdotes: [],
    feligreses: []
  });

  const [form, setForm] = useState({
    feligres_id: "", padre_id: "", madre_id: "", padrino_id: "", madrina_id: "",
    fecha_bautizo: "", sacerdote_id: "", numero_libro: "", pagina_libro: "", seccion_libro: ""
  });

  const cargarDatos = async (termino = "") => {
    try {
      const rec = await fetchRecursosBautizo();
      if (rec && rec.feligreses) setRecursos(rec);

      const hist = await fetchBautizos(termino);
      
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

      // 1. Extraer los datos del bautizado
      const feligresObj = recursos.feligreses.find(f => f.id == form.feligres_id);
      const nombreBautizado = feligresObj?.nombre_completo || "";
      const soloNombreBautizado = feligresObj?.nombre || "";
      const ciudadNacimiento = feligresObj?.ciudad || "Oruro";
      const fechaNacimiento = feligresObj?.fecha_nacimiento || "";

      // 2. Extraer nombres del resto de involucrados
      const nombrePadre = recursos.feligreses.find(f => f.id == form.padre_id)?.nombre_completo || "---";
      const nombreMadre = recursos.feligreses.find(f => f.id == form.madre_id)?.nombre_completo || "---";
      const nombrePadrino = recursos.feligreses.find(f => f.id == form.padrino_id)?.nombre_completo || "---";
      const nombreMadrina = recursos.feligreses.find(f => f.id == form.madrina_id)?.nombre_completo || "---";
      const nombreSacerdote = recursos.sacerdotes.find(s => s.id == form.sacerdote_id)?.nombre_completo || "";

      const usuarioActual = JSON.parse(localStorage.getItem('usuario') || '{}');

      // ID Temporal o Simulado para el Número de Serie
      const numeroSerie = Math.floor(Math.random() * 10000).toString().padStart(5, '0');

      setDatosImpresion({
        serie: numeroSerie,
        bautizado_completo: nombreBautizado,
        bautizado_nombre: soloNombreBautizado,
        ciudad_nacimiento: ciudadNacimiento,
        fecha_nacimiento: fechaNacimiento,
        padre: nombrePadre,
        madre: nombreMadre,
        padrino: nombrePadrino,
        madrina: nombreMadrina,
        parroquia: usuarioActual.parroquia_nombre || "Parroquia No Asignada",
        sacerdote: nombreSacerdote,
        fecha_bautizo: form.fecha_bautizo,
        libro: form.numero_libro,
        pagina: form.pagina_libro,
        seccion: form.seccion_libro,
        obispo: "Mons. Krzysztof Bialasik"
      });

      setMostrarModal(false); 
      setBautizoExitoso(true); 
      cargarDatos(); 
      
      setForm({
        feligres_id: "", padre_id: "", madre_id: "", padrino_id: "", madrina_id: "",
        fecha_bautizo: "", sacerdote_id: "", numero_libro: "", pagina_libro: "", seccion_libro: ""
      });
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  const generarPDF = (datos) => {
    const doc = new jsPDF();

    // --- ENCABEZADO ---
    // Placeholder para el Logo (Superior Izquierda)
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(15, 15, 25, 30);
    doc.setFontSize(8);
    doc.text("LOGO", 27.5, 30, { align: "center" });

    // Título Central
    doc.setFontSize(14);
    doc.setFont("times", "bold");
    doc.text("DIÓCESIS DE ORURO BOLIVIA", 105, 25, { align: "center" });

    doc.setFontSize(20);
    doc.text("CERTIFICADO DE BAUTISMO", 105, 35, { align: "center" });

    // Número de Serie (Superior Derecha)
    doc.setFontSize(12);
    doc.setTextColor(200, 0, 0); // Rojo para número de serie
    doc.text(`N° ${datos.serie || "00000"}`, 195, 25, { align: "right" });
    doc.setTextColor(0, 0, 0); // Regresar a negro

    // --- DATOS DEL PÁRROCO ---
    doc.setFont("times", "normal");
    doc.setFontSize(12);
    doc.text(`IGLESIA PARROQUIAL DE ${datos.parroquia.toUpperCase()}`, 15, 60);
    doc.text(`El presbítero ${datos.sacerdote}, de la mencionada parroquia:`, 15, 70);

    // --- CERTIFICACIÓN ---
    doc.setFont("times", "bold");
    doc.text("CERTIFICA:", 15, 85);
    
    doc.setFont("times", "normal");
    doc.text(`Que en el libro ${datos.libro} en la página N° ${datos.pagina} se halla inscrita la partida bautismal de:`, 15, 95);

    // Nombre del Bautizado en grande
    doc.setFontSize(18);
    doc.setFont("times", "bold");
    doc.text(datos.bautizado_completo.toUpperCase(), 105, 110, { align: "center" });

    // --- CONVERSIÓN DE FECHAS A LITERALES ---
    const bautizoLit = formatearFechaLiteral(datos.fecha_bautizo);
    const nacLit = formatearFechaLiteral(datos.fecha_nacimiento);
    
    // --- LÓGICA DE PADRINOS ---
    let textoPadrinos = "";
    if (datos.padrino !== "---" && datos.madrina !== "---") {
      textoPadrinos = `fueron padrinos ${datos.padrino} y ${datos.madrina}`;
    } else if (datos.padrino !== "---") {
      textoPadrinos = `fue padrino ${datos.padrino}`;
    } else if (datos.madrina !== "---") {
      textoPadrinos = `fue madrina ${datos.madrina}`;
    } else {
      textoPadrinos = "no se registraron padrinos";
    }

    // --- PÁRRAFO PRINCIPAL ---
    doc.setFontSize(12);
    doc.setFont("times", "normal");
    
    const parrafo = `En la parroquia de: ${datos.parroquia}, el día ${bautizoLit.diaLit} del mes de: ${bautizoLit.mesLit}, del año: ${bautizoLit.anoLit}, yo el párroco bauticé a: ${datos.bautizado_nombre}. Nacido(a) en: ${datos.ciudad_nacimiento}, el día ${nacLit.diaLit} de ${nacLit.mesLit} de ${nacLit.anoLit}, hijo(a) de ${datos.padre} y de ${datos.madre}, ${textoPadrinos}, de lo que como párroco doy fe ${datos.obispo}.`;

    const yParrafo = 125;
    
    // Configuración para texto justificado con interlineado doble
    doc.text(parrafo, 15, yParrafo, { 
      maxWidth: 180, 
      align: "justify", 
      lineHeightFactor: 2.0 
    });

    // --- COPIA FIEL Y FECHA DE IMPRESIÓN ---
    // Calculamos dónde terminó el párrafo para dar los saltos de línea correctos
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

    doc.save(`Certificado_Bautismo_${datos.bautizado_completo.replace(/\s+/g, '_')}.pdf`);
  };

  const handleImprimirReciente = () => {
    if (datosImpresion) {
      generarPDF(datosImpresion);
      setBautizoExitoso(false);
    }
  };

  const handleReimprimirTabla = (b) => {
    const datosAdaptados = {
      serie: "RE-" + b.id,
      bautizado_completo: `${b.bautizado_apellido} ${b.bautizado_nombre}`,
      bautizado_nombre: b.bautizado_nombre,
      ciudad_nacimiento: b.ciudad_nacimiento || "Oruro", 
      fecha_nacimiento: b.fecha_nacimiento || "2000-01-01", 
      padre: "Registrado en libro", 
      madre: "Registrado en libro",
      padrino: "Registrado en libro",
      madrina: "---",
      parroquia: b.parroquia_nombre || "",
      sacerdote: b.sacerdote_nombre || "",
      fecha_bautizo: b.fecha_bautizo,
      libro: b.numero_libro,
      pagina: b.pagina_libro,
      seccion: b.seccion_libro,
      obispo: "Mons. Krzysztof Bialasik"
    };
    generarPDF(datosAdaptados);
  };

  const renderOpcionFeligres = (f, esPrincipal = false) => {
    if (f.ya_lo_tiene === 1) {
      const fechaFormat = f.fecha_sacramento ? new Date(f.fecha_sacramento).toLocaleDateString() : '';
      const texto = `🔴 [YA BAUTIZADO] ${f.nombre_completo} - ${f.parroquia_sacramento} (${fechaFormat})`;
      return <option key={f.id} value={f.id} disabled={esPrincipal}>{texto}</option>;
    }
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
          + Nuevo Registro
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
            <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Nuevo Registro de Bautizo</h3>

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