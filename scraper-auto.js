/**
 * Scraper automático con gestión de Captcha integrada
 * Este script maneja automáticamente el captcha y las cookies
 */

const CaptchaManager = require('./captcha-manager');
const { getModelsByPartNumber } = require('./jhondeere');

// Variable global para mantener una sola instancia del manager
let captchaManager = null;

async function runScraping() {
  try {
    console.log('✅ Sistema listo, iniciando scraping...\n');
    console.log('='.repeat(60) + '\n');
    
    // Ejecutar el scraping principal
    await getModelsByPartNumber();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ PROCESO COMPLETADO EXITOSAMENTE');
    console.log('='.repeat(60));
    
    return true;
    
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ ERROR EN EL PROCESO');
    console.error('='.repeat(60));
    console.error('Mensaje:', error.message);
    console.error('Status:', error.response?.status || 'N/A');
    console.error('='.repeat(60) + '\n');
    
    // Si es error 403, intentar renovar y reintentar
    if (error.response && error.response.status === 403) {
      console.log('⏳ Error 403 detectado, renovando token con navegador existente...');
      
      if (captchaManager && captchaManager.isInitialized) {
        await captchaManager.searchPart('RE527858');
        await captchaManager.updateCookies();
        await captchaManager.saveToEnv();
        
        console.log('✅ Token renovado, esperando 5 segundos...\n');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        console.log('🔄 Reintentando scraping...\n');
        return runScraping(); // Reintentar solo el scraping
      } else {
        console.error('❌ No hay navegador disponible para renovar token');
        throw error;
      }
    }
    
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Iniciando scraper con gestión automática de captcha...\n');
    
    // Inicializar el gestor de captcha UNA SOLA VEZ
    captchaManager = new CaptchaManager();
    await captchaManager.initialize();
    
    // Guardar tokens iniciales
    await captchaManager.saveToEnv();
    
    // Activar renovación automática en segundo plano
    captchaManager.keepAlive();
    
    // Ejecutar el scraping (con reintentos automáticos)
    await runScraping();
    
    // Mantener el navegador abierto por si se necesita más adelante
    console.log('\n💡 Navegador permanece abierto para futuras ejecuciones');
    console.log('Presiona Ctrl+C para cerrar\n');
    
    // Mantener el proceso vivo
    process.stdin.resume();
    
  } catch (error) {
    console.error('❌ Error fatal:', error.message);
    
    if (captchaManager) {
      await captchaManager.close();
    }
    
    process.exit(1);
  }
}

// Manejar Ctrl+C
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Cerrando aplicación...');
  
  if (captchaManager) {
    await captchaManager.close();
  }
  
  console.log('👋 Adiós');
  process.exit(0);
});

// Ejecutar
main();
