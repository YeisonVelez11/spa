const axios = require('axios');
const fs = require('fs');

/**
 * Busca partes en el catálogo de John Deere
 * @param {string} searchTerm - El término de búsqueda (número de parte)
 * @param {string} captchaToken - Token de captcha (opcional, puede ser generado dinámicamente)
 * @returns {Promise} - Respuesta de la API
 */
async function searchJohnDeereParts(searchTerm, captchaToken = null) {
  const url = 'https://partscatalog.deere.com/jdrc-services/v1/search/parts';
  
  const headers = {
    'Content-Type': 'application/json',
  };

  const data = {
    q: searchTerm,
    eq: "",
    fr: null,
    br: "1189",
    locale: "en-US"
  };


  try {
    const response = await axios({
      method: 'post',
      url: url,
      headers: {
        ...headers,
      },
      data: data
    });

    return response.data;
  } catch (error) {
    console.error('Error al buscar partes:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Procesa todas las piezas del archivo JSON secuencialmente
 */
async function getModelsByPartNumber() {
  try {
    // Leer el archivo JSON
    const fileContent = fs.readFileSync('./data/id_piezas1.json', 'utf-8');
    const piezas = JSON.parse(fileContent);
    
    console.log(`Total de piezas a procesar: ${piezas.length}\n`);
    
    const resultados = [];
    
    // Procesar cada pieza secuencialmente
    for (let i = 0; i < piezas.length; i++) {
      const item = piezas[i];
      console.log(`[${i + 1}/${piezas.length}] Procesando: ${item.id_pieza} - ${item.parte}`);
      
      try {
        // Hacer la petición y esperar a que termine
        const resultado = await searchJohnDeereParts(item.id_pieza);
        
        resultados.push({
          ...item,
          success: true,
          data: resultado
        });
        
        console.log(`✓ Completado: ${item.id_pieza}\n`);
      } catch (error) {
        console.error(`✗ Error en ${item.id_pieza}: ${error.message}\n`);
        
        resultados.push({
          ...item,
          success: false,
          error: error.message
        });
      }
      
      // Pequeña pausa entre peticiones (opcional, para no saturar el servidor)
      /*if (i < piezas.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }*/
    }
    
    
    
    return resultados;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

// Exportar la función
module.exports = { searchJohnDeereParts, getModelsByPartNumber };

// Descomentar para probar
console.log(getModelsByPartNumber());
