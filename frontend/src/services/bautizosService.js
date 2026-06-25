// src/services/bautizosService.js
const API_URL = "http://localhost:5000/api/bautizos";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  if (!token || token === "null" || token === "undefined") {
    return { "Content-Type": "application/json" };
  }
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };
};

// Obtener listas para los combobox (parroquias, sacerdotes, feligreses)
export const fetchRecursosBautizo = async () => {
  const resp = await fetch(`${API_URL}/recursos`, {
    method: "GET",
    headers: getHeaders(),
  });
  if (!resp.ok) throw new Error("Error al obtener recursos de bautizo");
  return await resp.json();
};

// Registrar un nuevo bautizo
export const createBautizo = async (data) => {
  const resp = await fetch(API_URL, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!resp.ok) {
    const errorData = await resp.json();
    throw new Error(errorData.message || "Error al guardar el acta de bautizo");
  }
  return await resp.json();
};



export const fetchBautizos = async (busqueda = "") => {
  const resp = await fetch(`${API_URL}?buscar=${busqueda}`, {
    method: "GET",
    headers: getHeaders(),
  });
  if (!resp.ok) throw new Error("Error al obtener historial de bautizos");
  return await resp.json();
};