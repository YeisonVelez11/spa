# John Deere Parts Scraper

Aplicación para extraer información de partes y modelos del catálogo de John Deere.

## Instalación

```bash
npm install
```

## Configuración

1. Copia el archivo `.env.example` a `.env`:
```bash
cp .env.example .env
```

2. Completa las variables de entorno en `.env`:

```env
# Captcha Token de John Deere (obtenerlo del navegador)
CAPTCHA_TOKEN=tu_captcha_token_aqui

# Cookies de sesión (obtenerlas del navegador)
COOKIES=tu_cookie_string_completo_aqui

# Google Drive API Credentials (opcional)
# Si SERVER está definido, los CSV e imágenes se guardarán en Google Drive
SERVER=true
GOOGLE_CLIENT_EMAIL=tu_service_account_email@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\ntu_private_key_aqui\n-----END PRIVATE KEY-----\n"
```

## Modos de Ejecución

### 1. Modo CLI (Línea de Comandos)

Ejecuta el proceso directamente desde la terminal:

```bash
node jhondeere.js
```

O con un archivo específico:

```bash
node jhondeere.js 1
```

Este modo:
- ✅ Procesa las piezas del archivo especificado
- ✅ Muestra el progreso en consola
- ✅ Guarda archivos según la configuración de `SERVER`

### 2. Modo Servidor (API REST)

Inicia el servidor Express:

```bash
node server.js
```

El servidor estará disponible en `http://localhost:3000`

#### Endpoints Disponibles:

**Health Check:**
```bash
GET /health
```
Retorna el estado del servidor y la hora actual.

Respuesta:
```json
{
  "status": "OK",
  "timestamp": "28/10/2025, 22:30:00",
  "uptime": 123.456,
  "message": "Server is running"
}
```

**Iniciar Proceso:**
```bash
GET /process/start
```
Inicia el proceso de scraping en segundo plano.

Respuesta:
```json
{
  "status": "started",
  "message": "El proceso ha iniciado. Revisa la consola para ver el progreso.",
  "timestamp": "28/10/2025, 22:30:00"
}
```

**Ver Datos:**
```bash
GET /ver/:nombreArchivo
```
Visualiza los datos de un archivo JSON en formato tabla.

**Descargar Archivos:**
```bash
GET /descargar/:nombreArchivo/csv
GET /descargar/:nombreArchivo/json
```

## Comportamiento según Configuración

### Sin `SERVER` (Modo Local)
- 📁 CSV se guardan en `./csv_output/`
- 📁 Imágenes se guardan en `./images/`
- ⏱️ Operaciones bloqueantes (espera a que termine cada guardado)

### Con `SERVER=true` (Modo Google Drive)
- ☁️ CSV se suben a Google Drive en carpetas específicas:
  - `modelos`: Carpeta con ID especificado en constante `modelos`
  - `piezas`: Carpeta con ID especificado en constante `piezas`
  - `partes`: Carpeta con ID especificado en constante `partes`
- ☁️ Imágenes se suben a carpeta con ID especificado en constante `images`
- ⚡ Operaciones no bloqueantes (continúa sin esperar las subidas)
- 🔄 Autenticación única y global (solo se autentica una vez)

## Estructura de Archivos

```
spa/
├── jhondeere.js          # Script principal de scraping
├── server.js             # Servidor Express con API
├── funciones.js          # Funciones auxiliares
├── package.json          # Dependencias
├── .env                  # Variables de entorno (no incluido en repo)
├── .env.example          # Plantilla de variables de entorno
├── data/                 # Archivos de entrada con IDs de piezas
├── csv_output/           # CSV generados (modo local)
├── images/               # Imágenes descargadas (modo local)
└── front-lib/            # Librerías frontend para visualización
```

## Notas Importantes

- El proceso incluye reintentos infinitos para manejar errores de red y API
- Los headers HTTP se rotan automáticamente para evitar bloqueos
- El delay entre peticiones es adaptativo según los errores recibidos
- La autenticación de Google Drive se realiza una sola vez y se reutiliza
- En modo servidor, el proceso se ejecuta en segundo plano sin bloquear el endpoint

## Desarrollo

Para desarrollo con auto-reload:

```bash
nodemon server.js
```

o

```bash
nodemon jhondeere.js
```
