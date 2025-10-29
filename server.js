const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const { getModelsByPartNumber } = require('./jhondeere');
require('dotenv').config();

// Ruta para servir archivos estáticos desde la carpeta "front-lib"
const directorioFrontLib = path.join(__dirname, 'front-lib');
app.use('/front-lib', express.static(directorioFrontLib));

// Endpoint de health check
app.get('/health', (req, res) => {
  const currentTime = new Date().toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  res.json({
    status: 'OK',
    timestamp: currentTime,
    uptime: process.uptime(),
    message: 'Server is running'
  });
});

// Endpoint para ejecutar el proceso de John Deere
app.get('/process/start', async (req, res) => {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 Proceso iniciado desde endpoint /process/start');
    console.log('='.repeat(60) + '\n');
    
    // Enviar respuesta inmediata
    res.json({
      status: 'started',
      message: 'El proceso ha iniciado. Revisa la consola para ver el progreso.',
      timestamp: new Date().toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
    });
    
    // Ejecutar el proceso en segundo plano
    getModelsByPartNumber().then(() => {
      console.log('\n' + '='.repeat(60));
      console.log('✅ Proceso completado exitosamente desde endpoint');
      console.log('='.repeat(60) + '\n');
    }).catch((error) => {
      console.error('\n' + '='.repeat(60));
      console.error('❌ Error en el proceso desde endpoint:', error.message);
      console.error('='.repeat(60) + '\n');
    });
    
  } catch (error) {
    console.error('❌ Error al iniciar el proceso:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});



const puerto = process.env.PORT || 3000;
app.listen(puerto, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 Servidor iniciado exitosamente`);
  console.log(`📡 Puerto: ${puerto}`);
  console.log(`🌐 URL: http://localhost:${puerto}`);
  console.log(`💚 Health Check: http://localhost:${puerto}/health`);
  console.log(`⚙️  Iniciar Proceso: http://localhost:${puerto}/process/start`);
  console.log('='.repeat(60) + '\n');
});

