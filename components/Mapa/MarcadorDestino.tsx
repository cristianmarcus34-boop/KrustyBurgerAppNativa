// components/Mapa/MarcadorDestino.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colores } from '../../lib/colores';

interface Props {
    size?: 'small' | 'normal' | 'large';
}

export const MarcadorDestino = ({ size = 'normal' }: Props) => {
    const tamanos = {
        small: 32,
        normal: 44,
        large: 56,
    };

    const t = tamanos[size];

    return (
        <View style={[styles.destinoMarker, { width: t, height: t, borderRadius: t / 2 }]}>
            <Ionicons name="flag" size={t * 0.6} color="#FFFFFF" />
        </View>
    );
};

const styles = StyleSheet.create({
    destinoMarker: {
        backgroundColor: Colores.secundario,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
});