// setup.js - Este archivo se ejecuta ANTES que TODO
// Debe ser importado en el punto de entrada más temprano

// ✅ Crear location antes de que cualquier módulo lo intente usar
(function setupGlobalEnvironment() {
    console.log('[SETUP] Iniciando configuración global temprana...');

    // ✅ location con reload
    if (typeof global.location === 'undefined') {
        global.location = {
            href: '',
            protocol: 'http:',
            host: '',
            hostname: '',
            port: '',
            pathname: '',
            search: '',
            hash: '',
            origin: '',
            reload: function () {
                console.log('[SETUP] location.reload() - ignorado en móvil');
                return undefined;
            },
            replace: function () {
                console.log('[SETUP] location.replace() - ignorado en móvil');
                return undefined;
            },
            assign: function () {
                console.log('[SETUP] location.assign() - ignorado en móvil');
                return undefined;
            },
            toString: function () {
                return '';
            }
        };
        console.log('[SETUP] location OK');
    }

    // ✅ window con location
    if (typeof global.window === 'undefined') {
        global.window = {
            location: global.location,
            localStorage: {
                getItem: function () { return null; },
                setItem: function () { },
                removeItem: function () { },
                clear: function () { },
                length: 0,
                key: function () { return null; }
            },
            sessionStorage: {
                getItem: function () { return null; },
                setItem: function () { },
                removeItem: function () { },
                clear: function () { },
                length: 0,
                key: function () { return null; }
            },
            addEventListener: function () { },
            removeEventListener: function () { },
            dispatchEvent: function () { },
            navigator: {
                userAgent: 'React Native',
                platform: 'Android',
                deviceMemory: 4,
                hardwareConcurrency: 4,
            },
            performance: {
                now: function () { return Date.now(); },
                memory: { jsHeapSizeLimit: 2172649472 },
                mark: function () { },
                measure: function () { },
                clearMarks: function () { },
                clearMeasures: function () { },
                getEntriesByType: function () { return []; },
                getEntriesByName: function () { return []; },
            },
            document: {
                cookie: '',
                createElement: function () { return { style: {}, appendChild: function () { }, removeChild: function () { } }; },
                getElementById: function () { return null; },
                querySelector: function () { return null; },
                querySelectorAll: function () { return []; },
                addEventListener: function () { },
                removeEventListener: function () { },
            },
            console: console,
            setTimeout: setTimeout,
            clearTimeout: clearTimeout,
            setInterval: setInterval,
            clearInterval: clearInterval,
        };
        console.log('[SETUP] window OK');
    }

    // ✅ localStorage global
    if (typeof global.localStorage === 'undefined') {
        global.localStorage = global.window.localStorage;
        console.log('[SETUP] localStorage OK');
    }

    // ✅ sessionStorage global
    if (typeof global.sessionStorage === 'undefined') {
        global.sessionStorage = global.window.sessionStorage;
        console.log('[SETUP] sessionStorage OK');
    }

    // ✅ navigator global
    if (typeof global.navigator === 'undefined') {
        global.navigator = global.window.navigator;
        console.log('[SETUP] navigator OK');
    }

    // ✅ performance global
    if (typeof global.performance === 'undefined') {
        global.performance = global.window.performance;
        console.log('[SETUP] performance OK');
    }

    console.log('[SETUP] ✅ Entorno global configurado correctamente');
})();