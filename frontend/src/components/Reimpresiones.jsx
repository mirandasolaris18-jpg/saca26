import React, { useState, useEffect } from 'react';
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

export default function Reimpresiones({ tipo, onVolver, user }) {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [datosActaHtml, setDatosActaHtml] = useState(null); // Solo para el Acta de Matrimonio del Altar

  const titulos = {
    'bautizo': 'Reimpresión: Certificado de Bautismo',
    'confirmacion': 'Reimpresión: Certificado de Confirmación',
    'matrimonio': 'Reimpresión: Certificado de Matrimonio',
    'acta_matrimonio': 'Reimpresión: Acta de Matrimonio (Altar)'
  };

  // Limpiar y recargar cuando cambie de opción en el menú
  useEffect(() => {
    setBusqueda('');
    setResultados([]);
    cargarDatos('');
  }, [tipo]);

  const cargarDatos = async (termino) => {
    setCargando(true);
    const token = localStorage.getItem("token");
    const headers = { "Authorization": `Bearer ${token}` };
    try {
      let res;
      if (tipo === 'bautizo') {
        res = await fetch(`http://localhost:5000/api/bautizos?buscar=${termino}`, { headers });
      } else if (tipo === 'confirmacion') {
        res = await fetch(`http://localhost:5000/api/confirmaciones?buscar=${termino}`, { headers });
      } else {
        // Matrimonios (Certificados o Actas)
        res = await fetch(`http://localhost:5000/api/expedientes?buscar=${termino}`, { headers });
      }
      const data = await res.json();
      
      let list = Array.isArray(data) ? data : (data.data || []);
      
      // En matrimonios, solo permitimos reimprimir si el trámite ya está Completado
      if (tipo === 'matrimonio' || tipo === 'acta_matrimonio') {
        list = list.filter(exp => exp.estado_tramite === 'Completado');
      }
      setResultados(list);
    } catch (error) {
      console.error("Error buscando datos:", error);
    }
    setCargando(false);
  };

  // ==============================================================
  // GENERADORES DE PDF (Reutilizando la lógica que ya aprobaste)
  // ==============================================================
  
  const generarPDFBautizo = (datos) => {
    const doc = new jsPDF();
    doc.setDrawColor(0); doc.setLineWidth(0.5); doc.rect(15, 15, 25, 30);
    doc.setFontSize(8); doc.text("LOGO", 27.5, 30, { align: "center" });

    doc.setFontSize(14); doc.setFont("times", "bold");
    doc.text("DIÓCESIS DE ORURO BOLIVIA", 105, 25, { align: "center" });
    doc.setFontSize(20); doc.text("CERTIFICADO DE BAUTISMO", 105, 35, { align: "center" });

    doc.setFontSize(12); doc.setTextColor(200, 0, 0); 
    doc.text(`N° ${datos.serie || "00000"}`, 195, 25, { align: "right" });
    doc.setTextColor(0, 0, 0); 

    doc.setFont("times", "normal"); doc.setFontSize(12);
    doc.text(`IGLESIA PARROQUIAL DE ${datos.parroquia.toUpperCase()}`, 15, 60);
    doc.text(`El presbítero ${datos.sacerdote}, de la mencionada parroquia:`, 15, 70);

    doc.setFont("times", "bold"); doc.text("CERTIFICA:", 15, 85);
    doc.setFont("times", "normal");
    doc.text(`Que en el libro ${datos.libro} en la página N° ${datos.pagina} se halla inscrita la partida bautismal de:`, 15, 95);

    doc.setFontSize(18); doc.setFont("times", "bold");
    doc.text(datos.bautizado_completo.toUpperCase(), 105, 110, { align: "center" });

    const bautizoLit = formatearFechaLiteral(datos.fecha_bautizo);
    const nacLit = formatearFechaLiteral(datos.fecha_nacimiento);
    
    let textoPadrinos = "";
    if (datos.padrino !== "---" && datos.madrina !== "---") textoPadrinos = `fueron padrinos ${datos.padrino} y ${datos.madrina}`;
    else if (datos.padrino !== "---") textoPadrinos = `fue padrino ${datos.padrino}`;
    else if (datos.madrina !== "---") textoPadrinos = `fue madrina ${datos.madrina}`;
    else textoPadrinos = "no se registraron padrinos";

    doc.setFontSize(12); doc.setFont("times", "normal");
    const parrafo = `En la parroquia de: ${datos.parroquia}, el día ${bautizoLit.diaLit} del mes de: ${bautizoLit.mesLit}, del año: ${bautizoLit.anoLit}, yo el párroco bauticé a: ${datos.bautizado_nombre}. Nacido(a) en: ${datos.ciudad_nacimiento}, el día ${nacLit.diaLit} de ${nacLit.mesLit} de ${nacLit.anoLit}, hijo(a) de ${datos.padre} y de ${datos.madre}, ${textoPadrinos}, de lo que como párroco doy fe ${datos.obispo}.`;

    const yParrafo = 125;
    doc.text(parrafo, 15, yParrafo, { maxWidth: 180, align: "justify", lineHeightFactor: 2.0 });

    const lineasParrafo = doc.splitTextToSize(parrafo, 180);
    const yCopia = yParrafo + (lineasParrafo.length * 8.5) + 15; 
    
    doc.text("Es copia fiel del original.", 105, yCopia, { align: "center" });
    const hoy = new Date();
    const fechaImpresion = `Oruro, ${hoy.getDate()} de ${hoy.toLocaleDateString('es-ES', { month: 'long' })} de ${hoy.getFullYear()}`;
    doc.text(fechaImpresion, 105, yCopia + 10, { align: "center" });

    const yFirma = yCopia + 45;
    doc.setLineWidth(0.5); doc.line(75, yFirma, 135, yFirma);
    doc.setFont("times", "bold"); doc.text("Firma y Sello del Sacerdote", 105, yFirma + 5, { align: "center" });

    doc.setFontSize(9); doc.setFont("times", "italic"); doc.setTextColor(100, 100, 100);
    doc.text("Propiedad exclusiva de la Diócesis de Oruro. Prohibida su alteración a estos datos oficiales.", 105, 285, { align: "center" });

    doc.save(`Reimpresion_Bautismo_${datos.bautizado_completo.replace(/\s+/g, '_')}.pdf`);
  };

  const generarPDFConfirmacion = (datos) => {
    const doc = new jsPDF();
    doc.setDrawColor(0); doc.setLineWidth(0.5); doc.rect(15, 15, 25, 30);
    doc.setFontSize(8); doc.text("LOGO", 27.5, 30, { align: "center" });

    doc.setFontSize(14); doc.setFont("times", "bold");
    doc.text("DIÓCESIS DE ORURO BOLIVIA", 105, 25, { align: "center" });
    doc.setFontSize(20); doc.text("CERTIFICADO DE CONFIRMACIÓN", 105, 35, { align: "center" });

    doc.setFontSize(12); doc.setTextColor(200, 0, 0); 
    doc.text(`N° ${datos.serie || "00000"}`, 195, 25, { align: "right" });
    doc.setTextColor(0, 0, 0); 

    doc.setFont("times", "normal"); doc.setFontSize(12);
    doc.text(`IGLESIA PARROQUIAL DE ${datos.parroquia.toUpperCase()}`, 15, 60);
    doc.text(`El presbítero ${datos.sacerdote}, de la mencionada parroquia:`, 15, 70);

    doc.setFont("times", "bold"); doc.text("CERTIFICA:", 15, 85);
    doc.setFont("times", "normal");
    doc.text(`Que en el libro ${datos.libro} en la página N° ${datos.pagina} se halla inscrita la partida de confirmación de:`, 15, 95);

    doc.setFontSize(18); doc.setFont("times", "bold");
    doc.text(datos.confirmado_completo.toUpperCase(), 105, 110, { align: "center" });

    const confLit = formatearFechaLiteral(datos.fecha_confirmacion);
    const bautLit = formatearFechaLiteral(datos.fecha_bautizo);

    doc.setFontSize(12); doc.setFont("times", "normal");
    const parrafo = `En la parroquia de: ${datos.parroquia}, el día ${confLit.diaLit} del mes de: ${confLit.mesLit}, del año: ${confLit.anoLit}, yo el párroco confirmé a: ${datos.confirmado_nombre}. Quien fue bautizado(a) en la parroquia de: ${datos.parroquia_bautizo}, el día ${bautLit.diaLit} de ${bautLit.mesLit} de ${bautLit.anoLit}, ${datos.sponsor_prefijo} ${datos.sponsor_nombre}, de lo que como párroco doy fe ${datos.obispo}.`;

    const yParrafo = 125;
    doc.text(parrafo, 15, yParrafo, { maxWidth: 180, align: "justify", lineHeightFactor: 2.0 });

    const lineasParrafo = doc.splitTextToSize(parrafo, 180);
    const yCopia = yParrafo + (lineasParrafo.length * 8.5) + 15; 
    
    doc.text("Es copia fiel del original.", 105, yCopia, { align: "center" });
    const hoy = new Date();
    const fechaImpresion = `Oruro, ${hoy.getDate()} de ${hoy.toLocaleDateString('es-ES', { month: 'long' })} de ${hoy.getFullYear()}`;
    doc.text(fechaImpresion, 105, yCopia + 10, { align: "center" });

    const yFirma = yCopia + 45;
    doc.setLineWidth(0.5); doc.line(75, yFirma, 135, yFirma);
    doc.setFont("times", "bold"); doc.text("Firma y Sello del Sacerdote", 105, yFirma + 5, { align: "center" });

    doc.setFontSize(9); doc.setFont("times", "italic"); doc.setTextColor(100, 100, 100);
    doc.text("Propiedad exclusiva de la Diócesis de Oruro. Prohibida su alteración a estos datos oficiales.", 105, 285, { align: "center" });
    
    doc.save(`Reimpresion_Confirmacion_${datos.confirmado_completo.replace(/\s+/g, '_')}.pdf`);
  };

  const generarPDFMatrimonio = (datos) => {
    const doc = new jsPDF();
    doc.setDrawColor(0); doc.setLineWidth(0.5); doc.rect(15, 15, 25, 30);
    doc.setFontSize(8); doc.text("LOGO", 27.5, 30, { align: "center" });

    doc.setFontSize(14); doc.setFont("times", "bold");
    doc.text("DIÓCESIS DE ORURO BOLIVIA", 105, 25, { align: "center" });
    doc.setFontSize(20); doc.text("CERTIFICADO DE MATRIMONIO", 105, 35, { align: "center" });

    const numeroSerie = Math.floor(Math.random() * 10000).toString().padStart(5, '0');
    doc.setFontSize(12); doc.setTextColor(200, 0, 0); 
    doc.text(`N° ${numeroSerie}`, 195, 25, { align: "right" });
    doc.setTextColor(0, 0, 0); 

    doc.setFont("times", "normal"); doc.setFontSize(12);
    doc.text(`IGLESIA PARROQUIAL DE ${datos.parroquia_nombre?.toUpperCase() || '_________________'}`, 15, 60);
    doc.text(`El presbítero ${datos.parroco || '_________________'}, párroco de la mencionada parroquia:`, 15, 70);

    doc.setFont("times", "bold"); doc.text("CERTIFICA:", 15, 85);
    doc.setFont("times", "normal");
    doc.text(`Que en el libro ${datos.numero_libro || '___'} de matrimonios de este archivo parroquial, página ${datos.pagina_libro || '___'},`, 15, 95);
    doc.text(`número ${datos.numero_acta || '___'} se halla inscrita la siguiente partida matrimonial:`, 15, 102);

    const nombreNovio = `${datos.novio_nombre} ${datos.novio_apellido}`.toUpperCase();
    const nombreNovia = `${datos.novia_nombre} ${datos.novia_apellido}`.toUpperCase();
    
    doc.setFontSize(14); doc.setFont("times", "bold");
    doc.text(`${nombreNovio} Y ${nombreNovia}`, 105, 115, { align: "center" });

    const iMap = datos.intervinientes_map || {};
    const nomPadreNovio = iMap['Padre Novio'] ? `${iMap['Padre Novio'].nombre} ${iMap['Padre Novio'].apellido}` : '_________________';
    const nomMadreNovio = iMap['Madre Novio'] ? `${iMap['Madre Novio'].nombre} ${iMap['Madre Novio'].apellido}` : '_________________';
    const nomPadreNovia = iMap['Padre Novia'] ? `${iMap['Padre Novia'].nombre} ${iMap['Padre Novia'].apellido}` : '_________________';
    const nomMadreNovia = iMap['Madre Novia'] ? `${iMap['Madre Novia'].nombre} ${iMap['Madre Novia'].apellido}` : '_________________';
    const nomPadrino = iMap['Padrino'] ? `${iMap['Padrino'].nombre} ${iMap['Padrino'].apellido}` : '_________________';
    const nomMadrina = iMap['Madrina'] ? `${iMap['Madrina'].nombre} ${iMap['Madrina'].apellido}` : '_________________';
    const nomT1 = iMap['Testigo 1'] ? `${iMap['Testigo 1'].nombre} ${iMap['Testigo 1'].apellido}` : '_________________';
    const nomT2 = iMap['Testigo 2'] ? `${iMap['Testigo 2'].nombre} ${iMap['Testigo 2'].apellido}` : '_________________';

    const bodaLit = formatearFechaLiteral(datos.fecha_boda_programada);
    const civilLit = formatearFechaLiteral(datos.fecha_civil); 

    doc.setFontSize(12); doc.setFont("times", "normal");

    const parrafo1 = `En esta iglesia parroquial a los ${bodaLit.diaLit} del mes de ${bodaLit.mesLit} del año ${bodaLit.anoLit}, contrajeron matrimonio ${nombreNovio}, bautizado en la parroquia de ${datos.sacramentos_novio?.bautizo_parroquia || '_________________'}, hijo de ${nomPadreNovio} y de ${nomMadreNovio}, con: ${nombreNovia}, bautizada en la parroquia de ${datos.sacramentos_novia?.bautizo_parroquia || '_________________'}, hija de ${nomPadreNovia} y de ${nomMadreNovia}. Fueron padrinos ${nomPadrino} y ${nomMadrina}, siendo testigos presenciales ${nomT1} y ${nomT2}.`;

    const parrafo2 = `Lugar y fecha del matrimonio civil: ${datos.lugar_civil || '_________________'}, el día ${civilLit.diaLit} del mes de ${civilLit.mesLit} del año ${civilLit.anoLit}. Oficialía de registro civil N° ${datos.oficialia_civil || '___'}, partida N° ${datos.partida_civil || '___'}, número de registro ${datos.numero_civil || '___'}. Certificó ${datos.obispo_diocesis || '_________________'}.`;

    let yCursor = 125;
    
    doc.text(parrafo1, 15, yCursor, { maxWidth: 180, align: "justify", lineHeightFactor: 2.0 });
    const lineasP1 = doc.splitTextToSize(parrafo1, 180);
    yCursor += (lineasP1.length * 8.5) + 5; 

    doc.text(parrafo2, 15, yCursor, { maxWidth: 180, align: "justify", lineHeightFactor: 2.0 });
    const lineasP2 = doc.splitTextToSize(parrafo2, 180);
    yCursor += (lineasP2.length * 8.5) + 15; 

    doc.text("Es copia fiel del original.", 105, yCursor, { align: "center" });

    const hoy = new Date();
    const fechaImpresion = `Oruro, ${hoy.getDate()} de ${hoy.toLocaleDateString('es-ES', { month: 'long' })} de ${hoy.getFullYear()}`;
    doc.text(fechaImpresion, 105, yCursor + 10, { align: "center" });

    const yFirma = yCursor + 45;
    doc.setLineWidth(0.5); doc.line(75, yFirma, 135, yFirma);
    doc.setFont("times", "bold"); doc.text("Firma y Sello del Sacerdote", 105, yFirma + 5, { align: "center" });

    doc.setFontSize(9); doc.setFont("times", "italic"); doc.setTextColor(100, 100, 100);
    doc.text("Propiedad exclusiva de la Diócesis de Oruro. Prohibida su alteración a estos datos oficiales.", 105, 285, { align: "center" });
    
    doc.save(`Reimpresion_Matrimonio_${datos.expediente_id}.pdf`);
  };

  // ==============================================================
  // GESTIÓN DEL BOTÓN REIMPRIMIR
  // ==============================================================
  const handleImprimir = async (item) => {
    if (tipo === 'bautizo') {
      const datosAdaptados = {
        serie: "RE-" + item.id,
        bautizado_completo: `${item.bautizado_apellido} ${item.bautizado_nombre}`,
        bautizado_nombre: item.bautizado_nombre,
        ciudad_nacimiento: item.ciudad_nacimiento || "Oruro", 
        fecha_nacimiento: item.fecha_nacimiento || "2000-01-01", 
        padre: "Registrado en libro", 
        madre: "Registrado en libro",
        padrino: "Registrado en libro",
        madrina: "---",
        parroquia: item.parroquia_nombre || "",
        sacerdote: item.sacerdote_nombre || "",
        fecha_bautizo: item.fecha_bautizo,
        libro: item.numero_libro,
        pagina: item.pagina_libro,
        seccion: item.seccion_libro,
        obispo: "Mons. Krzysztof Bialasik"
      };
      generarPDFBautizo(datosAdaptados);
    } else if (tipo === 'confirmacion') {
      const datosAdaptados = {
        serie: "RE-" + item.id,
        confirmado_completo: `${item.confirmado_apellido} ${item.confirmado_nombre}`,
        confirmado_nombre: item.confirmado_nombre,
        parroquia_bautizo: item.bautizo_parroquia || item.parroquia_bautizo || "_________________",
        fecha_bautizo: item.bautizo_fecha || item.fecha_bautizo || "",
        sponsor_nombre: "Registrado en libro",
        sponsor_prefijo: "fue padrino/madrina",
        parroquia: item.parroquia_nombre || "",
        sacerdote: item.sacerdote_nombre || "",
        fecha_confirmacion: item.fecha_confirmacion,
        libro: item.numero_libro,
        pagina: item.pagina_libro,
        seccion: item.seccion_libro,
        obispo: "Mons. Krzysztof Bialasik"
      };
      generarPDFConfirmacion(datosAdaptados);
    } else {
      // Para matrimonios (Certificado PDF o Acta HTML del Altar), traemos los intervinientes completos
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5000/api/expedientes/${item.id}/impresion`, { headers: { "Authorization": `Bearer ${token}` } });
        const data = await res.json();
        
        const invMap = {};
        data.intervinientes.forEach(i => invMap[i.rol] = i);
        data.intervinientes_map = invMap;

        if (tipo === 'matrimonio') {
          generarPDFMatrimonio(data);
        } else if (tipo === 'acta_matrimonio') {
          setDatosActaHtml(data);
          setTimeout(() => { window.print(); setDatosActaHtml(null); }, 500);
        }
      } catch (error) {
        alert("Error obteniendo datos del expediente para imprimir.");
      }
    }
  };

  // Pre-cálculos para la vista del Acta en el Altar
  let diaBodaNum = "", mesBodaLit = "", anoBodaNum = "";
  if (datosActaHtml && datosActaHtml.fecha_boda_programada) {
    const fechaBodaObj = new Date(datosActaHtml.fecha_boda_programada);
    diaBodaNum = fechaBodaObj.getUTCDate();
    mesBodaLit = fechaBodaObj.toLocaleDateString('es-ES', { month: 'long', timeZone: 'UTC' });
    anoBodaNum = fechaBodaObj.getUTCFullYear();
  }

  return (
    <>
      <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-200 print:hidden animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <div>
            <button onClick={onVolver} className="text-sm text-gray-500 font-semibold hover:text-blue-700">← Volver al Panel</button>
            <h2 className="text-2xl font-bold text-gray-900 mt-1 flex items-center gap-2">
              <span className="text-3xl">🖨️</span> {titulos[tipo]}
            </h2>
          </div>
        </div>

        <input 
          type="text" 
          placeholder="🔍 Buscar por nombre o identificador..." 
          className="w-full p-2 border border-gray-300 rounded-lg mb-4"
          value={busqueda}
          onChange={handleBuscar}
        />

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm text-left border-collapse bg-white">
            <thead className="bg-gray-100 uppercase text-xs font-bold text-gray-700 border-b border-gray-200">
              <tr>
                {tipo === 'bautizo' && <th className="p-3">Bautizado</th>}
                {tipo === 'confirmacion' && <th className="p-3">Confirmado</th>}
                {(tipo === 'matrimonio' || tipo === 'acta_matrimonio') && <th className="p-3">Contrayentes (Expediente)</th>}
                <th className="p-3 text-center">Fecha de Sacramento</th>
                <th className="p-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cargando ? (
                <tr><td colSpan="3" className="p-6 text-center text-blue-600 font-bold animate-pulse">Buscando actas...</td></tr>
              ) : resultados.length > 0 ? (
                resultados.map(item => (
                  <tr key={item.id} className="hover:bg-blue-50 transition-colors">
                    
                    {tipo === 'bautizo' && <td className="p-3 font-semibold uppercase">{item.bautizado_apellido} {item.bautizado_nombre}</td>}
                    {tipo === 'confirmacion' && <td className="p-3 font-semibold uppercase">{item.confirmado_apellido} {item.confirmado_nombre}</td>}
                    
                    {(tipo === 'matrimonio' || tipo === 'acta_matrimonio') && (
                      <td className="p-3 font-medium uppercase">
                        <span className="text-blue-800 font-bold">{item.novio_nombre} {item.novio_apellido}</span> <br/>
                        <span className="text-pink-800 font-bold">{item.novia_nombre} {item.novia_apellido}</span>
                      </td>
                    )}
                    
                    <td className="p-3 text-center font-mono text-gray-600">
                      {tipo === 'bautizo' && item.fecha_bautizo}
                      {tipo === 'confirmacion' && item.fecha_confirmacion}
                      {(tipo === 'matrimonio' || tipo === 'acta_matrimonio') && new Date(item.fecha_boda_programada).toLocaleDateString('es-ES')}
                    </td>
                    
                    <td className="p-3 text-center">
                      <button onClick={() => handleImprimir(item)} className="px-3 py-1 bg-gray-800 text-white rounded text-xs font-bold hover:bg-gray-900 shadow">
                        🖨️ Procesar Reimpresión
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="3" className="p-6 text-center text-gray-500 italic">No se encontraron actas registradas que coincidan con la búsqueda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VISTA DE IMPRESIÓN HTML (SOLO PARA ACTA DE MATRIMONIO DEL ALTAR)        */}
      {/* ========================================================================= */}
      {datosActaHtml && tipo === 'acta_matrimonio' && (
        <div className="hidden print:block font-serif text-black w-full bg-white h-screen px-12 py-8">
          <div className="text-center mb-10">
            <h2 className="text-xl font-bold uppercase">{datosActaHtml.diocesis || 'Diócesis de Oruro'}</h2>
            <h3 className="text-lg uppercase">{datosActaHtml.parroquia_nombre}</h3>
            <h1 className="text-3xl font-extrabold uppercase mt-6 mb-2">Acta de Celebración Matrimonial</h1>
            <p className="text-sm italic border-b border-black inline-block pb-1">Documento original para el archivo parroquial</p>
          </div>
          
          <p className="text-justify leading-loose text-lg mt-8">
            En la <b>{datosActaHtml.parroquia_nombre}</b>, a los <b>{diaBodaNum}</b> días del mes de <b>{mesBodaLit}</b> del año <b>{anoBodaNum}</b>, 
            ante la presencia de Dios y de la Iglesia, actuando como ministro autorizado el presbítero <b>{datosActaHtml.parroco}</b>, 
            han contraído el Sacramento del Matrimonio:
          </p>
          
          <div className="my-8 text-center text-xl font-bold uppercase bg-gray-100 p-4 border-2 border-black">
            <p>{datosActaHtml.novio_nombre} {datosActaHtml.novio_apellido}</p>
            <p className="text-sm lowercase italic font-normal my-1">y</p>
            <p>{datosActaHtml.novia_nombre} {datosActaHtml.novia_apellido}</p>
          </div>

          <p className="text-justify leading-loose text-lg">
            Fueron padrinos de esta unión sacramental Sr. <b>{datosActaHtml.intervinientes_map['Padrino']?.nombre} {datosActaHtml.intervinientes_map['Padrino']?.apellido}</b> y Sra. <b>{datosActaHtml.intervinientes_map['Madrina']?.nombre} {datosActaHtml.intervinientes_map['Madrina']?.apellido}</b>, 
            quienes se comprometen a guiar espiritualmente a los nuevos esposos. Dieron fe de este acto los testigos presenciales <b>{datosActaHtml.intervinientes_map['Testigo 1']?.nombre} {datosActaHtml.intervinientes_map['Testigo 1']?.apellido}</b> y <b>{datosActaHtml.intervinientes_map['Testigo 2']?.nombre} {datosActaHtml.intervinientes_map['Testigo 2']?.apellido}</b>.
          </p>

          <p className="text-justify leading-loose text-lg mt-4">
            Consta el registro en el Libro Nro. <b>{datosActaHtml.numero_libro}</b>, Folio/Página <b>{datosActaHtml.pagina_libro}</b>, Partida <b>{datosActaHtml.numero_acta}</b>.
          </p>

          <div className="grid grid-cols-2 gap-y-20 gap-x-8 text-center mt-24">
            <div><div className="border-b border-black w-3/4 mx-auto mb-2"></div><p className="text-sm font-bold uppercase">El Esposo</p></div>
            <div><div className="border-b border-black w-3/4 mx-auto mb-2"></div><p className="text-sm font-bold uppercase">La Esposa</p></div>
            <div><div className="border-b border-black w-3/4 mx-auto mb-2"></div><p className="text-sm font-bold uppercase">Padrino</p></div>
            <div><div className="border-b border-black w-3/4 mx-auto mb-2"></div><p className="text-sm font-bold uppercase">Madrina</p></div>
            <div className="col-span-2 mt-8"><div className="border-b border-black w-1/3 mx-auto mb-2"></div><p className="text-sm font-bold uppercase">Firma y Sello del Párroco</p></div>
          </div>
        </div>
      )}
    </>
  );
}