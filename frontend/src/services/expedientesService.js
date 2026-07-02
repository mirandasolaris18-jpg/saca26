// src/services/expedientesService.js
const API_URL = "http://localhost:5000/api/expedientes";

export const fetchExpedientes = async () => {
  const token = localStorage.getItem("token");
  const response = await fetch(API_URL, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Error al obtener los expedientes.");
  return await response.json();
};

export const programarMatrimonio = async (datos) => {
  const token = localStorage.getItem("token");
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(datos)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Error al programar.");
  return data;
};

// Obtener los intervinientes (padres, padrinos, testigos) de un expediente
export const fetchIntervinientes = async (expedienteId) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/${expedienteId}/intervinientes`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Error al obtener los intervinientes.");
  return await response.json();
};

// Guardar los intervinientes
export const saveIntervinientes = async (expedienteId, intervinientes) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/${expedienteId}/intervinientes`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ intervinientes })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Error al guardar intervinientes.");
  return data;
};