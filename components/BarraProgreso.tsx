// components/BarraProgreso.tsx
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
    progreso: number; // 0 a 100
    color: string;
    label?: string;
    altura?: number;
}

export default function BarraProgreso({ progreso, color, label, altura = 8 }: Props) {
    const progresoValido = Math.min(100, Math.max(0, progreso));

    return (
        <View style={styles.container}>
            {label && (
                <View style={styles.labelContainer}>
                    <Text style={styles.label}>{label}</Text>
                    <Text style={styles.porcentaje}>{Math.round(progresoValido)}%</Text>
                </View>
            )}
            <View style={[styles.barraFondo, { height: altura }]}>
                <LinearGradient
                    colors={[color, color + '80']}
                    style={[
                        styles.barraProgreso,
                        {
                            width: `${progresoValido}%`,
                            height: altura,
                        }
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    labelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    label: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    porcentaje: {
        fontSize: 12,
        color: '#1A1A1A',
        fontWeight: '600',
    },
    barraFondo: {
        backgroundColor: '#F0F0F0',
        borderRadius: 4,
        overflow: 'hidden',
        width: '100%',
    },
    barraProgreso: {
        borderRadius: 4,
    },
});