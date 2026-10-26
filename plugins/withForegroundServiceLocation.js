// plugins/withForegroundServiceLocation.js
const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withForegroundServiceLocation(config) {
    return withAndroidManifest(config, async (config) => {
        const androidManifest = config.modResults;
        const application = androidManifest.manifest.application[0];

        if (!application) {
            throw new Error(
                '[withForegroundServiceLocation] No se encontró <application> en el manifest'
            );
        }

        // ✅ Asegurar que el array de <service> existe
        if (!application.service) {
            application.service = [];
        }

        const SERVICE_NAME =
            'expo.modules.location.taskConsumers.LocationTaskConsumerService';

        // ✅ Buscar si ya existe el service
        const existente = application.service.find(
            (item) => item.$ && item.$['android:name'] === SERVICE_NAME
        );

        if (existente) {
            // ✅ Actualizar los atributos si ya existe
            existente.$['android:foregroundServiceType'] = 'location';
            existente.$['android:exported'] = 'false';
            console.log(
                '✅ [withForegroundServiceLocation] Service LocationTaskConsumer ya existía, actualizado'
            );
        } else {
            // ✅ Agregar el service
            application.service.push({
                $: {
                    'android:name': SERVICE_NAME,
                    'android:foregroundServiceType': 'location',
                    'android:exported': 'false',
                },
            });
            console.log(
                '✅ [withForegroundServiceLocation] Service LocationTaskConsumer agregado al manifest'
            );
        }

        return config;
    });
};