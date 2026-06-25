// src/components/Reportes.jsx
import React, { useState, useEffect } from 'react';
import { 
  fetchResumenGeneral, 
  fetchEstadisticasBautizos, 
  fetchEstadisticasConfirmaciones, 
  fetchEstadisticasMatrimonios 
} from '../services/reportesService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Reportes() {
  const [vista, setVista] = useState('bautizos');
  const [datos, setDatos] = useState([]);
  const [resumen, setResumen] = useState({ totalBautizos: 0, totalConfirmaciones: 0, totalMatrimonios: 0 });
  
  const añoActual = new Date().getFullYear();
  const [fechaInicio, setFechaInicio] = useState(`${añoActual}-01-01`);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);

  const cargarDatos = async () => {
    try {
      const resumenData = await fetchResumenGeneral(fechaInicio, fechaFin);
      setResumen(resumenData);

      let reporte;
      if (vista === 'bautizos') reporte = await fetchEstadisticasBautizos(fechaInicio, fechaFin);
      else if (vista === 'confirmaciones') reporte = await fetchEstadisticasConfirmaciones(fechaInicio, fechaFin);
      else if (vista === 'matrimonios') reporte = await fetchEstadisticasMatrimonios(fechaInicio, fechaFin);
      
      setDatos(reporte);
    } catch (err) {
      console.error("Error al cargar reportes:", err);
    }
  };

  useEffect(() => { cargarDatos(); }, [vista, fechaInicio, fechaFin]);

  return (
    <div className="p-6 space-y-6">
      {/* 1. Tarjetas de Resumen Global */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">Total Bautizos</p>
          <p className="text-2xl font-bold">{resumen.totalBautizos}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <p className="text-sm text-gray-500">Total Confirmaciones</p>
          <p className="text-2xl font-bold">{resumen.totalConfirmaciones}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-emerald-500">
          <p className="text-sm text-gray-500">Total Matrimonios</p>
          <p className="text-2xl font-bold">{resumen.totalMatrimonios}</p>
        </div>
      </div>

      {/* 2. Selector de Vista */}
      <div className="flex gap-2 bg-gray-200 p-1 rounded-lg w-fit">
        {['bautizos', 'confirmaciones', 'matrimonios'].map((item) => (
          <button 
            key={item}
            onClick={() => setVista(item)}
            className={`px-4 py-2 rounded capitalize ${vista === item ? 'bg-white shadow' : 'text-gray-600'}`}
          >
            {item}
          </button>
        ))}
      </div>

      {/* 3. Área de Gráfica */}
      <div className="bg-white p-6 rounded shadow h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="parroquia_nombre" />
            <YAxis />
            <Tooltip />
            <Bar dataKey={vista === 'bautizos' ? 'total_bautizos' : vista === 'confirmaciones' ? 'total_confirmaciones' : 'total_matrimonios'} fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}