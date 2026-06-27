import React, { useState, useEffect } from "react";
import { fetchRecursosMatrimonio, createMatrimonio, fetchMatrimonios, fetchMatrimonioPDF } from "../services/matrimoniosService";
import { jsPDF } from "jspdf";
// import certificadoFondo from '../assets/certificado_vacio.jpg';

export default function Matrimonios({ onVolver }) {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [matrimonioExitoso, setMatrimonioExitoso] = useState(false);
  const [datosImpresion, setDatosImpresion] = useState(null);
  
  const [listaMatrimonios, setListaMatrimonios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  // Añadimos 'parejas' al estado inicial
  const [recursos, setRecursos] = useState({ parroquias: [], sacerdotes: [], feligreses: [], parejas: [] });

  // Estado para saber qué campo de padrino/madrina bloqueó al otro
  const [lockedField, setLockedField] = useState(null);

  const [form, setForm] = useState({
    novio_id: "", novia_id: "", 
    padre_novio_id: "", madre_novio_id: "", 
    padre_novia_id: "", madre_novia_id: "", 
    padrino_id: "", madrina_id: "", 
    testigo1_id: "", testigo2_id: "", fecha_matrimonio: "", 
    sacerdote_id: "", numero_libro: "", pagina_libro: "", seccion_libro: ""
  });

  const cargarDatos = async (termino = "") => {
    try {
      const rec = await fetchRecursosMatrimonio();
      if (rec && rec.feligreses) setRecursos(rec);

      const hist = await fetchMatrimonios(termino);
      if (hist) setListaMatrimonios(hist);
    } catch (error) {
      console.error("Error cargando datos de matrimonios:", error);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleBuscar = (e) => {
    e.preventDefault();
    cargarDatos(busqueda);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Lógica inteligente para Padrinos y Madrinas casados
  const handleParejaChange = (e) => {
    const { name, value } = e.target;
    
    // Si se limpia el campo, desbloqueamos el otro y limpiamos ambos
    if (!value) {
      setForm(prev => ({ ...prev, padrino_id: "", madrina_id: "" }));
      setLockedField(null);
      return;
    }

    if (name === "padrino_id") {
      const pareja = recursos.parejas?.find(p => p.novio_id == value);
      setForm(prev => ({ 
        ...prev, 
        padrino_id: value, 
        madrina_id: pareja ? pareja.novia_id : "" 
      }));
      setLockedField("madrina"); // Bloqueamos a la madrina
    } 
    else if (name === "madrina_id") {
      const pareja = recursos.parejas?.find(p => p.novia_id == value);
      setForm(prev => ({ 
        ...prev, 
        madrina_id: value, 
        padrino_id: pareja ? pareja.novio_id : "" 
      }));
      setLockedField("padrino"); // Bloqueamos al padrino
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (form.novio_id === form.novia_id) {
      alert("❌ Error: El esposo y la esposa no pueden ser la misma persona.");
      return;
    }

    try {
      const responseId = await createMatrimonio(form);
      
      // Ya no necesitamos buscar manualmente en feligreses, el backend nos dará el formato perfecto
      const dataPDF = await fetchMatrimonioPDF(responseId.id || responseId);
      
      prepararDatosYMostrarExito(dataPDF);

      setMostrarModal(false);
      setLockedField(null); // Reiniciamos el bloqueo
      setForm({ 
        novio_id: "", novia_id: "", 
        padre_novio_id: "", madre_novio_id: "", 
        padre_novia_id: "", madre_novia_id: "", 
        padrino_id: "", madrina_id: "", 
        testigo1_id: "", testigo2_id: "", fecha_matrimonio: "", 
        sacerdote_id: "", numero_libro: "", pagina_libro: "", seccion_libro: "" 
      });

    } catch (error) {
      alert(`❌ ${error.message}`); 
    }
  };

  // Función compartida para imprimir desde un registro nuevo o una reimpresión
  const prepararDatosYMostrarExito = (data) => {
    setDatosImpresion({
      esposo: data.novio_completo,
      esposa: data.novia_completo,
      padre_esposo: data.padre_novio || '---',
      madre_esposo: data.madre_novio || '---',
      padre_esposa: data.padre_novia || '---',
      madre_esposa: data.madre_novia || '---',
      padrino: data.padrino || '---',
      madrina: data.madrina || '---',
      testigo1: data.testigo1 || '---',
      testigo2: data.testigo2 || '---',
      fecha: data.fecha_matrimonio,
      sacerdote: data.sacerdote,
      parroquia: data.parroquia,
      libro: data.numero_libro,
      pagina: data.pagina_libro,
      seccion: data.seccion_libro
    });
    setMatrimonioExitoso(true);
    cargarDatos(); 
  };

  // Nueva función para reimprimir pasados
  const handleReimprimir = async (id) => {
    try {
      const dataPDF = await fetchMatrimonioPDF(id);
      prepararDatosYMostrarExito(dataPDF);
    } catch (error) {
      alert("❌ Error al recuperar el acta para imprimir: " + error.message);
    }
  };

  const generarPDF = (datos) => {
    const doc = new jsPDF({ format: 'letter', unit: 'mm' });
    
    // doc.addImage(certificadoFondo, 'JPEG', 0, 0, 215.9, 279.4); 

    doc.setFont("times", "normal");
    doc.setFontSize(14);
    
    doc.text(datos.esposo, 60, 80);
    doc.text(datos.esposa, 60, 90);
    
    doc.text(datos.padre_esposo, 40, 110);
    doc.text(datos.madre_esposo, 130, 110);
    doc.text(datos.padre_esposa, 40, 120);
    doc.text(datos.madre_esposa, 130, 120);

    doc.text(`${datos.padrino} y ${datos.madrina}`, 50, 140);
    doc.text(`${datos.testigo1} y ${datos.testigo2}`, 50, 150);
    
    doc.text(datos.fecha, 50, 170);
    doc.text(datos.sacerdote, 50, 180);
    
    doc.text(datos.libro, 50, 200);
    doc.text(datos.pagina, 100, 200);
    doc.text(datos.seccion, 150, 200);

    // ACTA SEGUNDA HOJA
    doc.addPage();
    doc.setFont("times", "bold");
    doc.setFontSize(18);
    doc.text("ACTA DE MATRIMONIO", 105, 30, { align: "center" });
    
    doc.setFont("times", "normal");
    doc.setFontSize(12);
    const textoActa = `En la ${datos.parroquia}, a los ${datos.fecha}, ante mí, el Presbítero ${datos.sacerdote}, contrajeron sagrado matrimonio ${datos.esposo} y ${datos.esposa}. Fueron padrinos ${datos.padrino} y ${datos.madrina}. Como testigos presenciaron el acto ${datos.testigo1} y ${datos.testigo2}. Dicho matrimonio se encuentra inscrito en el Libro ${datos.libro}, Página ${datos.pagina}, Sección ${datos.seccion} del archivo parroquial.`;
    
    const lineasActa = doc.splitTextToSize(textoActa, 170);
    doc.text(lineasActa, 20, 50);

    doc.text("_______________________", 40, 150, { align: "center" });
    doc.text(datos.esposo, 40, 155, { align: "center" });
    doc.text("El Esposo", 40, 160, { align: "center" });

    doc.text("_______________________", 170, 150, { align: "center" });
    doc.text(datos.esposa, 170, 155, { align: "center" });
    doc.text("La Esposa", 170, 160, { align: "center" });

    doc.save(`Acta_Matrimonio_${datos.esposo.split(" ")[0]}_${datos.esposa.split(" ")[0]}.pdf`);
  };

  const renderContrayente = (f, index) => (
    <option key={index} value={f.id}>{f.nombre_completo} ({f.genero})</option>
  );

  return (
    <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-emerald-800 flex items-center gap-2">
          <span className="text-3xl">💍</span> Gestión de Matrimonios
        </h2>
        <div className="flex gap-4">
          <button 
            onClick={() => setMostrarModal(true)} 
            className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
          >
            + Registrar Matrimonio
          </button>
          <button onClick={onVolver} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-300 transition-colors">Volver</button>
        </div>
      </div>

      <form onSubmit={handleBuscar} className="flex gap-2 mb-6">
        <input 
          type="text" 
          placeholder="Buscar matrimonio por nombre de contrayentes..." 
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <button type="submit" className="px-4 py-2 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-900 transition-colors">Buscar</button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-emerald-50 text-emerald-800 text-sm border-b border-emerald-200">
              <th className="p-3">ID</th>
              <th className="p-3">Esposo</th>
              <th className="p-3">Esposa</th>
              <th className="p-3">Fecha</th>
              <th className="p-3">Parroquia</th>
              <th className="p-3 text-center">Libro / Pag.</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
            {listaMatrimonios.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-3 font-mono text-xs">{m.id}</td>
                <td className="p-3 font-semibold">{m.esposo_nombre}</td>
                <td className="p-3 font-semibold">{m.esposa_nombre}</td>
                <td className="p-3">{new Date(m.fecha_matrimonio).toLocaleDateString()}</td>
                <td className="p-3">{m.parroquia_nombre}</td>
                <td className="p-3 text-center">L:{m.numero_libro} - P:{m.pagina_libro}</td>
                <td className="p-3 text-center flex justify-center gap-2">
                  <button onClick={() => alert("Función de edición en construcción")} className="text-blue-600 hover:text-blue-800" title="Editar">✏️</button>
                  {/* BOTON DE REIMPRESIÓN CONECTADO */}
                  <button onClick={() => handleReimprimir(m.id)} className="text-gray-600 hover:text-gray-800" title="Imprimir Acta">🖨️</button>
                </td>
              </tr>
            ))}
            {listaMatrimonios.length === 0 && (
              <tr><td colSpan="7" className="p-6 text-center text-gray-500 italic">No se encontraron matrimonios registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {mostrarModal && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center z-50 overflow-y-auto py-10">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl p-6 relative my-auto">
            <button 
              onClick={() => { setMostrarModal(false); setLockedField(null); }} 
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl font-bold transition-colors"
            >
              ×
            </button>
            <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Registrar Nueva Acta de Matrimonio</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-100">
                <h4 className="font-semibold text-emerald-800 mb-3 text-sm uppercase tracking-wider">I. Los Contrayentes</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Esposo (Novio) *</label>
                    <select name="novio_id" required value={form.novio_id} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 outline-none text-sm">
                      <option value="">-- Seleccionar Esposo --</option>
                      {recursos?.feligreses?.filter(f => f.genero === 'Masculino').map(renderContrayente)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Esposa (Novia) *</label>
                    <select name="novia_id" required value={form.novia_id} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 outline-none text-sm">
                      <option value="">-- Seleccionar Esposa --</option>
                      {recursos?.feligreses?.filter(f => f.genero === 'Femenino').map(renderContrayente)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50/50 p-4 rounded-lg border border-amber-100">
                <h4 className="font-semibold text-amber-800 mb-3 text-sm uppercase tracking-wider">II. Padres de los Contrayentes</h4>
                
                <h5 className="text-xs font-bold text-gray-500 mb-2">Padres del Esposo</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Padre (Opcional)</label>
                    <select name="padre_novio_id" value={form.padre_novio_id} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 outline-none text-sm">
                      <option value="">-- Seleccionar --</option>
                      {recursos?.feligreses?.filter(f => f.genero === 'Masculino').map(renderContrayente)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Madre (Opcional)</label>
                    <select name="madre_novio_id" value={form.madre_novio_id} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 outline-none text-sm">
                      <option value="">-- Seleccionar --</option>
                      {recursos?.feligreses?.filter(f => f.genero === 'Femenino').map(renderContrayente)}
                    </select>
                  </div>
                </div>

                <h5 className="text-xs font-bold text-gray-500 mb-2">Padres de la Esposa</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Padre (Opcional)</label>
                    <select name="padre_novia_id" value={form.padre_novia_id} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 outline-none text-sm">
                      <option value="">-- Seleccionar --</option>
                      {recursos?.feligreses?.filter(f => f.genero === 'Masculino').map(renderContrayente)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Madre (Opcional)</label>
                    <select name="madre_novia_id" value={form.madre_novia_id} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 outline-none text-sm">
                      <option value="">-- Seleccionar --</option>
                      {recursos?.feligreses?.filter(f => f.genero === 'Femenino').map(renderContrayente)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                <h4 className="font-semibold text-blue-800 mb-3 text-sm uppercase tracking-wider">III. Padrinos y Testigos</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Padrino (Casado) *</label>
                    <select 
                      name="padrino_id" 
                      value={form.padrino_id} 
                      onChange={handleParejaChange} 
                      disabled={lockedField === 'padrino'} 
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm disabled:bg-gray-100 disabled:text-gray-500"
                    >
                      <option value="">-- Seleccionar Padrino --</option>
                      {/* Solo listamos hombres que existan en la tabla de matrimonios */}
                      {recursos?.parejas?.map((p, i) => (
                        <option key={i} value={p.novio_id}>{p.esposo_nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Madrina (Casada) *</label>
                    <select 
                      name="madrina_id" 
                      value={form.madrina_id} 
                      onChange={handleParejaChange} 
                      disabled={lockedField === 'madrina'}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm disabled:bg-gray-100 disabled:text-gray-500"
                    >
                      <option value="">-- Seleccionar Madrina --</option>
                      {/* Solo listamos mujeres que existan en la tabla de matrimonios */}
                      {recursos?.parejas?.map((p, i) => (
                        <option key={i} value={p.novia_id}>{p.esposa_nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Testigo 1 *</label>
                    <select name="testigo1_id" required value={form.testigo1_id} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm">
                      <option value="">-- Seleccionar Testigo 1 --</option>
                      {recursos?.feligreses?.map(renderContrayente)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Testigo 2 *</label>
                    <select name="testigo2_id" required value={form.testigo2_id} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm">
                      <option value="">-- Seleccionar Testigo 2 --</option>
                      {recursos?.feligreses?.map(renderContrayente)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wider">IV. Detalles de Celebración y Archivo</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Fecha del Matrimonio *</label>
                    <input type="date" name="fecha_matrimonio" required value={form.fecha_matrimonio} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 outline-none text-sm"/>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Sacerdote Oficiante *</label>
                    <select name="sacerdote_id" required value={form.sacerdote_id} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 outline-none text-sm">
                      <option value="">-- Seleccionar Sacerdote --</option>
                      {recursos?.sacerdotes?.map((s, i) => <option key={i} value={s.id}>{s.nombre_completo}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Nº Libro *</label>
                    <input type="text" name="numero_libro" required value={form.numero_libro} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 outline-none text-sm" placeholder="Ej: 12"/>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Página *</label>
                    <input type="text" name="pagina_libro" required value={form.pagina_libro} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 outline-none text-sm" placeholder="Ej: 45"/>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Sección *</label>
                    <input type="text" name="seccion_libro" required value={form.seccion_libro} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-gray-500 outline-none text-sm" placeholder="Ej: A"/>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => { setMostrarModal(false); setLockedField(null); }} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-300 transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 transition-colors cursor-pointer">Guardar Acta</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {matrimonioExitoso && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/60 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">🖨️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">¡Acta Lista!</h3>
            <p className="text-sm text-gray-500 mb-6">El documento está listo para ser generado en formato PDF.</p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => { generarPDF(datosImpresion); setMatrimonioExitoso(false); }} 
                className="w-full py-3 bg-emerald-600 text-white font-bold rounded-lg shadow-md hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
              >
                <span>🖨️</span> Imprimir Certificado
              </button>
              <button 
                onClick={() => setMatrimonioExitoso(false)} 
                className="w-full py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}