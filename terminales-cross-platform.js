const { exec } = require('child_process');
const os = require('os');
const path = require('path');

// Cantidad de terminales que quieres abrir
const n = 3;

// Detectar sistema operativo
const platform = os.platform();
const scriptPath = path.join(__dirname, 'jhondeere.js');

console.log(`🖥️  Sistema operativo detectado: ${platform}`);
console.log(`📂 Script path: ${scriptPath}`);
console.log(`🚀 Abriendo ${n} terminales...\n`);

// Iterar de 1 a n para abrir n terminales
for (let i = 1; i <= n; i++) {
  const title = `jhondeere ${i}`;
  
  let terminalCommand;
  
  if (platform === 'darwin') {
    // macOS
    const command = `node "${scriptPath}" ${i}`;
    terminalCommand = `
      osascript -e 'tell application "Terminal"
        do script "${command}"
        set custom title of front window to "${title}"
      end tell'
    `;
  } else if (platform === 'win32') {
    // Windows - NO usar comillas en la ruta del script
    // cmd /k ejecuta el comando y mantiene la ventana abierta
    terminalCommand = `start "${title}" cmd /k "node ${scriptPath} ${i}"`;
  } else if (platform === 'linux') {
    // Linux (intentar con gnome-terminal, xterm como fallback)
    const command = `node "${scriptPath}" ${i}`;
    terminalCommand = `gnome-terminal --title="${title}" -- bash -c "${command}; exec bash" || xterm -T "${title}" -e "${command}; bash"`;
  } else {
    console.error(`❌ Sistema operativo no soportado: ${platform}`);
    continue;
  }
  
  // Ejecutar el comando para abrir la terminal
  exec(terminalCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Error al abrir terminal ${i}: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`⚠️  stderr terminal ${i}: ${stderr}`);
      return;
    }
    console.log(`✅ Terminal ${i} abierta: ${title}`);
  });
  
  // Pequeña pausa para evitar abrir todas al mismo tiempo
  setTimeout(() => {}, 500 * i);
}

console.log(`\n🎯 Proceso completado. Se intentaron abrir ${n} terminales.`);
