// services/feligresesService.js
const API_URL = "http://localhost:5000/api/feligreses";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  
  // Evitamos enviar strings "null" o "undefined" literales al backend
  if (!token || token === "null" || token === "undefined") {
    return { "Content-Type": "application/json" };
  }

  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };
};

export const fetchFeligreses = async (busqueda = "") => {
  const resp = await fetch(`${API_URL}?buscar=${busqueda}`, {
    method: "GET",
    headers: getHeaders(),
  });
  if (!resp.ok) throw new Error("Error al obtener feligreses");
  return await resp.json();
};

// CORREGIDO: Nombre cambiado a singular para alinearse con Feligreses.jsx
export const createFeligres = async (data) => {
  const resp = await fetch(API_URL, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!resp.ok) {
    const errorData = await resp.json();
    throw new Error(errorData.message || "Error al guardar");
  }
  return await resp.json();
};

export const fetchCiudades = async () => {
  const resp = await fetch(`${API_URL}/ciudades-lista`, {
    method: "GET",
    headers: getHeaders(), // CORREGIDO: Ahora sí envía las credenciales
  });
  if (!resp.ok) throw new Error("Error al obtener ciudades");
  return await resp.json();
};