// screens/cliente/PantallaTerminos.tsx - UNIFICADA
import React, { useRef, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    Share,
    Alert,
    Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { DISENO, useResponsive } from '../../lib/colores';

export default function PantallaTerminos({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const responsive = useResponsive();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(30)).current;
    const [fechaActual, setFechaActual] = useState('');

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(slideUpAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]).start();

        const ahora = new Date();
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        setFechaActual(`${meses[ahora.getMonth()]} ${ahora.getFullYear()}`);
    }, []);

    const isTablet = responsive.isTablet;
    const paddingHorizontal = responsive.getEspaciado('LG');

    const handleGoBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.navigate('Principal', { screen: 'Inicio' });
        }
    };

    const compartirTerminos = async () => {
        try {
            const textoCompleto = `
📋 TÉRMINOS Y CONDICIONES - KRUSTY BURGER

📌 1. Aceptación de los Términos
Al utilizar la aplicación Krusty Burger, operada técnicamente por Agencia Powa, aceptas cumplir con estos Términos y Condiciones.

📝 2. Registro y Cuenta
• Para usar la aplicación, debes registrarte con información verídica.
• Eres responsable de mantener la confidencialidad de tu contraseña.
• Puedes eliminar tu cuenta en cualquier momento desde la sección de perfil.

💻 3. Uso de la Plataforma
• El usuario se compromete a utilizar el sitio únicamente para realizar pedidos legítimos.
• Queda prohibida cualquier acción que pueda dañar la infraestructura.

💰 4. Precios y Disponibilidad
• Los precios están en pesos argentinos (ARS) e incluyen IVA.
• Krusty Burger se reserva el derecho de modificar los precios sin previo aviso.
• Las imágenes son de carácter ilustrativo.

💳 5. Pagos y Reembolsos
• Los pagos se procesan a través de Mercado Pago y efectivo.
• Los reembolsos se realizan dentro de los 5 minutos de la recepción del pedido.

⭐ 6. Programa de Puntos
• Los puntos se acumulan por cada compra realizada.
• Los puntos tienen una validez de 1 año desde su obtención.
• Los puntos no son transferibles ni canjeables por dinero en efectivo.

🚚 7. Entregas
• Los tiempos de entrega son estimados y pueden variar.
• La distancia de entrega está limitada a 7 km del local.
• El costo de envío se calcula automáticamente según la distancia.

🔒 8. Privacidad
• Tus datos personales están protegidos según la Ley 25.326.
• No compartimos tus datos con terceros sin tu consentimiento.
• Podés solicitar la eliminación de tus datos en cualquier momento.

🛠️ 9. Responsabilidad de Agencia Powa
• Agencia Powa actúa como socio tecnológico.
• No se responsabiliza por la calidad del producto final.

⚖️ 10. Ley Aplicable
Estos Términos se rigen por las leyes de la República Argentina.

📞 11. Contacto
📧 agenciadigitalpowa@gmail.com
📱 11-3830-5837

Última actualización: ${fechaActual}
            `.trim();

            await Share.share({
                message: textoCompleto,
                title: 'Términos y Condiciones - Krusty Burger',
            });
        } catch (error) {
            console.error('Error al compartir:', error);
        }
    };

    const mostrarInfoVersion = () => {
        Alert.alert(
            '📋 Información del documento',
            `Términos y Condiciones\nVersión: 1.0.0\nÚltima actualización: ${fechaActual}\n\nEste documento es legalmente vinculante al utilizar la aplicación.`,
            [{ text: 'Entendido' }]
        );
    };

    const abrirLink = (url: string) => {
        Linking.openURL(url).catch(() => {
            Alert.alert('❌ Error', 'No se pudo abrir el enlace');
        });
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[DISENO.colors.gradientStart, DISENO.colors.gradientEnd]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <View
                style={[
                    styles.header,
                    {
                        paddingTop: insets.top + (isTablet ? 16 : 12),
                        paddingHorizontal: paddingHorizontal,
                        paddingBottom: isTablet ? 16 : 12,
                    },
                ]}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleGoBack}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={isTablet ? 28 : 24} color={DISENO.colors.surface} />
                </TouchableOpacity>

                <Text style={[styles.title, { fontSize: isTablet ? 26 : 20 }]}>
                    📋 Términos
                </Text>

                <TouchableOpacity
                    style={styles.shareButton}
                    onPress={compartirTerminos}
                    activeOpacity={0.7}
                >
                    <Ionicons name="share-social-outline" size={isTablet ? 26 : 22} color={DISENO.colors.surface} />
                </TouchableOpacity>
            </View>

            <Animated.ScrollView
                style={[
                    styles.scroll,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideUpAnim }],
                    },
                ]}
                contentContainerStyle={[
                    styles.scrollContent,
                    {
                        paddingHorizontal: paddingHorizontal,
                        paddingBottom: insets.bottom + 40,
                        paddingTop: 24,
                    },
                ]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.card}>
                    {/* Badge de versión */}
                    <TouchableOpacity
                        style={styles.versionBadge}
                        onPress={mostrarInfoVersion}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="information-circle-outline" size={16} color={DISENO.colors.textTertiary} />
                        <Text style={[styles.versionBadgeText, { fontSize: isTablet ? 12 : 10 }]}>
                            v1.0.0 • {fechaActual}
                        </Text>
                    </TouchableOpacity>

                    {/* 1. Aceptación */}
                    <Text style={[styles.sectionTitle, { fontSize: isTablet ? 20 : 16 }]}>
                        📌 1. Aceptación de los Términos
                    </Text>
                    <Text style={[styles.text, { fontSize: isTablet ? 15 : 13 }]}>
                        Al utilizar la aplicación Krusty Burger, operada técnicamente por <Text style={styles.bold}>Agencia Powa</Text>, aceptas cumplir con estos Términos y Condiciones.
                        {'\n\n'}Si no estás de acuerdo, por favor no uses la aplicación.
                    </Text>

                    {/* 2. Registro */}
                    <Text style={[styles.sectionTitle, { fontSize: isTablet ? 20 : 16 }]}>
                        📝 2. Registro y Cuenta
                    </Text>
                    <Text style={[styles.text, { fontSize: isTablet ? 15 : 13 }]}>
                        • Para usar la aplicación, debes registrarte con información verídica.{'\n'}
                        • Eres responsable de mantener la confidencialidad de tu contraseña.{'\n'}
                        • Puedes eliminar tu cuenta en cualquier momento desde la sección de perfil.
                    </Text>

                    {/* 3. Uso */}
                    <Text style={[styles.sectionTitle, { fontSize: isTablet ? 20 : 16 }]}>
                        💻 3. Uso de la Plataforma
                    </Text>
                    <Text style={[styles.text, { fontSize: isTablet ? 15 : 13 }]}>
                        • El usuario se compromete a utilizar el sitio únicamente para realizar pedidos legítimos.{'\n'}
                        • Queda prohibida cualquier acción que pueda dañar la infraestructura.{'\n'}
                        • Los pedidos con datos falsos o fraudulentos serán cancelados.
                    </Text>

                    {/* 4. Precios */}
                    <Text style={[styles.sectionTitle, { fontSize: isTablet ? 20 : 16 }]}>
                        💰 4. Precios y Disponibilidad
                    </Text>
                    <Text style={[styles.text, { fontSize: isTablet ? 15 : 13 }]}>
                        • Los precios están en pesos argentinos (ARS) e incluyen IVA.{'\n'}
                        • Krusty Burger se reserva el derecho de modificar los precios sin previo aviso.{'\n'}
                        • Las imágenes son de carácter ilustrativo (especialmente en el caso de las Rib-Wich 🍖).
                    </Text>

                    {/* 5. Pagos */}
                    <Text style={[styles.sectionTitle, { fontSize: isTablet ? 20 : 16 }]}>
                        💳 5. Pagos y Reembolsos
                    </Text>
                    <Text style={[styles.text, { fontSize: isTablet ? 15 : 13 }]}>
                        • Los pagos se procesan a través de Mercado Pago y efectivo.{'\n'}
                        • Los reembolsos se realizan dentro de los 5 minutos de la recepción del pedido.{'\n'}
                        • En caso de error en el cobro, contactanos para resolverlo.
                    </Text>

                    {/* 6. Puntos */}
                    <Text style={[styles.sectionTitle, { fontSize: isTablet ? 20 : 16 }]}>
                        ⭐ 6. Programa de Puntos
                    </Text>
                    <Text style={[styles.text, { fontSize: isTablet ? 15 : 13 }]}>
                        • Los puntos se acumulan por cada compra realizada.{'\n'}
                        • Los puntos tienen una validez de <Text style={styles.bold}>1 año</Text> desde su obtención.{'\n'}
                        • Los puntos no son transferibles ni canjeables por dinero en efectivo.
                    </Text>

                    {/* 7. Entregas */}
                    <Text style={[styles.sectionTitle, { fontSize: isTablet ? 20 : 16 }]}>
                        🚚 7. Entregas
                    </Text>
                    <Text style={[styles.text, { fontSize: isTablet ? 15 : 13 }]}>
                        • Los tiempos de entrega son estimados y pueden variar.{'\n'}
                        • La distancia de entrega está limitada a <Text style={styles.bold}>7 km</Text> del local.{'\n'}
                        • El costo de envío se calcula automáticamente según la distancia.
                    </Text>

                    {/* 8. Privacidad */}
                    <Text style={[styles.sectionTitle, { fontSize: isTablet ? 20 : 16 }]}>
                        🔒 8. Privacidad
                    </Text>
                    <Text style={[styles.text, { fontSize: isTablet ? 15 : 13 }]}>
                        • Tus datos personales están protegidos según la <Text style={styles.bold}>Ley 25.326</Text>.{'\n'}
                        • No compartimos tus datos con terceros sin tu consentimiento.{'\n'}
                        • Podés solicitar la eliminación de tus datos en cualquier momento.
                    </Text>

                    {/* 9. Responsabilidad */}
                    <Text style={[styles.sectionTitle, { fontSize: isTablet ? 20 : 16 }]}>
                        🛠️ 9. Responsabilidad de Agencia Powa
                    </Text>
                    <Text style={[styles.text, { fontSize: isTablet ? 15 : 13 }]}>
                        <Text style={styles.bold}>Agencia Powa</Text> actúa como el socio tecnológico encargado del desarrollo y mantenimiento de la aplicación.
                        {'\n\n'}• No se responsabiliza por la calidad del producto final, la cual recae exclusivamente en Krusty Burger.
                    </Text>

                    {/* 10. Ley */}
                    <Text style={[styles.sectionTitle, { fontSize: isTablet ? 20 : 16 }]}>
                        ⚖️ 10. Ley Aplicable
                    </Text>
                    <Text style={[styles.text, { fontSize: isTablet ? 15 : 13 }]}>
                        Estos Términos se rigen por las leyes de la <Text style={styles.bold}>República Argentina</Text>.
                        {'\n'}Cualquier disputa será resuelta en los tribunales de la Ciudad Autónoma de Buenos Aires.
                    </Text>

                    {/* 11. Contacto */}
                    <Text style={[styles.sectionTitle, { fontSize: isTablet ? 20 : 16 }]}>
                        📞 11. Contacto
                    </Text>
                    <View style={styles.contactContainer}>
                        <TouchableOpacity
                            style={styles.contactItem}
                            onPress={() => Linking.openURL('mailto:agenciadigitalpowa@gmail.com')}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="mail-outline" size={20} color={DISENO.colors.accent} />
                            <Text style={[styles.contactText, { fontSize: isTablet ? 15 : 13 }]}>
                                agenciadigitalpowa@gmail.com
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.contactItem}
                            onPress={() => Linking.openURL('tel:1138305837')}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="call-outline" size={20} color={DISENO.colors.accent} />
                            <Text style={[styles.contactText, { fontSize: isTablet ? 15 : 13 }]}>
                                11-3830-5837
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <View style={styles.footerContainer}>
                        <Text style={[styles.version, { fontSize: isTablet ? 12 : 10 }]}>
                            Última actualización: {fechaActual}
                        </Text>
                        <View style={styles.footerSeparator} />
                        <TouchableOpacity
                            style={styles.footerLink}
                            onPress={() => Alert.alert(
                                '📄 Documento legal',
                                'Este documento es legalmente vinculante. Al usar la aplicación aceptas estos términos.',
                                [{ text: 'Entendido' }]
                            )}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.footerLinkText, { fontSize: isTablet ? 12 : 10 }]}>
                                📄 Documento legal
                            </Text>
                        </TouchableOpacity>
                        <Text style={[styles.version, { fontSize: isTablet ? 10 : 8, marginTop: 4 }]}>
                            v1.0.0
                        </Text>
                    </View>
                </View>
            </Animated.ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: DISENO.colors.fondo,
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'transparent',
    },
    backButton: {
        padding: 8,
        minWidth: 44,
        minHeight: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    shareButton: {
        padding: 8,
        minWidth: 44,
        minHeight: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontWeight: '700',
        color: DISENO.colors.surface,
        flex: 1,
        textAlign: 'center',
    },
    scroll: {
        flex: 1,
        marginTop: 80,
        backgroundColor: DISENO.colors.surface,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        ...DISENO.shadow.lg,
    },
    scrollContent: {
        flexGrow: 1,
    },
    card: {
        backgroundColor: DISENO.colors.surface,
        padding: 24,
        borderRadius: DISENO.radius.lg,
    },
    versionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        gap: 4,
        backgroundColor: DISENO.colors.fondo,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: DISENO.radius.full,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: DISENO.colors.border,
    },
    versionBadgeText: {
        color: DISENO.colors.textTertiary,
        fontWeight: '500',
    },
    sectionTitle: {
        fontWeight: '700',
        color: DISENO.colors.text,
        marginTop: 20,
        marginBottom: 8,
    },
    text: {
        color: DISENO.colors.textSecondary,
        lineHeight: 22,
    },
    bold: {
        fontWeight: '700',
        color: DISENO.colors.accent,
    },
    contactContainer: {
        marginTop: 4,
        gap: 8,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 4,
    },
    contactText: {
        color: DISENO.colors.textSecondary,
        fontWeight: '500',
    },
    footerContainer: {
        marginTop: 30,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: DISENO.colors.border,
        alignItems: 'center',
        gap: 8,
    },
    footerSeparator: {
        width: 40,
        height: 1,
        backgroundColor: DISENO.colors.border,
    },
    footerLink: {
        paddingVertical: 4,
    },
    footerLinkText: {
        color: DISENO.colors.accent,
        fontWeight: '500',
        textDecorationLine: 'underline',
    },
    version: {
        color: DISENO.colors.textTertiary,
        textAlign: 'center',
        opacity: 0.6,
    },
});