// screens/cliente/PantallaPrivacidad.tsx - CORREGIDO CON canGoBack()
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { DISENO, useResponsive } from '../../lib/colores';

export default function PantallaPrivacidad({ navigation }: any) {
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

    // ✅ FUNCIÓN PARA VOLVER CON VERIFICACIÓN
    const handleGoBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            // Si no hay pantalla anterior, ir al inicio
            navigation.navigate('Principal', { screen: 'Inicio' });
        }
    };

    const compartirPrivacidad = async () => {
        try {
            const textoCompleto = `
🔒 POLÍTICA DE PRIVACIDAD - KRUSTY BURGER

📌 1. Información que recopilamos
• Nombre completo
• Correo electrónico
• Número de teléfono
• Dirección de envío
• Historial de pedidos
• Ubicación (para envíos)
• Preferencias de comida

📝 2. Cómo usamos tu información
• Para procesar tus pedidos
• Para gestionar el programa de puntos
• Para enviarte promociones (con tu consentimiento)
• Para mejorar nuestros servicios
• Para notificaciones de estado de pedidos

🔒 3. Protección de datos
• Tus datos están protegidos según la Ley 25.326
• Utilizamos encriptación SSL en todas las comunicaciones
• Solo personal autorizado tiene acceso a tus datos
• Implementamos medidas de seguridad físicas y digitales

🤝 4. Compartir información
• No vendemos tus datos a terceros
• Compartimos datos solo con:
  - Mercado Pago (procesamiento de pagos)
  - Servicio de mensajería (notificaciones)
  - Socios de entrega (para envíos)

👤 5. Tus derechos
• Acceder a tus datos en cualquier momento
• Modificar o actualizar tu información
• Solicitar la eliminación de tus datos
• Darte de baja de comunicaciones comerciales
• Revocar tu consentimiento en cualquier momento

📱 6. Almacenamiento y Datos de Sesión
• Utilizamos almacenamiento local (AsyncStorage) para guardar tu sesión
• Los tokens de autenticación se almacenan de forma segura
• Guardamos preferencias como tu idioma y ubicación
• Los datos sensibles se almacenan encriptados
• Puedes borrar todos tus datos desde el menú de perfil
• No utilizamos cookies de seguimiento de terceros

👶 7. Datos de menores
• No recopilamos datos de menores de 13 años
• Si eres menor, necesitas autorización de tus padres
• Podemos solicitar verificación de edad

📍 8. Ubicación
• Solo solicitamos ubicación para calcular distancias de envío
• Puedes desactivar el acceso en cualquier momento desde el menú de perfil

📱 9. Notificaciones push
• Enviamos notificaciones sobre tu pedido
• Enviamos promociones (con tu consentimiento)
• Puedes desactivarlas en ajustes del dispositivo

📞 10. Contacto
Si tenés preguntas sobre tu privacidad, contactanos en:
📧 agenciadigitalpowa@gmail.com
📱 11-3830-5837

🔄 Última actualización: ${fechaActual}
            `.trim();

            await Share.share({
                message: textoCompleto,
                title: 'Política de Privacidad - Krusty Burger',
            });
        } catch (error) {
            console.error('Error al compartir:', error);
        }
    };

    const mostrarInfoVersion = () => {
        Alert.alert(
            '📋 Información del documento',
            `Política de Privacidad\nVersión: 1.0.0\nÚltima actualización: ${fechaActual}\n\nTus datos están protegidos según la Ley 25.326 de Protección de Datos Personales.`,
            [{ text: 'Entendido' }]
        );
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
                    🔒 Privacidad
                </Text>

                <TouchableOpacity
                    style={styles.shareButton}
                    onPress={compartirPrivacidad}
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

                    <Text style={[styles.sectionTitle, { fontSize: isTablet ? 20 : 16 }]}>
                        📌 1. Información que recopilamos
                    </Text>
                    <Text style={[styles.text, { fontSize: isTablet ? 15 : 13 }]}>
                        • Nombre completo{'\n'}
                        • Correo electrónico{'\n'}
                        • Número de teléfono{'\n'}
                        • Dirección de envío{'\n'}
                        • Historial de pedidos{'\n'}
                        • Ubicación (para envíos){'\n'}
                        • Preferencias de comida
                    </Text>

                    <Text style={[styles.sectionTitle, { fontSize: isTablet ? 20 : 16 }]}>
                        📝 2. Cómo usamos tu información
                    </Text>
                    <Text style={[styles.text, { fontSize: isTablet ? 15 : 13 }]}>
                        • Para procesar tus pedidos{'\n'}
                        • Para gestionar el programa de puntos{'\n'}
                        • Para enviarte promociones (con tu consentimiento){'\n'}
                        • Para mejorar nuestros servicios{'\n'}
                        • Para notificaciones de estado de pedidos
                    </Text>

                    <Text style={[styles.sectionTitle, { fontSize: isTablet ? 20 : 16 }]}>
                        🔒 3. Protección de datos
                    </Text>
                    <Text style={[styles.text, { fontSize: isTablet ? 15 : 13 }]}>
                        • Tus datos están protegidos según la Ley 25.326{'\n'}
                        • Utilizamos encriptación SSL en todas las comunicaciones{'\n'}
                        • Solo personal autorizado tiene acceso a tus datos{'\n'}
                        • Implementamos medidas de seguridad físicas y digitales
                    </Text>

                    <Text style={[styles.sectionTitle, { fontSize: isTablet ? 20 : 16 }]}>
                        🤝 4. Compartir información
                    </Text>
                    <Text style={[styles.text, { fontSize: isTablet ? 15 : 13 }]}>
                        • No vendemos tus datos a terceros{'\n'}
                        • Compartimos datos solo con:{'\n'}
                        {'  '}• Mercado Pago (procesamiento de pagos){'\n'}
                        {'  '}• Servicio de mensajería (notificaciones){'\n'}
                        {'  '}• Socios de entrega (para envíos)
                    </Text>

                    <Text style={[styles.sectionTitle, { fontSize: isTablet ? 20 : 16 }]}>
                        👤 5. Tus derechos
                    </Text>
                    <Text style={[styles.text, { fontSize: isTablet ? 15 : 13 }]}>
                        • Acceder a tus datos en cualquier momento{'\n'}
                        • Modificar o actualizar tu información{'\n'}
                        • Solicitar la eliminación de tus datos{'\n'}
                        • Darte de baja de comunicaciones comerciales{'\n'}
                        • Revocar tu consentimiento en cualquier momento
                    </Text>

                    <Text style={[styles.sectionTitle, { fontSize: isTablet ? 20 : 16 }]}>
                        📱 6. Almacenamiento y Datos de Sesión
                    </Text>
                    <Text style={[styles.text, { fontSize: isTablet ? 15 : 13 }]}>
                        • Utilizamos almacenamiento local (AsyncStorage) para guardar tu sesión{'\n'}
                        • Los tokens de autenticación se almacenan de forma segura{'\n'}
                        • Guardamos preferencias como tu idioma y ubicación{'\n'}
                        • Los datos sensibles se almacenan encriptados{'\n'}
                        • Puedes borrar todos tus datos desde el menú de perfil{'\n'}
                        • No utilizamos cookies de seguimiento de terceros
                    </Text>

                    <Text style={[styles.sectionTitle, { fontSize: isTablet ? 20 : 16 }]}>
                        👶 7. Datos de menores
                    </Text>
                    <Text style={[styles.text, { fontSize: isTablet ? 15 : 13 }]}>
                        • No recopilamos datos de menores de 13 años{'\n'}
                        • Si eres menor, necesitas autorización de tus padres{'\n'}
                        • Podemos solicitar verificación de edad
                    </Text>

                    <Text style={[styles.sectionTitle, { fontSize: isTablet ? 20 : 16 }]}>
                        📍 8. Ubicación
                    </Text>
                    <Text style={[styles.text, { fontSize: isTablet ? 15 : 13 }]}>
                        • Solo solicitamos ubicación para calcular distancias de envío y enviar la ubicacion en tiempo real de su pedido a nuestros clientes{'\n'}
                        • Puedes desactivar el acceso en cualquier momento desde el menú de perfil
                    </Text>

                    <Text style={[styles.sectionTitle, { fontSize: isTablet ? 20 : 16 }]}>
                        📱 9. Notificaciones push
                    </Text>
                    <Text style={[styles.text, { fontSize: isTablet ? 15 : 13 }]}>
                        • Enviamos notificaciones sobre tu pedido{'\n'}
                        • Enviamos promociones (con tu consentimiento){'\n'}
                        • Puedes desactivarlas en ajustes del dispositivo
                    </Text>

                    <Text style={[styles.sectionTitle, { fontSize: isTablet ? 20 : 16 }]}>
                        📞 10. Contacto
                    </Text>
                    <Text style={[styles.text, { fontSize: isTablet ? 15 : 13 }]}>
                        Si tenés preguntas sobre tu privacidad, contactanos en:{'\n'}
                        📧 agenciadigitalpowa@gmail.com{'\n'}
                        📱 11-3830-5837
                    </Text>

                    <View style={styles.footerContainer}>
                        <Text style={[styles.version, { fontSize: isTablet ? 12 : 10 }]}>
                            Última actualización: {fechaActual}
                        </Text>
                        <View style={styles.footerSeparator} />
                        <TouchableOpacity
                            style={styles.footerLink}
                            onPress={() => Alert.alert(
                                '🔒 Protección de datos',
                                'Tus datos están protegidos según la Ley 25.326 de Protección de Datos Personales.',
                                [{ text: 'Entendido' }]
                            )}
                        >
                            <Text style={[styles.footerLinkText, { fontSize: isTablet ? 12 : 10 }]}>
                                🔒 Ley 25.326
                            </Text>
                        </TouchableOpacity>
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