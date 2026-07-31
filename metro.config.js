const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Desactivar verificación de expo-router
process.env.EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK = 'true';

// ✅ Configuración para asegurar que setup.js se incluya primero
config.transformer.getTransformOptions = async () => ({
    transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
    },
});

// ✅ Forzar el orden de los módulos
config.serializer.createModuleIdFactory = function () {
    const fileToId = new Map();
    let nextId = 0;
    return function (path) {
        let id = fileToId.get(path);
        if (typeof id !== 'number') {
            id = nextId++;
            fileToId.set(path, id);
        }
        return id;
    };
};

module.exports = config;