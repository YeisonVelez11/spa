# 📂 Dividir archivo JSON en múltiples archivos

Este script divide el archivo `data/id_piezas.json` en N archivos más pequeños.

## 🚀 Uso

### 1. Configurar el número de archivos

Edita el archivo `split_json.js` y cambia la línea:

```javascript
const NUMBER_OF_FILES = 32; // Cambiar este número
```

### 2. Ejecutar el script

```bash
node split_json.js
```

## 📋 Resultado

El script generará archivos en el directorio `data/split/`:

```
data/split/
├── id_piezas_1.json
├── id_piezas_2.json
├── id_piezas_3.json
├── ...
└── id_piezas_32.json
```

Cada archivo contendrá una porción del array original dividido equitativamente.

## 📊 Ejemplo de salida

```
🚀 Iniciando división de archivo JSON...
📄 Archivo de entrada: ./data/id_piezas.json
🔢 Número de archivos: 32
📁 Directorio de salida: ./data/split

📂 Leyendo archivo: ./data/id_piezas.json...
✅ Total de elementos: 3200
📊 Elementos por archivo: ~100
📁 Generando 32 archivos...

  ✓ Archivo 1/32: id_piezas_1.json (100 elementos)
  ✓ Archivo 2/32: id_piezas_2.json (100 elementos)
  ✓ Archivo 3/32: id_piezas_3.json (100 elementos)
  ...
  ✓ Archivo 32/32: id_piezas_32.json (100 elementos)

✅ ¡Proceso completado!
📂 Archivos guardados en: /Users/yevelez/fury_3/spa/data/split

📋 Resumen:
   - Total de elementos: 3200
   - Archivos generados: 32
   - Elementos por archivo: ~100
```

## ⚙️ Configuración avanzada

Puedes cambiar también:

### Archivo de entrada
```javascript
const INPUT_FILE = './data/otro_archivo.json';
```

### Directorio de salida
```javascript
const OUTPUT_DIR = './data/mi_carpeta';
```

## 🔧 Usar archivos divididos en jhondeere.js

Para usar uno de los archivos divididos, cambia en `jhondeere.js`:

```javascript
// Línea 377 aproximadamente
const fileContent = fs.readFileSync("./data/split/id_piezas_1.json", "utf-8");
```

Así puedes procesar los archivos uno por uno o en paralelo.
