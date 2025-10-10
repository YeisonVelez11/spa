# 🔀 Configuración de Proxies Rotativos (GRATUITO)

## 📦 Instalación

Instala la dependencia necesaria:

```bash
npm install socks-proxy-agent
```

## 🚀 Activación

Para activar la rotación de proxies, edita el archivo `jhondeere.js`:

**Línea 31:** Cambia `USE_PROXY = false` a `USE_PROXY = true`

```javascript
let USE_PROXY = true; // ✅ Activar proxies
```

## 🔄 Actualizar Lista de Proxies

Los proxies gratuitos cambian frecuentemente. Para obtener proxies actualizados:

1. Visita: https://www.proxy-list.download/SOCKS5
2. O visita: https://www.socks-proxy.net/
3. Copia proxies en formato: `socks5://IP:PUERTO`
4. Actualiza el array `PROXY_LIST` en `jhondeere.js` (líneas 17-28)

### Ejemplo de actualización:

```javascript
const PROXY_LIST = [
  'socks5://103.152.112.162:1080',
  'socks5://192.111.137.34:18765',
  'socks5://72.210.221.223:4145',
  // Agregar más proxies aquí...
];
```

## ⚙️ Cómo Funciona

1. **Rotación automática**: Cada petición usa un proxy diferente de la lista
2. **Fallback**: Si un proxy falla, el sistema continúa con el siguiente
3. **Logs**: Verás en consola: `🔀 Usando proxy: socks5://...`

## ⚠️ Notas Importantes

- **Velocidad**: Los proxies gratuitos pueden ser lentos
- **Disponibilidad**: Algunos proxies pueden estar caídos
- **Actualización**: Actualiza la lista cada 1-2 días para mejores resultados
- **Alternativa**: Si los proxies gratuitos no funcionan bien, considera usar un servicio pago como:
  - Bright Data (Luminati)
  - Smartproxy
  - Oxylabs

## 🧪 Prueba

Ejecuta el script y verifica en los logs:

```
🔀 Usando proxy: socks5://103.152.112.162:1080
🌐 User-Agent: Mozilla/5.0...
```

Si ves estos mensajes, la rotación de proxies está funcionando correctamente.

## 🐛 Solución de Problemas

Si las peticiones fallan con proxies:

1. **Desactiva temporalmente**: `USE_PROXY = false`
2. **Actualiza la lista** de proxies
3. **Prueba sin proxies** primero para verificar que el resto funciona
4. **Verifica los logs** de errores de proxy

## 📊 Rendimiento

- **Sin proxy**: ~1-2 segundos por petición
- **Con proxy gratuito**: ~3-10 segundos por petición (varía según el proxy)
- **Ventaja**: Evita bloqueos por IP, permite más peticiones simultáneas
