import React, { useState, useEffect } from "react";

export default function Feligreses({ onVolver }) {
  const [feligreses, setFeligreses] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    documento_identidad: "",
    fecha_nacimiento: "",
    telefono: "",
    direccion: "",
    ciudad_id: "",
  });

  // Obtener el token almacenado (ajusta 'token' si usas otro nombre en tu login)
 const token = localStorage.getItem('token');

const response = await fetch('http://localhost:3000/api/feligreses', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(formData)
});

  const obtenerFeligreses = async () => {
    try {
      const resp = await fetch(
        `http://localhost:5000/api/feligreses?buscar=${busqueda}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`, // Incluimos la autenticación requerida
            "Content-Type": "application/json"
          }
        }
      );
      const data = await resp.json();
      if (resp.ok) setFeligreses(data);
    } catch (error) {
      console.error("Error conectando al backend:", error);
    }
  };

  const obtenerCiudades = async () => {
    try {
      // Esta ruta en el backend no requiere authMiddleware según nuestro diseño, se pide directo
      const resp = await fetch("http://localhost:5000/api/feligreses/ciudades-lista");
      const data = await resp.json();
      if (resp.ok) setCiudades(data);
    } catch (error) {
      console.error("Error conectando al backend:", error);
    }
  };

  useEffect(() => {
    obtenerFeligreses();
  }, [busqueda]);

  useEffect(() => {
    obtenerCiudades();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const resp = await fetch("http://localhost:5000/api/feligreses", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // Incluimos la autenticación requerida
        },
        body: JSON.stringify(form),
      });
      const data = await resp.json();

      if (resp.ok) {
        setMostrarModal(false);
        setForm({
          nombre: "",
          apellido: "",
          documento_identidad: "",
          fecha_nacimiento: "",
          telefono: "",
          direccion: "",
          ciudad_id: "",
        });
        obtenerFeligreses();
      } else {
        alert(`❌ Error: ${data.message}`);
      }
    } catch (error) {
      alert("❌ No se pudo conectar con el servidor backend");
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-200">
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <button
            onClick={onVolver}
            className="text-sm text-amber-600 font-semibold hover:underline mb-1 block cursor-pointer"
          >
            ← Volver al Panel
          </button>
          <h2 className="text-2xl font-bold text-gray-900">
            Módulo de Feligreses
          </h2>
        </div>
        <button
          onClick={() => setMostrarModal(true)}
          className="px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg text-sm hover:bg-amber-700 transition-colors shadow-xs cursor-pointer"
        >
          + Registrar Nuevo Feligrés
        </button>
      </div>

      {/* BÚSQUEDA */}
      <div className="mb-6">
        {!busqueda && (
          <p className="text-xs text-gray-500 mt-2 font-medium flex items-center gap-1">
            <span className="text-amber-600">ℹ️</span> Mostrando los 10 últimos registros ingresados al sistema.
          </p>
        )}
        <input
          type="text"
          placeholder="Buscar por nombre, apellido, cédula o dirección..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-hidden focus:border-amber-500 text-sm"
        />
      </div>

      {/* TABLA DE FELIGRESES */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-left text-sm text-gray-600 border-collapse">
          <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-bold border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-center w-12">N°</th>
              <th className="px-6 py-3">Apellidos y Nombres</th>
              <th className="px-6 py-3">Nro. Documento</th>
              <th className="px-6 py-3">Teléfono</th>
              <th className="px-6 py-3">Procedencia (Municipio/País)</th>
              <th className="px-6 py-3">Dirección Específica</th>
              <th className="px-6 py-3 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {feligreses.length > 0 ? (
              feligreses.map((f, index) => (
                <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 text-center font-medium text-gray-400">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900 uppercase">
                    {f.apellido} {f.nombre}
                  </td>
                  <td className="px-6 py-4 font-mono text-gray-700">
                    {f.documento_identidad
                      ? `C.I. ${f.documento_identidad}`
                      : "—"}
                  </td>
                  <td className="px-6 py-4">
                    {f.telefono || (
                      <span className="text-gray-400 italic text-xs">
                        No registra
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {f.ciudad ? (
                      `${f.ciudad} (${f.pais})`
                    ) : (
                      <span className="text-gray-400 italic text-xs">
                        Sin asignar
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600 truncate max-w-xs">
                    {f.direccion || (
                      <span className="text-gray-400 italic text-xs">
                        No registra
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        f.estado === "Activo"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {f.estado || "Activo"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="7"
                  className="px-6 py-10 text-center text-gray-400"
                >
                  No se encontraron feligreses registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DE REGISTRO */}
      {mostrarModal && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Registrar Nuevo Feligrés
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Nombre(s)*
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    required
                    value={form.nombre}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm uppercase focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Apellido(s)*
                  </label>
                  <input
                    type="text"
                    name="apellido"
                    required
                    value={form.apellido}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm uppercase focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Documento de Identidad (Opcional)
                </label>
                <input
                  type="text"
                  name="documento_identidad"
                  placeholder="Ej: 7491147"
                  value={form.documento_identidad}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  name="fecha_nacimiento"
                  value={form.fecha_nacimiento}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Teléfono / Celular (Opcional)
                </label>
                <input
                  type="text"
                  name="telefono"
                  placeholder="Ej: 76543210"
                  value={form.telefono}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              {/* COMBOBOX CON LOS DATOS DE NAVICAT */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Municipio / Procedencia (Opcional)
                </label>
                <select
                  name="ciudad_id"
                  value={form.ciudad_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:border-amber-500 focus:outline-hidden text-gray-800"
                >
                  <option value="">-- Selecciona un municipio --</option>
                  {ciudades.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.ciudad} ({c.pais})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Dirección Domiciliaria (Opcional)
                </label>
                <textarea
                  name="direccion"
                  rows="2"
                  placeholder="Ej: Barrio Central, Calle Bolívar #12"
                  value={form.direccion}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-amber-500 focus:outline-hidden"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg cursor-pointer"
                >
                  Guardar en Sistema
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

