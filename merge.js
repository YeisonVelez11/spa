const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ============================================================
// 🔧 CONFIGURACIÓN - MODIFICA AQUÍ LAS CARPETAS A PROCESAR
// ============================================================

/**
 * Carpetas a procesar cuando se ejecuta el script sin argumentos
 * Puedes agregar o quitar carpetas según necesites
 */
const FOLDERS_TO_PROCESS = [
  'parts',      // Procesar csv_output/parts/
  'pieces',  // Descomentar para procesar csv_output/pieces/
  'models',  // Descomentar para procesar csv_output/models/
];

// ============================================================

/**
 * Combina múltiples archivos CSV en uno solo usando streams para optimizar memoria
 * NOTA: Automáticamente remueve líneas duplicadas durante el proceso de merge
 * @param {string} folderName - Nombre de la carpeta dentro de csv_output (ej: 'parts', 'pieces', 'models')
 * @param {string} outputFileName - Nombre del archivo de salida (sin extensión)
 * @returns {Promise<object>} - Estadísticas del proceso (incluye duplicatesRemoved)
 */
async function mergeCsvFiles(folderName, outputFileName = null) {
  const inputDir = path.join(__dirname, 'csv_output', folderName);
  const outputFile = outputFileName || folderName;
  const outputPath = path.join(__dirname, 'csv_output', `${outputFile}.csv`);
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📁 Procesando archivos de: ${folderName}`);
  console.log(`📄 Archivo de salida: ${outputFile}.csv`);
  console.log(`🗑️  Modo: Remover duplicados automáticamente`);
  console.log(`${'='.repeat(60)}\n`);

  // Verificar que el directorio existe
  if (!fs.existsSync(inputDir)) {
    throw new Error(`❌ El directorio ${inputDir} no existe`);
  }

  // Obtener todos los archivos CSV del directorio
  const files = fs.readdirSync(inputDir)
    .filter(file => file.endsWith('.csv'))
    .map(file => path.join(inputDir, file));

  if (files.length === 0) {
    throw new Error(`❌ No se encontraron archivos CSV en ${inputDir}`);
  }

  console.log(`📊 Archivos encontrados: ${files.length}`);

  // Crear stream de escritura para el archivo de salida
  const writeStream = fs.createWriteStream(outputPath, { encoding: 'utf8' });
  
  let isFirstFile = true;
  let totalLines = 0;
  let filesProcessed = 0;
  let headerWritten = false;
  let duplicatesRemoved = 0;
  let masterHeader = null;
  let masterHeaderColumns = [];
  
  // Set para almacenar líneas únicas y detectar duplicados
  const uniqueLines = new Set();

  try {
    // Primera pasada: encontrar el header con más columnas
    console.log('🔍 Analizando headers de todos los archivos...');
    for (const file of files) {
      const fileStream = fs.createReadStream(file, { encoding: 'utf8' });
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });
      
      for await (const line of rl) {
        const columns = line.split(',');
        if (!masterHeader || columns.length > masterHeaderColumns.length) {
          masterHeader = line;
          masterHeaderColumns = columns;
        }
        break; // Solo leer la primera línea
      }
      
      fileStream.destroy();
    }
    
    console.log(`✓ Header maestro encontrado con ${masterHeaderColumns.length} columnas`);
    console.log(`  ${masterHeader}\n`);
    
    // Escribir el header maestro
    writeStream.write(masterHeader + '\n');
    headerWritten = true;
    
    // Segunda pasada: procesar los datos
    for (const file of files) {
      filesProcessed++;
      console.log(`⏳ Procesando [${filesProcessed}/${files.length}]: ${path.basename(file)}`);
      
      const fileStream = fs.createReadStream(file, { encoding: 'utf8' });
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      let isFirstLine = true;
      let linesInFile = 0;
      let currentFileHeader = null;
      let currentFileColumns = [];

      for await (const line of rl) {
        // Si es la primera línea del archivo (header)
        if (isFirstLine) {
          currentFileHeader = line;
          currentFileColumns = line.split(',');
          isFirstLine = false;
          continue;
        }

        // Escribir la línea de datos solo si no es duplicada
        if (line.trim()) { // Ignorar líneas vacías
          let processedLine = line;
          
          // Si el archivo actual tiene menos columnas que el header maestro,
          // agregar columnas vacías al final
          if (currentFileColumns.length < masterHeaderColumns.length) {
            const lineColumns = line.split(',');
            const missingColumns = masterHeaderColumns.length - currentFileColumns.length;
            // Agregar comas para las columnas faltantes
            processedLine = line + ','.repeat(missingColumns);
          }
          
          // Verificar si la línea ya existe
          if (!uniqueLines.has(processedLine)) {
            uniqueLines.add(processedLine);
            writeStream.write(processedLine + '\n');
            linesInFile++;
            totalLines++;
          } else {
            duplicatesRemoved++;
          }
        }
      }

      console.log(`  ✓ ${linesInFile} líneas procesadas`);
      
      // Liberar memoria
      fileStream.destroy();
    }

    // Cerrar el stream de escritura
    writeStream.end();

    // Esperar a que termine de escribir
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    const stats = {
      filesProcessed,
      totalLines,
      duplicatesRemoved,
      outputFile: outputPath,
      outputSize: fs.statSync(outputPath).size
    };

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ PROCESO COMPLETADO`);
    console.log(`${'='.repeat(60)}`);
    console.log(`📁 Archivos procesados: ${stats.filesProcessed}`);
    console.log(`📊 Total de líneas únicas: ${stats.totalLines.toLocaleString()}`);
    console.log(`🗑️  Duplicados removidos: ${stats.duplicatesRemoved.toLocaleString()}`);
    console.log(`💾 Tamaño del archivo: ${(stats.outputSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📄 Archivo guardado en: ${stats.outputFile}`);
    console.log(`${'='.repeat(60)}\n`);

    return stats;

  } catch (error) {
    // Cerrar el stream en caso de error
    writeStream.end();
    
    // Eliminar archivo parcial si hay error
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
    
    throw error;
  }
}

/**
 * Procesa múltiples carpetas de CSV
 * @param {Array<string>} folders - Array de nombres de carpetas a procesar
 */
async function mergeMultipleFolders(folders) {
  console.log(`\n🚀 Iniciando merge de ${folders.length} carpetas...\n`);
  
  const results = [];
  
  for (const folder of folders) {
    try {
      const stats = await mergeCsvFiles(folder);
      results.push({ folder, success: true, stats });
    } catch (error) {
      console.error(`❌ Error procesando ${folder}:`, error.message);
      results.push({ folder, success: false, error: error.message });
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 RESUMEN FINAL`);
  console.log(`${'='.repeat(60)}`);
  
  results.forEach(result => {
    if (result.success) {
      console.log(`✅ ${result.folder}: ${result.stats.totalLines.toLocaleString()} líneas`);
    } else {
      console.log(`❌ ${result.folder}: ${result.error}`);
    }
  });
  
  console.log(`${'='.repeat(60)}\n`);
  
  return results;
}

// Función principal para ejecutar desde línea de comandos
async function main() {
  const args = process.argv.slice(2);
  
  // Si no hay argumentos, usar la configuración del archivo
  if (args.length === 0) {
    if (FOLDERS_TO_PROCESS.length === 0) {
      console.log(`
⚠️  No hay carpetas configuradas para procesar.

🔧 CONFIGURACIÓN:
  Edita el archivo merge.js y modifica la variable FOLDERS_TO_PROCESS
  en las líneas 13-17 para agregar las carpetas que deseas procesar.

📝 EJEMPLO:
  const FOLDERS_TO_PROCESS = [
    'parts',
    'pieces',
    'models',
  ];

📖 O EJECUTA CON ARGUMENTOS:
  node merge.js <folder1> [folder2] [folder3] ...

📝 EJEMPLOS:
  node merge.js parts
  node merge.js pieces
  node merge.js models
  node merge.js parts pieces models
      `);
      process.exit(1);
    }
    
    console.log(`\n🔧 Usando configuración del archivo:`);
    console.log(`   Carpetas: ${FOLDERS_TO_PROCESS.join(', ')}\n`);
    
    try {
      if (FOLDERS_TO_PROCESS.length === 1) {
        await mergeCsvFiles(FOLDERS_TO_PROCESS[0]);
      } else {
        await mergeMultipleFolders(FOLDERS_TO_PROCESS);
      }
      
      console.log('✅ Proceso completado exitosamente');
      process.exit(0);
    } catch (error) {
      console.error('\n❌ ERROR:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
    return;
  }
  
  // Si hay argumentos, usarlos en lugar de la configuración
  try {
    if (args.length === 1) {
      await mergeCsvFiles(args[0]);
    } else {
      await mergeMultipleFolders(args);
    }
    
    console.log('✅ Proceso completado exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = {
  mergeCsvFiles,
  mergeMultipleFolders
};