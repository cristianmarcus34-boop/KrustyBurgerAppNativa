module.exports = ({ config }) => {
    const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();

    if (!googleMapsApiKey) {
        console.warn(
            '⚠️ EXPO_PUBLIC_GOOGLE_MAPS_API_KEY no está definida. Los mapas no van a funcionar en esta build.'
        );
    }

    return {
        ...config,
        extra: {
            ...config.extra,
            eas: {
                ...config.extra?.eas,
                projectId: "b2c2267e-d1bf-42ce-b6f1-b85cc48f28ab", // ID NUEVO
            },
        },
        ios: {
            ...config.ios,
            config: {
                ...config.ios?.config,
                googleMapsApiKey: googleMapsApiKey || '',
            },
        },
        android: {
            ...config.android,
            config: {
                ...config.android?.config,
                googleMaps: {
                    ...config.android?.config?.googleMaps,
                    apiKey: googleMapsApiKey || '',
                },
            },
        },
    };
};