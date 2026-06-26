import React, { useState, useEffect, useRef } from "react";
import { fetchResumenReportes } from "../services/reportesService";
import { jsPDF } from "jspdf";
// Importaciones de Chart.js
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Registrar los componentes de Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function Reportes({ onVolver }) {
  const [estadisticas, setEstadisticas] = useState({
    bautizos: 0,
    confirmaciones: 0,
    matrimonios: 0,
    feligreses: 0
  });

  const [fechas, setFechas] = useState({ inicio: "", fin: "" });
  const [cargando, setCargando] = useState(false);
  
  // Referencia para capturar el gráfico de torta y meterlo al PDF
  const chartRef = useRef(null);

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

  useEffect(() => {
    cargarEstadisticas("", "");
  }, []);

  const handleFiltrar = (e) => {
    e.preventDefault();
    if (!fechas.inicio || !fechas.fin) return alert("⚠️ Selecciona ambas fechas.");
    if (new Date(fechas.inicio) > new Date(fechas.fin)) return alert("⚠️ La fecha inicio no puede ser mayor.");
    cargarEstadisticas(fechas.inicio, fechas.fin);
  };

  const handleLimpiarFiltros = () => {
    setFechas({ inicio: "", fin: "" });
    cargarEstadisticas("", "");
  };

  // --- DATOS PARA LOS GRÁFICOS ---
  const dataPastel = {
    labels: ['Bautizos', 'Confirmaciones', 'Matrimonios'],
    datasets: [{
      data: [estadisticas.bautizos, estadisticas.confirmaciones, estadisticas.matrimonios],
      backgroundColor: ['#3b82f6', '#f97316', '#ec4899'], // Azul, Naranja, Rosa
      hoverOffset: 4
    }]
  };

  const dataBarras = {
    labels: ['Total en Sistema'],
    datasets: [{
      label: 'Feligreses Activos',
      data: [estadisticas.feligreses],
      backgroundColor: ['#10b981'], // Verde Esmeralda
      borderRadius: 4
    }]
  };

  const generarPDF = () => {
    const doc = new jsPDF();
    const usuarioActual = JSON.parse(localStorage.getItem('usuario') || '{}');
    const fechaReporte = new Date().toLocaleDateString();

    // Diseño Base
    doc.setLineWidth(1); doc.rect(10, 10, 190, 277);
    doc.setLineWidth(0.5); doc.rect(12, 12, 186, 273);

    doc.setFont("times", "bold");
    doc.setFontSize(22);
    doc.setTextColor(6, 95, 70); 
    doc.text("REPORTE ESTADÍSTICO PARROQUIAL", 105, 30, { align: "center" });

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Parroquia/Sede: ${usuarioActual.parroquia_nombre || "General (Toda la diócesis)"}`, 105, 40, { align: "center" });
    doc.text(`Generado por: ${usuarioActual.nombre_completo || "Administrador"} - Fecha: ${fechaReporte}`, 105, 48, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("times", "italic");
    const textoFiltro = fechas.inicio && fechas.fin ? `Período: Del ${fechas.inicio} al ${fechas.fin}` : `Período: Histórico completo`;
    doc.text(textoFiltro, 105, 60, { align: "center" });
    doc.line(20, 65, 190, 65);

    // Métricas en Texto
    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.text("RESUMEN NUMÉRICO", 20, 80);

    doc.setFontSize(14);
    doc.setFont("times", "normal");
    doc.text(`• Total de Bautizos:`, 30, 95); doc.text(estadisticas.bautizos.toString(), 100, 95);
    doc.text(`• Total de Confirmaciones:`, 30, 105); doc.text(estadisticas.confirmaciones.toString(), 100, 105);
    doc.text(`• Total de Matrimonios:`, 30, 115); doc.text(estadisticas.matrimonios.toString(), 100, 115);
    doc.text(`• Feligreses Activos:`, 30, 125); doc.text(estadisticas.feligreses.toString(), 100, 125);

    // ==========================================
    // MAGIA: INCRUSTAR EL GRÁFICO EN EL PDF
    // ==========================================
    if (chartRef.current) {
      // Tomamos el "canvas" HTML y lo convertimos a una imagen PNG en base64
      const chartImageBase64 = chartRef.current.canvas.toDataURL("image/png");
      doc.setFont("times", "bold");
      doc.setFontSize(16);
      doc.text("DISTRIBUCIÓN DE SACRAMENTOS", 20, 145);
      // Pegamos la imagen en el PDF (X: 55, Y: 155, Ancho: 100, Alto: 100)
      doc.addImage(chartImageBase64, 'PNG', 55, 155, 100, 100);
    }

    doc.line(60, 270, 150, 270);
    doc.setFont("times", "normal");
    doc.setFontSize(12);
    doc.text("Firma y Sello del Responsable", 105, 278, { align: "center" });

    doc.save(`Reporte_Parroquial_${fechaReporte.replace(/\//g, '-')}.pdf`);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <button onClick={onVolver} className="text-sm text-emerald-700 font-semibold hover:underline">← Volver al Panel</button>
          <h2 className="text-2xl font-bold text-gray-900 mt-1 flex items-center gap-2">
            <span className="text-3xl">📊</span> Módulo de Reportes Visuales
          </h2>
        </div>
        <button onClick={generarPDF} className="px-5 py-2 bg-emerald-700 text-white font-bold rounded-lg shadow hover:bg-emerald-800 transition-colors flex items-center gap-2">
          <span>🖨️</span> Descargar Reporte PDF
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-8">
        <form onSubmit={handleFiltrar} className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha Inicio</label>
            <input type="date" className="w-full px-3 py-2 border rounded focus:ring-1 outline-none text-sm" value={fechas.inicio} onChange={(e) => setFechas({...fechas, inicio: e.target.value})} />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha Fin</label>
            <input type="date" className="w-full px-3 py-2 border rounded focus:ring-1 outline-none text-sm" value={fechas.fin} onChange={(e) => setFechas({...fechas, fin: e.target.value})} />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-gray-800 text-white rounded text-sm hover:bg-gray-900">Filtrar</button>
            <button type="button" onClick={handleLimpiarFiltros} className="px-4 py-2 bg-white border text-gray-700 rounded text-sm hover:bg-gray-100">Limpiar</button>
          </div>
        </form>
      </div>

      {cargando ? (
        <div className="text-center py-10 text-emerald-700 font-bold animate-pulse">Cargando métricas y gráficos...</div>
      ) : (
        <>
          {/* Tarjetas Superiores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 text-center shadow-sm">
              <h4 className="text-blue-800 font-bold text-xs uppercase">Bautizos</h4>
              <span className="text-3xl font-extrabold text-blue-900">{estadisticas.bautizos}</span>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100 text-center shadow-sm">
              <h4 className="text-orange-800 font-bold text-xs uppercase">Confirmaciones</h4>
              <span className="text-3xl font-extrabold text-orange-900">{estadisticas.confirmaciones}</span>
            </div>
            <div className="bg-pink-50 rounded-xl p-4 border border-pink-100 text-center shadow-sm">
              <h4 className="text-pink-800 font-bold text-xs uppercase">Matrimonios</h4>
              <span className="text-3xl font-extrabold text-pink-900">{estadisticas.matrimonios}</span>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 text-center shadow-sm">
              <h4 className="text-emerald-800 font-bold text-xs uppercase">Feligreses Activos</h4>
              <span className="text-3xl font-extrabold text-emerald-900">{estadisticas.feligreses}</span>
            </div>
          </div>

          {/* Gráficos Visuales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Gráfico Torta */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center">
              <h3 className="font-bold text-gray-700 mb-4">Proporción de Sacramentos</h3>
              <div className="w-64 h-64">
                <Pie ref={chartRef} data={dataPastel} options={{ maintainAspectRatio: false }} />
              </div>
            </div>

            {/* Gráfico Barras */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center">
              <h3 className="font-bold text-gray-700 mb-4">Volumen de Feligreses</h3>
              <div className="w-full h-64">
                <Bar 
                  data={dataBarras} 
                  options={{ 
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } }
                  }} 
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}