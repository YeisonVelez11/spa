const fs = require('fs');
const path = require('path');

/**
 * Filtra elementos del JSON que tienen id_pieza completamente numérico O tienen 4 o 5 caracteres
 * @param {string} inputFile - Archivo JSON de entrada
 * @param {string} outputFile - Archivo JSON de salida
 */
function filterNumericIds(inputFile, outputFile) {
  try {
    console.log(`\n📂 Leyendo archivo: ${inputFile}...`);
    
    // Leer el archivo JSON
    const fileContent = fs.readFileSync(inputFile, 'utf-8');
    const data = JSON.parse(fileContent);
    
    // Validar que sea un array
    if (!Array.isArray(data)) {
      throw new Error('El archivo JSON debe contener un array');
    }
    
    const totalItems = data.length;
    console.log(`✅ Total de elementos en el archivo original: ${totalItems.toLocaleString()}`);
    
    // Filtrar elementos cuyo id_pieza es completamente numérico O tiene 4 o 5 caracteres
    const numericItems = data.filter(item => {
      if (!item.id_pieza) return false;
      const idPieza = item.id_pieza.toString();
      const isFullyNumeric = /^[0-9]+$/.test(idPieza); // Solo dígitos
      const hasFourOrFiveChars = idPieza.length === 4 || idPieza.length === 5;
      return isFullyNumeric || hasFourOrFiveChars;
    });
    
    // Filtrar elementos EXCLUIDOS (los que NO cumplen los criterios)
    const excludedItems = data.filter(item => {
      if (!item.id_pieza) return true; // Incluir items sin id_pieza en excluidos
      const idPieza = item.id_pieza.toString();
      const isFullyNumeric = /^[0-9]+$/.test(idPieza);
      const hasFourOrFiveChars = idPieza.length === 4 || idPieza.length === 5;
      return !(isFullyNumeric || hasFourOrFiveChars); // Negar la condición
    });
    
    // Contar por categoría
    const fullyNumericCount = data.filter(item => {
      if (!item.id_pieza) return false;
      return /^[0-9]+$/.test(item.id_pieza.toString());
    }).length;
    
    const fourOrFiveCharsCount = data.filter(item => {
      if (!item.id_pieza) return false;
      const len = item.id_pieza.toString().length;
      return len === 4 || len === 5;
    }).length;
    
    console.log(`\n🔍 Filtrando elementos...`);
    console.log(`   📌 Completamente numéricos: ${fullyNumericCount.toLocaleString()}`);
    console.log(`   📌 Tienen 4 o 5 caracteres: ${fourOrFiveCharsCount.toLocaleString()}`);
    console.log(`✅ Total de elementos filtrados: ${numericItems.length.toLocaleString()}`);
    console.log(`📊 Porcentaje: ${((numericItems.length / totalItems) * 100).toFixed(2)}%`);
    
    // Guardar archivo filtrado (incluidos)
    fs.writeFileSync(outputFile, JSON.stringify(numericItems, null, 2), 'utf-8');
    
    // Guardar archivo de excluidos
    const excludedFile = outputFile.replace('.json', '_excluidos.json');
    fs.writeFileSync(excludedFile, JSON.stringify(excludedItems, null, 2), 'utf-8');
    
    console.log(`\n✅ ¡Archivos creados exitosamente!`);
    console.log(`📄 Archivo incluidos: ${path.resolve(outputFile)}`);
    console.log(`📄 Archivo excluidos: ${path.resolve(excludedFile)}`);
    
    // Mostrar algunos ejemplos
    console.log(`\n📋 Primeros 10 ejemplos de IDs filtrados:`);
    numericItems.slice(0, 10).forEach((item, index) => {
      const idPieza = item.id_pieza.toString();
      const idLength = idPieza.length;
      const isFullyNumeric = /^[0-9]+$/.test(idPieza);
      const hasFourOrFive = idLength === 4 || idLength === 5;
      const reason = isFullyNumeric && hasFourOrFive ? `(100% numérico + ${idLength} chars)` : 
                     isFullyNumeric ? '(100% numérico)' : `(${idLength} chars)`;
      console.log(`   ${index + 1}. ${item.id_pieza} - ${item.parte} ${reason}`);
    });
    
    // Estadísticas adicionales
    console.log(`\n📊 Estadísticas:`);
    console.log(`   - Total original: ${totalItems.toLocaleString()}`);
    console.log(`   - IDs incluidos: ${numericItems.length.toLocaleString()}`);
    console.log(`   - IDs excluidos: ${excludedItems.length.toLocaleString()}`);
    
    // Mostrar ejemplos de excluidos
    console.log(`\n📋 Primeros 10 ejemplos de IDs EXCLUIDOS:`);
    excludedItems.slice(0, 10).forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.id_pieza} - ${item.parte}`);
    });
    
    return {
      totalItems,
      includedItems: numericItems.length,
      excludedItems: excludedItems.length,
      outputFile,
      excludedFile
    };
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    throw error;
  }
}

// ============================================
// CONFIGURACIÓN
// ============================================

const INPUT_FILE = './data/id_piezas.json';
const OUTPUT_FILE = './data/id_piezas2.json';

// ============================================
// EJECUTAR
// ============================================

console.log('🚀 Iniciando filtrado de IDs numéricos...');
console.log(`📄 Archivo de entrada: ${INPUT_FILE}`);
console.log(`📄 Archivo de salida: ${OUTPUT_FILE}`);

filterNumericIds(INPUT_FILE, OUTPUT_FILE);
