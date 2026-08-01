# 🍔 Krusty Burger App

Aplicación móvil de delivery para Krusty Burger, construida con React Native y Expo. Incluye sistema de autenticación, pedidos en tiempo real, GPS para repartidores, panel de administración y sistema de fidelidad con puntos y recompensas.

---

## 📱 Capturas de Pantalla

> *(Próximamente: agrega imágenes de tu app aquí)*

---

## ✨ Características Principales

### 👤 Autenticación
- Login / Registro con Supabase
- Roles: Cliente, Repartidor, Administrador
- Persistencia de sesión con AsyncStorage

### 🍔 Cliente
- Menú con 14 productos y categorías
- Carrito de compras con persistencia local
- Checkout con selección de dirección y método de pago
- Seguimiento de pedidos en tiempo real con mapa
- Sistema de puntos Krusty y niveles (Bronce, Plata, Oro, Platino)

### 👑 Administrador
- Gestión de pedidos (cambiar estados)
- Gestión de menú (CRUD con imágenes)
- Gestión de clientes (roles, eliminación)
- Estadísticas de ventas y pedidos

### 🚲 Repartidor
- Lista de pedidos activos e historial
- Transmisión GPS en tiempo real
- Detección automática de llegada al destino
- Estadísticas de entregas

---

## 🛠️ Tecnologías Utilizadas

| Tecnología | Descripción |
|------------|-------------|
| **Expo SDK 57** | Framework para React Native |
| **TypeScript** | Tipado estático |
| **Supabase** | Backend (Auth, Database, Storage) |
| **React Navigation** | Navegación (Stack + Bottom Tabs) |
| **Zustand** | Estado global |
| **expo-location** | GPS en tiempo real |
| **react-native-maps** | Mapas interactivos |
| **expo-secure-store** | Almacenamiento seguro |

---

## 📁 Estructura del Proyecto
KrustyBurger/
├── components/ # Componentes reutilizables
├── lib/ # Configuración y utilidades
│ ├── colores.ts # Paleta de colores
│ ├── supabase.ts # Cliente de Supabase
│ └── tipos.ts # Definiciones de tipos
├── screens/ # Pantallas de la app
│ ├── admin/ # Panel de administración
│ ├── auth/ # Login y registro
│ ├── cliente/ # Pantallas de cliente
│ └── repartidor/ # Pantallas de repartidor
├── stores/ # Stores de Zustand
│ ├── tiendaAutenticacion.ts
│ ├── tiendaCarrito.ts
│ └── tiendaPedidos.ts
├── plugins/ # Plugins de Expo
├── app.json # Configuración de Expo
└── .env.local # Variables de entorno


---

## 🚀 Instalación y Configuración

### 1️⃣ Clonar el repositorio

```bash
git clone https://github.com/cristianmarcus34-boop/KrustyBurgerAppNativa.git
cd KrustyBurgerAppNativa

2️⃣ Instalar dependencias
bash
npm install
3️⃣ Configurar variables de entorno
Crea un archivo .env.local en la raíz:

env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=tu-clave-publica
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=tu-clave-de-google-maps
4️⃣ Iniciar la aplicación
bash
# Modo desarrollo
npx expo start

# Compilar APK de desarrollo
npx expo run:android

# Compilar con EAS (recomendado)
eas build --platform android --profile development
🔑 Variables de Entorno
Variable	Descripción
EXPO_PUBLIC_SUPABASE_URL	URL de tu proyecto en Supabase
EXPO_PUBLIC_SUPABASE_KEY	Clave pública de Supabase
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY	Clave API de Google Maps
📱 Flujo de la App
Bienvenida → Login / Registro / Invitado

Cliente: Menú → Carrito → Checkout → Seguimiento

Repartidor: Lista de pedidos → Iniciar entrega → GPS → Entregar

Admin: Panel → Gestionar pedidos / menú / clientes / estadísticas

🧪 Estado del Proyecto
Funcionalidad	Estado
Autenticación	✅ Completado
Menú de productos	✅ Completado
Carrito de compras	✅ Completado
Checkout	✅ Completado
Seguimiento de pedidos	✅ Completado
GPS de repartidor	✅ Completado
Panel de administración	✅ Completado
Sistema de puntos	✅ Completado
🤝 Contribuciones
Este proyecto es de código abierto. Las contribuciones son bienvenidas.

Fork el proyecto

Crea una rama (git checkout -b feature/nueva-funcionalidad)

Commit tus cambios (git commit -m 'feat: Agregar nueva funcionalidad')

Push (git push origin feature/nueva-funcionalidad)

Abre un Pull Request

📄 Licencia
MIT

👨‍💻 Autor
Cristian Marcus

GitHub: @cristianmarcus34-boop

🙏 Agradecimientos
Expo por el framework

Supabase por el backend

React Native por el ecosistema

Google Maps por las APIs de mapas

📞 Contacto
¿Preguntas o sugerencias? Abre un issue en el repositorio.

text

---

## 🚀 GUARDA Y SUBE EL CAMBIO

```bash
# 1. Guarda el archivo
# 2. Agrégalo al repositorio
git add README.md

# 3. Haz un commit
git commit -m "docs: Agregar README.md con documentación completa del proyecto"

# 4. Sube los cambios
git push origin main