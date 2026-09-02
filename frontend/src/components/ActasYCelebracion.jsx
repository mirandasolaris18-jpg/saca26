// src/components/ActasYCelebracion.jsx
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

export default function ActasYCelebracion({ expedienteId, onVolver, user }) {
  const [datos, setDatos] = useState(null);
  const [form, setForm] = useState({
    numero_libro: '', folio: '', numero_acta: '',
    lugar_civil: 'Oruro', fecha_civil: '', oficialia_civil: '', partida_civil: '', numero_civil: '', obispo_diocesis: 'Mons. '
  });
  
  const [tipoImpresion, setTipoImpresion] = useState(null);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5000/api/expedientes/${expedienteId}/impresion`, { headers: { "Authorization": `Bearer ${token}` } });
        const data = await res.json();
        
        const invMap = {};
        data.intervinientes.forEach(i => invMap[i.rol] = i);
        data.intervinientes_map = invMap;
        
        setDatos(data);
        
        if (data.numero_libro) {
          setForm({
            numero_libro: data.numero_libro || '', folio: data.pagina_libro || '', numero_acta: data.numero_acta || '',
            lugar_civil: data.lugar_civil || 'Oruro', fecha_civil: data.fecha_civil ? data.fecha_civil.split('T')[0] : '',
            oficialia_civil: data.oficialia_civil || '', partida_civil: data.partida_civil || '',
            numero_civil: data.numero_civil || '', obispo_diocesis: data.obispo_diocesis || 'Mons. '
          });
        }
      } catch (error) { console.error("Error cargando datos", error); }
    };
    cargarDatos();
  }, [expedienteId]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleGuardarYCelebrar = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:5000/api/expedientes/${expedienteId}/celebracion`, {
        method: 'PUT',
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      alert("✅ Datos del acta guardados. El matrimonio figura como 'Celebrado'.");
      
      // Recargar datos para que la variable actaGuardada se actualice a true
      const res = await fetch(`http://localhost:5000/api/expedientes/${expedienteId}/impresion`, { headers: { "Authorization": `Bearer ${token}` } });
      const data = await res.json();
      const invMap = {}; data.intervinientes.forEach(i => invMap[i.rol] = i); data.intervinientes_map = invMap;
      setDatos(data);
    } catch (error) { alert("Error al guardar."); }
  };

  const imprimirActaAltar = () => {
    setTipoImpresion('acta');
    setTimeout(() => { window.print(); setTipoImpresion(null); }, 500);
  };

  const generarCertificadoPDF = () => {
    if (!datos) return;
    const doc = new jsPDF();

    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(15, 15, 25, 30);
    doc.setFontSize(8);
    doc.text("LOGO", 27.5, 30, { align: "center" });

    doc.setFontSize(14);
    doc.setFont("times", "bold");
    doc.text("DIÓCESIS DE ORURO BOLIVIA", 105, 25, { align: "center" });

    doc.setFontSize(20);
    doc.text("CERTIFICADO DE MATRIMONIO", 105, 35, { align: "center" });

    const numeroSerie = Math.floor(Math.random() * 10000).toString().padStart(5, '0');
    doc.setFontSize(12);
    doc.setTextColor(200, 0, 0); 
    doc.text(`N° ${numeroSerie}`, 195, 25, { align: "right" });
    doc.setTextColor(0, 0, 0); 

    doc.setFont("times", "normal");
    doc.setFontSize(12);
    doc.text(`IGLESIA PARROQUIAL DE ${datos.parroquia_nombre?.toUpperCase() || '_________________'}`, 15, 60);
    doc.text(`El presbítero ${datos.parroco || '_________________'}, párroco de la mencionada parroquia:`, 15, 70);

    doc.setFont("times", "bold");
    doc.text("CERTIFICA:", 15, 85);
    
    doc.setFont("times", "normal");
    doc.text(`Que en el libro ${datos.numero_libro || '___'} de matrimonios de este archivo parroquial, página ${datos.pagina_libro || '___'},`, 15, 95);
    doc.text(`número ${datos.numero_acta || '___'} se halla inscrita la siguiente partida matrimonial:`, 15, 102);

    const nombreNovio = `${datos.novio_nombre} ${datos.novio_apellido}`.toUpperCase();
    const nombreNovia = `${datos.novia_nombre} ${datos.novia_apellido}`.toUpperCase();
    
    doc.setFontSize(14);
    doc.setFont("times", "bold");
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

    doc.setFontSize(12);
    doc.setFont("times", "normal");

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
    const mesHoyLit = hoy.toLocaleDateString('es-ES', { month: 'long' });
    const fechaImpresion = `Oruro, ${hoy.getDate()} de ${mesHoyLit} de ${hoy.getFullYear()}`;
    doc.text(fechaImpresion, 105, yCursor + 10, { align: "center" });

    const yFirma = yCursor + 45;
    doc.setLineWidth(0.5);
    doc.line(75, yFirma, 135, yFirma);
    doc.setFont("times", "bold");
    doc.text("Firma y Sello del Sacerdote", 105, yFirma + 5, { align: "center" });

    doc.setFontSize(9);
    doc.setFont("times", "italic");
    doc.setTextColor(100, 100, 100);
    doc.text("Propiedad exclusiva de la Diócesis de Oruro. Prohibida su alteración a estos datos oficiales.", 105, 285, { align: "center" });
    
    doc.save(`Certificado_Matrimonio_${datos.expediente_id}.pdf`);
  };

  if (!datos) return <div className="p-6 text-center">Cargando datos del expediente...</div>;

  const fechaBodaObj = new Date(datos.fecha_boda_programada);
  const diaBodaNum = fechaBodaObj.getUTCDate();
  const mesBodaLit = fechaBodaObj.toLocaleDateString('es-ES', { month: 'long', timeZone: 'UTC' });
  const anoBodaNum = fechaBodaObj.getUTCFullYear();

  // 🛡️ VARIABLE CLAVE: Determina si el acta ya fue guardada previamente
  const actaGuardada = Boolean(datos.numero_libro);

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-amber-100 p-6 print:hidden animate-fade-in">
        <button onClick={onVolver} className="mb-4 text-gray-500 font-bold hover:text-amber-700">← Volver al listado</button>
        
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div>
            <h2 className="text-2xl font-bold text-amber-900 mb-1">2.3.6 Actas y Celebración</h2>
            <p className="text-sm text-gray-600">Completar datos del libro parroquial y Registro Civil para generar certificados. Expediente #{datos.expediente_id}</p>
          </div>
          {/* Etiqueta visual de estado */}
          {actaGuardada && (
            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-bold rounded-full border border-green-200">
              🔒 Acta Registrada
            </span>
          )}
        </div>

        <form onSubmit={handleGuardarYCelebrar} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* BLOQUE: LIBRO PARROQUIAL */}
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 shadow-inner">
              <h3 className="font-bold text-gray-800 mb-4 uppercase text-sm border-b pb-2">📖 Libro Parroquial de Matrimonios</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Libro Nro.</label>
                  <input required type="text" name="numero_libro" value={form.numero_libro} onChange={handleChange} disabled={actaGuardada} className="w-full p-2 border rounded text-sm outline-none focus:border-amber-500 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Página / Folio</label>
                  <input required type="text" name="folio" value={form.folio} onChange={handleChange} disabled={actaGuardada} className="w-full p-2 border rounded text-sm outline-none focus:border-amber-500 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Acta / Partida</label>
                  <input required type="text" name="numero_acta" value={form.numero_acta} onChange={handleChange} disabled={actaGuardada} className="w-full p-2 border rounded text-sm outline-none focus:border-amber-500 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed" />
                </div>
              </div>
            </div>

            {/* BLOQUE: REGISTRO CIVIL */}
            <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-200 shadow-inner">
              <h3 className="font-bold text-blue-900 mb-4 uppercase text-sm border-b border-blue-200 pb-2">⚖️ Datos del Matrimonio Civil</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-bold text-blue-800 mb-1">Lugar (Ciudad)</label>
                  <input type="text" name="lugar_civil" value={form.lugar_civil} onChange={handleChange} disabled={actaGuardada} className="w-full p-2 border border-blue-300 rounded text-sm outline-none disabled:bg-blue-100/50 disabled:text-gray-500 disabled:cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-blue-800 mb-1">Fecha Civil</label>
                  <input type="date" name="fecha_civil" value={form.fecha_civil} onChange={handleChange} disabled={actaGuardada} className="w-full p-2 border border-blue-300 rounded text-sm outline-none disabled:bg-blue-100/50 disabled:text-gray-500 disabled:cursor-not-allowed" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-blue-800 mb-1">Oficialía Nro.</label>
                  <input type="text" name="oficialia_civil" value={form.oficialia_civil} onChange={handleChange} disabled={actaGuardada} className="w-full p-2 border border-blue-300 rounded text-sm outline-none disabled:bg-blue-100/50 disabled:text-gray-500 disabled:cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-blue-800 mb-1">Partida Nro.</label>
                  <input type="text" name="partida_civil" value={form.partida_civil} onChange={handleChange} disabled={actaGuardada} className="w-full p-2 border border-blue-300 rounded text-sm outline-none disabled:bg-blue-100/50 disabled:text-gray-500 disabled:cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-blue-800 mb-1">Nro. Registro</label>
                  <input type="text" name="numero_civil" value={form.numero_civil} onChange={handleChange} disabled={actaGuardada} className="w-full p-2 border border-blue-300 rounded text-sm outline-none disabled:bg-blue-100/50 disabled:text-gray-500 disabled:cursor-not-allowed" />
                </div>
              </div>
            </div>

            {/* BLOQUE: AUTORIDAD */}
            <div className="bg-purple-50 p-5 rounded-xl border border-purple-200 shadow-inner md:col-span-2">
              <h3 className="font-bold text-purple-900 mb-4 uppercase text-sm border-b border-purple-200 pb-2">👑 Autoridad Diocesana</h3>
              <div>
                <label className="block text-xs font-bold text-purple-800 mb-1">Certificó (Nombre del Obispo de la Diócesis)</label>
                <input required type="text" name="obispo_diocesis" value={form.obispo_diocesis} onChange={handleChange} disabled={actaGuardada} className="w-full p-2 border border-purple-300 rounded text-sm outline-none max-w-md disabled:bg-purple-100/50 disabled:text-gray-500 disabled:cursor-not-allowed" />
              </div>
            </div>

          </div>

          <div className="flex justify-between items-center pt-6 border-t">
            {/* Si ya está guardada, mostramos un botón bloqueado gris, si no, el botón naranja para guardar */}
            <button 
              type="submit" 
              disabled={actaGuardada} 
              className={`px-6 py-3 rounded-lg font-bold shadow-lg transition-colors ${actaGuardada ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-amber-600 text-white hover:bg-amber-700'}`}
            >
              {actaGuardada ? '🔒 Acta Registrada' : '💾 Guardar y Registrar Celebración'}
            </button>

            <div className="space-x-3">
              <button 
                type="button" 
                disabled={!actaGuardada} 
                onClick={imprimirActaAltar} 
                className="px-4 py-3 border-2 border-emerald-600 text-emerald-700 rounded-lg font-bold hover:bg-emerald-50 disabled:border-gray-300 disabled:text-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
              >
                📝 Imprimir Acta (Altar)
              </button>
              
              <button 
                type="button" 
                disabled={!actaGuardada} 
                onClick={generarCertificadoPDF} 
                className="px-4 py-3 bg-emerald-700 text-white rounded-lg font-bold hover:bg-emerald-800 shadow-lg disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none disabled:cursor-not-allowed transition-colors"
              >
                🖨️ Imprimir CERTIFICADO
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* VISTA DE IMPRESIÓN HTML: ACTA DE MATRIMONIO (Para firmar en el Altar)   */}
      {/* ========================================================================= */}
      {tipoImpresion === 'acta' && (
        <div className="hidden print:block font-serif text-black w-full bg-white h-screen px-12 py-8">
          <div className="text-center mb-10">
            <h2 className="text-xl font-bold uppercase">{datos.diocesis || 'Diócesis de Oruro'}</h2>
            <h3 className="text-lg uppercase">{datos.parroquia_nombre}</h3>
            <h1 className="text-3xl font-extrabold uppercase mt-6 mb-2">Acta de Celebración Matrimonial</h1>
            <p className="text-sm italic border-b border-black inline-block pb-1">Documento original para el archivo parroquial</p>
          </div>
          
          <p className="text-justify leading-loose text-lg mt-8">
            En la <b>{datos.parroquia_nombre}</b>, a los <b>{diaBodaNum}</b> días del mes de <b>{mesBodaLit}</b> del año <b>{anoBodaNum}</b>, 
            ante la presencia de Dios y de la Iglesia, actuando como ministro autorizado el presbítero <b>{datos.parroco}</b>, 
            han contraído el Sacramento del Matrimonio:
          </p>
          
          <div className="my-8 text-center text-xl font-bold uppercase bg-gray-100 p-4 border-2 border-black">
            <p>{datos.novio_nombre} {datos.novio_apellido}</p>
            <p className="text-sm lowercase italic font-normal my-1">y</p>
            <p>{datos.novia_nombre} {datos.novia_apellido}</p>
          </div>

          <p className="text-justify leading-loose text-lg">
            Fueron padrinos de esta unión sacramental Sr. <b>{datos.intervinientes_map['Padrino']?.nombre} {datos.intervinientes_map['Padrino']?.apellido}</b> y Sra. <b>{datos.intervinientes_map['Madrina']?.nombre} {datos.intervinientes_map['Madrina']?.apellido}</b>, 
            quienes se comprometen a guiar espiritualmente a los nuevos esposos. Dieron fe de este acto los testigos presenciales <b>{datos.intervinientes_map['Testigo 1']?.nombre} {datos.intervinientes_map['Testigo 1']?.apellido}</b> y <b>{datos.intervinientes_map['Testigo 2']?.nombre} {datos.intervinientes_map['Testigo 2']?.apellido}</b>.
          </p>

          <p className="text-justify leading-loose text-lg mt-4">
            Consta el registro en el Libro Nro. <b>{datos.numero_libro}</b>, Folio/Página <b>{datos.pagina_libro}</b>, Partida <b>{datos.numero_acta}</b>.
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