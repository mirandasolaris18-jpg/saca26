// src/services/parroquiasService.js
const API_URL = "http://localhost:5000/api/parroquias";

export const fetchParroquias = async () => {
  const token = localStorage.getItem("token");
  const response = await fetch(API_URL, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Error al obtener las parroquias");
  return response.json();
};