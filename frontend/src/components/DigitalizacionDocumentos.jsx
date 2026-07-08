// src/components/DigitalizacionDocumentos.jsx
import React, { useState } from 'react';

export default function DigitalizacionDocumentos({ expediente, onVolver }) {
  const [archivos, setArchivos] = useState({});
  const [cargando, setCargando] = useState(false);

  const documentosRequeridos = [
    { id: 'doc_expediente', label: 'Documento firmado de expediente matrimonial' },
    { id: 'cert_bautizo', label: 'Certificado de bautizo de ambos novios' },
    { id: 'ci_novios', label: 'Fotocopia de carnet de identidad de ambos novios' },
    { id: 'ci_padrinos', label: 'Fotocopia de carnet de ambos padrinos' },
    { id: 'ci_testigos', label: 'Fotocopia de carnet de ambos testigos' },
    { id: 'cert_matrimonio_pad', label: 'Certificado de matrimonio de los padrinos' },
    { id: 'cert_confirmacion', label: 'Certificado de confirmación de ambos novios' }
  ];

  const handleFileChange = (e, docId) => {
    setArchivos({ ...archivos, [docId]: e.target.files[0] });
  };

  const handleUpload = async (docId, nombreDocumento) => {
    const file = archivos[docId];
    if (!file) return alert('Seleccione un archivo primero.');
    
    setCargando(true);
    // Aquí conectarías con tu backend (ej. usando FormData y multer)
    // await uploadDocumentoService(expediente.id, nombreDocumento, file);
    
    setTimeout(() => {
      alert(`✅ ${nombreDocumento} subido correctamente.`);
      setCargando(false);
    }, 1000);
  };

  return (
    <div className="animate-fade-in bg-white p-6 rounded-xl shadow-lg">
      <button onClick={onVolver} className="mb-4 text-gray-500 font-bold hover:text-blue-700">← Volver al listado</button>
      
      <div className="mb-6 pb-4 border-b">
        <h2 className="text-2xl font-bold text-blue-900">2.3.3 Digitalización de Documentos</h2>
        <p className="text-sm text-gray-600 mt-1">
          Expediente #{expediente.id} | Novios: <span className="font-bold uppercase">{expediente.novio_nombre} y {expediente.novia_nombre}</span>
        </p>
        <p className="text-xs text-amber-600 mt-1 italic">* Esta digitalización es opcional pero altamente recomendada para el archivo parroquial.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documentosRequeridos.map((doc) => (
          <div key={doc.id} className="border border-gray-200 p-4 rounded-lg bg-gray-50 flex flex-col justify-between">
            <label className="text-sm font-bold text-gray-800 mb-3">{doc.label}</label>
            <div className="flex gap-2 items-center">
              <input 
                type="file" 
                accept=".pdf, image/*"
                onChange={(e) => handleFileChange(e, doc.id)}
                className="text-xs w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
              />
              <button 
                onClick={() => handleUpload(doc.id, doc.label)}
                disabled={!archivos[doc.id] || cargando}
                className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Subir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}