// services/reportesService.js
const API_URL = "http://localhost:5000/api/reportes"; // Ajusta tu puerto si es necesario

export const fetchResumenReportes = async (fechaInicio = "", fechaFin = "") => {
  try {
    const token = localStorage.getItem("token");
    
    // Construir la URL con parámetros de consulta si existen fechas
    let url = `${API_URL}/resumen`;
    if (fechaInicio && fechaFin) {
      url += `?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Error al obtener los datos del reporte");
    }

    return await response.json();
  } catch (error) {
    console.error("Error en fetchResumenReportes:", error);
    throw error;
  }
};