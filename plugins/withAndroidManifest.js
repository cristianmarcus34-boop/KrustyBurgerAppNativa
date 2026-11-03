// plugins/withAndroidManifest.js
const {
    withAndroidManifest,
    withAndroidStyles,
    withAppBuildGradle,
    withGradleProperties,
} = require('@expo/config-plugins');

module.exports = function withAndroidManifestPlugin(config) {
    config = withAndroidManifest(config, async (config) => {
        const androidManifest = config.modResults;
        const application = androidManifest.manifest.application[0];
        application.$['android:resizeableActivity'] = 'true';

        const mainActivity = application.activity?.find(
            (item) => item.$['android:name'] === '.MainActivity'
        );
        if (mainActivity) {
            delete mainActivity.$['android:screenOrientation'];
        }

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

    config = withAndroidStyles(config, (config) => {
        const appTheme = config.modResults.resources.style?.find(
            (style) => style.$?.name === 'AppTheme'
        );
        if (!appTheme) {
            throw new Error('[withAndroidManifest] No se encontró el estilo AppTheme.');
        }

        appTheme.item = (appTheme.item || []).filter(
            (item) =>
                item.$?.name !== 'android:statusBarColor' &&
                item.$?.name !== 'android:navigationBarColor'
        );

        return config;
    });

    config = withAppBuildGradle(config, (config) => {
        const contents = config.modResults.contents;
        const legacyR8Config = /getDefaultProguardFile\((['"])proguard-android\.txt\1\)/;

        if (legacyR8Config.test(contents)) {
            config.modResults.contents = contents.replace(
                legacyR8Config,
                'getDefaultProguardFile("proguard-android-optimize.txt")'
            );
        } else if (!contents.includes('proguard-android-optimize.txt')) {
            throw new Error(
                '[withAndroidManifest] No se encontró la configuración ProGuard de Release para optimizar R8.'
            );
        }

        return config;
    });

    return withGradleProperties(config, (config) => {
        const properties = config.modResults;
        const enabledOptimizations = new Map([
            ['android.enablePngCrunchInReleaseBuilds', 'true'],
            ['android.enableMinifyInReleaseBuilds', 'true'],
            ['android.enableShrinkResourcesInReleaseBuilds', 'true'],
            ['android.r8.optimizedResourceShrinking', 'true'],
        ]);

        for (const [key, value] of enabledOptimizations) {
            const existing = properties.find(
                (property) => property.type === 'property' && property.key === key
            );
            if (existing) {
                existing.value = value;
            } else {
                properties.push({ type: 'property', key, value });
            }
        }

        return config;
    });
};