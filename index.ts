// index.ts - PUNTO DE ENTRADA PRINCIPAL
// ✅ Importar setup PRIMERO (antes que cualquier otra cosa)
import './setup.js';

// ✅ Luego importar el resto
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);