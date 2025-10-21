const { exec } = require('child_process');

// Cantidad de terminales que quieres abrir
const n = 3;

// Iterar de 1 a n para abrir n terminales
for (let i = 1; i <= n; i++) {
  // El comando que deseas ejecutar en cada terminal
  const command = `node /Users/yevelez/fury_3/spa/jhondeere.js ${i}`;

  // Título personalizado para cada terminal
  const title = `jhondeere ${i}`;

  // Construir el comando de AppleScript para abrir una nueva terminal,
  // establecer un título personalizado y ejecutar el comando deseado
  const terminalCommand = `
    osascript -e 'tell application "Terminal"
      do script "${command}"
      set custom title of front window to "${title}"
    end tell'
  `;

  // Ejecutar el comando para abrir la terminal
  exec(terminalCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error al abrir la terminal: ${error}`);
      return;
    }
    if (stderr) {
      console.error(`Error en el script: ${stderr}`);
      return;
    }
    console.log(`Salida: ${stdout}`);
  });
}