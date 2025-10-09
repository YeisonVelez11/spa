// Polyfill para compatibilidad con Node.js 16 y 22
if (typeof global.ReadableStream === 'undefined') {
  try {
    const { ReadableStream } = require('stream/web');
    global.ReadableStream = ReadableStream;
  } catch (e) {
    // Si falla, continuar sin polyfill (Node.js 22 ya lo tiene)
  }
}

const axios = require("axios");
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { jsonToCsv } = require("./funciones");
const ModelParts = [];
// Configurar puppeteer con plugin stealth para evitar detección
puppeteer.use(StealthPlugin());

// Variable global para mantener la instancia del navegador
let browser = null;
let page = null;

/*
[{
    "businessRegion": null,
    "externalBusinessRegion": false,
    "model": "1070E - HARVESTER",
    "code": "PC9795",
    "equipmentName": "1070E Wheeled Harvester (S.N. 001801- ), Tier 3, Rotating and Leveling Cabin, Gen I, Engine 6068HTJ87 - PC9795",
    "equipmentRefId": "16566",
    "rangeLookup": false,
    "rangeFrom": null,
    "rangeTo": null,
    "filters": null,
    "validationString": null,
    "debugInfo": null,
    "pin": null,
    "encodedFilterString": null,
    "filteringLevel": null,
    "makeName": null,
    "makeId": null,
    "baseCode": "1070E",
    "hash": null
}]
*/

async function getAllModelsByPart(searchTerm) {
  const url = "https://partscatalog.deere.com/jdrc-services/v1/search/parts";

  const headers = {
    "Content-Type": "application/json",
  };

  const data = {
    q: searchTerm,
    eq: "",
    fr: null,
    br: "1189",
    locale: "en-US",
  };

  
    //await new Promise(resolve => setTimeout(resolve, tiempoMs));
    const response = await axios({
      method: "post",
      url: url,
      headers: {
        ...headers,
      },
      data: data,
    });
    return response.data;
}


/**
 * Inicializa el navegador Puppeteer con configuración anti-detección
 */
async function initBrowser() {
  if (browser) {
    console.log("✓ Navegador ya inicializado");
    return { browser, page };
  }

  console.log("🚀 Iniciando navegador con configuración anti-detección...");
  
  browser = await puppeteer.launch({
    headless: false, // Cambiar a true para modo headless
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-web-security',
      '--disable-features=BlockInsecurePrivateNetworkRequests',
      '--window-size=1920,1080',
      '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ],
    defaultViewport: {
      width: 1920,
      height: 1080
    }
  });

  page = await browser.newPage();

  // Configurar headers adicionales para parecer más humano
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Referer': 'https://www.google.com/'
  });

  // Ocultar propiedades de automatización
  await page.evaluateOnNewDocument(() => {
    // Sobrescribir navigator.webdriver
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });

    // Sobrescribir plugins
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });

    // Sobrescribir languages
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    });

    // Agregar chrome object
    window.chrome = {
      runtime: {},
    };

    // Sobrescribir permissions
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    );
  });

  console.log("✓ Navegador inicializado correctamente");
  return { browser, page };
}

/**
 * Navega a la URL de John Deere y espera a que cargue completamente
 * @param {string} partId - ID del equipo
 * @param {string} partNumber - Número de parte
 */
async function navigateToPartPage(partId, partNumber) {
  if (!page) {
    await initBrowser();
  }

  const url = `https://partscatalog.deere.com/jdrc/sidebyside/equipment/16566/referrer/search/pgId/2752688`;
  console.log(`🌐 Navegando a: ${url}`);
  
  try {
    // Navegar con timeout de 60 segundos y esperar múltiples condiciones
    console.log("⏳ Esperando carga completa de la página...");
    await page.goto(url, {
      waitUntil: ['load', 'domcontentloaded', 'networkidle0'], // Esperar a que todo esté cargado
      timeout: 60000
    });

    // Esperar a que elementos clave estén cargados
    await page.waitForSelector('body', { timeout: 10000 });
    
    // Esperar adicional para que JavaScript se ejecute
    console.log("⏳ Esperando renderizado de JavaScript...");
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Intentar esperar elementos específicos de la página
    try {
      await page.waitForSelector('.partpagesection, .part-details, .catalog-content', { 
        timeout: 10000,
        visible: true 
      });
      console.log("✓ Elementos de contenido detectados");
    } catch (e) {
      console.warn("⚠️  No se detectaron elementos específicos, continuando...");
    }
    
    // Hacer scroll para activar lazy loading
    console.log("📜 Haciendo scroll para activar lazy loading...");
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log("✓ Página completamente renderizada");
 
    // Hacer resize para forzar actualización de la data en pantalla
    // console.log("🔄 Haciendo resize para actualizar data...");
    // await page.setViewport({ width: 1920, height: 1080 });
    // await new Promise(resolve => setTimeout(resolve, 1000));
    // await page.setViewport({ width: 1900, height: 1080 });
    // await new Promise(resolve => setTimeout(resolve, 1000));
    // await page.setViewport({ width: 1920, height: 1080 });
    // await new Promise(resolve => setTimeout(resolve, 2000));
    // console.log("✓ Resize completado");
          
    // Extraer elementos del DOM y mostrarlos en consola de Node
    const partPageSections = await page.evaluate(() => {
      const elements = document.querySelectorAll(".partpagesection");
      return Array.from(elements).map(el => ({
        tagName: el.tagName,
        className: el.className,
        id: el.id,
        textContent: el.textContent.substring(0, 100), // Primeros 100 caracteres
        innerHTML: el.innerHTML.substring(0, 200) // Primeros 200 caracteres del HTML
      }));
    });
    
    console.log("📋 Elementos .partpagesection encontrados:", partPageSections.length);
    console.log(JSON.stringify(partPageSections, null, 2));
   // await new Promise(resolve => setTimeout(resolve, 100000));

    // Pequeña pausa adicional para asegurar que todo está cargado
    //await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log("✓ Página cargada completamente");
    return true;
  } catch (error) {
    console.error(`❌ Error al navegar a la página: ${error.message}`);
    return false;
  }
}

/**
 * Cierra el navegador de forma segura
 */
async function closeBrowser() {
  if (browser) {
    console.log("🔒 Cerrando navegador...");
    await browser.close();
    browser = null;
    page = null;
    console.log("✓ Navegador cerrado");
  }
}

async function getModelsByPartNumber() {
    try {
      // Inicializar navegador al inicio
      await initBrowser();
      
      // Leer el archivo JSON
      const fileContent = fs.readFileSync("./data/id_piezas1.json", "utf-8");
      const piezas = JSON.parse(fileContent);
  
      console.log(`Total de piezas a procesar: ${piezas.length}\n`);
  
      const resultados = [];
  
      // Procesar cada pieza secuencialmente
      for (let i = 0; i < piezas.length; i++) {
        const item = piezas[i];
        console.log(
          `------${i + 1}/${piezas.length}] ${item.id_pieza}`
        );
        console.log("getAllModelsByPart");
        try {
          // Navegar a la página antes de hacer la petición
          // Usar un part_id de ejemplo, ajustar según necesidad

          
          const resultado = await getAllModelsByPart(item.id_pieza);

          const modelData = [];
  
          //for (let j = 0; j < resultado.searchResults.length; j++) {
  
          for (let j = 0; j <= 0; j++) {

             const { equipmentRefId:partId } = resultado.searchResults[j];
            await navigateToPartPage(partId, item.id_pieza);

            console.log("MODELO", j);
            const { baseCode, model, equipmentName } = resultado.searchResults[j];
  
            modelData.push({
              id_model: baseCode,
              model_name: model,
              model_full_name: equipmentName,
            });
            //await getModelPart(item.id_pieza, resultado.searchResults[j]);
  
          }
          /*await jsonToCsv(
            modelData,
            `model_${item.id_pieza}`,
            `${item.id_pieza}/`
          );*/
          /*await jsonToCsv(ModelParts,`part_${item.id_pieza}`,`${item.id_pieza}/`);
          ModelParts = [];
  */
  
  
          console.log(`✓ Completado: ${item.id_pieza}\n`);
        } catch (error) {
          console.error(`✗ Error en ${item.id_pieza}: ${error.message}\n`);
          
          resultados.push({
            ...item,
            success: false,
            error: error.message,
          });
        }
  
      }
  
      return resultados;
    } catch (error) {
      console.error("Error:", error.message);
      throw error;
    } finally {
      // Cerrar navegador al finalizar
      await closeBrowser();
    }
  }


    getModelsByPartNumber();


module.exports = {
  initBrowser,
  navigateToPartPage,
  closeBrowser,
  getModelsByPartNumber
};

