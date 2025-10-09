# Cómo obtener el Captcha-Token y Cookies

## Problema
La web de John Deere usa **Google reCAPTCHA Enterprise** y requiere cookies de sesión válidas. Sin estos, recibirás error 403.

## Solución: Obtener tokens del navegador

### Paso 1: Abrir DevTools en Chrome
1. Ve a https://partscatalog.deere.com/
2. Presiona `F12` o `Cmd+Option+I` (Mac) para abrir DevTools
3. Ve a la pestaña **Network**

### Paso 2: Hacer una búsqueda
1. Busca cualquier parte en la web (ejemplo: "RM100085")
2. En la pestaña Network, busca la petición a `/jdrc-services/v1/search/parts`
3. Click derecho en la petición → **Copy** → **Copy as cURL**

### Paso 3: Extraer los valores

Del comando cURL copiado, necesitas:

#### A) Captcha-Token
Busca la línea que dice:
```
-H 'Captcha-Token: 0cAFcWeA65rfCMcKxTla8rSGxyjtPex...'
```
Copia TODO el valor después de `Captcha-Token: `

#### B) Cookies
Busca la línea que dice:
```
-b 'BVBRANDID=27dd6b9e-e094-4a39-b68f-6bfca39ae752; nmstat=...'
```
Copia TODO el valor después de `-b '` (sin las comillas)

### Paso 4: Crear archivo .env

1. Copia `.env.example` a `.env`:
```bash
cp .env.example .env
```

2. Edita `.env` y pega tus valores:
```env
CAPTCHA_TOKEN=tu_captcha_token_completo_aqui
COOKIES=tu_cookie_string_completo_aqui
```

### Paso 5: Ejecutar el script
```bash
node jhondeere.js
```

## ⚠️ IMPORTANTE

### El Captcha-Token expira
- **Duración**: ~10-30 minutos
- **Solución**: Necesitas renovarlo periódicamente
- Cuando veas error 403, obtén un nuevo token

### Las Cookies expiran
- **Duración**: Variable (horas/días)
- **Solución**: Renueva cuando sea necesario

## Alternativa: Usar Puppeteer

Si quieres automatizar completamente (sin renovar tokens manualmente), considera usar Puppeteer para:
1. Abrir un navegador real
2. Resolver el captcha automáticamente
3. Hacer las peticiones desde el navegador

Esto es más complejo pero más robusto a largo plazo.

## Tips para evitar baneos

1. **Aumenta los delays**: Cambia `tiempoMs` a 1000-2000ms
2. **No hagas muchas peticiones seguidas**: Toma descansos
3. **Rota IPs**: Usa proxies si es posible
4. **Horarios**: Ejecuta en horarios de bajo tráfico (madrugada)
