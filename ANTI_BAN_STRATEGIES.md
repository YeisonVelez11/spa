# 🛡️ Estrategias Anti-Ban Implementadas

## ⚠️ Problema Detectado

El servidor usa **reCAPTCHA Enterprise** y sistemas anti-bot avanzados:
- ✅ Captcha-Token (Enterprise)
- ✅ Rate limiting estricto
- ✅ Cookies de sesión complejas
- ✅ Detección de patrones de scraping

## 🔧 Soluciones Implementadas

### 1. **Headers Mejorados**
- ✅ Agregado `product-line: JDRC`
- ✅ Agregado `Captcha-Version: Enterprise`
- ✅ Agregado `Expires: 0`
- ✅ Mejorado `Cache-Control: no-cache,no-store`

### 2. **Delays Aumentados**
- ✅ **3-8 segundos** entre peticiones (antes: 2-5s)
- ✅ **60 segundos** para errores 403 (antes: 30s)
- ✅ **45 segundos** para errores 502
- ✅ Delay adaptativo que aumenta con errores consecutivos

### 3. **Rotación de Headers Más Agresiva**
- ✅ Rotación cada **2 peticiones** (antes: cada 3)
- ✅ Rotación **5 veces** cuando hay error (antes: 3 veces)
- ✅ Multiplicador adaptativo hasta **10x** (antes: 8x)

### 4. **Delays Habilitados**
- ✅ Delay aleatorio entre peticiones **SIEMPRE activo**
- ✅ Logs visibles para monitorear el comportamiento

## 📊 Configuración Actual

```javascript
MIN_DELAY_BETWEEN_REQUESTS = 3000ms  // 3 segundos
MAX_DELAY_BETWEEN_REQUESTS = 8000ms  // 8 segundos
RETRY_DELAY_403_MS = 60000ms         // 60 segundos
RETRY_DELAY_502_MS = 45000ms         // 45 segundos
```

## 🚀 Recomendaciones Adicionales

### **CRÍTICO: No hacer peticiones simultáneas**

El servidor detecta múltiples peticiones desde la misma IP. **NO uses paralelización**.

```javascript
// ❌ MAL - Peticiones simultáneas
await Promise.all([
  getPart1(),
  getPart2(),
  getPart3()
]);

// ✅ BIEN - Peticiones secuenciales
await getPart1();
await getPart2();
await getPart3();
```

### **Opción 1: Reducir velocidad (RECOMENDADO)**

Aumenta los delays aún más si sigues siendo baneado:

```javascript
const MIN_DELAY_BETWEEN_REQUESTS = 5000;  // 5 segundos
const MAX_DELAY_BETWEEN_REQUESTS = 12000; // 12 segundos
const RETRY_DELAY_403_MS = 120000;        // 2 minutos
```

### **Opción 2: Usar Proxies Rotativos (MEJOR SOLUCIÓN)**

El servidor está detectando tu IP. Usa proxies para rotar IPs:

1. **Servicios pagos** (recomendado):
   - Bright Data (Luminati)
   - Smartproxy
   - Oxylabs
   - ScraperAPI

2. **Implementación**:
   ```bash
   npm install socks-proxy-agent
   ```
   
   Ver archivo `PROXY_SETUP.md` para instrucciones completas.

### **Opción 3: Usar Navegador Real (MÁXIMA EFECTIVIDAD)**

Usa Puppeteer o Playwright para simular un navegador real:

```bash
npm install puppeteer
```

Esto incluye:
- ✅ Captcha-Token real generado por el navegador
- ✅ Cookies de sesión válidas
- ✅ JavaScript ejecutado correctamente
- ✅ Comportamiento humano simulado

### **Opción 4: Dividir el Trabajo**

Si tienes múltiples IPs disponibles:

1. Divide `id_piezas2.json` en N archivos (ya tienes `split_json.js`)
2. Ejecuta el script desde diferentes máquinas/IPs
3. Combina los resultados con `merge.js`

## 🔍 Monitoreo

### Señales de que estás siendo baneado:
- 🚨 Múltiples errores 403 consecutivos
- 🚨 Errores 502 frecuentes
- 🚨 Timeouts constantes
- 🚨 Respuestas vacías o undefined

### Qué hacer si te bannean:
1. **Detener el script inmediatamente**
2. **Esperar 30-60 minutos**
3. **Aumentar los delays**
4. **Considerar usar proxies**

## 📈 Velocidad vs Seguridad

| Estrategia | Velocidad | Riesgo de Ban | Costo |
|------------|-----------|---------------|-------|
| Delays largos (actual) | 🐌 Lenta | 🟡 Medio | Gratis |
| Proxies rotativos | 🚀 Rápida | 🟢 Bajo | $$ |
| Navegador real | 🐢 Muy lenta | 🟢 Muy bajo | Gratis |
| Múltiples IPs | 🚀 Muy rápida | 🟢 Bajo | Gratis* |

*Requiere múltiples máquinas/conexiones

## ⚡ Optimización Actual

Con la configuración actual:
- **~15,000 piezas** en `id_piezas2.json`
- **~5 segundos** promedio por petición
- **~20 horas** de ejecución estimada

Para acelerar sin ban:
- Usa **proxies rotativos** → ~5 horas
- Usa **múltiples instancias** con diferentes IPs → ~2 horas

## 🎯 Conclusión

La configuración actual está **optimizada para evitar bans**, pero es **lenta**.

**Mejor opción**: Invertir en proxies rotativos para mantener velocidad sin riesgo de ban.
