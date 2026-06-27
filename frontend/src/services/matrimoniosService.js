// src/services/matrimoniosService.js

// Asegúrate de que este puerto coincida con el que usa tu backend en index.js
const API_URL = "http://localhost:5000/api/matrimonios";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };
};

export const fetchRecursosMatrimonio = async () => {
  const resp = await fetch(`${API_URL}/recursos`, { method: "GET", headers: getHeaders() });
  if (!resp.ok) throw new Error("Error al obtener recursos de matrimonio");
  return await resp.json();
};

export const createMatrimonio = async (data) => {
  const resp = await fetch(API_URL, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!resp.ok) {
    const errorData = await resp.json();
    throw new Error(errorData.message || "Error al guardar el acta matrimonial");
  }
  return await resp.json();
};

export const fetchMatrimonios = async (busqueda = "") => {
  const resp = await fetch(`${API_URL}?buscar=${busqueda}`, { method: "GET", headers: getHeaders() });
  if (!resp.ok) throw new Error("Error al obtener historial de matrimonios");
  return await resp.json();
};

// CORRECCIÓN: Usamos la constante API_URL para mantener consistencia en el puerto
export const fetchMatrimonioPDF = async (id) => {
  const response = await fetch(`${API_URL}/${id}/pdf`, { 
    method: "GET",
    headers: getHeaders() 
  });
  if (!response.ok) throw new Error("Error al obtener los datos para el PDF");
  return await response.json();
};