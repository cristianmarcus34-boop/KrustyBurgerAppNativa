// polyfill.js - VERSIÓN COMPLETA CON LOCATION
// Ejecutar ANTES que cualquier módulo de React Native

// ============================================
// 1. localStorage
// ============================================
if (typeof global.localStorage === 'undefined') {
    const store = new Map();
    global.localStorage = {
        getItem: (key) => store.get(key) || null,
        setItem: (key, value) => store.set(key, String(value)),
        removeItem: (key) => store.delete(key),
        clear: () => store.clear(),
        length: 0,
        key: () => null,
    };
    console.log('[Polyfill] localStorage OK');
}

// ============================================
// 2. sessionStorage
// ============================================
if (typeof global.sessionStorage === 'undefined') {
    const sessionStore = new Map();
    global.sessionStorage = {
        getItem: (key) => sessionStore.get(key) || null,
        setItem: (key, value) => sessionStore.set(key, String(value)),
        removeItem: (key) => sessionStore.delete(key),
        clear: () => sessionStore.clear(),
        length: 0,
        key: () => null,
    };
    console.log('[Polyfill] sessionStorage OK');
}

// ============================================
// 3. window CON location COMPLETO
// ============================================
if (typeof global.window === 'undefined') {
    // ✅ Crear location primero
    const location = {
        href: '',
        protocol: 'http:',
        host: '',
        hostname: '',
        port: '',
        pathname: '',
        search: '',
        hash: '',
        origin: '',
        reload: () => {
            console.log('[Polyfill] location.reload() llamado - ignorado en móvil');
            // No hacemos nada en móvil
        },
        replace: () => {
            console.log('[Polyfill] location.replace() llamado - ignorado en móvil');
        },
        assign: () => {
            console.log('[Polyfill] location.assign() llamado - ignorado en móvil');
        },
        toString: () => '',
    };

    global.window = {
        localStorage: global.localStorage,
        sessionStorage: global.sessionStorage,
        location: location,
        addEventListener: () => { },
        removeEventListener: () => { },
        dispatchEvent: () => { },
        navigator: {
            userAgent: 'React Native',
            platform: 'Android',
            deviceMemory: 4,
            hardwareConcurrency: 4,
        },
        performance: {
            now: () => Date.now(),
            memory: { jsHeapSizeLimit: 2172649472 },
            mark: () => { },
            measure: () => { },
            clearMarks: () => { },
            clearMeasures: () => { },
            getEntriesByType: () => [],
            getEntriesByName: () => [],
        },
        document: {
            cookie: '',
            createElement: () => ({ style: {}, appendChild: () => { }, removeChild: () => { } }),
            getElementById: () => null,
            querySelector: () => null,
            querySelectorAll: () => [],
            addEventListener: () => { },
            removeEventListener: () => { },
        },
        console: console,
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        setInterval: setInterval,
        clearInterval: clearInterval,
    };
    console.log('[Polyfill] window OK (con location completo)');
}

// ============================================
// 4. navigator
// ============================================
if (typeof global.navigator === 'undefined') {
    global.navigator = {
        userAgent: 'React Native',
        platform: 'Android',
        deviceMemory: 4,
        hardwareConcurrency: 4,
        language: 'es-AR',
        languages: ['es-AR', 'es'],
        cookieEnabled: true,
        onLine: true,
        connection: {
            effectiveType: '4g',
            rtt: 50,
            downlink: 10,
        },
    };
    console.log('[Polyfill] navigator OK');
}

// ============================================
// 5. performance
// ============================================
if (typeof global.performance === 'undefined') {
    global.performance = {
        now: () => Date.now(),
        memory: { jsHeapSizeLimit: 2172649472 },
        timing: {
            navigationStart: Date.now(),
        },
        mark: () => { },
        measure: () => { },
        clearMarks: () => { },
        clearMeasures: () => { },
        getEntriesByType: () => [],
        getEntriesByName: () => [],
        getEntries: () => [],
    };
    console.log('[Polyfill] performance OK');
}

// ============================================
// 6. location global (por si acaso)
// ============================================
if (typeof global.location === 'undefined') {
    global.location = global.window.location;
    console.log('[Polyfill] location global OK');
}

console.log('🎉 Polyfill completo (localStorage + sessionStorage + window + location)');