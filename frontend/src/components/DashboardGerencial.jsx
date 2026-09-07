import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer 
} from 'recharts';

// --- DATOS SIMULADOS (MOCKS) PARA LA PRESENTACIÓN ---
const kpis = {
  totalBautizos: 1450,
  totalConfirmaciones: 890,
  totalMatrimonios: 320,
  tramitesPendientes: 45
};

const datosTorta = [
  { name: 'Bautizos', value: 1450 },
  { name: 'Confirmaciones', value: 890 },
  { name: 'Matrimonios', value: 320 },
];

const datosBarras = [
  { mes: 'Ene', Bautizos: 120, Confirmaciones: 80, Matrimonios: 20 },
  { mes: 'Feb', Bautizos: 98, Confirmaciones: 45, Matrimonios: 35 },
  { mes: 'Mar', Bautizos: 86, Confirmaciones: 60, Matrimonios: 15 },
  { mes: 'Abr', Bautizos: 105, Confirmaciones: 70, Matrimonios: 25 },
  { mes: 'May', Bautizos: 130, Confirmaciones: 90, Matrimonios: 40 },
  { mes: 'Jun', Bautizos: 150, Confirmaciones: 110, Matrimonios: 30 },
];

// Colores institucionales para los gráficos
const COLORES = ['#059669', '#dc2626', '#d97706']; // Esmeralda, Rojo, Ámbar

export default function DashboardGerencial({ user }) {
  const [cargando, setCargando] = useState(false);

  // Aquí en el futuro haremos el fetch al backend:
  // useEffect(() => { fetchMetricasCuria(); }, []);

  return (
    <div className="bg-gray-50 min-h-full animate-fade-in">
      
      {/* ENCABEZADO */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Panel Gerencial de la Diócesis</h2>
          <p className="text-sm text-gray-500">Métricas y tendencias sacramentales a nivel global.</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-gray-400 uppercase">Autoridad en Sesión</p>
          <p className="text-emerald-800 font-bold">{user?.nombre_completo || 'Cancillería'}</p>
        </div>
      </div>

      {/* TARJETAS DE INDICADORES (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100 border-l-4 border-l-emerald-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Total Bautizos (Año)</p>
            <p className="text-3xl font-extrabold text-gray-800 mt-1">{kpis.totalBautizos}</p>
          </div>
          <div className="text-4xl">💧</div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100 border-l-4 border-l-red-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Confirmaciones (Año)</p>
            <p className="text-3xl font-extrabold text-gray-800 mt-1">{kpis.totalConfirmaciones}</p>
          </div>
          <div className="text-4xl">🕊️</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-amber-100 border-l-4 border-l-amber-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Matrimonios (Año)</p>
            <p className="text-3xl font-extrabold text-gray-800 mt-1">{kpis.totalMatrimonios}</p>
          </div>
          <div className="text-4xl">💍</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-purple-100 border-l-4 border-l-purple-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Trámites Pendientes</p>
            <p className="text-3xl font-extrabold text-purple-700 mt-1">{kpis.tramitesPendientes}</p>
          </div>
          <div className="text-4xl">📨</div>
        </div>
      </div>

      {/* SECCIÓN DE GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* GRÁFICO DE TORTA */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-1">
          <h3 className="text-sm font-bold text-gray-700 uppercase mb-4 text-center">Distribución Sacramental</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={datosTorta}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {datosTorta.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORES[index % COLORES.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => new Intl.NumberFormat('es-BO').format(value)} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-center text-gray-400 mt-2">Porcentaje de sacramentos registrados en la gestión actual.</p>
        </div>

        {/* GRÁFICO DE BARRAS */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
          <h3 className="text-sm font-bold text-gray-700 uppercase mb-4">Tendencia Mensual de Celebraciones</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <BarChart data={datosBarras} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Bautizos" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Confirmaciones" fill="#dc2626" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Matrimonios" fill="#d97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}