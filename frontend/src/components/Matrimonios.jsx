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

  // 1. CORRECCIÓN PRINCIPAL: Usar novio_id y novia_id
  const [form, setForm] = useState({
    novio_id: "", novia_id: "", padrino_id: "", madrina_id: "", 
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 2. Validación actualizada
    if (form.novio_id === form.novia_id) {
      alert("❌ Error: El esposo y la esposa no pueden ser la misma persona.");
      return;
    }

    try {
      await createMatrimonio(form);
      
      const f = recursos.feligreses;
      const getNombre = (id) => f.find(x => x.id == id)?.nombre_completo || "---";

      // 3. Generación para PDF actualizada
      setDatosImpresion({
        esposo: getNombre(form.novio_id),
        esposa: getNombre(form.novia_id),
        padrino: getNombre(form.padrino_id),
        madrina: getNombre(form.madrina_id),
        testigo1: getNombre(form.testigo1_id),
        testigo2: getNombre(form.testigo2_id),
        fecha: form.fecha_matrimonio,
        sacerdote: recursos.sacerdotes.find(s => s.id == form.sacerdote_id)?.nombre_completo || "",
        libro: form.numero_libro,
        pagina: form.pagina_libro,
        seccion: form.seccion_libro
      });

      setMostrarModal(false);
      setMatrimonioExitoso(true);
      cargarDatos(); 
      
      // Limpiar formulario tras éxito
      setForm({ 
        novio_id: "", novia_id: "", padrino_id: "", madrina_id: "", 
        testigo1_id: "", testigo2_id: "", fecha_matrimonio: "", 
        sacerdote_id: "", numero_libro: "", pagina_libro: "", seccion_libro: "" 
      });

    } catch (error) {
      alert(`❌ ${error.message}`); 
    }
  };

  const generarPDF = (datos) => {
    const doc = new jsPDF();
    doc.setFont("times", "normal");
    doc.setFontSize(22);
    doc.text("Certificado de Matrimonio", 105, 30, { align: "center" });

    doc.setFontSize(14);
    doc.text(`Esposo: ${datos.esposo}`, 20, 60);
    doc.text(`Esposa: ${datos.esposa}`, 20, 70);
    doc.text(`Fecha: ${datos.fecha}`, 20, 80);
    doc.text(`Sacerdote Oficiante: ${datos.sacerdote}`, 20, 90);
    
    doc.setFontSize(12);
    doc.text(`Padrinos: ${datos.padrino} y ${datos.madrina}`, 20, 110);
    doc.text(`Testigos: ${datos.testigo1} y ${datos.testigo2}`, 20, 120);
    doc.text(`Libro: ${datos.libro} | Página: ${datos.pagina} | Sección: ${datos.seccion}`, 20, 140);

    doc.save(`Acta_Matrimonio_${datos.esposo.split(" ")[0]}_${datos.esposa.split(" ")[0]}.pdf`);
  };

  // Render para separar feligreses masculinos y femeninos visualmente en los Selects
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

      {/* Buscador */}
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

      {/* Tabla de Matrimonios */}
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
                  <button onClick={() => alert("Función de impresión en construcción")} className="text-gray-600 hover:text-gray-800" title="Imprimir Acta">🖨️</button>
                </td>
              </tr>
            ))}
            {listaMatrimonios.length === 0 && (
              <tr><td colSpan="7" className="p-6 text-center text-gray-500 italic">No se encontraron matrimonios registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Registro */}
      {mostrarModal && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center z-50 overflow-y-auto py-10">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl p-6 relative my-auto">
            <button 
              onClick={() => setMostrarModal(false)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl font-bold transition-colors"
            >
              ×
            </button>
            <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Registrar Nueva Acta de Matrimonio</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Sección Contrayentes */}
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

              {/* Sección Padrinos y Testigos */}
              <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                <h4 className="font-semibold text-blue-800 mb-3 text-sm uppercase tracking-wider">II. Padrinos y Testigos</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Padrino (Opcional)</label>
                    <select name="padrino_id" value={form.padrino_id} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm">
                      <option value="">-- Seleccionar --</option>
                      {recursos?.feligreses?.map(renderContrayente)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Madrina (Opcional)</label>
                    <select name="madrina_id" value={form.madrina_id} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm">
                      <option value="">-- Seleccionar --</option>
                      {recursos?.feligreses?.map(renderContrayente)}
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

              {/* Sección Datos Parroquiales y de Archivo */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wider">III. Detalles de Celebración y Archivo</h4>
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
                <button type="button" onClick={() => setMostrarModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-300 transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 transition-colors cursor-pointer">Guardar Acta</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Éxito e Impresión */}
      {matrimonioExitoso && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/60 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">💍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">¡Matrimonio Registrado!</h3>
            <p className="text-sm text-gray-500 mb-6">El acta nupcial ha pasado todos los controles del sistema y fue guardada con éxito.</p>
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