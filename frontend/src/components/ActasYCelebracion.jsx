// src/components/ActasYCelebracion.jsx
import React, { useState, useEffect } from 'react';

// --- UTILIDAD: Convertidor de números a letras para las fechas ---
const numALetrasDia = (num) => {
  const dias = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve", "treinta", "treinta y uno"];
  return dias[parseInt(num, 10)] || num;
};

const numALetrasAno = (num) => {
  const anos = { 2024: "dos mil veinticuatro", 2025: "dos mil veinticinco", 2026: "dos mil veintiséis", 2027: "dos mil veintisiete", 2028: "dos mil veintiocho", 2029: "dos mil veintinueve", 2030: "dos mil treinta" };
  return anos[parseInt(num, 10)] || num;
};

export default function ActasYCelebracion({ expedienteId, onVolver, user }) {
  const [datos, setDatos] = useState(null);
  const [form, setForm] = useState({
    numero_libro: '', folio: '', numero_acta: '',
    lugar_civil: 'Oruro', fecha_civil: '', oficialia_civil: '', partida_civil: '', numero_civil: '', obispo_diocesis: 'Mons. '
  });
  
  const [tipoImpresion, setTipoImpresion] = useState(null); // 'acta' o 'certificado'

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
        
        // Si ya tenía datos guardados previamente, llenar el formulario para reimpresión
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
      // Recargar para tener los datos frescos listos para imprimir
      const res = await fetch(`http://localhost:5000/api/expedientes/${expedienteId}/impresion`, { headers: { "Authorization": `Bearer ${token}` } });
      const data = await res.json();
      const invMap = {}; data.intervinientes.forEach(i => invMap[i.rol] = i); data.intervinientes_map = invMap;
      setDatos(data);
    } catch (error) { alert("Error al guardar."); }
  };

  const imprimir = (tipo) => {
    setTipoImpresion(tipo);
    setTimeout(() => { window.print(); setTipoImpresion(null); }, 500);
  };

  if (!datos) return <div className="p-6 text-center">Cargando datos del expediente...</div>;

  // --- VARIABLES PARA FECHAS LITERALES ---
  const fechaBodaObj = new Date(datos.fecha_boda_programada);
  const diaBodaNum = fechaBodaObj.getUTCDate();
  const mesBodaLit = fechaBodaObj.toLocaleDateString('es-ES', { month: 'long', timeZone: 'UTC' });
  const anoBodaNum = fechaBodaObj.getUTCFullYear();

  let diaCivilNum = "___", mesCivilLit = "___", anoCivilNum = "___";
  if (datos.fecha_civil) {
    const fechaCivObj = new Date(datos.fecha_civil);
    diaCivilNum = fechaCivObj.getUTCDate();
    mesCivilLit = fechaCivObj.toLocaleDateString('es-ES', { month: 'long', timeZone: 'UTC' });
    anoCivilNum = fechaCivObj.getUTCFullYear();
  }

  const hoy = new Date();

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-amber-100 p-6 print:hidden animate-fade-in">
        <button onClick={onVolver} className="mb-4 text-gray-500 font-bold hover:text-amber-700">← Volver al listado</button>
        
        <h2 className="text-2xl font-bold text-amber-900 mb-1">2.3.6 Actas y Celebración</h2>
        <p className="text-sm text-gray-600 mb-6 border-b pb-4">Completar datos del libro parroquial y Registro Civil para generar certificados. Expediente #{datos.expediente_id}</p>

        <form onSubmit={handleGuardarYCelebrar} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* BLOQUE: LIBRO PARROQUIAL */}
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 shadow-inner">
              <h3 className="font-bold text-gray-800 mb-4 uppercase text-sm border-b pb-2">📖 Libro Parroquial de Matrimonios</h3>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-xs font-bold text-gray-600 mb-1">Libro Nro.</label><input required type="text" name="numero_libro" value={form.numero_libro} onChange={handleChange} className="w-full p-2 border rounded text-sm outline-none focus:border-amber-500" /></div>
                <div><label className="block text-xs font-bold text-gray-600 mb-1">Página / Folio</label><input required type="text" name="folio" value={form.folio} onChange={handleChange} className="w-full p-2 border rounded text-sm outline-none focus:border-amber-500" /></div>
                <div><label className="block text-xs font-bold text-gray-600 mb-1">Acta / Partida</label><input required type="text" name="numero_acta" value={form.numero_acta} onChange={handleChange} className="w-full p-2 border rounded text-sm outline-none focus:border-amber-500" /></div>
              </div>
            </div>

            {/* BLOQUE: REGISTRO CIVIL */}
            <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-200 shadow-inner">
              <h3 className="font-bold text-blue-900 mb-4 uppercase text-sm border-b border-blue-200 pb-2">⚖️ Datos del Matrimonio Civil</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div><label className="block text-xs font-bold text-blue-800 mb-1">Lugar (Ciudad)</label><input type="text" name="lugar_civil" value={form.lugar_civil} onChange={handleChange} className="w-full p-2 border border-blue-300 rounded text-sm outline-none" /></div>
                <div><label className="block text-xs font-bold text-blue-800 mb-1">Fecha Civil</label><input type="date" name="fecha_civil" value={form.fecha_civil} onChange={handleChange} className="w-full p-2 border border-blue-300 rounded text-sm outline-none" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-xs font-bold text-blue-800 mb-1">Oficialía Nro.</label><input type="text" name="oficialia_civil" value={form.oficialia_civil} onChange={handleChange} className="w-full p-2 border border-blue-300 rounded text-sm outline-none" /></div>
                <div><label className="block text-xs font-bold text-blue-800 mb-1">Partida Nro.</label><input type="text" name="partida_civil" value={form.partida_civil} onChange={handleChange} className="w-full p-2 border border-blue-300 rounded text-sm outline-none" /></div>
                <div><label className="block text-xs font-bold text-blue-800 mb-1">Nro. Matrimonio</label><input type="text" name="numero_civil" value={form.numero_civil} onChange={handleChange} className="w-full p-2 border border-blue-300 rounded text-sm outline-none" /></div>
              </div>
            </div>

            {/* BLOQUE: AUTORIDAD */}
            <div className="bg-purple-50 p-5 rounded-xl border border-purple-200 shadow-inner md:col-span-2">
              <h3 className="font-bold text-purple-900 mb-4 uppercase text-sm border-b border-purple-200 pb-2">👑 Autoridad Diocesana</h3>
              <div><label className="block text-xs font-bold text-purple-800 mb-1">Certificó (Nombre del Obispo de la Diócesis)</label><input required type="text" name="obispo_diocesis" value={form.obispo_diocesis} onChange={handleChange} className="w-full p-2 border border-purple-300 rounded text-sm outline-none max-w-md" /></div>
            </div>

          </div>

          <div className="flex justify-between items-center pt-6 border-t">
            <button type="submit" className="px-6 py-3 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 shadow-lg">💾 Guardar y Registrar Celebración</button>
            <div className="space-x-3">
              <button type="button" disabled={!datos.numero_libro} onClick={() => imprimir('acta')} className="px-4 py-3 border-2 border-emerald-600 text-emerald-700 rounded-lg font-bold hover:bg-emerald-50 disabled:opacity-50">📝 Imprimir Acta (Altar)</button>
              <button type="button" disabled={!datos.numero_libro} onClick={() => imprimir('certificado')} className="px-4 py-3 bg-emerald-700 text-white rounded-lg font-bold hover:bg-emerald-800 shadow-lg disabled:opacity-50">🖨️ Imprimir CERTIFICADO</button>
            </div>
          </div>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* VISTA DE IMPRESIÓN 1: ACTA DE MATRIMONIO (Para firmar en el Altar)      */}
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

      {/* ========================================================================= */}
      {/* VISTA DE IMPRESIÓN 2: CERTIFICADO DE MATRIMONIO OFICIAL (Entregado)     */}
      {/* ========================================================================= */}
      {tipoImpresion === 'certificado' && (
        <div className="hidden print:block font-serif text-black w-full bg-white h-screen px-12 py-8 relative">
          
          <div className="flex justify-between items-start mb-6">
            <div className="text-left leading-tight">
              <h2 className="text-xl font-bold uppercase">DIÓCESIS DE {datos.diocesis || 'ORURO'} - BOLIVIA</h2>
            </div>
            <div className="text-right">
              {/* QR Dinámico que incluye el expediente y número de libro para validación */}
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=Certificado_Matrimonio_${datos.expediente_id}_Libro_${datos.numero_libro}_Pag_${datos.pagina_libro}`} alt="QR Code Validación" className="w-24 h-24 object-contain" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold uppercase tracking-widest mt-2 mb-6">Certificado de Matrimonio</h1>
            <h3 className="text-lg font-bold uppercase">IGLESIA PARROQUIAL DE: {datos.parroquia_nombre}</h3>
            <p className="text-md mt-2">El presbítero: <b>{datos.parroco}</b>, párroco de la mencionada parroquia.</p>
          </div>

          <div className="text-justify leading-loose text-[17px] space-y-4">
            <p>
              <b>Certifica:</b> Que el libro <b>{datos.numero_libro}</b> de matrimonios de este archivo parroquial, 
              página <b>{datos.pagina_libro}</b>, número <b>{datos.numero_acta}</b> se halla inscrita la siguiente partida matrimonial:
            </p>
            
            <div className="text-center text-xl font-bold uppercase my-6 leading-tight">
              <p>{datos.novio_nombre} {datos.novio_apellido}</p>
              <p>{datos.novia_nombre} {datos.novia_apellido}</p>
            </div>

            <p>
              En esta iglesia parroquial a los {diaBodaNum} ({numALetrasDia(diaBodaNum)}) del mes de {mesBodaLit} del año {anoBodaNum} ({numALetrasAno(anoBodaNum)}), 
              contrajeron matrimonio <b>{datos.novio_nombre} {datos.novio_apellido}</b>, bautizado en la parroquia de {datos.sacramentos_novio.bautizo_parroquia || '____________________'}, 
              hijo de {datos.intervinientes_map['Padre Novio'] ? `${datos.intervinientes_map['Padre Novio'].nombre} ${datos.intervinientes_map['Padre Novio'].apellido}` : '_________________'} 
              y {datos.intervinientes_map['Madre Novio'] ? `${datos.intervinientes_map['Madre Novio'].nombre} ${datos.intervinientes_map['Madre Novio'].apellido}` : '_________________'}, 
              con: <b>{datos.novia_nombre} {datos.novia_apellido}</b>, bautizada en la parroquia de: {datos.sacramentos_novia.bautizo_parroquia || '____________________'}, 
              hija de {datos.intervinientes_map['Padre Novia'] ? `${datos.intervinientes_map['Padre Novia'].nombre} ${datos.intervinientes_map['Padre Novia'].apellido}` : '_________________'} 
              y {datos.intervinientes_map['Madre Novia'] ? `${datos.intervinientes_map['Madre Novia'].nombre} ${datos.intervinientes_map['Madre Novia'].apellido}` : '_________________'}, 
              siendo testigos presenciales, {datos.intervinientes_map['Testigo 1'] ? `${datos.intervinientes_map['Testigo 1'].nombre} ${datos.intervinientes_map['Testigo 1'].apellido}` : '_________________'} 
              y {datos.intervinientes_map['Testigo 2'] ? `${datos.intervinientes_map['Testigo 2'].nombre} ${datos.intervinientes_map['Testigo 2'].apellido}` : '_________________'}.
            </p>

            <p className="mt-6">
              <b>Lugar y fecha del matrimonio civil:</b> {datos.lugar_civil || '___________'}, {diaCivilNum} de {mesCivilLit} del {anoCivilNum}.
            </p>
            <p>
              <b>Oficialía de registro civil:</b> {datos.lugar_civil || '___________'}, {diaCivilNum} de {mesCivilLit} del {anoCivilNum}.
            </p>
            <p>
              Oficialía del registro civil <b>{datos.oficialia_civil || '___'}</b>, partida <b>{datos.partida_civil || '___'}</b>, 
              número: <b>{datos.numero_civil || '___'}</b>, certificó <b>{datos.obispo_diocesis || '________________'}</b>.
            </p>
            
            <p className="mt-8 text-right">
              Oruro, {hoy.getUTCDate()} de {hoy.toLocaleDateString('es-ES', { month: 'long', timeZone: 'UTC' })} de {hoy.getUTCFullYear()}.
            </p>
          </div>

          <div className="absolute bottom-20 right-12 text-center">
            <div className="border-b border-black w-64 mx-auto mb-2"></div>
            <p className="text-xs font-bold uppercase">Firma y Sello <br/>Autoridad Diocesana / Párroco</p>
          </div>

          <div className="absolute bottom-4 left-12 text-[9px] text-gray-400">
            <p>Impreso por el usuario: {user?.nombre_completo || 'Sistema'}</p>
            <p>ID Registro: {datos.expediente_id} | Ref: Matr-Diocesis</p>
          </div>

        </div>
      )}
    </>
  );
}