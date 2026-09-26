module.exports = ({ config }) => {
    const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();

    if (!googleMapsApiKey) {
        // ⚠️ En builds sin la var, solo avisamos. No rompemos.
        // Esto permite que `expo config`, `eas env:list`, etc. funcionen.
        console.warn(
            '⚠️ EXPO_PUBLIC_GOOGLE_MAPS_API_KEY no está definida. Los mapas no van a funcionar en esta build.'
        );
    }

    return {
        ...config,
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