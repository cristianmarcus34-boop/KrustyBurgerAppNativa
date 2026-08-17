// components/Mapa/MarcadorMoto.tsx
import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colores } from '../../lib/colores';

interface Props {
    animated?: boolean;
    scale?: Animated.Value;
    size?: 'small' | 'normal' | 'large';
}

export const MarcadorMoto = ({ animated = true, scale, size = 'normal' }: Props) => {
    const tamanos = {
        small: { circle: 32, icon: 18, pulseOuter: 50, pulseInner: 70 },
        normal: { circle: 44, icon: 24, pulseOuter: 60, pulseInner: 80 },
        large: { circle: 56, icon: 32, pulseOuter: 80, pulseInner: 100 },
    };

    const t = tamanos[size];

    const Container = animated && scale ? Animated.View : View;

    return (
        <Container style={[styles.motoMarker, animated && scale && { transform: [{ scale }] }]}>
            <View style={[styles.motoCircle, { width: t.circle, height: t.circle, borderRadius: t.circle / 2 }]}>
                <Ionicons name="bicycle" size={t.icon} color="#000000" />
            </View>
            <View style={[styles.motoPulseOuter, { width: t.pulseOuter, height: t.pulseOuter, borderRadius: t.pulseOuter / 2 }]} />
            <View style={[styles.motoPulseInner, { width: t.pulseInner, height: t.pulseInner, borderRadius: t.pulseInner / 2 }]} />
        </Container>
    );
};

const styles = StyleSheet.create({
    motoMarker: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    motoCircle: {
        backgroundColor: '#F5C518',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        zIndex: 2,
    },
    motoPulseOuter: {
        position: 'absolute',
        backgroundColor: 'rgba(245, 197, 24, 0.2)',
        zIndex: 1,
    },
    motoPulseInner: {
        position: 'absolute',
        backgroundColor: 'rgba(245, 197, 24, 0.08)',
        zIndex: 0,
    },
});