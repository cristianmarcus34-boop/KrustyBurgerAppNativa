// components/SplashScreen.tsx - COMPLETO Y ACTUALIZADO
import React, { useEffect, useRef } from 'react';
import {
    View,
    Image,
    StyleSheet,
    Animated,
    Dimensions,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface Props {
    onFinish: () => void;
    duration?: number;
}

export default function SplashScreen({ onFinish, duration = 3000 }: Props) {
    const scaleAnim = useRef(new Animated.Value(0.5)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const spinAnim = useRef(new Animated.Value(0)).current;

    // ✅ TAMAÑO DEL LOGO (responsive)
    const logoSize = Math.min(width * 0.5, 250);

    useEffect(() => {
        // ✅ Animación de entrada del logo
        Animated.parallel([
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();

        // ✅ Animación del spinner (infinita)
        Animated.loop(
            Animated.timing(spinAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            })
        ).start();

        // ✅ Temporizador para finalizar el splash
        const timer = setTimeout(() => {
            onFinish();
        }, duration);

        return () => clearTimeout(timer);
    }, []);

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            <StatusBar hidden />

            {/* ✅ Fondo con gradiente sutil */}
            <LinearGradient
                colors={['#FFFFFF', '#F5F2ED', '#FFFFFF']}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* ✅ LOGO CON ANIMACIÓN */}
            <Animated.View
                style={[
                    styles.logoContainer,
                    {
                        opacity: opacityAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                <Image
                    source={require('../assets/icon.png')}
                    style={[
                        styles.logo,
                        {
                            width: logoSize,
                            height: logoSize,
                        },
                    ]}
                    resizeMode="contain"
                />
            </Animated.View>

            {/* ✅ SPINNER GIRATORIO */}
            <Animated.View
                style={[
                    styles.spinnerContainer,
                    {
                        transform: [{ rotate: spin }],
                    },
                ]}
            >
                <View style={styles.spinner} />
            </Animated.View>

            {/* ✅ TEXTO "Cargando..." */}
            <Animated.Text style={[styles.loadingText, { opacity: opacityAnim }]}>
                Cargando...
            </Animated.Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    gradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    logo: {
        borderRadius: 35,
        backgroundColor: 'transparent',
    },
    spinnerContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        marginTop: 35,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(245, 197, 24, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(229, 57, 53, 0.1)',
    },
    spinner: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 4,
        borderColor: 'transparent',
        borderTopColor: '#F5C518',
        borderRightColor: '#E53935',
        borderBottomColor: '#F5C518',
        borderLeftColor: 'transparent',
    },
    loadingText: {
        marginTop: 24,
        fontSize: 15,
        color: '#888888',
        fontWeight: '500',
        letterSpacing: 1.5,
    },
});