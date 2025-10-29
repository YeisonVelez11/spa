# Documentación de Cambios Asíncronos

## Resumen del Proyecto

Este proyecto es un scraper de John Deere Parts Catalog que extrae información de piezas, modelos y partes, guardando CSV e imágenes.

## Cambios Realizados - Operaciones Asíncronas (No Bloqueantes)

### Fecha: 2025-10-28

Se modificó el código para que **TODAS** las operaciones de guardado (CSV e imágenes) se ejecuten en segundo plano sin bloquear el flujo principal del scraper.

---

## 🎯 Objetivo

Maximizar la velocidad del scraping eliminando todas las esperas de operaciones de I/O (escritura de archivos locales y subidas a Google Drive).

---

## 📋 Cambios Implementados

### 1. **Google Drive - Autenticación Global**

**Archivo:** `jhondeere.js`

**Ubicación:** Líneas 18-53

**Cambio:**
- Se creó una variable global `globalAuthClient` que almacena el cliente de autenticación
- La función `getAuthClient()` solo autentica una vez y reutiliza el cliente
- Se conecta automáticamente al inicio si `SERVER` está definido

**Código:**
```javascript
// Cliente de autenticación global para Google Drive (se inicializa una sola vez)
let globalAuthClient = null;

async function getAuthClient() {
  // Si ya existe el cliente global, retornarlo
  if (globalAuthClient) {
    return globalAuthClient;
  }
  // ... autenticación solo la primera vez
}
```

---

### 2. **CSV - Guardado Asíncrono**

#### 2.1 CSV de Modelos
**Ubicación:** Líneas ~728-753

**Versión Asíncrona (ACTIVA):**
```javascript
if (process.env.SERVER) {
  getAuthClient().then(authClient => {
    if (authClient && modelData.length > 0) {
      uploadCsvToDrive(authClient, modelData, `model_${item.id_pieza}`, modelos).catch(err => {
        console.error(`Error subiendo CSV de modelos ${item.id_pieza}:`, err.message);
      });
    }
  });
} else {
  jsonToCsv(
    modelData,
    `model_${item.id_pieza}`,
    `models/`
  ).catch(err => {
    console.error(`Error guardando CSV local de modelos ${item.id_pieza}:`, err.message);
  });
}
```

**Versión Bloqueante (COMENTADA):**
```javascript
// await jsonToCsv(
//   modelData,
//   `model_${item.id_pieza}`,
//   `models/`
// );
```

#### 2.2 CSV de Piezas
**Ubicación:** Líneas ~754-780

**Versión Asíncrona (ACTIVA):**
```javascript
if (process.env.SERVER) {
  getAuthClient().then(authClient => {
    if (authClient && pieceDetail.length > 0) {
      uploadCsvToDrive(authClient, pieceDetail, `${item.id_pieza}`, piezas).catch(err => {
        console.error(`Error subiendo CSV de piezas ${item.id_pieza}:`, err.message);
      });
    }
  });
} else {
  jsonToCsv(
    pieceDetail,
    `${item.id_pieza}`,
    `pieces/`
  ).catch(err => {
    console.error(`Error guardando CSV local de piezas ${item.id_pieza}:`, err.message);
  });
}
```

**Versión Bloqueante (COMENTADA):**
```javascript
// await jsonToCsv(
//   pieceDetail,
//   `${item.id_pieza}`,
//   `pieces/`
// );
```

#### 2.3 CSV de Partes
**Ubicación:** Líneas ~1087-1112

**Versión Asíncrona (ACTIVA):**
```javascript
if (process.env.SERVER) {
  getAuthClient().then(authClient => {
    if (authClient && ModelParts.length > 0) {
      uploadCsvToDrive(authClient, ModelParts, `${pageId}`, partes).catch(err => {
        console.error(`Error subiendo CSV de partes ${pageId}:`, err.message);
      });
    }
  });
} else {
  jsonToCsv(
    ModelParts,
    `${pageId}`,
    `parts/`
  ).catch(err => {
    console.error(`Error guardando CSV local de partes ${pageId}:`, err.message);
  });
}
```

**Versión Bloqueante (COMENTADA):**
```javascript
// await jsonToCsv(
//   ModelParts,
//   `${pageId}`,
//   `parts/`
// );
```

---

### 3. **Imágenes - Guardado Asíncrono**

#### 3.1 Función `downloadAndSaveImage()` - Imágenes desde URL

**Ubicación:** Líneas ~242-269

**Versión Asíncrona (ACTIVA):**
```javascript
if (process.env.SERVER) {
  // Subir a Google Drive (sin esperar)
  getAuthClient().then(authClient => {
    if (authClient) {
      uploadImageToDrive(authClient, response.data, fileName, images).catch(err => {
        console.error(`Error subiendo imagen ${fileName} a Drive:`, err.message);
      });
    }
  });
  return fileName;
} else {
  // Guardar localmente (sin esperar - en segundo plano)
  const imagesDir = path.join(__dirname, "images");
  const filePath = path.join(imagesDir, fileName);
  
  Promise.resolve().then(() => {
    fs.writeFileSync(filePath, response.data);
  }).catch(err => {
    console.error(`Error guardando imagen local ${fileName}:`, err.message);
  });
  
  return filePath;
}
```

**Versión Bloqueante (COMENTADA):**
```javascript
// fs.writeFileSync(filePath, response.data);
```

#### 3.2 Función `saveBase64Image()` - Imágenes desde Base64

**Ubicación:** Líneas ~819-877

**Versión Asíncrona (ACTIVA):**
```javascript
if (process.env.SERVER) {
  // Subir a Google Drive (sin esperar)
  getAuthClient().then(authClient => {
    if (authClient) {
      uploadImageToDrive(authClient, imageBuffer, fullFileName, images).catch(err => {
        console.error(`Error subiendo imagen ${fullFileName} a Drive:`, err.message);
      });
    }
  });
  return fullFileName;
} else {
  // Guardar localmente (sin esperar - en segundo plano)
  const imagesDir = path.join(__dirname, "images");
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  const filePath = path.join(imagesDir, fullFileName);
  
  fs.promises.writeFile(filePath, imageBuffer).catch(err => {
    console.error(`Error guardando imagen local ${fullFileName}:`, err.message);
  });
  
  return filePath;
}
```

**Versión Bloqueante (COMENTADA):**
```javascript
// await fs.promises.writeFile(filePath, imageBuffer);
```

#### 3.3 Llamadas a funciones de guardado de imágenes

**3.3.1 Imagen del equipo**
**Ubicación:** Línea ~999

**Versión Asíncrona (ACTIVA):**
```javascript
downloadAndSaveImage(imageUrl, equipmentRefId).catch(err => {
  console.error(`Error guardando imagen del equipo ${equipmentRefId}:`, err.message);
});
```

**Versión Bloqueante (COMENTADA):**
```javascript
// await downloadAndSaveImage(imageUrl, equipmentRefId);
```

**3.3.2 Imagen de partes**
**Ubicación:** Línea ~1059

**Versión Asíncrona (ACTIVA):**
```javascript
saveBase64Image(imageParts.data.image, pageId+"_parts").catch(err => {
  console.error(`Error guardando imagen de partes ${pageId}:`, err.message);
});
```

**Versión Bloqueante (COMENTADA):**
```javascript
// await saveBase64Image(imageParts.data.image, pageId+"_parts");
```

**3.3.3 Imágenes múltiples**
**Ubicación:** Línea ~1678

**Versión Asíncrona (ACTIVA):**
```javascript
saveBase64Image(base64Image, fileName).catch(err => {
  console.error(`Error guardando imagen ${fileName}:`, err.message);
});
```

**Versión Bloqueante (COMENTADA):**
```javascript
// await saveBase64Image(base64Image, fileName);
```

---

## 🔄 Cómo Restaurar a Versión Bloqueante

Si necesitas volver a la versión bloqueante (que espera a que se guarden los archivos):

### Pasos:

1. **Buscar todas las líneas con comentario:** `// Versión original (bloqueante) - comentada`

2. **Para cada sección:**
   - Comentar la versión asíncrona (activa)
   - Descomentar la versión bloqueante

### Ejemplo de restauración:

**Antes (Asíncrono - Actual):**
```javascript
jsonToCsv(
  modelData,
  `model_${item.id_pieza}`,
  `models/`
).catch(err => {
  console.error(`Error guardando CSV local de modelos ${item.id_pieza}:`, err.message);
});

// Versión original (bloqueante) - comentada
// await jsonToCsv(
//   modelData,
//   `model_${item.id_pieza}`,
//   `models/`
// );
```

**Después (Bloqueante - Restaurado):**
```javascript
// Versión asíncrona - comentada
// jsonToCsv(
//   modelData,
//   `model_${item.id_pieza}`,
//   `models/`
// ).catch(err => {
//   console.error(`Error guardando CSV local de modelos ${item.id_pieza}:`, err.message);
// });

// Versión original (bloqueante) - activa
await jsonToCsv(
  modelData,
  `model_${item.id_pieza}`,
  `models/`
);
```

---

## 📊 Comparación de Rendimiento

### Versión Bloqueante (Original):
- ⏱️ Espera cada operación de guardado
- 🐌 Más lento pero garantiza que archivos estén escritos
- 📁 Útil para debugging o cuando se necesita confirmar escritura

### Versión Asíncrona (Actual):
- ⚡ No espera operaciones de I/O
- 🚀 Máxima velocidad de scraping
- 🔄 Archivos se guardan en paralelo
- ⚠️ Archivos pueden no estar listos inmediatamente después del proceso

---

## 🎯 Ubicaciones Clave en el Código

### Archivos Modificados:
1. `jhondeere.js` - Lógica principal del scraper
2. `server.js` - Servidor Express con endpoints
3. `package.json` - Dependencias actualizadas
4. `.env.example` - Variables de entorno
5. `Dockerfile` - Configuración Docker
6. `docker-compose.yml` - Orquestación Docker
7. `Procfile` - Deployment config

### Funciones Clave:
- `getAuthClient()` - Autenticación global de Google Drive
- `uploadCsvToDrive()` - Subir CSV a Google Drive
- `uploadImageToDrive()` - Subir imágenes a Google Drive
- `downloadAndSaveImage()` - Descargar y guardar imágenes desde URL
- `saveBase64Image()` - Guardar imágenes desde Base64
- `jsonToCsv()` - Guardar CSV localmente
- `getModelsByPartNumber()` - Función principal del scraper

---

## 🔍 Búsqueda Rápida

Para encontrar todas las secciones modificadas, busca en `jhondeere.js`:

```
// Versión original (bloqueante) - comentada
```

O busca:

```
.catch(err => {
  console.error(
```

---

## 📝 Notas Importantes

1. **Autenticación Google Drive**: Se realiza una sola vez al inicio si `SERVER` está definido
2. **Manejo de Errores**: Todos los errores se capturan y se muestran en consola sin detener el proceso
3. **Compatibilidad**: Funciona en ambos modos (SERVER y LOCAL)
4. **Reversibilidad**: Todo el código original está comentado para fácil restauración

---

## 🚀 Comandos Útiles

### Ejecutar en modo CLI:
```bash
node jhondeere.js
```

### Ejecutar servidor:
```bash
node server.js
```

### Docker:
```bash
docker build -t john-deere-scraper .
docker run -p 3000:3000 --env-file .env john-deere-scraper
```

### Docker Compose:
```bash
docker-compose up -d
docker-compose logs -f
docker-compose down
```

---

## 📞 Endpoints del Servidor

- `GET /health` - Health check con timestamp
- `GET /process/start` - Iniciar proceso de scraping
- `GET /ver/:nombreArchivo` - Ver datos en formato tabla
- `GET /descargar/:nombreArchivo/csv` - Descargar CSV
- `GET /descargar/:nombreArchivo/json` - Descargar JSON

---

## 🔐 Variables de Entorno

```env
PORT=3000
SERVER=true
GOOGLE_CLIENT_EMAIL=your_email@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
CAPTCHA_TOKEN=your_captcha_token
COOKIES=your_cookies
```

---

**Última actualización:** 2025-10-28 23:34:00
**Versión:** Asíncrona (No Bloqueante)
**Estado:** Producción
