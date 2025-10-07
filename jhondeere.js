const axios = require("axios");
const fs = require("fs");
const path = require("path");

/**
 * Busca partes en el catálogo de John Deere
 * @param {string} searchTerm - El término de búsqueda (número de parte)
 * @param {string} captchaToken - Token de captcha (opcional, puede ser generado dinámicamente)
 * @returns {Promise} - Respuesta de la API
 */

//Nos trae toda la lista completa de modelos al introducir una parte

async function searchJohnDeereParts(searchTerm) {
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

  try {
    const response = await axios({
      method: "post",
      url: url,
      headers: {
        ...headers,
      },
      data: data,
    });

    return response.data;
  } catch (error) {
    console.error(
      "Error al buscar partes:",
      error.response?.data || error.message
    );
    throw error;
  }
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

    const resultados = [];

    // Procesar cada pieza secuencialmente
    for (let i = 0; i < piezas.length; i++) {
      const item = piezas[i];
      console.log(
        `[${i + 1}/${piezas.length}] Procesando: ${item.id_pieza} - ${
          item.parte
        }`
      );
      console.log("searchJohnDeereParts");
      try {
        const resultado = await searchJohnDeereParts(item.id_pieza);

        /*for (let j = 0; j < resultado.data.searchResults.length; j++) {
          console.log("getModelPartUse",j);
          await getModelPartUse(item.id_pieza, resultado.data.searchResults[j]);

        */
        //TODO descomentar lo anterior await getModelPartUse(item.id_pieza, resultado.data.searchResults[j]);
        await getModelPartUse(item.id_pieza, resultado.searchResults[0]);

        /*}*/

        console.log(`✓ Completado: ${item.id_pieza}\n`);
      } catch (error) {
        console.error(`✗ Error en ${item.id_pieza}: ${error.message}\n`);

        resultados.push({
          ...item,
          success: false,
          error: error.message,
        });
      }

      // Pequeña pausa entre peticiones (opcional, para no saturar el servidor)
      /*if (i < piezas.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
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
async function saveBase64Image(base64Data, fileName) {
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

async function getModelPartUse(partNumber, { equipmentRefId }) {
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
    console.log("partNumber, { equipmentRefId }", partNumber, {
      equipmentRefId,
    });
    const response = await axios({
      method: "post",
      url: url,
      headers: {
        ...headers,
      },
      data: data,
    });
    const businessRegion = { brID: "1189" };

    //for (let i = 0; i < response.data.searchResults.length; i++) {
    //TODO
    //const partUsedModel = response.data.searchResults[i];
    const partUsedModel = response.data.searchResults[0];

    const {  pageId, baseCode } = partUsedModel;

    console.log("Procesando:", { equipmentRefId, pageId, baseCode });

    let getImageModel;

    try {
      console.log("petición para guardar imagen general", partNumber, {
        equipmentRefId,
      });

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

      getImageModel = await axios({
        method: "post",
        url: "https://partscatalog.deere.com/jdrc-services/v1/sidebyside/sidebysidePage",
        headers: {
          ...headers,
        },
        data: {
          eqID: equipmentRefId,
          pgID: pageId,
          ...businessRegion,
          locale: "en-US",
        },
      });

      // Guardar la imagen si existe en la respuesta
      if (getImageModel.data && getImageModel.data.image) {
        const fileName = `${baseCode}_${partNumber}`;
        const imageFilePath = await saveBase64Image(
          getImageModel.data.image,
          fileName
        );
        getImageModel.data.imageFilePath = imageFilePath;
      }

      /*for (let j = 0; j < getImageModel.data.partItems.length; j++) {
        try {
          console.log("part detail");
          */
         if(getImageModel.data.partItems){
          await getPartDetail({...getImageModel.data.partItems[10], equipmentRefId: equipmentRefId});
          //TODO await getPartDetail({...getImageModel.data.partItems[j], equipmentRefId: equipmentRefId});
         }

        /*} catch (error) {
          console.error("Error:", error.message);
          throw error;
        }
      }*/
    } catch (error) {
      console.error("Error:", error.message);
      throw error;
      //}
      //console.log(getImageModel.data);
    }
  } catch (error) {
    console.error("Error:", error.message);
    throw error;
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
async function getPartDetailRemarks({equipmentRefId,partNumber, id}, isAlternative = true) {
  const url =
    "https://partscatalog.deere.com/jdrc-services/v1/partdetail/partinfo";

  const headers = {
    "Content-Type": "application/json",
  };

  const data = {
    "pid": id,
    "fr": {
        "equipmentRefId": equipmentRefId,
        "currentPin": null,
        "businessRegion": 1189,
        "filtersEnabled": true,
        "filteringLevel": null,
        "encodedFilters": null,
        "encodedFiltersHash": null
    },
    "locale": "en-US",
    "snp": "",
    "eqId": equipmentRefId
}

  try {
    console.log("remarks", data);
    const response = await axios({
      method: "post",
      url: url,
      headers: {
        ...headers,
      },
      data: data,
    });

    console.log("respuesta detalle remarks",response.data);

    if(response.data.alternateParts && response.data.alternateParts.length > 0 && isAlternative){
      console.log("alternativa");
      for (let index = 0; index < response.data.alternateParts.length; index++) {
        
        const {partNumber , partId} = response.data.alternateParts[index];
        await getPartDetail({equipmentRefId,partNumber, id:partId}, false);
      }
    
    }
    

  } catch (error) {
    console.error("Error:", error.message);
    throw error;
  }
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

async function getPartDetail({equipmentRefId,partNumber, id} , isAlternative = true) {
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
    console.log(equipmentRefId,partNumber, id);
    const response = await axios({
      method: "post",
      url: url,
      headers: {
        ...headers,
      },
      data: data,
    });

    console.log("respuesta detalle",response.data);

 ///remark
    await getPartDetailRemarks({equipmentRefId, id}, isAlternative);

    await getImagesPart({partNumber});
  } catch (error) {
    console.error("Error:", error.message);
    throw error;
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
    await getPartDetail({equipmentRefId,partNumber, id, equipmentRefId});

 ///remark
    await getPartDetailRemarks({equipmentRefId, partNumber, id});

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

async function getImagesPart({partNumber}) {
  const url =
    "https://partscatalog.deere.com/jdrc-services/v1/partdetail/partImages";

  const headers = {
    "Content-Type": "application/json",
  };

  const data = {
    "partNum": partNumber,
    "locale": "en-US",
    "imageFormat": ""
  };

  try {
    const response = await axios({
      method: "post",
      url: url,
      headers: {
        ...headers,
      },
      data: data,
    });

    // Verificar si existe el mapa de imágenes
    if (response.data && response.data.imagesMap) {
      const imagesMap = response.data.imagesMap;
      const imageIds = Object.keys(imagesMap);
      
      console.log(`📸 Encontradas ${imageIds.length} imágenes para ${partNumber}`);
      
      // Guardar cada imagen de forma secuencial
      for (let index = 0; index < imageIds.length; index++) {
        const imageId = imageIds[index];
        const base64Image = imagesMap[imageId];
        const fileName = `${partNumber}_${index}`;
        
        try {
          await saveBase64Image(base64Image, fileName);
          console.log(`  ✓ Imagen ${index + 1}/${imageIds.length} guardada: ${fileName}.png`);
        } catch (error) {
          console.error(`  ✗ Error guardando imagen ${index}: ${error.message}`);
        }
      }
      
      console.log(`✓ Todas las imágenes de ${partNumber} guardadas\n`);
      return imageIds.length;
    } else {
      console.log(`⚠ No se encontraron imágenes para ${partNumber}\n`);
      return 0;
    }
    
  } catch (error) {
    console.error("Error:", error.message);
    throw error;
  }
}


(async () => {
  await getModelsByPartNumber();
  //segundo argumento es un string con el equipmentRefId
  //await getModelPartUse("RE527858", { equipmentRefId: "16566" });
})();

// Exportar las funciones
module.exports = { getModelsByPartNumber, getModelPartUse, getImagesPart, getPartDetail };
