// utils/perfilOnboardingHelper.ts
// Helper para detectar qué datos del perfil faltan y gestionar
// qué modales ya le ofrecimos al usuario (evita ser repetitivo).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Perfil } from '../lib/tipos';

// ============================================================
// 📋 TIPOS
// ============================================================

export type TipoDatoFaltante = 'telefono' | 'direccion' | 'cumpleanos' | 'bienvenida';

export interface EstadoOnboarding {
    bienvenidaVista: boolean;
    telefonoOfrecido: boolean;
    direccionOfrecida: boolean;
    cumpleanosOfrecido: boolean;
}

const DEFAULT_ESTADO: EstadoOnboarding = {
    bienvenidaVista: false,
    telefonoOfrecido: false,
    direccionOfrecida: false,
    cumpleanosOfrecido: false,
};

// ============================================================
// 🔑 CLAVES DE STORAGE (por usuario)
// ============================================================

const KEY_PREFIX = '@krusty_onboarding_v1';

const getKey = (userId: string) => `${KEY_PREFIX}_${userId}`;

// ============================================================
// 💾 LEER / GUARDAR ESTADO
// ============================================================

export async function leerEstadoOnboarding(userId: string): Promise<EstadoOnboarding> {
    if (!userId) return { ...DEFAULT_ESTADO };
    try {
        const raw = await AsyncStorage.getItem(getKey(userId));
        if (!raw) return { ...DEFAULT_ESTADO };
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_ESTADO, ...parsed };
    } catch (error) {
        console.error('❌ [onboarding] Error leyendo estado:', error);
        return { ...DEFAULT_ESTADO };
    }
}

export async function guardarEstadoOnboarding(
    userId: string,
    estado: Partial<EstadoOnboarding>,
): Promise<void> {
    if (!userId) return;
    try {
        const actual = await leerEstadoOnboarding(userId);
        const nuevo = { ...actual, ...estado };
        await AsyncStorage.setItem(getKey(userId), JSON.stringify(nuevo));
    } catch (error) {
        console.error('❌ [onboarding] Error guardando estado:', error);
    }
}

export async function marcarOfrecido(
    userId: string,
    tipo: TipoDatoFaltante,
): Promise<void> {
    const mapa: Record<TipoDatoFaltante, keyof EstadoOnboarding> = {
        bienvenida: 'bienvenidaVista',
        telefono: 'telefonoOfrecido',
        direccion: 'direccionOfrecida',
        cumpleanos: 'cumpleanosOfrecido',
    };
    const campo = mapa[tipo];
    await guardarEstadoOnboarding(userId, { [campo]: true });
}

// ============================================================
// 🔍 DETECCIÓN DE DATOS FALTANTES
// ============================================================

export function tieneTelefono(perfil: Perfil | null | undefined): boolean {
    return Boolean(perfil?.telefono && perfil.telefono.trim().length >= 6);
}

export function tieneDireccion(perfil: Perfil | null | undefined): boolean {
    return Boolean(
        perfil?.direccion_calle &&
        perfil.direccion_calle.trim().length > 0 &&
        perfil?.direccion_numero &&
        perfil.direccion_numero.trim().length > 0,
    );
}

export function tieneCumpleanos(perfil: Perfil | null | undefined): boolean {
    return Boolean((perfil as any)?.fecha_nacimiento);
}

// ============================================================
// 🎯 SIGUIENTE DATO A PEDIR
// ============================================================

/**
 * Devuelve el próximo dato que conviene pedirle al usuario,
 * o null si ya está todo completo / ya se le ofreció antes.
 */
export function siguienteDatoFaltante(
    perfil: Perfil | null | undefined,
    estado: EstadoOnboarding,
    contexto: 'onboarding' | 'checkout' = 'onboarding',
): TipoDatoFaltante | null {
    if (!perfil) return null;

    // ─── En Checkout: solo pedimos lo que BLOQUEA la compra ───
    if (contexto === 'checkout') {
        if (!tieneTelefono(perfil)) return 'telefono';
        if (!tieneDireccion(perfil)) return 'direccion';
        return null;
    }

    // ─── En Onboarding: pedimos en orden de prioridad ───
    // 1. Bienvenida (una sola vez, la primera vez)
    if (!estado.bienvenidaVista) return 'bienvenida';

    // 2. Teléfono (crítico, y no se lo ofrecimos antes)
    if (!tieneTelefono(perfil) && !estado.telefonoOfrecido) return 'telefono';

    // 3. Cumpleaños (nice to have)
    if (!tieneCumpleanos(perfil) && !estado.cumpleanosOfrecido) return 'cumpleanos';

    // 4. Dirección → la dejamos para el checkout

    return null;
}

// ============================================================
// 🎂 HELPERS DE CUMPLEAÑOS
// ============================================================

/**
 * Convierte el formato legado "DD/MM" a una fecha ISO usando el año 2000.
 */
export function parsearCumpleanosDDMM(valor: string): string | null {
    const limpio = valor.trim();
    const match = limpio.match(/^(\d{1,2})[\/\-](\d{1,2})$/);
    if (!match) return null;

    const dia = parseInt(match[1], 10);
    const mes = parseInt(match[2], 10);

    if (dia < 1 || dia > 31 || mes < 1 || mes > 12) return null;

    const dd = String(dia).padStart(2, '0');
    const mm = String(mes).padStart(2, '0');
    return `2000-${mm}-${dd}`; // Año "placeholder" — no lo pedimos
}

/**
 * Convierte "DD/MM/AAAA" a una fecha ISO (YYYY-MM-DD).
 */
export function parsearCumpleanosDDMMAAAA(valor: string): string | null {
    const limpio = valor.trim();
    const match = limpio.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;

    const dia = parseInt(match[1], 10);
    const mes = parseInt(match[2], 10);
    const anio = parseInt(match[3], 10);
    const ahora = new Date();

    if (anio < 1 || anio > ahora.getFullYear() || mes < 1 || mes > 12) return null;

    const diasPorMes = [
        31,
        anio % 4 === 0 && (anio % 100 !== 0 || anio % 400 === 0) ? 29 : 28,
        31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
    ];
    if (dia < 1 || dia > diasPorMes[mes - 1]) return null;
    if (
        anio === ahora.getFullYear()
        && (mes > ahora.getMonth() + 1 || (mes === ahora.getMonth() + 1 && dia > ahora.getDate()))
    ) {
        return null;
    }

    const dd = String(dia).padStart(2, '0');
    const mm = String(mes).padStart(2, '0');
    const yyyy = String(anio).padStart(4, '0');
    return `${yyyy}-${mm}-${dd}`;
}

/**
 * Formatea una fecha ISO (YYYY-MM-DD) a "DD/MM" para mostrar.
 */
export function formatearCumpleanosDDMM(fechaISO: string | null | undefined): string {
    if (!fechaISO) return '';
    const partes = fechaISO.split('-'); // ['2000', '05', '14']
    if (partes.length < 3) return '';
    return `${partes[2]}/${partes[1]}`;
}

/**
 * Formatea una fecha ISO (YYYY-MM-DD) a "DD/MM/AAAA".
 */
export function formatearCumpleanosDDMMAAAA(fechaISO: string | null | undefined): string {
    if (!fechaISO) return '';
    const partes = fechaISO.split('-');
    if (partes.length !== 3) return '';
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}