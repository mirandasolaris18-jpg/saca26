// src/services/catequesisService.js
const API_URL = "http://localhost:5000/api/catequesis"; // Asegúrate de usar el puerto 5000
const FELIGRESES_URL = "http://localhost:5000/api/feligreses"; // Para el select de personas

// Obtener la lista de catequistas de la parroquia
export const fetchCatequistas = async () => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/catequistas`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
  if (!response.ok) throw new Error("Error al obtener los catequistas");
  return await response.json();
};

// Registrar un nuevo catequista
export const createCatequista = async (catequistaData) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/catequistas`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(catequistaData)
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Error al registrar el catequista");
  return data;
};

// Obtener feligreses para llenar el <select>
export const fetchFeligresesParaCatequistas = async () => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${FELIGRESES_URL}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
  if (!response.ok) throw new Error("Error al obtener feligreses");
  return await response.json();
};

// Agregar al final de src/services/catequesisService.js

// Obtener periodos (Gestiones)
export const fetchPeriodos = async () => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/periodos`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Error al obtener periodos");
  return await response.json();
};

// Obtener los grupos creados
export const fetchGrupos = async () => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/grupos`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Error al obtener grupos");
  return await response.json();
};

// Crear un nuevo grupo
export const createGrupo = async (grupoData) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/grupos`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(grupoData)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Error al crear el grupo");
  return data;
};

// Agregar al final de src/services/catequesisService.js

// Inscribir a un alumno
export const createInscripcion = async (inscripcionData) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/inscripciones`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(inscripcionData)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Error al realizar la inscripción");
  return data;
};

// Obtener los alumnos inscritos en un grupo
export const fetchInscritosPorGrupo = async (grupoId) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/inscripciones/${grupoId}`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Error al obtener la lista de inscritos");
  return await response.json();
};

// Cargar la planilla de un día específico
export const fetchPlanillaAsistencia = async (grupoId, fechaClase, tipoSesion) => {
  const token = localStorage.getItem("token");
  const url = `${API_URL}/asistencia/${grupoId}?fecha_clase=${fechaClase}&tipo_sesion=${tipoSesion}`;
  
  const response = await fetch(url, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Error al cargar la planilla");
  return await response.json();
};

// Guardar los registros de todo el curso
export const saveAsistencia = async (payload) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/asistencia`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Error al guardar asistencia");
  return data;
};