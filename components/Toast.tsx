import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colores } from '../lib/colores';

// ✅ Tipo definido correctamente
export type TipoToast = 'exito' | 'error' | 'advertencia' | 'info';

// ✅ Hook con tipos correctos
export const useToast = () => {
    const [visible, setVisible] = useState(false);
    const [mensaje, setMensaje] = useState('');
    const [tipo, setTipo] = useState<TipoToast>('info');

    const mostrar = (texto: string, tipoToast: TipoToast = 'info') => {
        setMensaje(texto);
        setTipo(tipoToast);
        setVisible(true);
        setTimeout(() => setVisible(false), 2500);
    };

    const ocultar = () => setVisible(false);

    return {
        visible,
        mensaje,
        tipo,
        mostrar,
        ocultar,
        // Atajos
        exito: (texto: string) => mostrar(texto, 'exito'),
        error: (texto: string) => mostrar(texto, 'error'),
        advertencia: (texto: string) => mostrar(texto, 'advertencia'),
        info: (texto: string) => mostrar(texto, 'info'),
    };
};

// ✅ Props con tipos correctos
interface ToastProps {
    visible: boolean;
    mensaje: string;
    tipo: TipoToast;
    ocultar: () => void;
}

// ✅ Componente con tipos correctos
export const Toast = ({ visible, mensaje, tipo, ocultar }: ToastProps) => {
    const translateY = useRef(new Animated.Value(-80)).current;

    useEffect(() => {
        Animated.spring(translateY, {
            toValue: visible ? 0 : -80,
            friction: 8,
            useNativeDriver: true,
        }).start();
    }, [visible]);

    if (!visible) return null;

    // ✅ Diccionarios con tipo correcto usando Record
    const iconos: Record<TipoToast, keyof typeof Ionicons.glyphMap> = {
        exito: 'checkmark-circle',
        error: 'close-circle',
        advertencia: 'warning',
        info: 'information-circle',
    };

    const colores: Record<TipoToast, string> = {
        exito: '#4CAF50',
        error: '#FF5252',
        advertencia: '#FFA726',
        info: Colores.frinkAzul,
    };

    // ✅ Acceso seguro con el tipo correcto
    const icono = iconos[tipo];
    const color = colores[tipo];

    return (
        <Animated.View
            style={[
                styles.overlay,
                { transform: [{ translateY }] },
            ]}
        >
            <View style={[styles.toast, { borderLeftColor: color }]}>
                <Ionicons name={icono} size={22} color={color} />
                <Text style={styles.texto}>{mensaje}</Text>
                <TouchableOpacity onPress={ocultar}>
                    <Ionicons name="close" size={18} color={Colores.frinkGris} />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        zIndex: 9999,
    },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 14,
        borderRadius: 12,
        borderLeftWidth: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 6,
        gap: 12,
    },
    texto: {
        flex: 1,
        fontSize: 14,
        color: Colores.frinkAzul,
        fontWeight: '500',
    },
});