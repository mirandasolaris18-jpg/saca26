import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Asegúrate de tener la imagen escaneada en tu carpeta assets o public
import certificadoFondo from '../assets/certificado_matrimonio_vacio.jpg';

const styles = StyleSheet.create({
  page: { position: 'relative' },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: -1, // Se coloca detrás del texto
  },
  textOverlay: {
    fontFamily: 'Times-Roman', // Usa fuentes formales
    fontSize: 14,
    position: 'absolute',
    color: '#000000',
  },
  // ESTILOS PARA EL ACTA (PÁGINA 2)
  actaContainer: { padding: 50, fontFamily: 'Times-Roman' },
  actaTitle: { fontSize: 20, textAlign: 'center', marginBottom: 20, fontWeight: 'bold' },
  actaText: { fontSize: 12, lineHeight: 1.5, marginBottom: 30, textAlign: 'justify' },
  firmasGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  firmaBox: { width: '45%', marginTop: 40, alignItems: 'center' },
  firmaLinea: { borderTop: '1px solid black', width: '100%', marginBottom: 5 },
  firmaNombre: { fontSize: 11 }
});

const MatrimonioPDF = ({ data }) => {
  return (
    <Document>
      {/* PÁGINA 1: CERTIFICADO CON FONDO IMPRESO */}
      <Page size="LETTER" style={styles.page}>
        {/* Imagen escaneada de fondo */}
        <Image src={certificadoFondo} style={styles.backgroundImage} />
        
        {/* Usamos 'top' y 'left' para posicionar exactamente el texto en las líneas del escaneado. 
            ¡Tendrás que ir ajustando estos valores (píxeles) mediante ensayo y error con tu imagen real! */}
        <Text style={[styles.textOverlay, { top: 150, left: 200 }]}>{data.novia_completo}</Text>
        <Text style={[styles.textOverlay, { top: 180, left: 200 }]}>{data.novio_completo}</Text>
        
        {/* Padres */}
        <Text style={[styles.textOverlay, { top: 220, left: 100 }]}>Padre Novio: {data.padre_novio || '---'}</Text>
        <Text style={[styles.textOverlay, { top: 220, left: 350 }]}>Madre Novio: {data.madre_novio || '---'}</Text>
        <Text style={[styles.textOverlay, { top: 250, left: 100 }]}>Padre Novia: {data.padre_novia || '---'}</Text>
        <Text style={[styles.textOverlay, { top: 250, left: 350 }]}>Madre Novia: {data.madre_novia || '---'}</Text>
        
        {/* Padrinos y Testigos */}
        <Text style={[styles.textOverlay, { top: 290, left: 150 }]}>{data.padrino || '---'} y {data.madrina || '---'}</Text>
        <Text style={[styles.textOverlay, { top: 320, left: 150 }]}>{data.testigo1} y {data.testigo2}</Text>
        
        {/* Datos Parroquia */}
        <Text style={[styles.textOverlay, { top: 360, left: 150 }]}>{data.fecha_matrimonio}</Text>
        <Text style={[styles.textOverlay, { top: 360, left: 350 }]}>{data.parroquia}</Text>
        <Text style={[styles.textOverlay, { top: 390, left: 150 }]}>{data.sacerdote}</Text>

        {/* Datos de Libro */}
        <Text style={[styles.textOverlay, { top: 430, left: 100 }]}>L: {data.numero_libro}</Text>
        <Text style={[styles.textOverlay, { top: 430, left: 200 }]}>P: {data.pagina_libro}</Text>
        <Text style={[styles.textOverlay, { top: 430, left: 300 }]}>S: {data.seccion_libro}</Text>
      </Page>

      {/* PÁGINA 2: ACTA DE MATRIMONIO (SIN FONDO, GENERADA POR EL SISTEMA) */}
      <Page size="LETTER" style={styles.actaContainer}>
        <Text style={styles.actaTitle}>ACTA DE MATRIMONIO</Text>
        
        <Text style={styles.actaText}>
          En la {data.parroquia}, a los {data.fecha_matrimonio}, ante mí, el Presbítero {data.sacerdote}, 
          contrajeron sagrado matrimonio {data.novio_completo} y {data.novia_completo}.
          Fueron padrinos {data.padrino || '---'} y {data.madrina || '---'}.
          Como testigos presenciaron el acto {data.testigo1} y {data.testigo2}.
          Dicho matrimonio se encuentra inscrito en el Libro {data.numero_libro}, 
          Página {data.pagina_libro}, Sección {data.seccion_libro} del archivo parroquial.
        </Text>

        {/* ZONA DE FIRMAS */}
        <View style={styles.firmasGrid}>
          <View style={styles.firmaBox}>
            <View style={styles.firmaLinea} />
            <Text style={styles.firmaNombre}>{data.novia_completo}</Text>
            <Text style={{fontSize: 10}}>La Esposa</Text>
          </View>
          <View style={styles.firmaBox}>
            <View style={styles.firmaLinea} />
            <Text style={styles.firmaNombre}>{data.novio_completo}</Text>
            <Text style={{fontSize: 10}}>El Esposo</Text>
          </View>
          
          <View style={styles.firmaBox}>
            <View style={styles.firmaLinea} />
            <Text style={styles.firmaNombre}>{data.testigo1}</Text>
            <Text style={{fontSize: 10}}>Testigo</Text>
          </View>
          <View style={styles.firmaBox}>
            <View style={styles.firmaLinea} />
            <Text style={styles.firmaNombre}>{data.testigo2}</Text>
            <Text style={{fontSize: 10}}>Testigo</Text>
          </View>

          <View style={styles.firmaBox}>
            <View style={styles.firmaLinea} />
            <Text style={styles.firmaNombre}>{data.sacerdote}</Text>
            <Text style={{fontSize: 10}}>Párroco que presenció el acto</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default MatrimonioPDF;