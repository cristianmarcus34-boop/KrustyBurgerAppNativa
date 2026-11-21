// app.config.js
module.exports = ({ config }) => {
    const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();

    if (!googleMapsApiKey) {
        console.warn(
            '⚠️ EXPO_PUBLIC_GOOGLE_MAPS_API_KEY no está definida. Los mapas no van a funcionar en esta build.'
        );
    }

    return {
        ...config,
        name: 'KrustyBurger',
        slug: 'KrustyBurger',
        version: '1.0.6',
        scheme: 'krustyburger',
        orientation: 'default',
        icon: './assets/icon.png',
        userInterfaceStyle: 'automatic',
        ios: {
            supportsTablet: true,
            bundleIdentifier: 'com.agenciapowa.KrustyBurger',
            infoPlist: {
                NSCameraUsageDescription: 'KrustyBurger necesita acceso a la cámara para escanear códigos QR y cupones.',
                NSPhotoLibraryUsageDescription: 'KrustyBurger necesita acceso a tus fotos para subir imágenes.',
                NSLocationWhenInUseUsageDescription: 'KrustyBurger necesita tu ubicación para el seguimiento de pedidos.',
                NSLocationAlwaysUsageDescription: 'KrustyBurger necesita tu ubicación para el seguimiento de pedidos en tiempo real.',
                UISupportedInterfaceOrientations: ['UIInterfaceOrientationPortrait'],
                'UISupportedInterfaceOrientations~ipad': ['UIInterfaceOrientationPortrait'],
                UIBackgroundModes: ['location', 'fetch', 'remote-notification'],
            },
            config: {
                ...config.ios?.config,
                googleMapsApiKey: googleMapsApiKey || '',
            },
        },
        android: {
            adaptiveIcon: {
                backgroundColor: '#FF6600',
                foregroundImage: './assets/android-icon-foreground.png',
                backgroundImage: './assets/android-icon-background.png',
                monochromeImage: './assets/android-icon-monochrome.png',
            },
            versionCode: 27,
            predictiveBackGestureEnabled: false,
            googleServicesFile: './google-services.json',
            package: 'com.agenciapowa.KrustyBurger',
            blockedPermissions: [
                'android.permission.READ_MEDIA_IMAGES',
                'android.permission.READ_MEDIA_VIDEO',
                'android.permission.READ_MEDIA_AUDIO',
                'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
                'android.permission.READ_EXTERNAL_STORAGE',
                'android.permission.WRITE_EXTERNAL_STORAGE',
                'android.permission.RECORD_AUDIO',
                'android.permission.SYSTEM_ALERT_WINDOW',
            ],
            permissions: [
                'android.permission.ACCESS_FINE_LOCATION',
                'android.permission.ACCESS_COARSE_LOCATION',
                'android.permission.ACCESS_BACKGROUND_LOCATION', // ✅ Requerido para delivery en tiempo real
                'android.permission.CAMERA',
                'android.permission.RECEIVE_BOOT_COMPLETED',
                'android.permission.VIBRATE',
                'android.permission.WAKE_LOCK',
                'android.permission.INTERNET',
                'android.permission.ACCESS_NETWORK_STATE',
                'android.permission.ACCESS_WIFI_STATE',
                'android.permission.POST_NOTIFICATIONS',
                'android.permission.FOREGROUND_SERVICE',
                'android.permission.FOREGROUND_SERVICE_LOCATION', // ✅ Requerido para Android 14+ / Servicios en primer plano
            ],
            intentFilters: [
                {
                    action: 'VIEW',
                    data: [
                        { scheme: 'https', host: 'www.krustyburger.com.ar' },
                        { scheme: 'https', host: 'krustyburger.com.ar' },
                    ],
                    category: ['BROWSABLE', 'DEFAULT'],
                },
            ],
            config: {
                ...config.android?.config,
                googleMaps: {
                    ...config.android?.config?.googleMaps,
                    apiKey: googleMapsApiKey || '',
                },
            },
        },
        plugins: [
            'expo-secure-store',
            'expo-router',
            './plugins/withAndroidManifest.js',
            'expo-status-bar',
            'expo-font',
            'expo-updates',
            [
                'expo-splash-screen',
                {
                    image: './assets/icon.png',
                    imageWidth: 250,
                    resizeMode: 'contain',
                    backgroundColor: '#FFFFFF',
                },
            ],
            [
                'expo-camera',
                {
                    cameraPermission: 'KrustyBurger necesita acceso a la cámara para escanear códigos QR y cupones.',
                },
            ],
            [
                'expo-image-picker',
                {
                    photosPermission: 'KrustyBurger necesita acceso a tus fotos para subir imágenes.',
                    cameraPermission: 'KrustyBurger necesita acceso a la cámara para tomar fotos.',
                },
            ],
            [
                'expo-location',
                {
                    isIosBackgroundLocationEnabled: true,
                    isAndroidBackgroundLocationEnabled: true, // ✅ Habilitado para app de repartidor/delivery
                    isAndroidForegroundServiceEnabled: true,
                    locationAlwaysAndWhenInUsePermission: 'KrustyBurger necesita tu ubicación para el seguimiento de pedidos en tiempo real.',
                    locationAlwaysPermission: 'KrustyBurger necesita tu ubicación para el seguimiento de pedidos en tiempo real.',
                    locationWhenInUsePermission: 'KrustyBurger necesita tu ubicación para el seguimiento de pedidos.',
                },
            ],
            [
                'expo-notifications',
                {
                    icon: './assets/notification-icon.png',
                    color: '#F5C518',
                    sounds: [
                        './assets/sounds/krustyyotequieromucho.wav',
                        './assets/sounds/saxolisa.wav',
                        './assets/sounds/circopararapapa.wav',
                    ],
                },
            ],
            [
                'expo-build-properties',
                {
                    android: {
                        compileSdkVersion: 37,
                        targetSdkVersion: 36,
                        buildToolsVersion: '37.0.0',
                        agpVersion: '9.0.0', // ✅ Soluciona la advertencia de Gradle 9.0 en Google Play Console
                        enableMinifyInReleaseBuilds: true,
                        enableShrinkResourcesInReleaseBuilds: true,
                        extraProguardRules: '-keep class expo.modules.notifications.** { *; }'
                    },
                    ios: {
                        deploymentTarget: '16.4',
                    },
                },
            ],
            [
                'expo-gradle-jvmargs',
                {
                    xmx: '4g',
                    maxMetaspace: '1g',
                },
            ],
            './plugins/withForegroundServiceLocation.js', // ✅ Plugin nativo para asegurar el foregroundServiceType="location"
            'expo-web-browser',
            '@react-native-community/datetimepicker',
            'expo-sharing',
            'expo-image',
        ],
        updates: {
            enabled: true,
            checkAutomatically: 'ON_LOAD',
            fallbackToCacheTimeout: 3000,
            url: 'https://u.expo.dev/709ab55b-7649-4a00-8a9c-a9dfd6aa2277',
        },
        extra: {
            ...config.extra,
            router: {
                origin: false,
            },
            eas: {
                projectId: "709ab55b-7649-4a00-8a9c-a9dfd6aa2277"
            },
        },
        runtimeVersion: {
            policy: 'appVersion',
        },
        owner: 'agenciapowa',
    };
};