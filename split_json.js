const fs = require('fs');
const path = require('path');

/**
 * Divide un archivo JSON en N archivos más pequeños
 * @param {string} inputFile - Ruta del archivo JSON de entrada
 * @param {number} numberOfFiles - Cantidad de archivos a generar
 * @param {string} outputDir - Directorio donde guardar los archivos divididos
 */
function splitJsonFile(inputFile, numberOfFiles, outputDir = './data/split') {
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
    console.log(`✅ Total de elementos: ${totalItems}`);
    
    // Calcular cuántos elementos por archivo
    const itemsPerFile = Math.ceil(totalItems / numberOfFiles);
    console.log(`📊 Elementos por archivo: ~${itemsPerFile}`);
    console.log(`📁 Generando ${numberOfFiles} archivos...\n`);
    
    // Crear directorio de salida si no existe
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Dividir y guardar archivos
    for (let i = 0; i < numberOfFiles; i++) {
      const start = i * itemsPerFile;
      const end = Math.min(start + itemsPerFile, totalItems);
      const chunk = data.slice(start, end);
      
      // Nombre del archivo: id_piezas_1.json, id_piezas_2.json, etc.
      const outputFileName = `id_piezas_${i + 1}.json`;
      const outputFilePath = path.join(outputDir, outputFileName);
      
      // Guardar archivo
      fs.writeFileSync(outputFilePath, JSON.stringify(chunk, null, 2), 'utf-8');
      
      console.log(`  ✓ Archivo ${i + 1}/${numberOfFiles}: ${outputFileName} (${chunk.length} elementos)`);
    }
    
    console.log(`\n✅ ¡Proceso completado!`);
    console.log(`📂 Archivos guardados en: ${path.resolve(outputDir)}`);
    console.log(`\n📋 Resumen:`);
    console.log(`   - Total de elementos: ${totalItems}`);
    console.log(`   - Archivos generados: ${numberOfFiles}`);
    console.log(`   - Elementos por archivo: ~${itemsPerFile}`);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    throw error;
  }
}

// ============================================
// CONFIGURACIÓN
// ============================================

// Archivo de entrada
const INPUT_FILE = './data/id_piezas_restantes.json';

// Número de archivos a generar (CAMBIAR ESTE VALOR)
const NUMBER_OF_FILES = 8;

// Directorio de salida
const OUTPUT_DIR = './data/split';

// ============================================
// EJECUTAR
// ============================================

console.log('🚀 Iniciando división de archivo JSON...');
console.log(`📄 Archivo de entrada: ${INPUT_FILE}`);
console.log(`🔢 Número de archivos: ${NUMBER_OF_FILES}`);
console.log(`📁 Directorio de salida: ${OUTPUT_DIR}`);

splitJsonFile(INPUT_FILE, NUMBER_OF_FILES, OUTPUT_DIR);
