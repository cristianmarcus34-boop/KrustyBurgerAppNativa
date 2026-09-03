import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const gradlePath = path.join(__dirname, '../android/app/build.gradle');

try {
  const content = fs.readFileSync(gradlePath, 'utf8');
  
  // Eliminar líneas que contengan exactamente '' (dos comillas simples)
  const lines = content.split('\n');
  const fixedLines = lines.filter(line => line.trim() !== "''");
  
  if (lines.length !== fixedLines.length) {
    fs.writeFileSync(gradlePath, fixedLines.join('\n'), 'utf8');
    console.log('✅ Corregido: Se eliminó la línea vacía (``) de app/build.gradle');
  } else {
    console.log('ℹ️ No se encontró la línea problemática.');
  }
} catch (error) {
  console.error('❌ Error:', error.message);
}