// polyfill.ts - Versión COMPLETAMENTE TIPADA
import { Platform } from 'react-native';

// ✅ Declarar global para TypeScript
declare const global: any;

if (Platform.OS !== 'web') {
    // ============================================
    // 1. localStorage
    // ============================================
    if (typeof global.localStorage === 'undefined') {
        const store = new Map<string, string>();
        global.localStorage = {
            getItem: (key: string): string | null => {
                console.log(`[Polyfill] localStorage.getItem: ${key}`);
                return store.get(key) || null;
            },
            setItem: (key: string, value: string): void => {
                console.log(`[Polyfill] localStorage.setItem: ${key} = ${value}`);
                store.set(key, String(value));
            },
            removeItem: (key: string): void => {
                console.log(`[Polyfill] localStorage.removeItem: ${key}`);
                store.delete(key);
            },
            clear: (): void => {
                console.log('[Polyfill] localStorage.clear');
                store.clear();
            },
            length: 0,
            key: (index: number): string | null => {
                console.log(`[Polyfill] localStorage.key: ${index}`);
                return null;
            },
        };
        console.log('✅ Polyfill: localStorage creado');
    }

    // ============================================
    // 2. window (con TODAS las propiedades)
    // ============================================
    if (typeof global.window === 'undefined') {
        global.window = {
            localStorage: global.localStorage,
            location: {
                href: '',
                reload: (): void => { },
                origin: '',
                pathname: '',
                search: '',
                hash: '',
                hostname: '',
                port: '',
                protocol: '',
            },
            addEventListener: (): void => { },
            removeEventListener: (): void => { },
            dispatchEvent: (): void => { },
            navigator: {
                userAgent: 'React Native',
                platform: 'Android',
                deviceMemory: 4,
                hardwareConcurrency: 4,
            },
            performance: {
                memory: {
                    jsHeapSizeLimit: 2172649472,
                    totalJSHeapSize: 10000000,
                    usedJSHeapSize: 5000000,
                },
                now: (): number => Date.now(),
                timing: {
                    navigationStart: Date.now(),
                },
                mark: (name: string): any => {
                    console.log(`[Polyfill] performance.mark: ${name}`);
                    return { name, startTime: Date.now() };
                },
                measure: (name: string, startMark?: string, endMark?: string): any => {
                    console.log(`[Polyfill] performance.measure: ${name}`);
                    return {
                        name,
                        startTime: Date.now(),
                        duration: 0,
                    };
                },
                clearMarks: (): void => {
                    console.log('[Polyfill] performance.clearMarks');
                },
                clearMeasures: (): void => {
                    console.log('[Polyfill] performance.clearMeasures');
                },
                getEntriesByType: (type: string): any[] => {
                    console.log(`[Polyfill] performance.getEntriesByType: ${type}`);
                    return [];
                },
                getEntriesByName: (name: string): any[] => {
                    console.log(`[Polyfill] performance.getEntriesByName: ${name}`);
                    return [];
                },
            },
            document: {
                cookie: '',
                createElement: (): any => ({
                    style: {},
                    appendChild: (): void => { },
                    removeChild: (): void => { },
                }),
                getElementById: (): null => null,
                querySelector: (): null => null,
                querySelectorAll: (): any[] => [],
                addEventListener: (): void => { },
                removeEventListener: (): void => { },
            },
            console: console,
            setTimeout: setTimeout,
            clearTimeout: clearTimeout,
            setInterval: setInterval,
            clearInterval: clearInterval,
        };
        console.log('✅ Polyfill: window (completo) creado');
    }

    // ============================================
    // 3. navigator (completo)
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
        console.log('✅ Polyfill: navigator (completo) creado');
    }

    // ============================================
    // 4. performance (completo)
    // ============================================
    if (typeof global.performance === 'undefined') {
        const marks = new Map<string, any>();
        const measures = new Map<string, any>();

        global.performance = {
            memory: {
                jsHeapSizeLimit: 2172649472,
                totalJSHeapSize: 10000000,
                usedJSHeapSize: 5000000,
            },
            now: (): number => Date.now(),
            timing: {
                navigationStart: Date.now(),
                unloadEventStart: 0,
                unloadEventEnd: 0,
                redirectStart: 0,
                redirectEnd: 0,
                fetchStart: 0,
                domainLookupStart: 0,
                domainLookupEnd: 0,
                connectStart: 0,
                connectEnd: 0,
                secureConnectionStart: 0,
                requestStart: 0,
                responseStart: 0,
                responseEnd: 0,
                domLoading: 0,
                domInteractive: 0,
                domContentLoadedEventStart: 0,
                domContentLoadedEventEnd: 0,
                domComplete: 0,
                loadEventStart: 0,
                loadEventEnd: 0,
            },
            mark: (name: string): any => {
                console.log(`[Polyfill] performance.mark: ${name}`);
                const mark = { name, startTime: Date.now() };
                marks.set(name, mark);
                return mark;
            },
            measure: (name: string, startMark?: string, endMark?: string): any => {
                console.log(`[Polyfill] performance.measure: ${name}`);
                const measure = {
                    name,
                    startTime: Date.now(),
                    duration: 0,
                };
                measures.set(name, measure);
                return measure;
            },
            clearMarks: (name?: string): void => {
                console.log(`[Polyfill] performance.clearMarks: ${name || 'all'}`);
                if (name) {
                    marks.delete(name);
                } else {
                    marks.clear();
                }
            },
            clearMeasures: (name?: string): void => {
                console.log(`[Polyfill] performance.clearMeasures: ${name || 'all'}`);
                if (name) {
                    measures.delete(name);
                } else {
                    measures.clear();
                }
            },
            getEntriesByType: (type: string): any[] => {
                console.log(`[Polyfill] performance.getEntriesByType: ${type}`);
                if (type === 'mark') return Array.from(marks.values());
                if (type === 'measure') return Array.from(measures.values());
                return [];
            },
            getEntriesByName: (name: string): any[] => {
                console.log(`[Polyfill] performance.getEntriesByName: ${name}`);
                return [...marks.values(), ...measures.values()].filter((e: any) => e.name === name);
            },
            getEntries: (): any[] => {
                console.log('[Polyfill] performance.getEntries');
                return [...marks.values(), ...measures.values()];
            },
        };
        console.log('✅ Polyfill: performance (completo) creado');
    }

    // ============================================
    // 5. URL (para compatibilidad)
    // ============================================
    if (typeof global.URL === 'undefined') {
        global.URL = class URL {
            public href: string;
            public origin: string;
            public protocol: string;
            public host: string;
            public hostname: string;
            public port: string;
            public pathname: string;
            public search: string;
            public hash: string;

            constructor(url: string, base?: string) {
                this.href = url;
                this.origin = base || '';
                this.protocol = 'http:';
                this.host = '';
                this.hostname = '';
                this.port = '';
                this.pathname = '';
                this.search = '';
                this.hash = '';
            }

            toString(): string {
                return this.href;
            }
        };
        console.log('✅ Polyfill: URL creado');
    }

    // ============================================
    // 6. Blob (para compatibilidad)
    // ============================================
    if (typeof global.Blob === 'undefined') {
        global.Blob = class Blob {
            public parts: any[];
            public options: any;
            public size: number;
            public type: string;

            constructor(parts?: any[], options?: any) {
                this.parts = parts || [];
                this.options = options || {};
                this.size = this.parts.reduce((acc: number, part: any) => acc + (part.length || 0), 0);
                this.type = this.options.type || '';
            }
        };
        console.log('✅ Polyfill: Blob creado');
    }

    console.log('🎉 Polyfill EXTREMO completado');
}