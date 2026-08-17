// components/BarraInferiorProfesional.tsx
import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colores } from '../lib/colores';
import { IconProps } from '@expo/vector-icons/build/createIconSet';

// ✅ TEMÁTICA KRUSTY - VERSIÓN SOFISTICADA
const temaApp = {
    primario: '#E53935',
    secundario: '#F5C518',
    verde: '#43A047',
    fondo: '#1A1A1A',
    texto: '#FFFFFF',
    textoGris: '#B0B0B0',
    tabBar: {
        fondo: 'rgba(241, 5, 5, 0.91)',
        borde: 'rgba(241, 5, 5, 0.91)',
        activo: '#f7f7f1',
        inactivo: 'rgb(247, 222, 222)',
        sombra: 'rgba(241, 5, 5, 0.91)',
        gradiente: ['rgba(197, 46, 46, 0.91)', 'rgba(148, 13, 13, 0.85)'] as const,
    },
};

// ✅ TIPO CORRECTO PARA LOS ICONOS DE IONICONS
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabItem {
    name: string;
    label: string;
    icon: IoniconName;
    iconFocused: IoniconName;
}

interface Props {
    state?: any;
    descriptors?: any;
    navigation?: any;
    badge?: number;
}

export default function BarraInferiorProfesional({ state, descriptors, navigation, badge = 0 }: Props) {
    const insets = useSafeAreaInsets();
    const translateY = useRef(new Animated.Value(50)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    // ✅ Animación de entrada
    useEffect(() => {
        Animated.parallel([
            Animated.spring(translateY, {
                toValue: 0,
                friction: 10,
                tension: 40,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // ✅ TABS CON TIPADO CORRECTO
    const tabs: TabItem[] = [
        { name: 'Inicio', label: 'Inicio', icon: 'home-outline', iconFocused: 'home' },
        { name: 'Menu', label: 'Menú', icon: 'restaurant-outline', iconFocused: 'restaurant' },
        { name: 'Ofertas', label: 'Ofertas', icon: 'pricetag-outline', iconFocused: 'pricetag' },
        { name: 'Pedidos', label: 'Pedidos', icon: 'receipt-outline', iconFocused: 'receipt' },
        { name: 'Perfil', label: 'Perfil', icon: 'person-outline', iconFocused: 'person' },
    ];

    // ✅ MANEJO DE SEGURIDAD PARA STATE
    const isFocused = (routeName: string) => {
        if (!state || !state.routes || state.routes.length === 0) {
            return routeName === 'Inicio';
        }
        return state.routes[state.index]?.name === routeName;
    };

    const onPress = (routeName: string) => {
        if (!navigation) return;

        const event = navigation.emit({
            type: 'tabPress',
            target: routeName,
            canPreventDefault: true,
        });

        if (!event.defaultPrevented) {
            navigation.navigate(routeName);
        }
    };

    // ✅ SI NO HAY STATE, NO RENDERIZAR
    if (!state || !state.routes) {
        return null;
    }

    // ✅ Colores de la temática
    const tabColors = temaApp.tabBar;

    return (
        <Animated.View
            style={[
                styles.contenedor,
                {
                    transform: [{ translateY }],
                    opacity,
                    paddingBottom: Platform.OS === 'android'
                        ? insets.bottom + 12
                        : insets.bottom + 16,
                    paddingTop: Platform.OS === 'android' ? 12 : 10,
                    backgroundColor: tabColors.fondo,
                    borderTopColor: tabColors.borde,
                    shadowColor: tabColors.sombra,
                },
            ]}
        >
            {/* ✅ Fondo con gradiente sutil */}
            <LinearGradient
                colors={tabColors.gradiente}
                style={styles.fondoGradiente}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            />

            {/* ✅ Borde superior con gradiente elegante */}
            <LinearGradient
                colors={['transparent', tabColors.activo + '30', 'transparent']}
                style={styles.bordeSuperior}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            />

            {/* ✅ Botones */}
            <View style={styles.botonesContainer}>
                {tabs.map((tab) => {
                    const focused = isFocused(tab.name);

                    return (
                        <TouchableOpacity
                            key={tab.name}
                            activeOpacity={0.7}
                            style={styles.boton}
                            onPress={() => onPress(tab.name)}
                        >
                            <View style={styles.botonContenido}>
                                {/* ✅ Icono con efecto de escala */}
                                <Animated.View
                                    style={[
                                        styles.iconoWrapper,
                                        focused && styles.iconoWrapperActivo,
                                    ]}
                                >
                                    <Ionicons
                                        name={focused ? tab.iconFocused : tab.icon}
                                        size={focused ? 26 : 22}
                                        color={focused ? tabColors.activo : tabColors.inactivo}
                                    />
                                </Animated.View>

                                {/* ✅ Etiqueta */}
                                <Text
                                    style={[
                                        styles.etiqueta,
                                        {
                                            color: focused ? tabColors.activo : tabColors.inactivo,
                                            fontWeight: focused ? '700' : '500',
                                            fontSize: focused ? 11 : 10,
                                            opacity: focused ? 1 : 0.6,
                                        },
                                    ]}
                                >
                                    {tab.label}
                                </Text>

                                {/* ✅ Badge en Perfil */}
                                {tab.name === 'Perfil' && badge > 0 && (
                                    <View style={styles.badgeContainer}>
                                        <LinearGradient
                                            colors={['#FF6B6B', temaApp.primario]}
                                            style={styles.badgeGradiente}
                                        >
                                            <Text style={styles.badgeTexto}>{badge > 99 ? '99+' : badge}</Text>
                                        </LinearGradient>
                                    </View>
                                )}

                                {/* ✅ Indicador de foco */}
                                {focused && (
                                    <View style={styles.indicadorContainer}>
                                        <LinearGradient
                                            colors={[tabColors.activo, tabColors.activo + '60']}
                                            style={styles.indicador}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        />
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </Animated.View>
    );
}

// ============================================================
// 🎨 ESTILOS - SOFISTICADOS Y ELEGANTES
// ============================================================
const styles = StyleSheet.create({
    contenedor: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        overflow: 'hidden',
        borderTopWidth: 1,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 25,
    },
    fondoGradiente: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    bordeSuperior: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
    },
    botonesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        height: 68,
    },
    boton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 2,
    },
    botonContenido: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        width: '100%',
    },
    iconoWrapper: {
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconoWrapperActivo: {
        // Espacio para el indicador
    },
    etiqueta: {
        marginTop: 2,
        textAlign: 'center',
        letterSpacing: 0.3,
    },
    badgeContainer: {
        position: 'absolute',
        top: -4,
        right: '18%',
        borderRadius: 12,
        overflow: 'hidden',
        minWidth: 18,
        height: 18,
        shadowColor: '#E53935',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 4,
    },
    badgeGradiente: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeTexto: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: 'bold',
        includeFontPadding: false,
    },
    indicadorContainer: {
        position: 'absolute',
        bottom: -6,
        left: '28%',
        right: '28%',
        height: 3,
        borderRadius: 2,
        overflow: 'hidden',
    },
    indicador: {
        flex: 1,
        borderRadius: 2,
    },
});