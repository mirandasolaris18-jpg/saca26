// src/services/confirmacionesService.js
const API_URL = "http://localhost:5000/api/confirmaciones";

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

// Obtener listas para los combobox
export const fetchRecursosConfirmacion = async () => {
  const resp = await fetch(`${API_URL}/recursos`, { 
    method: "GET", 
    headers: getHeaders() 
  });
  if (!resp.ok) throw new Error("Error al obtener recursos de confirmación");
  return await resp.json();
};

// Registrar una nueva confirmación
export const createConfirmacion = async (data) => {
  const resp = await fetch(API_URL, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!resp.ok) {
    const errorData = await resp.json();
    throw new Error(errorData.message || "Error al guardar el acta de confirmación");
  }
  return await resp.json();
};

// Obtener el historial para la tabla
export const fetchConfirmaciones = async (busqueda = "") => {
  const resp = await fetch(`${API_URL}?buscar=${busqueda}`, { 
    method: "GET", 
    headers: getHeaders() 
  });
  if (!resp.ok) throw new Error("Error al obtener historial de confirmaciones");
  return await resp.json();
};