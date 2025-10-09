const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * Gestor automático de Captcha y Cookies usando Puppeteer
 */
class CaptchaManager {
  constructor() {
    this.browser = null;
    this.page = null;
    this.captchaToken = null;
    this.cookies = null;
    this.tokenExpiry = null;
    this.isInitialized = false;
  }

  /**
   * Inicializa el navegador y obtiene el token inicial
   */
  async initialize() {
    console.log('🚀 Iniciando navegador...');
    
    this.browser = await puppeteer.launch({
      headless: false, // Cambiar a true si no quieres ver el navegador
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled'
      ]
    });

    this.page = await this.browser.newPage();
    
    // Configurar user agent
    await this.page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
    );

    // Interceptar requests para capturar el Captcha-Token
    await this.page.setRequestInterception(true);
    
    this.page.on('request', (request) => {
      const headers = request.headers();
      
      // Capturar Captcha-Token de las peticiones
      if (headers['captcha-token']) {
        this.captchaToken = headers['captcha-token'];
        this.tokenExpiry = Date.now() + (20 * 60 * 1000); // 20 minutos
        console.log('✅ Captcha-Token capturado');
      }
      
      request.continue();
    });

    console.log('🌐 Navegando a John Deere...');
    await this.page.goto('https://partscatalog.deere.com/', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Esperar a que la página cargue completamente
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Hacer una búsqueda para activar el captcha
    await this.searchPart('RE527858');

    // Obtener cookies
    await this.updateCookies();

    this.isInitialized = true;
    console.log('✅ CaptchaManager inicializado correctamente\n');
  }

  /**
   * Realiza una búsqueda para activar el captcha
   */
  async searchPart(partNumber) {
    try {
      console.log(`🔍 Buscando parte: ${partNumber}`);
      
      // Esperar al input de búsqueda
      await this.page.waitForSelector('input[type="text"]', { timeout: 10000 });
      
      // Escribir en el input
      await this.page.type('input[type="text"]', partNumber);
      
      // Presionar Enter o click en buscar
      await this.page.keyboard.press('Enter');
      
      // Esperar a que se complete la búsqueda
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log('✅ Búsqueda completada');
    } catch (error) {
      console.log('⚠️  No se pudo hacer búsqueda automática, continuar manualmente');
    }
  }

  /**
   * Actualiza las cookies desde el navegador
   */
  async updateCookies() {
    const cookies = await this.page.cookies();
    this.cookies = cookies
      .map(cookie => `${cookie.name}=${cookie.value}`)
      .join('; ');
    
    console.log('🍪 Cookies actualizadas');
  }

  /**
   * Verifica si el token ha expirado
   */
  isTokenExpired() {
    if (!this.tokenExpiry) return true;
    return Date.now() > this.tokenExpiry;
  }

  /**
   * Renueva el token y cookies si es necesario
   */
  async renewIfNeeded() {
    if (this.isTokenExpired()) {
      console.log('⏰ Token expirado, renovando...');
      await this.searchPart('RE527858');
      await this.updateCookies();
      console.log('✅ Token renovado\n');
    }
  }

  /**
   * Obtiene el token actual (renovándolo si es necesario)
   */
  async getToken() {
    await this.renewIfNeeded();
    return this.captchaToken;
  }

  /**
   * Obtiene las cookies actuales
   */
  async getCookies() {
    await this.renewIfNeeded();
    return this.cookies;
  }

  /**
   * Guarda el token y cookies en archivo .env
   */
  async saveToEnv() {
    const envPath = path.join(__dirname, '.env');
    const envContent = `CAPTCHA_TOKEN=${this.captchaToken}\nCOOKIES=${this.cookies}\n`;
    
    fs.writeFileSync(envPath, envContent);
    console.log('💾 Token y cookies guardados en .env');
  }

  /**
   * Mantiene el navegador abierto y renueva automáticamente
   */
  async keepAlive() {
    console.log('🔄 Modo keep-alive activado (renovación automática cada 15 minutos)');
    
    setInterval(async () => {
      try {
        console.log('\n⏰ Renovando token automáticamente...');
        await this.searchPart('RE527858');
        await this.updateCookies();
        await this.saveToEnv();
        console.log('✅ Renovación automática completada\n');
      } catch (error) {
        console.error('❌ Error en renovación automática:', error.message);
      }
    }, 15 * 60 * 1000); // Cada 15 minutos
  }

  /**
   * Cierra el navegador
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('👋 Navegador cerrado');
    }
  }
}

// Exportar la clase
module.exports = CaptchaManager;

// Si se ejecuta directamente, iniciar en modo standalone
if (require.main === module) {
  (async () => {
    const manager = new CaptchaManager();
    
    try {
      await manager.initialize();
      await manager.saveToEnv();
      
      console.log('\n' + '='.repeat(60));
      console.log('✅ CAPTCHA MANAGER LISTO');
      console.log('='.repeat(60));
      console.log('Token y cookies guardados en .env');
      console.log('Puedes ejecutar tu script principal ahora');
      console.log('\nOpciones:');
      console.log('1. Presiona Ctrl+C para cerrar');
      console.log('2. Deja abierto para renovación automática');
      console.log('='.repeat(60) + '\n');
      
      // Mantener vivo para renovación automática
      await manager.keepAlive();
      
      // Mantener el proceso vivo
      process.stdin.resume();
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      await manager.close();
      process.exit(1);
    }
  })();
}
