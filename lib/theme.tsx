// lib/theme.tsx
// ============================================================
// 🌓 SISTEMA DE TEMAS (CLARO / OSCURO / SISTEMA)
// ============================================================
import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    useCallback,
    ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================
// 📦 TIPOS
// ============================================================
export type ModoTema = 'claro' | 'oscuro' | 'sistema';

export interface PaletaTema {
    fondo: string;
    fondoAlt: string;
    surface: string;
    surfaceHover: string;
    card: string;
    cardShadow: string;
    cardShadowHeavy: string;
    border: string;
    borderLight: string;

    text: string;
    textSecondary: string;
    textTertiary: string;

    accent: string;
    accentLight: string;
    accentSecondary: string;
    accentSecondaryLight: string;

    gradientStart: string;
    gradientMid: string;
    gradientEnd: string;
    gradientButtonStart: string;
    gradientButtonEnd: string;

    success: string;
    successLight: string;
    warning: string;
    danger: string;
    info: string;

    morado: string;
    moradoClaro: string;
    moradoOscuro: string;
    rosa: string;
    rosaClaro: string;
    rosaMaggie: string;
    azul: string;
    azulClaro: string;
    azulHomero: string;
    verde: string;
    verdeClaro: string;
    verdeOscuro: string;
    verdeMarge: string;
    naranja: string;
    naranjaClaro: string;
    naranjaBart: string;

    platino: string;
    oro: string;
    plata: string;
    bronce: string;

    blanco: string;
    negro: string;
    gris: string;
    grisClaro: string;
    grisOscuro: string;
    amarillo: string;
    amarilloClaro: string;
    amarilloOscuro: string;
    rojo: string;
    rojoClaro: string;
    rojoOscuro: string;
    isDark: boolean;
}

export interface Tema {
    colors: PaletaTema;
    isDark: boolean;
}

// ============================================================
// 🎨 PALETA CLARA
// ============================================================
export const PALETA_CLARA: PaletaTema = {
    fondo: '#F5F2ED',
    fondoAlt: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceHover: '#F8F6F2',
    card: '#FFFFFF',
    cardShadow: 'rgba(0,0,0,0.06)',
    cardShadowHeavy: 'rgba(0,0,0,0.12)',
    border: 'rgba(0,0,0,0.06)',
    borderLight: 'rgba(0,0,0,0.04)',

    text: '#1A1A1A',
    textSecondary: 'rgba(0,0,0,0.55)',
    textTertiary: 'rgba(0,0,0,0.30)',

    accent: '#E53935',
    accentLight: '#FF6B6B',
    accentSecondary: '#F5C518',
    accentSecondaryLight: '#FFE135',

    gradientStart: '#E53935',
    gradientMid: '#EF5350',
    gradientEnd: '#F5C518',
    gradientButtonStart: '#E53935',
    gradientButtonEnd: '#F5C518',

    success: '#43A047',
    successLight: '#66BB6A',
    warning: '#FF6F00',
    danger: '#E53935',
    info: '#3949AB',

    morado: '#7B1FA2',
    moradoClaro: '#9C27B0',
    moradoOscuro: '#4A148C',
    rosa: '#EC407A',
    rosaClaro: '#F06292',
    rosaMaggie: '#F48FB1',
    azul: '#1A237E',
    azulClaro: '#3949AB',
    azulHomero: '#1A237E',
    verde: '#43A047',
    verdeClaro: '#66BB6A',
    verdeOscuro: '#2E7D32',
    verdeMarge: '#43A047',
    naranja: '#FF6F00',
    naranjaClaro: '#FFA726',
    naranjaBart: '#FF6F00',

    platino: '#78909C',
    oro: '#F9A825',
    plata: '#BDBDBD',
    bronce: '#A1887F',

    blanco: '#FFFFFF',
    negro: '#1A1A1A',
    gris: '#9E9E9E',
    grisClaro: '#E0E0E0',
    grisOscuro: '#616161',
    amarillo: '#F5C518',
    amarilloClaro: '#FFE135',
    amarilloOscuro: '#D4A800',
    rojo: '#E53935',
    rojoClaro: '#FF6B6B',
    rojoOscuro: '#C62828',
    isDark: false,
};

// ============================================================
// 🌙 PALETA OSCURA
// ============================================================
export const PALETA_OSCURA: PaletaTema = {
    fondo: '#0D0D0D',
    fondoAlt: '#1A1A1A',
    surface: '#1A1A1A',
    surfaceHover: '#242424',
    card: '#1A1A1A',
    cardShadow: 'rgba(0,0,0,0.4)',
    cardShadowHeavy: 'rgba(0,0,0,0.6)',
    border: 'rgba(255,255,255,0.08)',
    borderLight: 'rgba(255,255,255,0.05)',

    text: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.65)',
    textTertiary: 'rgba(255,255,255,0.35)',

    accent: '#FF5252',
    accentLight: '#FF8A80',
    accentSecondary: '#FFD54F',
    accentSecondaryLight: '#FFE082',

    gradientStart: '#B71C1C',
    gradientMid: '#E53935',
    gradientEnd: '#F5C518',
    gradientButtonStart: '#E53935',
    gradientButtonEnd: '#F5C518',

    success: '#66BB6A',
    successLight: '#81C784',
    warning: '#FFA726',
    danger: '#EF5350',
    info: '#64B5F6',

    morado: '#AB47BC',
    moradoClaro: '#BA68C8',
    moradoOscuro: '#7B1FA2',
    rosa: '#F06292',
    rosaClaro: '#F48FB1',
    rosaMaggie: '#F8BBD0',
    azul: '#5C6BC0',
    azulClaro: '#7986CB',
    azulHomero: '#5C6BC0',
    verde: '#66BB6A',
    verdeClaro: '#81C784',
    verdeOscuro: '#388E3C',
    verdeMarge: '#66BB6A',
    naranja: '#FFA726',
    naranjaClaro: '#FFB74D',
    naranjaBart: '#FFA726',

    platino: '#90A4AE',
    oro: '#FFCA28',
    plata: '#E0E0E0',
    bronce: '#BCAAA4',

    blanco: '#FFFFFF',
    negro: '#0A0A0A',
    gris: '#BDBDBD',
    grisClaro: '#424242',
    grisOscuro: '#9E9E9E',
    amarillo: '#FFD54F',
    amarilloClaro: '#FFE082',
    amarilloOscuro: '#FFC107',
    rojo: '#EF5350',
    rojoClaro: '#FF8A80',
    rojoOscuro: '#C62828',
    isDark: true,
};

// ============================================================
// 🎯 TEMAS COMPLETOS
// ============================================================
export const TEMA_CLARO: Tema = { colors: PALETA_CLARA, isDark: false };
export const TEMA_OSCURO: Tema = { colors: PALETA_OSCURA, isDark: true };

// ============================================================
// 💾 PERSISTENCIA
// ============================================================
export const STORAGE_KEY_TEMA = '@tema_preferido';

// ============================================================
// 🧠 CONTEXTO
// ============================================================
interface TemaContextValue {
    modo: ModoTema;
    tema: Tema;
    esOscuro: boolean;
    setModo: (modo: ModoTema) => Promise<void>;
    toggleTema: () => Promise<void>;
    cargando: boolean;
}

const TemaContext = createContext<TemaContextValue | null>(null);

// ============================================================
// 🏗️ PROVIDER
// ============================================================
interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    // ⚠️ useColorScheme puede devolver null en el primer render
    const sistemaOscuro = useColorScheme() === 'dark';
    const [modo, setModoState] = useState<ModoTema>('sistema');
    const [cargando, setCargando] = useState(true);

    // ============================================================
    // 📥 CARGAR PREFERENCIA GUARDADA AL INICIAR
    // ============================================================
    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                const guardado = (await AsyncStorage.getItem(STORAGE_KEY_TEMA)) as ModoTema | null;

                if (__DEV__) {
                    console.log('🎨 [Theme] Preferencia leída:', guardado);
                }

                if (!mounted) return;

                if (guardado === 'claro' || guardado === 'oscuro' || guardado === 'sistema') {
                    setModoState(guardado);
                    if (__DEV__) {
                        console.log('🎨 [Theme] Modo restaurado:', guardado);
                    }
                } else {
                    if (__DEV__) {
                        console.log('🎨 [Theme] Sin preferencia guardada, usando "sistema"');
                    }
                }
            } catch (e) {
                console.warn('⚠️ [Theme] No se pudo leer preferencia:', e);
            } finally {
                if (mounted) setCargando(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

    // ============================================================
    // 🎨 RESOLVER TEMA EFECTIVO
    // ============================================================
    const esOscuro = useMemo(() => {
        if (modo === 'oscuro') return true;
        if (modo === 'claro') return false;
        return sistemaOscuro;
    }, [modo, sistemaOscuro]);

    const tema = esOscuro ? TEMA_OSCURO : TEMA_CLARO;

    // ============================================================
    // 💾 GUARDAR MODO
    // ============================================================
    const setModo = useCallback(async (nuevo: ModoTema) => {
        if (__DEV__) {
            console.log('🎨 [Theme] Guardando modo:', nuevo);
        }

        // 1. Actualizar el estado inmediatamente (UI responsiva)
        setModoState(nuevo);

        // 2. Persistir en AsyncStorage
        try {
            await AsyncStorage.setItem(STORAGE_KEY_TEMA, nuevo);

            if (__DEV__) {
                console.log('🎨 [Theme] Modo guardado OK:', nuevo);
            }
        } catch (e) {
            console.warn('⚠️ [Theme] No se pudo guardar preferencia:', e);
        }
    }, []);

    const toggleTema = useCallback(async () => {
        await setModo(esOscuro ? 'claro' : 'oscuro');
    }, [esOscuro, setModo]);

    const value = useMemo<TemaContextValue>(
        () => ({ modo, tema, esOscuro, setModo, toggleTema, cargando }),
        [modo, tema, esOscuro, setModo, toggleTema, cargando]
    );

    return <TemaContext.Provider value={value}>{children}</TemaContext.Provider>;
};

// ============================================================
// 🪝 HOOKS
// ============================================================
export const useTema = (): TemaContextValue => {
    const ctx = useContext(TemaContext);
    if (!ctx) {
        throw new Error('useTema debe usarse dentro de <ThemeProvider>');
    }
    return ctx;
};

export const useColores = (): PaletaTema => useTema().tema.colors;

export default ThemeProvider;