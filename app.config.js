module.exports = ({ config }) => {
    const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
    if (!googleMapsApiKey) {
        throw new Error(
            'Falta EXPO_PUBLIC_GOOGLE_MAPS_API_KEY. Definila en .env.local o en el entorno de la build.'
        );
    }

    return {
        ...config,
        ios: {
            ...config.ios,
            config: {
                ...config.ios?.config,
                googleMapsApiKey,
            },
        },
        android: {
            ...config.android,
            config: {
                ...config.android?.config,
                googleMaps: {
                    ...config.android?.config?.googleMaps,
                    apiKey: googleMapsApiKey,
                },
            },
        },
    };
};
