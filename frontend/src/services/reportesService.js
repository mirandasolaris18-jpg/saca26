// src/services/reportesService.js

const BASE_URL = 'http://localhost:5000/api/reportes';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

// 1. Resumen general para las tarjetas del Dashboard
export const fetchResumenGeneral = async (fechaInicio, fechaFin) => {
  const response = await fetch(`${BASE_URL}/resumen-general?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`, {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Error al obtener el resumen general');
  return response.json();
};

// 2. Estadísticas de Bautizos
export const fetchEstadisticasBautizos = async (fechaInicio, fechaFin) => {
  const response = await fetch(`${BASE_URL}/bautizos?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`, {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Error al obtener estadísticas de bautizos');
  return response.json();
};

// 3. Estadísticas de Confirmaciones (CORREGIDO: Ahora ya existe la función)
export const fetchEstadisticasConfirmaciones = async (fechaInicio, fechaFin) => {
  const response = await fetch(`${BASE_URL}/confirmaciones?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`, {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Error al obtener estadísticas de confirmaciones');
  return response.json();
};

// 4. Estadísticas de Matrimonios (CORREGIDO: Ahora ya existe la función)
export const fetchEstadisticasMatrimonios = async (fechaInicio, fechaFin) => {
  const response = await fetch(`${BASE_URL}/matrimonios?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`, {
    headers: getHeaders()
  });
  if (!response.ok) throw new Error('Error al obtener estadísticas de matrimonios');
  return response.json();
};