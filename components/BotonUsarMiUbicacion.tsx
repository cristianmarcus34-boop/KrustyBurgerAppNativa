// components/BotonUsarMiUbicacion.tsx
// Botón reutilizable "Usar mi ubicación actual" con estados visuales

import React, { useState } from 'react';
import {
    TouchableOpacity,
    Text,
    View,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { DISENO } from '../lib/colores';
import { FUENTES } from '../lib/fuentes';
import {
    obtenerUbicacionConDireccion,
    DireccionNormalizada,
} from '../utils/ubicacionHelper';

type Estado = 'idle' | 'cargando' | 'ok' | 'error';

interface Props {
    /** Callback con la dirección normalizada obtenida */
    onUbicacionObtenida: (direccion: DireccionNormalizada) => void;
    /** Callback opcional si falla */
    onError?: (mensaje: string) => void;
    /** Texto personalizado (default: "Usar mi ubicación actual") */
    texto?: string;
    /** Variante visual */
    variante?: 'primario' | 'secundario' | 'compacto';
    /** Deshabilitar el botón */
    disabled?: boolean;
}

export default function BotonUsarMiUbicacion({
    onUbicacionObtenida,
    onError,
    texto = 'Usar mi ubicación actual',
    variante = 'primario',
    disabled = false,
}: Props) {
    const [estado, setEstado] = useState<Estado>('idle');

    const handlePress = async () => {
        if (estado === 'cargando' || disabled) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
        setEstado('cargando');

        try {
            const direccion = await obtenerUbicacionConDireccion(true);

            if (!direccion) {
                setEstado('error');
                onError?.('No pudimos obtener tu ubicación');
                setTimeout(() => setEstado('idle'), 2500);
                return;
            }

            if (!direccion.tieneDireccionReal) {
                // Tenemos coordenadas pero no dirección legible
                Alert.alert(
                    '📍 Ubicación capturada',
                    'Obtuvimos tus coordenadas pero no pudimos detectar la dirección exacta. Podés completarla manualmente si hace falta.',
                    [{ text: 'Entendido' }],
                );
            }

            onUbicacionObtenida(direccion);
            setEstado('ok');

            setTimeout(() => setEstado('idle'), 2000);
        } catch (error: any) {
            console.error('❌ [BotonUsarMiUbicacion] Error:', error);
            setEstado('error');
            onError?.(error?.message || 'Error inesperado');
            setTimeout(() => setEstado('idle'), 2500);
        }
    };

    // ─── Estilos según variante ─────────────────────────────
    const esCompacto = variante === 'compacto';
    const esSecundario = variante === 'secundario';

    const backgroundColor = esSecundario
        ? DISENO.colors.info + '15'
        : DISENO.colors.accentSecondary;

    const borderColor = esSecundario
        ? DISENO.colors.info + '30'
        : DISENO.colors.accentSecondary;

    const textColor = esSecundario ? DISENO.colors.info : DISENO.colors.text;

    const iconColor = textColor;

    const contenido = () => {
        if (estado === 'cargando') {
            return (
                <>
                    <ActivityIndicator size="small" color={textColor} />
                    <Text style={[styles.texto, { color: textColor, fontSize: esCompacto ? 12 : 14 }]}>
                        Obteniendo ubicación...
                    </Text>
                </>
            );
        }

        if (estado === 'ok') {
            return (
                <>
                    <Ionicons name="checkmark-circle" size={esCompacto ? 16 : 20} color={DISENO.colors.success} />
                    <Text style={[styles.texto, { color: DISENO.colors.success, fontSize: esCompacto ? 12 : 14 }]}>
                        ¡Ubicación obtenida!
                    </Text>
                </>
            );
        }

        if (estado === 'error') {
            return (
                <>
                    <Ionicons name="alert-circle" size={esCompacto ? 16 : 20} color={DISENO.colors.accent} />
                    <Text style={[styles.texto, { color: DISENO.colors.accent, fontSize: esCompacto ? 12 : 14 }]}>
                        No pudimos obtenerla
                    </Text>
                </>
            );
        }

        return (
            <>
                <Ionicons name="locate" size={esCompacto ? 16 : 20} color={iconColor} />
                <Text style={[styles.texto, { color: textColor, fontSize: esCompacto ? 12 : 14 }]}>
                    {texto}
                </Text>
            </>
        );
    };

    return (
        <TouchableOpacity
            style={[
                styles.boton,
                {
                    backgroundColor,
                    borderColor,
                    paddingVertical: esCompacto ? 8 : 12,
                    paddingHorizontal: esCompacto ? 12 : 16,
                    opacity: disabled ? 0.5 : 1,
                },
            ]}
            onPress={handlePress}
            disabled={disabled || estado === 'cargando'}
            activeOpacity={0.75}
        >
            {contenido()}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    boton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 12,
        borderWidth: 1,
    },
    texto: {
        fontFamily: FUENTES.display,
        fontWeight: '600',
        includeFontPadding: false,
    },
});