# 🤖 Scraper Automático con Gestión de Captcha

Sistema automatizado para scraping de John Deere con renovación automática de tokens y cookies.

## 🚀 Características

- ✅ **Gestión automática de Captcha-Token**
- ✅ **Renovación automática de cookies**
- ✅ **Detección y recuperación de errores 403**
- ✅ **Navegador Puppeteer integrado**
- ✅ **Renovación cada 15 minutos**
- ✅ **Sin intervención manual**

## 📦 Instalación

Ya tienes todo instalado, incluyendo Puppeteer.

## 🎯 Modos de Uso

### Opción 1: Modo Completamente Automático (RECOMENDADO)

Este modo maneja TODO automáticamente:

```bash
npm run start:auto
```

**Qué hace:**
1. Abre un navegador Chrome automáticamente
2. Navega a John Deere
3. Captura el Captcha-Token y Cookies
4. Guarda en `.env`
5. Inicia el scraping
6. Renueva tokens cada 15 minutos
7. Se recupera automáticamente de errores 403

**Ventajas:**
- ✅ Cero intervención manual
- ✅ Renovación automática
- ✅ Recuperación de errores
- ✅ Puede correr por horas/días

### Opción 2: Solo Obtener Tokens (Manual después)

Si solo quieres obtener los tokens y luego ejecutar manualmente:

```bash
npm run captcha
```

**Qué hace:**
1. Abre navegador
2. Obtiene tokens
3. Guarda en `.env`
4. Mantiene el navegador abierto para renovación

Luego en otra terminal:
```bash
npm start
```

### Opción 3: Modo Manual (Original)

Si prefieres obtener tokens manualmente desde DevTools:

```bash
# 1. Obtén tokens desde Chrome DevTools (ver INSTRUCCIONES_CAPTCHA.md)
# 2. Crea .env con tus tokens
# 3. Ejecuta:
npm start
```

## 📁 Estructura de Archivos

```
spa/
├── jhondeere.js           # Script principal de scraping
├── captcha-manager.js     # Gestor automático de captcha
├── scraper-auto.js        # Scraper con auto-renovación
├── funciones.js           # Funciones auxiliares
├── .env                   # Tokens (auto-generado)
├── .env.example           # Plantilla
└── README_AUTOMATICO.md   # Esta guía
```

## ⚙️ Configuración

### Ajustar Velocidad de Scraping

En `jhondeere.js`, línea 14:

```javascript
const tiempoMs = 500; // Aumentar si recibes 403 frecuentemente
```

Valores recomendados:
- **500ms**: Rápido (puede dar 403)
- **1000ms**: Balanceado (recomendado)
- **2000ms**: Seguro (más lento pero sin baneos)

### Modo Headless (sin ventana)

En `captcha-manager.js`, línea 24:

```javascript
headless: false, // Cambiar a true para modo invisible
```

## 🔧 Troubleshooting

### Error: "No se pudo hacer búsqueda automática"

**Solución:** El selector cambió. Busca manualmente en el navegador que se abre.

### Error 403 persistente

**Soluciones:**
1. Aumenta `tiempoMs` a 1000-2000ms
2. Verifica que el navegador Puppeteer esté abierto
3. Reinicia el proceso completo

### El navegador no se abre

**Solución:** Verifica que Puppeteer esté instalado:
```bash
npm install puppeteer
```

### Tokens no se renuevan

**Solución:** Mantén el navegador de Puppeteer abierto. No lo cierres manualmente.

## 📊 Monitoreo

El script muestra logs en tiempo real:

```
🚀 Iniciando navegador...
🌐 Navegando a John Deere...
🔍 Buscando parte: RE527858
✅ Captcha-Token capturado
🍪 Cookies actualizadas
💾 Token y cookies guardados en .env
✅ CaptchaManager inicializado correctamente

🔄 Modo keep-alive activado (renovación automática cada 15 minutos)
```

## 🎓 Cómo Funciona

### 1. Puppeteer abre un navegador real
- Chrome/Chromium controlado por código
- Simula un usuario real
- Pasa todos los checks de bot

### 2. Intercepta peticiones HTTP
- Captura el `Captcha-Token` de las requests
- Extrae cookies de la sesión
- Guarda automáticamente

### 3. Renovación automática
- Cada 15 minutos hace una búsqueda
- Actualiza tokens y cookies
- Guarda en `.env`

### 4. Integración con scraper
- `jhondeere.js` lee de `.env`
- Usa tokens frescos siempre
- Se recupera de errores 403

## 🚦 Flujo Completo

```
┌─────────────────────────────────────────┐
│  npm run start:auto                     │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Puppeteer abre Chrome                  │
│  Navega a John Deere                    │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Captura Captcha-Token y Cookies        │
│  Guarda en .env                         │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Inicia scraping (jhondeere.js)         │
│  Lee tokens de .env                     │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Cada 15 min: Renueva tokens            │
│  Si error 403: Renueva inmediatamente   │
└─────────────────────────────────────────┘
```

## 💡 Tips Pro

1. **Ejecuta en horarios de bajo tráfico** (madrugada)
2. **Monitorea los logs** para detectar patrones
3. **Ajusta delays** según necesidad
4. **Usa PM2** para ejecución continua:
   ```bash
   pm2 start scraper-auto.js --name "scraper"
   ```

## ⚠️ Limitaciones

- **Puppeteer consume recursos**: ~200-500MB RAM
- **Navegador debe estar abierto**: Para renovación automática
- **No es 100% indetectable**: Pero muy efectivo

## 🎉 Ventajas vs Método Manual

| Característica | Manual | Automático |
|---------------|--------|------------|
| Obtener tokens | 5 min cada vez | Automático |
| Renovación | Manual cada 20 min | Auto cada 15 min |
| Recuperación 403 | Reiniciar todo | Automática |
| Puede correr horas | ❌ No | ✅ Sí |
| Intervención | Alta | Cero |

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs del navegador Puppeteer
2. Verifica que `.env` se esté actualizando
3. Aumenta los delays si hay muchos 403
4. Considera usar proxies para IPs rotativas
