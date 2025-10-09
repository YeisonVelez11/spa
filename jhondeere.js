const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { jsonToCsv } = require("./funciones");

// Configuración para reintentos
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000; // 5 segundos
const RETRY_DELAY_403_MS = 15000; // 30 segundos para 403

// Headers completos para evitar detección como bot
const COMMON_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
  'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"macOS"',
  'Origin': 'https://partscatalog.deere.com',
  'Referer': 'https://partscatalog.deere.com/',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache'
};

// Configuración de axios con interceptores para simular comportamiento humano
const axiosInstance = axios.create({
  timeout: 30000,
  maxRedirects: 5,
  validateStatus: (status) => status >= 200 && status < 500, // Aceptar más rangos de status
  headers: COMMON_HEADERS
});

/**
 * Función auxiliar para manejar reintentos en caso de errores 403/502
 * @param {Function} fn - Función a ejecutar
 * @param {string} context - Contexto para logging
 * @param {number} retries - Número de reintentos restantes
 * @returns {Promise} - Resultado de la función o null si falla
 */
async function retryOnError(fn, context, retries = MAX_RETRIES) {
  try {
    return await fn();
  } catch (error) {
    const status = error.response?.status;
    const isRecoverableError = status === 403 || status === 502;
    
    if (isRecoverableError && retries > 0) {
      const delay = status === 403 ? RETRY_DELAY_403_MS : RETRY_DELAY_MS;
      console.warn(`⚠️  Error ${status} en ${context}. Reintentando en ${delay/1000}s... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryOnError(fn, context, retries - 1);
    }
    
    // Si no es recuperable o se agotaron los reintentos, registrar y continuar
    if (isRecoverableError) {
      console.error(`❌ Error ${status} en ${context} después de ${MAX_RETRIES} intentos. Continuando...`);
      return null;
    }
    
    // Para otros errores, también continuar pero registrar
    console.error(`❌ Error en ${context}: ${error.message}. Continuando...`);
    return null;
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
        ...COMMON_HEADERS,
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
    // Leer el archivo JSON
    const fileContent = fs.readFileSync("./data/id_piezas1.json", "utf-8");
    const piezas = JSON.parse(fileContent);

    console.log(`Total de piezas a procesar: ${piezas.length}\n`);

    // Declarar resultados fuera del loop
    const resultados = [];

    // Procesar cada pieza secuencialmente

    for (let i = 0; i < piezas.length; i++) {
      ModelParts = [];
      const modelData = [];

      const item = piezas[i];
      console.log(
        `[------${i + 1}/${piezas.length}] ${item.id_pieza}`
      );
      console.log("getAllModelsByPart");
      try {
        const resultado = await getAllModelsByPart(item.id_pieza);
        
        // Si resultado es null (error recuperable), saltar esta pieza
        if (!resultado || !resultado.searchResults) {
          console.warn(`⚠️  Saltando pieza ${item.id_pieza} debido a errores`);
          resultados.push({
            ...item,
            success: false,
            error: "Error recuperable - saltado",
          });
          continue;
        }
        

        for (let j = 0; j < resultado.searchResults.length; j++) {

        //for (let j = 0; j <= 1; j++) {
          console.log("MODELO",`${j+ 1}/${resultado.searchResults.length}`, j, item.id_pieza);
          const { baseCode, model, equipmentName,equipmentRefId } = resultado.searchResults[j];
          console.log("equipmentRefId",equipmentRefId);
          modelData.push({
            model_id: equipmentRefId,
            model_code: baseCode,
            model_name: model,
            model_full_name: equipmentName,
          });
     


          await getModelPart(item.id_pieza, resultado.searchResults[j],item.parte);
          //TODO descomentar lo anterior await getModelPart(item.id_pieza, resultado.data.searchResults[j]);
          //await getModelPart(item.id_pieza, resultado.searchResults[0]);
        }

        await jsonToCsv(
           modelData,
          `model_${item.id_pieza}`,
          `models/`
        );



        console.log(`✓ Completado: ${item.id_pieza}\n`);
      } catch (error) {
        console.error(`✗ Error en ${item.id_pieza}: ${error.message}\n`);
        
        // Ya no propagamos errores 403/502, solo registramos y continuamos
        resultados.push({
          ...item,
          success: false,
          error: error.message,
        });
      }

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

    console.log(`✓ Imagen guardada: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error(`✗ Error al guardar imagen: ${error.message}`);
    throw error;
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
    console.log(`PARTE ${partNumber} - ${equipmentRefId}`);
    
    const response = await retryOnError(async () => {
      //await new Promise(resolve => setTimeout(resolve, tiempoMs));
      return await axiosInstance({
        method: "post",
        url: url,
        headers: {
          ...COMMON_HEADERS,
          "Content-Type": "application/json",
        },
        data: data,
      });
    }, `getModelPart(${partNumber}, ${equipmentRefId})`);
    
    // Si response es null (error recuperable), salir de la función
    if (!response || !response.data || !response.data.searchResults) {
      console.warn(`⚠️  Saltando getModelPart para ${partNumber}`);
      return;
    }
    
    const businessRegion = { brID: "1189" };
    for (let i = 0; i < response.data.searchResults.length; i++) {

      const {  partLocation, partLocationPath } = response.data.searchResults[i];

      const partUsedModel = response.data.searchResults[i];
      //TODO const partUsedModel = response.data.searchResults[0];

      const { pageId, baseCode, id, chapter, partType } = partUsedModel;
      const imagePart = `${equipmentRefId}_${pageId}`;

      ModelParts = [];
      ModelParts.push({
        part_id: pageId,
        part_name: partLocation,
        part_path: partLocationPath,
        part_type: partType,
        image: imagePart+".png",
        id,
        chapter,
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
        getImageModel = await retryOnError(async () => {
          //await new Promise(resolve => setTimeout(resolve, tiempoMs));
          return await axiosInstance({
            method: "post",
            url: "https://partscatalog.deere.com/jdrc-services/v1/sidebyside/sidebysidePage",
            headers: {
              ...COMMON_HEADERS,
              "Content-Type": "application/json",
            },
            data: {
              eqID: equipmentRefId,
              pgID: pageId,
              ...businessRegion,
              locale: "en-US",
            },
          });
        }, `getImageModel(${partNumber}, ${equipmentRefId}, ${pageId})`);
        
        // Si getImageModel es null, saltar este modelo
        if (!getImageModel || !getImageModel.data) {
          console.warn(`⚠️  Saltando imagen de modelo para ${partNumber}`);
          continue;
        }

        // Guardar la imagen si existe en la respuesta
        if (getImageModel.data && getImageModel.data.image) {
          const imageFilePath = await saveBase64Image(
            getImageModel.data.image,
            imagePart,
          );
          getImageModel.data.imageFilePath = imageFilePath;
        }

       /* for (let j = 0; j < getImageModel.data.partItems.length; j++) {
          try {*/
            console.log("piece detail",getImageModel.data);

            if (getImageModel.data.partItems) {
              const piece = getImageModel.data.partItems.find(
                (partItem) => {
                  //console.log(`Comparando: ${partItem.partNumber} === R520632`);
                  return partItem.partNumber === partNumber
                }
              );
              if(Object.keys(piece).length > 0){
                console.log("encontrado", partNumber);

                // Verificar si el archivo CSV ya existe
                const csvFilePath = path.join(__dirname, "csv_output", "pieces", `${partNumber}.csv`);
                
                if (!fs.existsSync(csvFilePath)) {
                  console.log(`Procesando pieza ${partNumber}...`);
                  await getPieceDetail({...piece, equipmentRefId: equipmentRefId,parte:parte});
                  //TODO await getPieceDetail({...getImageModel.data.partItems[j], equipmentRefId: equipmentRefId});
                } else {
                  console.log(`⏭ Saltando ${partNumber} - archivo CSV ya existe`);
                }
              }
              else{
                console.log("No encontrado");
              }
            }
            else{
              console.log("no hay",getImageModel.data.partItems);
            }
         /* } catch (error) {
            console.error("Error:", error.message);
            throw error;
          }
        }*/
      } catch (error) {
        console.error(`⚠️  Error en procesamiento de modelo ${partNumber}:`, error.message);
        // No lanzar error, solo registrar y continuar con el siguiente
        continue;
      }
    }
  } catch (error) {
    console.error(`⚠️  Error general en getModelPart(${partNumber}):`, error.message);
    // No lanzar error, solo registrar
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
  { equipmentRefId, partNumber, id },
  isAlternative = true
) {
  const url =
    "https://partscatalog.deere.com/jdrc-services/v1/partdetail/partinfo";

  const headers = {
    "Content-Type": "application/json",
  };

  const data = {
    pid: id,
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
        ...COMMON_HEADERS,
        "Content-Type": "application/json",
      },
      data: data,
    });
    console.log("respuesta detalle remarks");
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

async function getPieceDetail(
  { equipmentRefId, partNumber, id,parte},
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
    
    const response = await retryOnError(async () => {
     // await new Promise(resolve => setTimeout(resolve, tiempoMs));
      return await axiosInstance({
        method: "post",
        url: url,
        headers: {
          ...COMMON_HEADERS,
          "Content-Type": "application/json",
        },
        data: data,
      });
    }, `getPieceDetail(${partNumber})`);
    
    // Si response es null, salir
    if (!response || !response.data || !response.data.partOps) {
      console.warn(`⚠️  Saltando getPieceDetail para ${partNumber}`);
      return;
    }

    console.log("respuesta detalle");

    ///remark
    const remarks = await getPieceDetailRemarks({ equipmentRefId, id }, isAlternative);
    
    // Si remarks es null, salir
    if (!remarks) {
      console.warn(`⚠️  No se pudieron obtener remarks para ${partNumber}`);
      return;
    }

    const images = await getImagesPart({ partNumber });
    const partOps = response.data.partOps;
    const pieceDetail = {
      piece_id: partOps[0].partBasicInfo.partNumber,
      piece_name: remarks.name,
      piece_parte: parte,
      piece_description: remarks.description,
      piece_qty: remarks.qty,
      piece_remarks: remarks.remarks,
      piece_packageWeight: partOps[0].partShippingInfo.packageWeight,
      piece_packageWeightUnit: partOps[0].partShippingInfo.packageWeightUnit,
      piece_packageWidth: partOps[0].partShippingInfo.packageWidth,
      piece_packageWidthUnit: partOps[0].partShippingInfo.packageWidthUnit,
      piece_packageWidthUnit: partOps[0].partShippingInfo.packageWidthUnit,
      piece_packageLength: partOps[0].partShippingInfo.packageLength,
      piece_packageLengthUnit: partOps[0].partShippingInfo.packageLengthUnit,
      piece_packageQty: partOps[0].partShippingInfo.packageQty,
      piece_alternative_part_id: "",
      piece_images: images,
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
      console.log("alternativa");
      /*
      TODO
       for (
        let index = 0;
        index < remarks.alternateParts.length;
        index++
      ) {*/
        //const { partNumber, partId } = remarks.alternateParts[index];
        /*await getPieceDetail({ 
          equipmentRefId, 
          partNumber: remarks.alternateParts[index].partNumber,
          id: remarks.alternateParts[index].partId }, false);*/
          
          pieceDetail.piece_alternative_part_id = remarks.alternateParts[0].partId;
          
          /*
          en teoria en algun momento se va a guardar
          await getPieceDetail({ 
            equipmentRefId, 
            partNumber: remarks.alternateParts[0].partNumber,
            id: remarks.alternateParts[0].partId, 
            parte: parte }, false);*/

      //}
    }
    console.log("crearia",pieceDetail,partNumber);

    await jsonToCsv(
      [pieceDetail],
      `${partNumber}`,
      `pieces/`
    );
    



  } catch (error) {
    console.error(`⚠️  Error en getPieceDetail(${partNumber}):`, error.message);
    // No lanzar error, solo registrar
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
          ...COMMON_HEADERS,
          "Content-Type": "application/json",
        },
        data: data,
      });
    }, `getImagesPart(${partNumber})`);
    
    // Si response es null, retornar 0
    if (!response) {
      console.warn(`⚠️  No se pudieron obtener imágenes para ${partNumber}`);
      return 0;
    }

    // Verificar si existe el mapa de imágenes
    if (response.data && response.data.imagesMap) {
      const imagesMap = response.data.imagesMap;
      const imageIds = Object.keys(imagesMap);

      console.log(
        `📸 Encontradas ${imageIds.length} imágenes para ${partNumber}`
      );
      let arrayImages = "";
      // Guardar cada imagen de forma secuencial
      for (let index = 0; index < imageIds.length; index++) {
        const imageId = imageIds[index];
        const base64Image = imagesMap[imageId];
        const fileName = `${partNumber}_${index}`;

        try {
          await saveBase64Image(base64Image, fileName);
          console.log(
            `  ✓ Imagen ${index + 1}/${
              imageIds.length
            } guardada: ${fileName}.png`
          );
          // Concatenar el nombre del archivo
          arrayImages += `${fileName}.png`;
          // Agregar salto de línea si no es el último elemento
          if (index < imageIds.length - 1) {
            arrayImages += "\n";
          }

        } catch (error) {
          console.error(
            `  ✗ Error guardando imagen ${index}: ${error.message}`
          );
        }
      }

      console.log(`✓ Todas las imágenes de ${partNumber} guardadas\n`);
      console.log(`📋 Lista de imágenes: ${arrayImages}`);
      return arrayImages;
    } else {
      console.log(`⚠ No se encontraron imágenes para ${partNumber}\n`);
      return 0;
    }
  } catch (error) {
    console.error(`⚠️  Error en getImagesPart(${partNumber}):`, error.message);
    return 0;
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
