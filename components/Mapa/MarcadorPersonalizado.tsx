// components/Mapa/MarcadorPersonalizado.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colores } from '../../lib/colores';

interface Props {
    color?: string;
    size?: 'small' | 'normal' | 'large';
    showRing?: boolean;
}

export const MarcadorPersonalizado = ({
    color = Colores.bartNaranja,
    size = 'normal',
    showRing = true
}: Props) => {
    const tamanos = {
        small: { punto: 16, anillo: 36 },
        normal: { punto: 24, anillo: 50 },
        large: { punto: 32, anillo: 64 },
    };

    const t = tamanos[size];

    return (
        <View style={styles.marcadorContainer}>
            <View style={[
                styles.marcadorPunto,
                {
                    width: t.punto,
                    height: t.punto,
                    borderRadius: t.punto / 2,
                    backgroundColor: color,
                }
            ]} />
            {showRing && (
                <View style={[
                    styles.marcadorAnillo,
                    {
                        width: t.anillo,
                        height: t.anillo,
                        borderRadius: t.anillo / 2,
                        backgroundColor: color + '20',
                        borderColor: color + '30',
                    }
                ]} />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    marcadorContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    marcadorPunto: {
        borderWidth: 3,
        borderColor: Colores.textoClaro,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 6,
        zIndex: 2,
    },
    marcadorAnillo: {
        position: 'absolute',
        borderWidth: 1,
        zIndex: 1,
    },
});