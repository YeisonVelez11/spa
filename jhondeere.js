const axios = require("axios");
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const { jsonToCsv } = require("./funciones");

/**
 * Descarga una imagen desde una URL y la guarda en el sistema de archivos
 * @param {string} imageUrl - URL de la imagen
 * @param {string} equipmentRefId - ID del equipo para nombrar el archivo
 * @returns {Promise<string>} - Ruta del archivo guardado
 */
async function downloadAndSaveImage(imageUrl, equipmentRefId) {
  // Crear carpeta images si no existe
  const imagesDir = path.join(__dirname, "images");
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  // Verificar si la imagen ya existe
  const fileName = `${equipmentRefId}.png`;
  const filePath = path.join(imagesDir, fileName);
  
  if (fs.existsSync(filePath)) {
    //console.log(`⏭ Imagen ya existe: ${fileName}`);
    return filePath;
  }

  // Reintentar hasta que se descargue exitosamente (excepto error 500)
  let attemptNumber = 1;
  while (true) {
    try {
      // Descargar la imagen como buffer
      const response = await axios({
        method: "get",
        url: imageUrl,
        responseType: "arraybuffer", // Importante para imágenes
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000, // 30 segundos de timeout
      });

      // Guardar la imagen
      fs.writeFileSync(filePath, response.data);
      
      return filePath;
    } catch (error) {
      const status = error.response?.status;
      const errorType = status === 500 ? '500' : status === 403 ? '403' : status === 502 ? '502' : 'recuperable';
      
      console.error(`❌ Error ${errorType} al descargar imagen para ${equipmentRefId} (Intento #${attemptNumber}):`, error.message);
      console.log(`🔄 Reintentando descarga de imagen en 5 segundos... ♾️`);
      
      const delay = (status === 403 || status === 502) ? 10000 : 5000;
      await new Promise(resolve => setTimeout(resolve, delay));
      attemptNumber++;
    }
  }
}

// Configuración para reintentos
const MAX_RETRIES = Infinity; // ♾️ REINTENTOS ILIMITADOS - La aplicación nunca morirá
const RETRY_DELAY_MS = 8000; // 8 segundos
const RETRY_DELAY_403_MS = 60000; // 60 segundos para 403 (aumentado para evitar ban)
const RETRY_DELAY_502_MS = 45000; // 45 segundos para 502
const MIN_DELAY_BETWEEN_REQUESTS = 3000; // 3 segundos mínimo (aumentado)
const MAX_DELAY_BETWEEN_REQUESTS = 8000; // 8 segundos máximo (aumentado)

// Pool de User-Agents para rotar
const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

// Índice actual del User-Agent
let currentUserAgentIndex = 0;

// Contador de peticiones para rotar headers
let requestCount = 0;

// Contador de errores 403 consecutivos
let consecutive403Count = 0;

// Delay adaptativo basado en errores
let adaptiveDelayMultiplier = 1;

/**
 * Obtiene un User-Agent rotativo
 */
function getRotatingUserAgent() {
  const userAgent = USER_AGENTS[currentUserAgentIndex];
  currentUserAgentIndex = (currentUserAgentIndex + 1) % USER_AGENTS.length;
  return userAgent;
}

/**
 * Genera un delay aleatorio para simular comportamiento humano
 * Se adapta basado en errores 403 consecutivos
 */
function getRandomDelay(min = MIN_DELAY_BETWEEN_REQUESTS, max = MAX_DELAY_BETWEEN_REQUESTS) {
  const adjustedMin = min * adaptiveDelayMultiplier;
  const adjustedMax = max * adaptiveDelayMultiplier;
  return Math.floor(Math.random() * (adjustedMax - adjustedMin + 1)) + adjustedMin;
}

/**
 * Genera headers dinámicos con rotación
 */
function getRotatingHeaders() {
  const userAgent = getRotatingUserAgent();
  const isChrome = userAgent.includes('Chrome') && !userAgent.includes('Edg');
  const isFirefox = userAgent.includes('Firefox');
  const isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome');
  const isEdge = userAgent.includes('Edg');
  
  // Variar el Referer para simular navegación natural
  const referers = [
    'https://partscatalog.deere.com/',
    'https://partscatalog.deere.com/jdrc/',
    'https://partscatalog.deere.com/jdrc/sidebyside/equipment',
    'https://partscatalog.deere.com/jdrc/sidebyside/search'
  ];
  const randomReferer = referers[Math.floor(Math.random() * referers.length)];
  
  // Variar Accept-Language ligeramente
  const languages = [
    'en-US,en;q=0.9,es;q=0.8',
    'en-US,en;q=0.9',
    'en-US,en;q=0.9,es;q=0.8,fr;q=0.7'
  ];
  const randomLanguage = languages[Math.floor(Math.random() * languages.length)];
  
  const baseHeaders = {
    'User-Agent': userAgent,
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': randomLanguage,
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Origin': 'https://partscatalog.deere.com',
    'Referer': randomReferer,
    'Cache-Control': 'no-cache,no-store',
    'Pragma': 'no-cache',
    'Expires': '0',
    'product-line': 'JDRC',
    'Captcha-Version': 'Enterprise'
  };
  
  // Agregar headers específicos del navegador
  if (isChrome || isEdge) {
    baseHeaders['Sec-Fetch-Dest'] = 'empty';
    baseHeaders['Sec-Fetch-Mode'] = 'cors';
    baseHeaders['Sec-Fetch-Site'] = 'same-origin';
    baseHeaders['Sec-Ch-Ua'] = isEdge 
      ? '"Not_A Brand";v="8", "Chromium";v="120", "Microsoft Edge";v="120"'
      : '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"';
    baseHeaders['Sec-Ch-Ua-Mobile'] = '?0';
    baseHeaders['Sec-Ch-Ua-Platform'] = userAgent.includes('Windows') ? '"Windows"' : '"macOS"';
  }
  
  return baseHeaders;
}

// Headers base (se actualizarán dinámicamente)
let COMMON_HEADERS = getRotatingHeaders();

// Configuración de agentes HTTP/HTTPS para manejar mejor las conexiones
const httpAgent = new http.Agent({ 
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60000
});

const httpsAgent = new https.Agent({ 
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60000,
  rejectUnauthorized: false
});

// Configuración de axios con interceptores para simular comportamiento humano
const axiosInstance = axios.create({
  timeout: 60000, // 60 segundos de timeout
  maxRedirects: 5,
  validateStatus: (status) => status >= 200 && status < 500, // Aceptar más rangos de status
  httpAgent: httpAgent,
  httpsAgent: httpsAgent
});

// Interceptor para agregar delay aleatorio y rotar headers
axiosInstance.interceptors.request.use(async (config) => {
  // Agregar delay aleatorio entre peticiones (CRÍTICO para evitar ban)
  //const delay = getRandomDelay();
  //console.log(`⏳ Esperando ${(delay/1000).toFixed(1)}s antes de petición...`);
  //await new Promise(resolve => setTimeout(resolve, delay));

  // Rotar headers cada 2 peticiones (más frecuente)
  requestCount++;
  if (requestCount % 2 === 0) {
    COMMON_HEADERS = getRotatingHeaders();
    //console.log(`🔄 Rotando headers (petición #${requestCount})`);
  }
  
  // Aplicar headers actuales
  config.headers = {
    ...COMMON_HEADERS,
    ...config.headers
  };
  
  // Log del User-Agent actual
  //console.log(`🌐 User-Agent: ${config.headers['User-Agent'].substring(0, 50)}...`);
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor de respuesta para manejar errores
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Enriquecer el error con información adicional
    if (error.code) {
      console.error(`🔴  red detectado: ${error.code} - ${error.message}`);
    }
    return Promise.reject(error);
  }
);

/**
 * Función auxiliar para manejar reintentos ILIMITADOS en caso de errores recuperables
 * @param {Function} fn - Función a ejecutar
 * @param {string} context - Contexto para logging
 * @param {number} attemptNumber - Número de intento actual (solo para logging)
 * @returns {Promise} - Resultado de la función (nunca falla, reintenta indefinidamente)
 */
async function retryOnError(fn, context, attemptNumber = 1) {
  try {
    const result = await fn();
    
    // Si la petición fue exitosa, resetear contadores
    consecutive403Count = 0;
    if (adaptiveDelayMultiplier > 1) {
      adaptiveDelayMultiplier = Math.max(1, adaptiveDelayMultiplier - 0.2);
      console.log(`✅ Petición exitosa. Reduciendo delay adaptativo a ${adaptiveDelayMultiplier.toFixed(1)}x`);
    }
    
    return result;
  } catch (error) {
    const status = error.response?.status;
    const errorCode = error.code;
    
    // Detectar errores de red (sin internet, timeout, conexión rechazada, etc.)
    const networkErrors = [
      'ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNREFUSED', 
      'ENETUNREACH', 'EAI_AGAIN', 'ECONNABORTED', 'EHOSTUNREACH'
    ];
    const isNetworkError = networkErrors.includes(errorCode) || error.message?.includes('network');
    
    // Errores HTTP que requieren REINTENTOS INFINITOS
    const isCriticalHttpError = status === 403 || status === 502 || status === 503 || status === 429;
    
    // Error 500 - permitir continuar
    const isError500 = status === 500;
    
    // Determinar si es un error que requiere reintentos infinitos
    const isRecoverableError = isCriticalHttpError || isNetworkError;
    
    if (isRecoverableError) {
      // Imprimir "error" para errores 403 o 502
      if (status === 403 || status === 502) {
        console.log("error");
      }
      
      // Manejo específico de errores de red - REINTENTOS ILIMITADOS
      if (isNetworkError) {
        const delay = 10000; // 10 segundos para errores de red
        console.warn(`🌐 de red (${errorCode || error.message}) en ${context}. Reintentando en ${(delay/1000).toFixed(1)}s... (Intento #${attemptNumber}) ♾️ REINTENTOS ILIMITADOS`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryOnError(fn, context, attemptNumber + 1);
      }
      
      // Manejo de errores HTTP - REINTENTOS ILIMITADOS
      if (status === 403) {
        consecutive403Count++;
        
        // Aumentar delay adaptativo progresivamente
        if (consecutive403Count >= 2) {
          adaptiveDelayMultiplier = Math.min(10, adaptiveDelayMultiplier + 1.2);
          console.warn(`🐌 ${consecutive403Count} errores 403 consecutivos. Aumentando delay a ${adaptiveDelayMultiplier.toFixed(1)}x`);
        }
      }
      
      // Forzar rotación de headers MÚLTIPLES VECES para cambiar más
      for (let i = 0; i < 5; i++) {
        COMMON_HEADERS = getRotatingHeaders();
      }
      console.log(`🔄 Headers rotados agresivamente (5 veces)`);
      
      // Delays específicos por tipo de error
      let delay;
      if (status === 403) {
        delay = RETRY_DELAY_403_MS * adaptiveDelayMultiplier;
      } else if (status === 502) {
        delay = RETRY_DELAY_502_MS;
      } else {
        delay = RETRY_DELAY_MS;
      }
      
      console.warn(`⚠️   ${status} en ${context}. Rotando headers y reintentando en ${(delay/1000).toFixed(1)}s... (Intento #${attemptNumber}) ♾️ REINTENTOS ILIMITADOS`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryOnError(fn, context, attemptNumber + 1);
    }
    
    // Para errores NO recuperables, también reintentar indefinidamente
    console.error(`❌ Error NO recuperable en ${context}: ${error.message}. Reintentando en 10s... ♾️ (Intento #${attemptNumber})`);
    await new Promise(resolve => setTimeout(resolve, 10000));
    return retryOnError(fn, context, attemptNumber + 1);
  }
}

/**
 * Busca partes en el catálogo de John Deere
 * @param {string} searchTerm - El término de búsqueda (número de parte)
 * @param {string} captchaToken - Token de captcha (opcional, puede ser generado dinámicamente)
 * @returns {Promise} - Respuesta de la API
 */

//Nos trae toda la lista completa de modelos al introducir una parte
const tiempoMs = 3000;
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

  return retryOnError(async () => {
    //await new Promise(resolve => setTimeout(resolve, tiempoMs));
    const response = await axiosInstance({
      method: "post",
      url: url,
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    });
    return response.data;
  }, `getAllModelsByPart(${searchTerm})`);
}

/**
 * obtiene todos los modelos donde se usan las piezas
 */

/*
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

async function getModelsByPartNumber() {
  try {
    const scriptStartTime = Date.now();
    const scriptStartDate = new Date().toLocaleString('es-ES', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
    
    // Obtener el argumento desde la línea de comandos (node jhondeere.js 1)
    const fileIndex = process.argv[2]; // Captura el primer argumento después del nombre del script
    
    // Construir el nombre del archivo según el argumento
    const fileName = fileIndex ? `./data/id_piezas${fileIndex}.json` : "./data/id_piezas1.json";
    
    console.log(`📂 Archivo a procesar: ${fileName}`);
    
    // Leer el archivo JSON
    const fileContent = fs.readFileSync(fileName, "utf-8");
    const piezas = JSON.parse(fileContent);

    console.log(`🚀 Script iniciado: ${scriptStartDate}`);
    console.log(`Total de piezas a procesar: ${piezas.length}\n`);

    // Declarar resultados fuera del loop
    const resultados = [];

    // Procesar cada pieza secuencialmente

    for (let i = 0; i < piezas.length; i++) {
      const startTime = Date.now();
      ModelParts = [];
      pieceDetail = []
      const modelData = [];

      const item = piezas[i];
      console.log(
        `------${i + 1}/${piezas.length}] ${item.id_pieza}`
      );
      try {
        const resultado = await getAllModelsByPart(item.id_pieza);
        
        // Si resultado es null (error 500), reintentar la misma pieza
        if (!resultado || !resultado.searchResults) {
          console.warn(`⚠️  Error 500 obteniendo modelos para pieza ${item.id_pieza}. Reintentando...`);
          console.log(`🔄 Repitiendo: ------${i + 1}/${piezas.length}] ${item.id_pieza}`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          i--; // Decrementar para repetir la misma pieza
          continue;
        }
        

        for (let j = 0; j < resultado.searchResults.length; j++) {

        //for (let j = 0; j <= 1; j++) {
          console.log("MODELO",`${j+ 1}/${resultado.searchResults.length}`, j, resultado.searchResults[j].equipmentName, item.id_pieza);
          const { baseCode, model, equipmentName,equipmentRefId } = resultado.searchResults[j];
          
          try {
            modelData.push({
              model_id: equipmentRefId,
              model_code: baseCode,
              model_name: model,
              model_full_name: equipmentName,
              link: `https://partscatalog.deere.com/jdrc/search/type/parts/term/${item.id_pieza}`,
            });
       

            if(equipmentRefId && equipmentRefId !== "-1" && equipmentRefId !== -1){
              await getModelPart(item.id_pieza, resultado.searchResults[j],item.parte);
              //TODO descomentar lo anterior await getModelPart(item.id_pieza, resultado.data.searchResults[j]);
              //await getModelPart(item.id_pieza, resultado.searchResults[0]);
            }
          } catch (modelError) {
            const status = modelError.response?.status;
            const errorType = status === 500 ? '500' : status === 403 ? '403' : status === 502 ? '502' : 'recuperable';
            
            // Cualquier error - reintentar la misma iteración del modelo
            console.warn(`⚠️  Error ${errorType} en modelo ${equipmentName}. Reintentando iteración...`);
            console.log(`🔄 Repitiendo: MODELO ${j+ 1}/${resultado.searchResults.length} ${equipmentName} ${item.id_pieza}`);
            
            const delay = (status === 403 || status === 502) ? 10000 : 5000;
            await new Promise(resolve => setTimeout(resolve, delay));
            j--; // Decrementar para repetir la misma iteración
            continue;
          }

        }

        await jsonToCsv(
           modelData,
          `model_${item.id_pieza}`,
          `models/`
        );
        await jsonToCsv(
          pieceDetail,
          `${item.id_pieza}`,
          `pieces/`
        );


      } catch (error) {
        const status = error.response?.status;
        
        // Errores 500, 403, 502 u otros - reintentar la misma pieza
        const errorType = status === 500 ? '500' : status === 403 ? '403' : status === 502 ? '502' : 'recuperable';
        console.error(`✗ Error ${errorType} en ${item.id_pieza}: ${error.message}\n`);
        console.log(`🔄 Repitiendo pieza: ------${i + 1}/${piezas.length}] ${item.id_pieza}`);
        
        const delay = (status === 403 || status === 502) ? 10000 : 5000;
        await new Promise(resolve => setTimeout(resolve, delay));
        // Reintentar la misma pieza decrementando el índice
        i--;
        continue;
      }

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      const totalElapsedSeconds = Math.floor((endTime - scriptStartTime) / 1000);
      
      // Convertir tiempo total a formato HH:MM:SS
      const hours = Math.floor(totalElapsedSeconds / 3600);
      const minutes = Math.floor((totalElapsedSeconds % 3600) / 60);
      const seconds = totalElapsedSeconds % 60;
      const totalElapsedFormatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      const currentTime = new Date().toLocaleString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
      console.log(`⏱️  Iteración ${i + 1}: ${duration}s | Tiempo total: ${totalElapsedFormatted} | Hora: ${currentTime}\n`);

      // Pequeña pausa entre peticiones (opcional, para no saturar el servidor)
      /*if (i < piezas.length - 1) {
        await new Promise(resolve => setTimeout(resolve, tiempoMs));
      }*/
    }

    return resultados;
  } catch (error) {
    console.error("Error:", error.message);
    throw error;
  }
}

// Descomentar para probar

/**
 * Guarda una imagen base64 en el sistema de archivos
 * @param {string} base64Data - Datos de la imagen en base64
 * @param {string} fileName - Nombre del archivo (sin extensión)
 */
async function saveBase64Image(base64Data, fileName, pathFull = "") {
  let attemptNumber = 1;
  while (true) {
    try {
      // Crear el directorio images si no existe
      const imagesDir = path.join(__dirname, "images");
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }

      // Limpiar el base64 (remover el prefijo data:image/...;base64, si existe)
      const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, "");

      // Convertir base64 a buffer
      const imageBuffer = Buffer.from(base64Clean, "base64");

      // Crear el path completo del archivo
      const fullFileName = `${fileName}.png`;
      const filePath = path.join(imagesDir, fullFileName);

      // Guardar la imagen de forma asíncrona
      await fs.promises.writeFile(filePath, imageBuffer);

      //console.log(`✓ Imagen guardada: ${filePath}`);
      return filePath;
    } catch (error) {
      // Los errores de filesystem no tienen status HTTP, siempre reintentar
      console.error(`✗ Error al guardar imagen ${fileName} (Intento #${attemptNumber}): ${error.message}`);
      console.log(`🔄 Reintentando guardar imagen en 5 segundos... ♾️`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      attemptNumber++;
    }
  }
}

/**
 * Muestra los modelos donde se usa la pieza con las imagenes previas
 * @param {string} partNumber - Número de parte a buscar
 * @param {string} equipmentRefId - ID del equipo (string)
 */

/*
[
  {
    "datasetId": "0e09aeb9-101e-3652-e053-41d516aca982",
    "manufacturer": "JOHNDEERE",
    "partNumber": "RE527858",
    "partType": "STANDARD",
    "partDescription": "Hexagonal Head Flanged Screw, M6 X 12",
    "partLocation": "65QK Turbocharger ( - 000379)",
    "partLocationPath": "0400 Engine 6068HTJ87 6068HTJ87 > ST818296 - 65QK Turbocharger ( - 000379)",
    "partRemarks": "",
    "model": "1070E - HARVESTER",
    "modelType": null,
    "modelQualifier": "HARVESTER",
    "equipment": "PC9795 - 1070E Wheeled Harvester (S.N. 001801- ), Tier 3, Rotating and Leveling Cabin, Gen I, Engine 6068HTJ87",
    "equipmentRefId": "16566",
    "chapter": "0400 Engine 6068HTJ87 6068HTJ87",
    "catalogKey": "9795|04|0400",
    "pageId": "2752688",
    "partItemId": "22452374",
    "callout": "22",
    "crosscatKey": "",
    "isPartNavigable": true,
    "id": "1570065",
    "rankSortScore": 0,
    "alphaSortScore": 0,
    "rowFilterStatus": null,
    "imageId": "258350",
    "image": null,
    "navStateLoaded": false,
    "globalLookup": false,
    "numberOfMatches": 1,
    "associatedPart": null,
    "picklistContext1": null,
    "picklistContext2": null,
    "quantity": 1,
    "baseCode": "1070E",
    "hasAttachment": false
  }
]*/
let ModelParts = [];

async function getModelPart(partNumber, { equipmentRefId },parte) {
  const url = "https://partscatalog.deere.com/jdrc-services/v1/search/parts";

  const headers = {
    "Content-Type": "application/json",
  };

  const data = {
    q: partNumber,
    eq: equipmentRefId,
    locale: "en-US",
  };

  try {
    
    // Reintentar hasta obtener respuesta válida
    let response = null;
    let attemptNumber = 0;
    
    while (!response || !response.data || !response.data.searchResults) {
      attemptNumber++;
      
      try {
        response = await retryOnError(async () => {
          //await new Promise(resolve => setTimeout(resolve, tiempoMs));
          return await axiosInstance({
            method: "post",
            url: url,
            headers: {
              "Content-Type": "application/json",
            },
            data: data,
          });
        }, `getModelPart(${partNumber}, ${equipmentRefId})`);
        
        // Verificar si la respuesta es válida
        if (!response || !response.data || !response.data.searchResults) {
          console.warn(`⚠️  Respuesta inválida para ${partNumber} (Intento #${attemptNumber}). Reintentando...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          response = null; // Forzar otra iteración
        }
      } catch (error) {
        console.error(`❌ Error en getModelPart para ${partNumber} (Intento #${attemptNumber}):`, error.message);
        await new Promise(resolve => setTimeout(resolve, 5000));
        response = null; // Forzar otra iteración
      }
    }
    
    const businessRegion = { brID: "1189" };
    for (let i = 0; i < response.data.searchResults.length; i++) {

      const {  partLocation, partLocationPath } = response.data.searchResults[i];

      const partUsedModel = response.data.searchResults[i];
      //TODO const partUsedModel = response.data.searchResults[0];

      const { pageId, baseCode, id, partItemId,chapter, partType, imageId } = partUsedModel;
      const imagePart = `${equipmentRefId}_${pageId}`;

      ModelParts = [];

        // Descargar y guardar la imagen del equipo
        const imageUrl = `https://partscatalog.deere.com/jdrc-services/v1/image/getImageBlob?locale=en-US&iid=${imageId}`;
        await downloadAndSaveImage(imageUrl, equipmentRefId);

        // // Image plano - verificar si ya existe antes de hacer petición
        // const planoFileName = `${equipmentRefId}_plano.png`;
        // const planoFilePath = path.join(__dirname, "images", planoFileName);
        
        // if (!fs.existsSync(planoFilePath)) {
        //   const imagePlano = await axiosInstance({
        //     method: "post",
        //     url: "https://partscatalog.deere.com/jdrc-services/v1/sidebyside/getRelatedPictorial",
        //     headers: {
        //       "Content-Type": "application/json",
        //     },
        //     data: {
        //       eqID: equipmentRefId,
        //       pgID: id,
        //       pageCode: "PICT-04.2",
        //       brID: "1061",
        //       locale: "en-US",
        //       originalPageId: pageId
        //     },
        //   });

        //   if(imagePlano.data && imagePlano.data.pageDetails){
        //     await saveBase64Image(imagePlano.data.pageDetails.image, equipmentRefId+"_plano");
        //   }
        // }

//
// Reintentar hasta guardar la imagen de partes exitosamente
let partsImageSaved = false;
let partsImageAttempt = 0;

while (!partsImageSaved) {
  try{
    const partsFileName = `${pageId}_parts.png`;
    const partsFilePath = path.join(__dirname, "images", partsFileName);
    
    if (fs.existsSync(partsFilePath)) {
      // Ya existe, no necesita descargarse
      partsImageSaved = true;
      break;
    }
    
    const imageParts = await axiosInstance({
      method: "post",
      url: "https://partscatalog.deere.com/jdrc-services/v1/image/getImage",
      data: {
        eq: equipmentRefId,
        iid: imageId
      },
    });
  
    if(imageParts.data && imageParts.data.image){
      await saveBase64Image(imageParts.data.image, pageId+"_parts");
      partsImageSaved = true;
    } else {
      throw new Error("No se recibió imagen en la respuesta");
    }
  }
  catch(e){
    partsImageAttempt++;
    const status = e.response?.status;
    const errorType = status === 500 ? '500' : status === 403 ? '403' : status === 502 ? '502' : 'recuperable';
    
    console.error(`❌ Error ${errorType} en getImage (Intento #${partsImageAttempt}): ${e.message}`);
    console.log(`🔄 Reintentando guardar imagen de partes para ${pageId}...`);
    
    const delay = (status === 403 || status === 502) ? 10000 : 5000;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

    console.log(`Parte ${i + 1}/${response.data.searchResults.length} ${partLocation}| ${pageId}`);
      ModelParts.push({
        part_id: pageId,
        part_name: partLocation,
        part_path: partLocationPath,
        part_type: partType,
        image: pageId+".png",
        image_parts: pageId+"_parts.png",
        id,
        part_item_id:partItemId,
        equipment_ref_id:equipmentRefId,
        chapter,
        link: `https://partscatalog.deere.com/jdrc/search/type/parts/equipment/${equipmentRefId}/term/${partNumber}`,
      });
      await jsonToCsv(
        ModelParts,
        `${pageId}`,
        `parts/`
      );
      let getImageModel;

      try {
  

        /*
          {
            "id": 2752688,
            "name": "65QK Turbocharger ( - 000379)",
            "code": "ST818296",
            "catKey": "PC9795",
            "image":base64,
            "imageSupplementCode": null,
            "partItems": [
              {
                  "id": 11989764,
                  "partID": 364677,
                  "partNumber": "24M7096",
                  "displayPartNumber": "24M7096",
                  "partDescription": "Round Hole Washer",
                  "calloutLabel": "27",
                  "sortCalloutLabel": "27",
                  "sortSequence": "0000000029",
                  "sortPartNumID": "24M709611989764",
                  "quantity": 1,
                  "quantityReq": "1",
                  "remarks": "10.500 X 18 X 1.600 mm",
                  "serialNumber": null,
                  "serialNumberLabel": null,
                  "supportedModels": null,
                  "price": 0,
                  "formattedPrice": null,
                  "pUnit": null,
                  "availability": null,
                  "parentPno": null,
                  "currencySymbol": null,
                  "substituteMsg": null,
                  "extraColumns": [],
                  "taxInfo": null,
                  "formattedPriceInclTax": null,
                  "hasAttachment": false,
                  "hasPartImage": true
              }
        ]
  
        
          
          */
        // Reintentar INFINITAMENTE hasta obtener partItems válido
        let retryCount = 0;
        let getImageModel = null;
        
        // while (true) { // ♾️ REINTENTOS INFINITOS
        //   getImageModel = await retryOnError(async () => {
        //     //await new Promise(resolve => setTimeout(resolve, tiempoMs));
        //     return await axiosInstance({
        //       method: "post",
        //       url: "https://partscatalog.deere.com/jdrc-services/v1/sidebyside/sidebysidePage",
        //       headers: {
        //         "Content-Type": "application/json",
        //       },
        //       data: {
        //         eqID: equipmentRefId,
        //         pgID: pageId,
        //         ...businessRegion,
        //         locale: "en-US",
        //       },
        //     });
        //   }, `getImageModel(${partNumber}, ${equipmentRefId}, ${pageId})`);
          
        //   // Si getImageModel es null, saltar este modelo
        //   if (!getImageModel || !getImageModel.data) {
        //     console.warn(`⚠️  Saltando imagen de modelo para ${partNumber}`);
        //     break;
        //   }
          
        //   // Verificar si partItems existe y es válido
        //   if (getImageModel.data.partItems && Array.isArray(getImageModel.data.partItems)) {
        //     // partItems válido, salir del loop
        //     //console.log(`✅ partItems obtenido correctamente - ${partNumber}`);
        //     break;
        //   } else {
        //     retryCount++;
        //     console.log(`⚠️  partItems undefined, reintentando... (Intento #${retryCount}) ♾️ INFINITO - ${partNumber}`);
            
        //     // 🛡️ ESTRATEGIA ANTI-BAN: Rotar headers agresivamente
        //     console.log(`🔄 Rotando headers agresivamente para evitar ban...`);
        //     for (let i = 0; i < 10; i++) {
        //       COMMON_HEADERS = getRotatingHeaders();
        //     }
            
        //     // 🛡️ Aumentar delay progresivamente según intentos
        //     let antiBanDelay = 2000; // Base: 2 segundos
        //     if (retryCount >= 3) antiBanDelay = 5000;   // 3+ intentos: 5 segundos
        //     if (retryCount >= 5) antiBanDelay = 10000;  // 5+ intentos: 10 segundos
        //     if (retryCount >= 10) antiBanDelay = 20000; // 10+ intentos: 20 segundos
        //     if (retryCount >= 20) antiBanDelay = 40000; // 20+ intentos: 40 segundos
            
        //     console.log(`⏳ Esperando ${(antiBanDelay/1000).toFixed(1)}s antes de reintentar (estrategia anti-ban)...`);
        //     await new Promise(resolve => setTimeout(resolve, antiBanDelay));
        //   }
        // }
        
        // // Si no hay partItems después del loop, saltar (solo si getImageModel es null)
        // if (!getImageModel || !getImageModel.data || !getImageModel.data.partItems) {
        //   console.log(`❌ error no hay partItems - ${partNumber}`);
        //   continue;
        // }

        // Guardar la imagen si existe en la respuesta
        // if (getImageModel.data && getImageModel.data.image) {
        //   const imageFilePath = await saveBase64Image(
        //     getImageModel.data.image,
        //     imagePart,
        //   );
        //   getImageModel.data.imageFilePath = imageFilePath;
        // }
       /* for (let j = 0; j < getImageModel.data.partItems.length; j++) {
          try {*/

        // const piece = getImageModel.data.partItems.find(
        //   (partItem) => {

        //     //console.log(`Comparando: ${partItem.partNumber} === R520632`);
        //     return partItem.partNumber === partNumber
        //   }
        // );
        //if(piece && Object.keys(piece).length > 0){
       




        

        await getPieceDetail({...partUsedModel, equipmentRefId: equipmentRefId,pageId:pageId, parte:parte});
     
        // }
        // else{
        //   console.log("error, No encontrado en partItems");
        // }
         /* } catch (error) {
            console.error("Error:", error.message);
            throw error;
          }
        }*/
      } catch (error) {
        const status = error.response?.status;
        const errorType = status === 500 ? '500' : status === 403 ? '403' : status === 502 ? '502' : 'recuperable';
        
        // Cualquier error - reintentar la misma iteración
        console.warn(`⚠️  Error ${errorType} en procesamiento de parte ${partLocation}. Reintentando iteración...`);
        console.log(`🔄 Repitiendo: Parte ${i + 1}/${response.data.searchResults.length} ${partLocation}| ${pageId}`);
        
        // Delay más largo para 403 y 502
        const delay = (status === 403 || status === 502) ? 10000 : 5000;
        await new Promise(resolve => setTimeout(resolve, delay));
        i--; // Decrementar para repetir la misma iteración
        continue;
      }
    }
  } catch (error) {
    const status = error.response?.status;
    const errorType = status === 500 ? '500' : status === 403 ? '403' : status === 502 ? '502' : 'recuperable';
    
    // Cualquier error - reintentar toda la función
    console.error(`⚠️  Error ${errorType} general en getModelPart(${partNumber}):`, error.message);
    console.log(`🔄 Reintentando getModelPart completo en 10 segundos... ♾️`);
    
    const delay = (status === 403 || status === 502) ? 10000 : 5000;
    await new Promise(resolve => setTimeout(resolve, delay));
    return getModelPart(partNumber, { equipmentRefId }, parte);
  }
}
/*
{
  name: 'Turbocharger Actuator, 24 Volt',
  description: 'Turbocharger Actuator, 24 Volt',
  qty: 1,
  remarks: '24 V, ALSO ORDER RE528219; INCLUDES E63524; ORDER DZ115246; SUB FOR RE523491',
  equipment: null,
  navElements: null,
  alternateParts: [
    {
      refId: null,
      datasetId: null,
      formattedPartNumber: 'RM100085',
      displayPartNumber: 'RM100085',
      partNumber: 'RM100085',
      description: 'ACTUATOR REMAN',
      partId: '378093',
      quantity: 1
    }
  ],
  partAttachments: []
}
*/
// id es el id de la parte
async function getPieceDetailRemarks(
  { equipmentRefId, partNumber, pageId, id, partItemId },
  isAlternative = true
) {
  const url =
    "https://partscatalog.deere.com/jdrc-services/v1/partdetail/partinfo";

  const headers = {
    "Content-Type": "application/json",
  };

  const data = {
    pid: partItemId,
    fr: {
      equipmentRefId: equipmentRefId,
      currentPin: null,
      businessRegion: 1189,
      filtersEnabled: true,
      filteringLevel: null,
      encodedFilters: null,
      encodedFiltersHash: null,
    },
    locale: "en-US",
    snp: "",
    eqId: equipmentRefId,
  };

  return retryOnError(async () => {
    //await new Promise(resolve => setTimeout(resolve, tiempoMs));
    const response = await axiosInstance({
      method: "post",
      url: url,
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    });
    return response.data;
  }, `getPieceDetailRemarks(${partNumber})`);
}

/*
{
    "tax-info": null,
    "partOps": [
        {
            "partBasicInfo": {
                "partNumber": "24M7096",
                "partDescription": "WASHER, METALLIC, ROUND HOLE",
                "isSubAvailable": false,
                "subQty": 0
            },
            "partOrderingInfo": null,
            "partShippingInfo": {
                "packageWeight": 0.01,
                "packageWeightUnit": "LBS",
                "packageWidth": null,
                "packageWidthUnit": null,
                "packageLength": null,
                "packageLengthUnit": null,
                "packageQty": null
            },
            "validUntil": "2025-10-08T02:00:00Z",
            "error": null
        }
    ],
    "error": null
}
*/
let pieceDetail = [];
async function getPieceDetail(
  { equipmentRefId, partNumber, id,parte, partItemId, pageId},
  isAlternative = true
) {
  const url =
    "https://partscatalog.deere.com/jdrc-services/v1/integration/parts";

  const headers = {
    "Content-Type": "application/json",
  };

  const data = {
    "locale-cd": "en-US",
    "iso2-country-code": "ES",
    "include-sub-part-detail": "false",
    "part-list": [
      {
        partNumber: partNumber,
      },
    ],
  };

  try {
    // Reintentar INFINITAMENTE hasta obtener partOps válido
    let retryCountDetail = 0;
    let response = null;
    
    while (true) { // ♾️ REINTENTOS INFINITOS
      response = await retryOnError(async () => {
       // await new Promise(resolve => setTimeout(resolve, tiempoMs));
        return await axiosInstance({
          method: "post",
          url: url,
          headers: {
            "Content-Type": "application/json",
          },
          data: data,
        });
      }, `getPieceDetail(${partNumber})`);
      
      // Verificar si partOps existe y es válido
      if (response && response.data && response.data.partOps && Array.isArray(response.data.partOps) && response.data.partOps.length > 0) {
        //console.log(`✅ partOps obtenido correctamente - ${partNumber}`);
        break;
      } else {
        retryCountDetail++;
        console.log(`⚠️  partOps undefined/vacío, reintentando... (Intento #${retryCountDetail}) ♾️ INFINITO - ${partNumber}`);
        
        // 🛡️ ESTRATEGIA ANTI-BAN: Rotar headers agresivamente
        console.log(`🔄 Rotando headers agresivamente para evitar ban...`);
        for (let i = 0; i < 10; i++) {
          COMMON_HEADERS = getRotatingHeaders();
        }
        
        // 🛡️ Aumentar delay progresivamente según intentos
        let antiBanDelay = 2000; // Base: 2 segundos
        if (retryCountDetail >= 3) antiBanDelay = 5000;   // 3+ intentos: 5 segundos
        if (retryCountDetail >= 5) antiBanDelay = 10000;  // 5+ intentos: 10 segundos
        if (retryCountDetail >= 10) antiBanDelay = 20000; // 10+ intentos: 20 segundos
        if (retryCountDetail >= 20) antiBanDelay = 40000; // 20+ intentos: 40 segundos
        
        console.log(`⏳ Esperando ${(antiBanDelay/1000).toFixed(1)}s antes de reintentar (estrategia anti-ban)...`);
        await new Promise(resolve => setTimeout(resolve, antiBanDelay));
      }
    }

    // Reintentar INFINITAMENTE hasta obtener remarks válido
    let retryCountRemarks = 0;
    let remarks = null;
    
    while (true) { // ♾️ REINTENTOS INFINITOS
      remarks = await getPieceDetailRemarks({ equipmentRefId, id, partItemId }, isAlternative);
      // Verificar si remarks es válido
      if (remarks && typeof remarks === 'object') {
        //console.log(`✅ remarks obtenido correctamente - ${partNumber}`);
        break;
      } else {
        retryCountRemarks++;
        console.log(`⚠️  remarks undefined, reintentando... (Intento #${retryCountRemarks}) ♾️ INFINITO - ${partNumber}`);
        
        // 🛡️ ESTRATEGIA ANTI-BAN: Rotar headers agresivamente
        console.log(`🔄 Rotando headers agresivamente para evitar ban...`);
        for (let i = 0; i < 10; i++) {
          COMMON_HEADERS = getRotatingHeaders();
        }
        
        // 🛡️ Aumentar delay progresivamente según intentos
        let antiBanDelay = 2000; // Base: 2 segundos
        if (retryCountRemarks >= 3) antiBanDelay = 5000;   // 3+ intentos: 5 segundos
        if (retryCountRemarks >= 5) antiBanDelay = 10000;  // 5+ intentos: 10 segundos
        if (retryCountRemarks >= 10) antiBanDelay = 20000; // 10+ intentos: 20 segundos
        if (retryCountRemarks >= 20) antiBanDelay = 40000; // 20+ intentos: 40 segundos
        
        console.log(`⏳ Esperando ${(antiBanDelay/1000).toFixed(1)}s antes de reintentar (estrategia anti-ban)...`);
        await new Promise(resolve => setTimeout(resolve, antiBanDelay));
      }
    }

    const images = await getImagesPart({ partNumber });
    const partOps = response.data.partOps;
      const pieceDetailData = {
      piece_id: partOps[0]?.partBasicInfo?.partNumber ?? "",
      piece_name: remarks?.name ?? "",
      piece_parte: parte ?? "",
      piece_description: remarks?.description ?? "",
      piece_model: equipmentRefId ?? "",
      piece_part: pageId ?? "",
      piece_alternative_part_id: "",
      piece_qty: remarks?.qty ?? "",
      piece_remarks: remarks?.remarks ?? "",
      piece_packageWeight: partOps[0]?.partShippingInfo?.packageWeight ?? "",
      piece_packageWeightUnit: partOps[0]?.partShippingInfo?.packageWeightUnit ?? "",
      piece_packageWidth: partOps[0]?.partShippingInfo?.packageWidth ?? "",
      piece_packageWidthUnit: partOps[0]?.partShippingInfo?.packageWidthUnit ?? "",
      piece_packageLength: partOps[0]?.partShippingInfo?.packageLength ?? "",
      piece_packageLengthUnit: partOps[0]?.partShippingInfo?.packageLengthUnit ?? "",
      piece_packageQty: partOps[0]?.partShippingInfo?.packageQty ?? "",
      piece_images: images ?? "",
      link: `https://partscatalog.deere.com/jdrc/partdetails/partnum/${partNumber}/referrer/sbs/pid/${partItemId}/pgId/${pageId}/eqId/${equipmentRefId}`
    };

    /*if (
        remarks.alternateParts &&
        remarks.alternateParts.length > 0 
      ) {
        console.log("alternativa");
        pieceDetail.piece_alternative_piece_id = remarks.alternateParts[0].partNumber;
      }*/

  
    if (
      remarks.alternateParts &&
      remarks.alternateParts.length > 0 
    ) {
      
      for (
        let index = 0;
        index < remarks.alternateParts.length;
        index++
      ) {
        try {
          const alternativePartId = remarks.alternateParts[index].partNumber;
          
          pieceDetail.push({
            ...pieceDetailData,
            piece_alternative_part_id: alternativePartId
          });
        } catch (altError) {
          const status = altError.response?.status;
          const errorType = status === 500 ? '500' : status === 403 ? '403' : status === 502 ? '502' : 'recuperable';
          
          // Cualquier error - reintentar la misma alternativa
          console.warn(`⚠️  Error ${errorType} en alternativa ${index + 1}. Reintentando...`);
          console.log(`🔄 Repitiendo: Alternativa ${index + 1}/${remarks.alternateParts.length}`);
          
          const delay = (status === 403 || status === 502) ? 10000 : 5000;
          await new Promise(resolve => setTimeout(resolve, delay));
          index--; // Decrementar para repetir la misma iteración
          continue;
        }
        
      }
    } else {
      // Si no hay alternativas, agregar el pieceDetailData sin alternative_part_id
      pieceDetail.push(pieceDetailData);
    }


  } catch (error) {
    const status = error.response?.status;
    const errorType = status === 500 ? '500' : status === 403 ? '403' : status === 502 ? '502' : 'recuperable';
    
    // Cualquier error - lanzar error específico para que el loop lo maneje
    const errorRetry = new Error(`Error ${errorType} en getPieceDetail`);
    errorRetry.needsRetry = true;
    errorRetry.response = { status: status };
    errorRetry.originalError = error;
    throw errorRetry;
  }
}

/*async function getAlternativeParts({partNumber}) {
  const url =
    "https://partscatalog.deere.com/jdrc-services/v1/integration/parts";

  const headers = {
    "Content-Type": "application/json",
  };

  const data = {
    "dealer-id": "",
    "locale-cd": "en-US",
    "iso2-country-code": "ES",
    "include-sub-part-detail": "true",
    "part-number": partNumber
  };

  try {
    console.log("alternative part");
    const response = await axios({
      method: "post",
      url: url,
      headers: {
        ...headers,
      },
      data: data,
    });

    console.log(response.data);
    await getPieceDetail({equipmentRefId,partNumber, id, equipmentRefId});

 ///remark
    await getPieceDetailRemarks({equipmentRefId, partNumber, id});

    await getImagesPart({partNumber});
  } catch (error) {
    console.error("Error:", error.message);
    throw error;
  }
}*/

/**
 * Obtiene y guarda todas las imágenes de una parte
 * @param {string} partNumber - Número de parte
 */

/*{
    "imagesMap": {
        "591793": base64,
        "591794": base64,
        "591795": base64,
    }
}*/

async function getImagesPart({ partNumber }) {
  const url =
    "https://partscatalog.deere.com/jdrc-services/v1/partdetail/partImages";

  const headers = {
    "Content-Type": "application/json",
  };

  const data = {
    partNum: partNumber,
    locale: "en-US",
    imageFormat: "",
  };

  try {
    const response = await retryOnError(async () => {
      //await new Promise(resolve => setTimeout(resolve, tiempoMs));
      return await axiosInstance({
        method: "post",
        url: url,
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      });
    }, `getImagesPart(${partNumber})`);
    
    // Si response es null (error 500), retornar 0
    if (!response) {
      console.warn(`⚠️  Error 500 en getImagesPart para ${partNumber}. Retornando 0.`);
      return 0;
    }

    // Verificar si existe el mapa de imágenes
    if (response.data && response.data.imagesMap) {
      const imagesMap = response.data.imagesMap;
      const imageIds = Object.keys(imagesMap);

      // console.log(
      //   `📸 Encontradas ${imageIds.length} imágenes para ${partNumber}`
      // );
      let arrayImages = "";
      // Guardar cada imagen de forma secuencial
      for (let index = 0; index < imageIds.length; index++) {
        const imageId = imageIds[index];
        const base64Image = imagesMap[imageId];
        const fileName = `${partNumber}_${index}`;

        try {
          await saveBase64Image(base64Image, fileName);
          // console.log(
          //   `  ✓ Imagen ${index + 1}/${
          //     imageIds.length
          //   } guardada: ${fileName}.png`
          // );
          // Concatenar el nombre del archivo
          arrayImages += `${fileName}.png`;
          // Agregar salto de línea si no es el último elemento
          if (index < imageIds.length - 1) {
            arrayImages += "|";
          }

        } catch (error) {
          const status = error.response?.status;
          const errorType = status === 500 ? '500' : status === 403 ? '403' : status === 502 ? '502' : 'recuperable';
          
          // Cualquier error - reintentar la misma imagen
          console.warn(`⚠️  Error ${errorType} guardando imagen ${index + 1}. Reintentando...`);
          console.log(`🔄 Repitiendo: Imagen ${index + 1}/${imageIds.length} de ${partNumber}`);
          
          const delay = (status === 403 || status === 502) ? 10000 : 5000;
          await new Promise(resolve => setTimeout(resolve, delay));
          index--; // Decrementar para repetir la misma iteración
          continue;
        }
      }

      //console.log(`✓ Todas las imágenes de ${partNumber} guardadas\n`);
      //console.log(`📋 Lista de imágenes: ${arrayImages}`);
      return arrayImages;
    } else {
      //console.log(`⚠ No se encontraron imágenes para ${partNumber}\n`);
      return 0;
    }
  } catch (error) {
    const status = error.response?.status;
    const errorType = status === 500 ? '500' : status === 403 ? '403' : status === 502 ? '502' : 'recuperable';
    
    // Cualquier error - reintentar toda la función
    console.error(`⚠️  Error ${errorType} en getImagesPart(${partNumber}):`, error.message);
    console.log(`🔄 Reintentando getImagesPart en 10 segundos... ♾️`);
    
    const delay = (status === 403 || status === 502) ? 10000 : 5000;
    await new Promise(resolve => setTimeout(resolve, delay));
    return getImagesPart({ partNumber });
  }
}

// Función principal con manejo de errores mejorado
async function main() {
  try {
    console.log("🚀 Iniciando proceso...\n");
    await getModelsByPartNumber();
    console.log("\n" + "=".repeat(60));
    console.log("✅ Proceso completado exitosamente");
    console.log("=".repeat(60));
    process.exit(0);
  } catch (error) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ ERROR CRÍTICO EN EL PROCESO PRINCIPAL");
    console.error("=".repeat(60));
    console.error("Mensaje:", error.message);
    console.error("Stack:", error.stack);
    console.error("=".repeat(60) + "\n");
    
    // Solo reiniciar en caso de errores críticos no relacionados con 403/502
    console.log("⏳ Esperando 10 segundos antes de reintentar...");
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log("🔄 REINICIANDO PROCESO...\n");
    console.log("=".repeat(60) + "\n");
    return main();
  }
}

// Manejar señales de terminación
process.on('SIGINT', () => {
  console.log('\n⚠️  Proceso interrumpido por el usuario');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Excepción no capturada:', error);
  console.log('🔄 Reiniciando en 5 segundos...');
  setTimeout(() => main(), 5000);
});

// Iniciar el proceso
main();

// Exportar las funciones
module.exports = {
  getModelsByPartNumber,
  getModelPart,
  getImagesPart,
  getPieceDetail,
};
