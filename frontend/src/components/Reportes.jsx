// components/Reportes.jsx
import React, { useState, useEffect } from "react";
import { fetchResumenReportes } from "../services/reportesService";
import { jsPDF } from "jspdf";

export default function Reportes({ onVolver }) {
  const [estadisticas, setEstadisticas] = useState({
    bautizos: 0,
    confirmaciones: 0,
    matrimonios: 0,
    feligreses: 0
  });

  const [fechas, setFechas] = useState({ inicio: "", fin: "" });
  const [cargando, setCargando] = useState(false);

  const cargarEstadisticas = async (fechaInicio, fechaFin) => {
    setCargando(true);
    try {
      const data = await fetchResumenReportes(fechaInicio, fechaFin);
      setEstadisticas(data);
    } catch (error) {
      alert("❌ Hubo un problema al cargar los reportes.");
    } finally {
      setCargando(false);
    }
  };

  // Carga inicial (Totales históricos)
  useEffect(() => {
    cargarEstadisticas("", "");
  }, []);

  const handleFiltrar = (e) => {
    e.preventDefault();
    if (!fechas.inicio || !fechas.fin) {
      alert("⚠️ Por favor selecciona ambas fechas para filtrar.");
      return;
    }
    if (new Date(fechas.inicio) > new Date(fechas.fin)) {
      alert("⚠️ La fecha de inicio no puede ser mayor a la fecha de fin.");
      return;
    }
    cargarEstadisticas(fechas.inicio, fechas.fin);
  };

  const handleLimpiarFiltros = () => {
    setFechas({ inicio: "", fin: "" });
    cargarEstadisticas("", "");
  };

  const generarPDF = () => {
    const doc = new jsPDF();
    const usuarioActual = JSON.parse(localStorage.getItem('usuario') || '{}');
    const fechaReporte = new Date().toLocaleDateString();

    // Bordes decorativos
    doc.setLineWidth(1); doc.rect(10, 10, 190, 277);
    doc.setLineWidth(0.5); doc.rect(12, 12, 186, 273);

    // Cabecera
    doc.setFont("times", "bold");
    doc.setFontSize(22);
    doc.setTextColor(6, 95, 70); // Verde Esmeralda
    doc.text("REPORTE ESTADÍSTICO PARROQUIAL", 105, 30, { align: "center" });

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Parroquia/Sede: ${usuarioActual.parroquia_nombre || "General (Toda la diócesis)"}`, 105, 40, { align: "center" });
    doc.text(`Generado por: ${usuarioActual.nombre_completo || "Administrador"} - Fecha: ${fechaReporte}`, 105, 48, { align: "center" });

    // Filtros aplicados
    doc.setFontSize(11);
    doc.setFont("times", "italic");
    const textoFiltro = fechas.inicio && fechas.fin 
      ? `Período analizado: Del ${fechas.inicio} al ${fechas.fin}` 
      : `Período analizado: Histórico completo (Sin filtro de fechas)`;
    doc.text(textoFiltro, 105, 60, { align: "center" });

    doc.line(20, 65, 190, 65);

    // Contenido / Métricas
    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.text("RESUMEN DE SACRAMENTOS Y REGISTROS", 20, 80);

    doc.setFontSize(14);
    doc.setFont("times", "normal");
    doc.text(`• Total de Bautizos Registrados:`, 30, 100);
    doc.text(estadisticas.bautizos.toString(), 140, 100);

    doc.text(`• Total de Confirmaciones Registradas:`, 30, 115);
    doc.text(estadisticas.confirmaciones.toString(), 140, 115);

    doc.text(`• Total de Matrimonios Registrados:`, 30, 130);
    doc.text(estadisticas.matrimonios.toString(), 140, 130);

    doc.line(30, 140, 160, 140);

    doc.setFont("times", "bold");
    doc.text(`• Total de Feligreses en Base de Datos:`, 30, 155);
    doc.text(estadisticas.feligreses.toString(), 140, 155);

    // Firmas
    doc.line(60, 240, 150, 240);
    doc.setFont("times", "normal");
    doc.setFontSize(12);
    doc.text("Firma y Sello del Responsable", 105, 248, { align: "center" });

    doc.save(`Reporte_Parroquial_${fechaReporte.replace(/\//g, '-')}.pdf`);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <button onClick={onVolver} className="text-sm text-emerald-700 font-semibold hover:underline">← Volver al Panel</button>
          <h2 className="text-2xl font-bold text-gray-900 mt-1 flex items-center gap-2">
            <span className="text-3xl">📊</span> Módulo de Reportes
          </h2>
        </div>
        <button 
          onClick={generarPDF}
          className="px-5 py-2 bg-emerald-700 text-white font-bold rounded-lg shadow hover:bg-emerald-800 transition-colors flex items-center gap-2"
        >
          <span>🖨️</span> Descargar Reporte PDF
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-8">
        <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Filtro por Rango de Fechas</h3>
        <form onSubmit={handleFiltrar} className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha Inicio</label>
            <input 
              type="date" 
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
              value={fechas.inicio} 
              onChange={(e) => setFechas({...fechas, inicio: e.target.value})} 
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha Fin</label>
            <input 
              type="date" 
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
              value={fechas.fin} 
              onChange={(e) => setFechas({...fechas, fin: e.target.value})} 
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-gray-800 text-white font-semibold rounded text-sm hover:bg-gray-900 transition-colors">
              Aplicar Filtro
            </button>
            <button type="button" onClick={handleLimpiarFiltros} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded text-sm hover:bg-gray-100 transition-colors">
              Limpiar
            </button>
          </div>
        </form>
      </div>

      {/* Grid de Tarjetas de Estadísticas */}
      {cargando ? (
        <div className="text-center py-10 text-emerald-700 font-bold animate-pulse">Cargando métricas...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-100 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="text-4xl mb-2">💧</div>
            <h4 className="text-blue-800 font-bold text-sm uppercase tracking-wide">Bautizos</h4>
            <span className="text-4xl font-extrabold text-blue-900 mt-2">{estadisticas.bautizos}</span>
          </div>

          <div className="bg-orange-50 rounded-xl p-6 border border-orange-100 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="text-4xl mb-2">🕊️</div>
            <h4 className="text-orange-800 font-bold text-sm uppercase tracking-wide">Confirmaciones</h4>
            <span className="text-4xl font-extrabold text-orange-900 mt-2">{estadisticas.confirmaciones}</span>
          </div>

          <div className="bg-pink-50 rounded-xl p-6 border border-pink-100 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="text-4xl mb-2">💍</div>
            <h4 className="text-pink-800 font-bold text-sm uppercase tracking-wide">Matrimonios</h4>
            <span className="text-4xl font-extrabold text-pink-900 mt-2">{estadisticas.matrimonios}</span>
          </div>

          <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="text-4xl mb-2">👥</div>
            <h4 className="text-emerald-800 font-bold text-sm uppercase tracking-wide">Feligreses Activos</h4>
            <span className="text-4xl font-extrabold text-emerald-900 mt-2">{estadisticas.feligreses}</span>
          </div>

        </div>
      )}

      <div className="mt-8 text-xs text-gray-400 text-center italic">
        * Las estadísticas reflejan únicamente los registros válidos (activos) en el sistema. Los documentos con borrado lógico no se contabilizan.
      </div>
    </div>
  );
}