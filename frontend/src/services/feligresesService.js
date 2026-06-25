// src/services/feligresesService.js
const API_URL = "http://localhost:5000/api/feligreses";

// Función auxiliar para configurar los permisos (Token)
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

// 1. Obtener la lista de feligreses (con o sin búsqueda)
export const fetchFeligreses = async (busqueda = "") => {
  const resp = await fetch(`${API_URL}?buscar=${busqueda}`, {
    method: "GET",
    headers: getHeaders(),
  });
  if (!resp.ok) throw new Error("Error al obtener feligreses");
  return await resp.json();
};

// 2. Registrar un nuevo feligrés en la base de datos
export const createFeligres = async (data) => {
  const resp = await fetch(API_URL, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!resp.ok) {
    const errorData = await resp.json();
    throw new Error(errorData.message || "Error al guardar el feligrés");
  }
  return await resp.json();
};

// 3. Obtener el catálogo de ciudades para el formulario
export const fetchCiudades = async () => {
  const resp = await fetch(`${API_URL}/ciudades-lista`, {
    method: "GET",
    headers: getHeaders(),
  });
  if (!resp.ok) throw new Error("Error al obtener el catálogo de ciudades");
  return await resp.json();
};