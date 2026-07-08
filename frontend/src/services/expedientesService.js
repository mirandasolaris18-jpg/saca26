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
// src/services/expedientesService.js

export const saveIntervinientes = async (id, intervinientesData) => {
  const token = localStorage.getItem("token");
  
  const response = await fetch(`http://localhost:5000/api/expedientes/${id}/intervinientes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json' // 🚨 ESTO ES VITAL PARA QUE EL BACKEND ENTIENDA EL ARRAY
    },
    body: JSON.stringify(intervinientesData)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Error al guardar intervinientes");
  }
  return data;
};

export const cambiarEstadoExpediente = async (id, estado) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/${id}/estado`, {
    method: "PUT",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ estado })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  return data;
};

export const trasladarExpediente = async (id, parroquia_destino_id) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/${id}/trasladar`, {
    method: "PUT",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ parroquia_destino_id })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  return data;
};