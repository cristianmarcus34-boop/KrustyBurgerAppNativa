// plugins/withAndroidManifest.js
const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withAndroidManifestPlugin(config) {
    return withAndroidManifest(config, async (config) => {
        const androidManifest = config.modResults;
        const application = androidManifest.manifest.application[0];

        // ✅ Asegurar que meta-data existe
        if (!application['meta-data']) {
            application['meta-data'] = [];
        }

        // ✅ Buscar si ya existe la meta-data de Google Maps
        const existingMetaData = application['meta-data'].find(
            (item) => item.$['android:name'] === 'com.google.android.geo.API_KEY'
        );

        const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
        if (!API_KEY) {
            throw new Error('Falta EXPO_PUBLIC_GOOGLE_MAPS_API_KEY para configurar Google Maps en Android.');
        }

        if (existingMetaData) {
            // ✅ Si existe, actualizar el valor
            existingMetaData.$['android:value'] = API_KEY;
            console.log('✅ API Key de Google Maps actualizada en AndroidManifest.xml');
        } else {
            // ✅ Si no existe, agregarla
            application['meta-data'].push({
                $: {
                    'android:name': 'com.google.android.geo.API_KEY',
                    'android:value': API_KEY
                }
            });
            console.log('✅ API Key de Google Maps agregada a AndroidManifest.xml');
        }

        console.log('📱 AndroidManifest.xml de Google Maps actualizado correctamente');

        return config;
    });
};