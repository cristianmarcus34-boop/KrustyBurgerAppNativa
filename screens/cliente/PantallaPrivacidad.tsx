// screens/cliente/PantallaPrivacidad.tsx - COMPLETO Y SOFISTICADO
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
    Modal,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { DISENO, useResponsive } from '../../lib/colores';
import { FUENTES } from '../../lib/fuentes';
import { tiendaAutenticacion } from '../../stores/tiendaAutenticacion';
import { servicioEliminacionCuenta } from '../../services/servicioEliminacionCuenta';

// ============================================================
// 📋 COMPONENTE PRINCIPAL
// ============================================================
export default function PantallaPrivacidad({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const responsive = useResponsive();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(30)).current;
    const [fechaActual, setFechaActual] = useState('');

    // ✅ STORE DE AUTENTICACIÓN
    const { perfil, cerrarSesion } = tiendaAutenticacion();

    // ✅ ESTADOS PARA ELIMINACIÓN
    const [tieneSolicitudEliminacion, setTieneSolicitudEliminacion] = useState(false);
    const [diasRestantes, setDiasRestantes] = useState(0);
    const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
    const [passwordConfirmacion, setPasswordConfirmacion] = useState('');
    const [motivoEliminacion, setMotivoEliminacion] = useState('');
    const [cargandoEliminar, setCargandoEliminar] = useState(false);
    const [mostrarPassword, setMostrarPassword] = useState(false);

    const isTablet = responsive.isTablet;
    const isSmallPhone = responsive.isSmallPhone;
    const paddingHorizontal = responsive.getEspaciado('LG');

    // ============================================================
    // 🎬 EFECTOS
    // ============================================================
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(slideUpAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]).start();

        const ahora = new Date();
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        setFechaActual(`${meses[ahora.getMonth()]} ${ahora.getFullYear()}`);

        // ✅ VERIFICAR ESTADO DE ELIMINACIÓN
        if (perfil?.id) {
            verificarEstadoEliminacion();
        }
    }, [perfil?.id]);

    // ============================================================
    // 🗑️ VERIFICAR ESTADO DE ELIMINACIÓN
    // ============================================================
    const verificarEstadoEliminacion = async () => {
        if (!perfil?.id) return;

        try {
            const estado = await servicioEliminacionCuenta.obtenerEstadoEliminacion(perfil.id);
            setTieneSolicitudEliminacion(estado.tieneSolicitud);
            setDiasRestantes(estado.diasRestantes || 0);
        } catch (error) {
            console.error('❌ Error verificando estado:', error);
        }
    };

    // ============================================================
    // 🗑️ SOLICITAR ELIMINACIÓN DE CUENTA
    // ============================================================
    const solicitarEliminacionCuenta = async () => {
        if (!perfil || !perfil.id || !perfil.email) {
            Alert.alert('❌ Error', 'No se pudo identificar tu cuenta.');
            return;
        }

        if (!motivoEliminacion || motivoEliminacion.trim().length < 10) {
            Alert.alert('📝 Motivo requerido', 'Contanos con más detalle por qué querés eliminar tu cuenta.');
            return;
        }

        if (!passwordConfirmacion || passwordConfirmacion.length < 6) {
            Alert.alert('🔒 Contraseña requerida', 'Ingresá tu contraseña para confirmar.');
            return;
        }

        setCargandoEliminar(true);

        try {
            const resultado = await servicioEliminacionCuenta.solicitarEliminacion(
                perfil.id,
                perfil.email,
                motivoEliminacion.trim(),
                passwordConfirmacion
            );

            if (!resultado.success) {
                Alert.alert('❌ Error', resultado.error || 'Ocurrió un error.');
                setCargandoEliminar(false);
                return;
            }

            const fechaEliminacion = new Date(resultado.solicitud!.fecha_eliminacion);
            const fechaFormateada = fechaEliminacion.toLocaleDateString('es-AR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });

            Alert.alert(
                '✅ Solicitud enviada',
                `Tu solicitud fue recibida.\n\n📅 Tu cuenta será eliminada el ${fechaFormateada}.`,
                [{
                    text: 'Entendido',
                    onPress: async () => {
                        setMostrarModalEliminar(false);
                        setPasswordConfirmacion('');
                        setMotivoEliminacion('');
                        await cerrarSesion();
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Bienvenida' }],
                        });
                    }
                }]
            );
        } catch (error) {
            console.error('❌ Error:', error);
            Alert.alert('❌ Error', 'Ocurrió un error inesperado.');
        } finally {
            setCargandoEliminar(false);
        }
    };

    // ============================================================
    // 🔄 CANCELAR ELIMINACIÓN
    // ============================================================
    const cancelarEliminacion = async () => {
        if (!perfil?.id) return;

        Alert.alert(
            '🔄 Cancelar eliminación',
            '¿Estás seguro que querés cancelar la eliminación de tu cuenta?',
            [
                {
                    text: 'Sí, cancelar',
                    onPress: async () => {
                        const resultado = await servicioEliminacionCuenta.cancelarEliminacion(perfil.id);
                        if (resultado.success) {
                            setTieneSolicitudEliminacion(false);
                            setDiasRestantes(0);
                            Alert.alert('✅ Cancelado', 'Tu cuenta ya no será eliminada.');
                        } else {
                            Alert.alert('❌ Error', resultado.error || 'No se pudo cancelar.');
                        }
                    },
                    style: 'destructive'
                },
                { text: 'No', style: 'cancel' }
            ]
        );
    };

    // ============================================================
    // 🔙 VOLVER CON VERIFICACIÓN
    // ============================================================
    const handleGoBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.navigate('Principal', { screen: 'Inicio' });
        }
    };

    // ============================================================
    // 📤 COMPARTIR
    // ============================================================
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

    // ============================================================
    // 🖥️ RENDER
    // ============================================================
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

                {/* ✅ TÍTULO CON SIMPSONFONT */}
                <Text style={[styles.title, { fontSize: isTablet ? 22 : 18 }]}>
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

                    {/* ============================================== */}
                    {/* 1. INFORMACIÓN QUE RECOPILAMOS */}
                    {/* ============================================== */}
                    <Text style={[styles.sectionTitle, { fontSize: isTablet ? 17 : 15 }]}>
                        📌 1. Información que recopilamos
                    </Text>
                    <Text style={[styles.text, { fontSize: isTablet ? 14 : 13 }]}>
                        • Nombre completo{'\n'}
                        • Correo electrónico{'\n'}
                        • Número de teléfono{'\n'}
                        • Dirección de envío{'\n'}
                        • Historial de pedidos{'\n'}
                        • Ubicación (para envíos){'\n'}
                        • Preferencias de comida
                    </Text>

                    {/* ============================================== */}
                    {/* 2. CÓMO USAMOS TU INFORMACIÓN */}
                    {/* ============================================== */}
                    <Text style={[styles.sectionTitle, { fontSize: isTablet ? 17 : 15 }]}>
                        📝 2. Cómo usamos tu información
                    </Text>
                    <Text style={[styles.text, { fontSize: isTablet ? 14 : 13 }]}>
                        • Para procesar tus pedidos{'\n'}
                        • Para gestionar el programa de puntos{'\n'}
                        • Para enviarte promociones (con tu consentimiento){'\n'}
                        • Para mejorar nuestros servicios{'\n'}
                        • Para notificaciones de estado de pedidos
                    </Text>

                    {/* ============================================== */}
                    {/* 3. PROTECCIÓN DE DATOS */}
                    {/* ============================================== */}
                    <Text style={[styles.sectionTitle, { fontSize: isTablet ? 17 : 15 }]}>
                        🔒 3. Protección de datos
                    </Text>
                    <Text style={[styles.text, { fontSize: isTablet ? 14 : 13 }]}>
                        • Tus datos están protegidos según la Ley 25.326{'\n'}
                        • Utilizamos encriptación SSL en todas las comunicaciones{'\n'}
                        • Solo personal autorizado tiene acceso a tus datos{'\n'}
                        • Implementamos medidas de seguridad físicas y digitales
                    </Text>

                    {/* ============================================== */}
                    {/* 4. COMPARTIR INFORMACIÓN */}
                    {/* ============================================== */}
                    <Text style={[styles.sectionTitle, { fontSize: isTablet ? 17 : 15 }]}>
                        🤝 4. Compartir información
                    </Text>
                    <Text style={[styles.text, { fontSize: isTablet ? 14 : 13 }]}>
                        • No vendemos tus datos a terceros{'\n'}
                        • Compartimos datos solo con:{'\n'}
                        {'  '}• Mercado Pago (procesamiento de pagos){'\n'}
                        {'  '}• Servicio de mensajería (notificaciones){'\n'}
                        {'  '}• Socios de entrega (para envíos)
                    </Text>

                    {/* ============================================== */}
                    {/* 5. TUS DERECHOS */}
                    {/* ============================================== */}
                    <Text style={[styles.sectionTitle, { fontSize: isTablet ? 17 : 15 }]}>
                        👤 5. Tus derechos
                    </Text>
                    <Text style={[styles.text, { fontSize: isTablet ? 14 : 13 }]}>
                        • Acceder a tus datos en cualquier momento{'\n'}
                        • Modificar o actualizar tu información{'\n'}
                        • Solicitar la eliminación de tus datos{'\n'}
                        • Darte de baja de comunicaciones comerciales{'\n'}
                        • Revocar tu consentimiento en cualquier momento
                    </Text>

                    {/* ============================================== */}
                    {/* 6. ALMACENAMIENTO */}
                    {/* ============================================== */}
                    <Text style={[styles.sectionTitle, { fontSize: isTablet ? 17 : 15 }]}>
                        📱 6. Almacenamiento y Datos de Sesión
                    </Text>
                    <Text style={[styles.text, { fontSize: isTablet ? 14 : 13 }]}>
                        • Utilizamos almacenamiento local (AsyncStorage) para guardar tu sesión{'\n'}
                        • Los tokens de autenticación se almacenan de forma segura{'\n'}
                        • Guardamos preferencias como tu idioma y ubicación{'\n'}
                        • Los datos sensibles se almacenan encriptados{'\n'}
                        • Puedes borrar todos tus datos desde el boton de eliminación{'\n'}
                        • No utilizamos cookies de seguimiento de terceros
                    </Text>

                    {/* ============================================== */}
                    {/* 7. MENORES */}
                    {/* ============================================== */}
                    <Text style={[styles.sectionTitle, { fontSize: isTablet ? 17 : 15 }]}>
                        👶 7. Datos de menores
                    </Text>
                    <Text style={[styles.text, { fontSize: isTablet ? 14 : 13 }]}>
                        • No recopilamos datos de menores de 13 años{'\n'}
                        • Si eres menor, necesitas autorización de tus padres{'\n'}
                        • Podemos solicitar verificación de edad
                    </Text>

                    {/* ============================================== */}
                    {/* 8. UBICACIÓN */}
                    {/* ============================================== */}
                    <Text style={[styles.sectionTitle, { fontSize: isTablet ? 17 : 15 }]}>
                        📍 8. Ubicación
                    </Text>
                    <Text style={[styles.text, { fontSize: isTablet ? 14 : 13 }]}>
                        • Solo solicitamos ubicación para calcular distancias de envío y enviar la ubicación en tiempo real de tu pedido{'\n'}
                        • Puedes desactivar el acceso en cualquier momento desde el menú de perfil
                    </Text>

                    {/* ============================================== */}
                    {/* 9. NOTIFICACIONES */}
                    {/* ============================================== */}
                    <Text style={[styles.sectionTitle, { fontSize: isTablet ? 17 : 15 }]}>
                        📱 9. Notificaciones push
                    </Text>
                    <Text style={[styles.text, { fontSize: isTablet ? 14 : 13 }]}>
                        • Enviamos notificaciones sobre tu pedido{'\n'}
                        • Enviamos promociones (con tu consentimiento){'\n'}
                        • Puedes desactivarlas en ajustes del dispositivo
                    </Text>

                    {/* ============================================== */}
                    {/* 10. CONTACTO */}
                    {/* ============================================== */}
                    <Text style={[styles.sectionTitle, { fontSize: isTablet ? 17 : 15 }]}>
                        📞 10. Contacto
                    </Text>
                    <Text style={[styles.text, { fontSize: isTablet ? 14 : 13 }]}>
                        Si tenés preguntas sobre tu privacidad, contactanos en:{'\n'}
                        📧 agenciadigitalpowa@gmail.com{'\n'}
                        📱 11-3830-5837
                    </Text>

                    {/* ============================================== */}
                    {/* 🆕 11. GESTIÓN DE TU CUENTA Y DATOS */}
                    {/* ============================================== */}
                    <View style={styles.seccionEliminar}>
                        <Text style={[styles.sectionTitle, { fontSize: isTablet ? 17 : 15, marginTop: 0 }]}>
                            🗑️ 11. Gestión de tu cuenta y datos
                        </Text>
                        <Text style={[styles.text, { fontSize: isTablet ? 14 : 13, marginBottom: 12 }]}>
                            De acuerdo con la Ley 25.326 de Protección de Datos Personales, tenés derecho a solicitar la eliminación de tu cuenta y todos los datos asociados. Este proceso es:
                        </Text>

                        <View style={styles.bulletContainer}>
                            <View style={styles.bullet}>
                                <Ionicons name="time-outline" size={16} color={DISENO.colors.info} />
                                <Text style={[styles.bulletText, { fontSize: isTablet ? 13 : 12 }]}>
                                    Programado con 30 días de espera
                                </Text>
                            </View>
                            <View style={styles.bullet}>
                                <Ionicons name="refresh-outline" size={16} color={DISENO.colors.success} />
                                <Text style={[styles.bulletText, { fontSize: isTablet ? 13 : 12 }]}>
                                    Cancelable si iniciás sesión antes
                                </Text>
                            </View>
                            <View style={styles.bullet}>
                                <Ionicons name="shield-checkmark-outline" size={16} color={DISENO.colors.accent} />
                                <Text style={[styles.bulletText, { fontSize: isTablet ? 13 : 12 }]}>
                                    Permanente e irreversible al finalizar
                                </Text>
                            </View>
                        </View>

                        {tieneSolicitudEliminacion ? (
                            <View style={styles.solicitudActivaContainer}>
                                <View style={styles.solicitudActivaHeader}>
                                    <Ionicons name="hourglass-outline" size={20} color={DISENO.colors.accentSecondary} />
                                    <Text style={[styles.solicitudActivaTitulo, { fontSize: isTablet ? 14 : 13 }]}>
                                        Eliminación programada
                                    </Text>
                                </View>
                                <Text style={[styles.solicitudActivaTexto, { fontSize: isTablet ? 13 : 12 }]}>
                                    Tu cuenta se eliminará en {diasRestantes} días.
                                </Text>
                                <TouchableOpacity
                                    style={styles.botonCancelarEliminacion}
                                    onPress={cancelarEliminacion}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="close-circle-outline" size={18} color={DISENO.colors.success} />
                                    <Text style={[styles.botonCancelarEliminacionTexto, { fontSize: isTablet ? 13 : 12 }]}>
                                        Cancelar eliminación
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={styles.botonEliminarCuenta}
                                onPress={() => setMostrarModalEliminar(true)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="trash-outline" size={18} color={DISENO.colors.danger} />
                                <Text style={[styles.botonEliminarCuentaTexto, { fontSize: isTablet ? 13 : 12 }]}>
                                    Solicitar eliminación de cuenta
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* FOOTER */}
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

            {/* ============================================================ */}
            {/* 🚨 MODAL DE ELIMINACIÓN DE CUENTA */}
            {/* ============================================================ */}
            <Modal
                visible={mostrarModalEliminar}
                transparent
                animationType="fade"
                statusBarTranslucent
                onRequestClose={() => {
                    setMostrarModalEliminar(false);
                    setPasswordConfirmacion('');
                    setMotivoEliminacion('');
                }}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalEliminarOverlay}
                >
                    <View style={styles.modalEliminarContainer}>
                        <LinearGradient
                            colors={['#E53935', '#C62828']}
                            style={styles.modalEliminarHeader}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <View style={styles.modalEliminarHeaderContent}>
                                <View style={styles.modalEliminarIconContainer}>
                                    <Ionicons name="trash-outline" size={28} color="#FFFFFF" />
                                </View>
                                {/* ✅ TÍTULO CON SIMPSONFONT */}
                                <Text style={styles.modalEliminarTitle}>
                                    Eliminar cuenta
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => {
                                    setMostrarModalEliminar(false);
                                    setPasswordConfirmacion('');
                                    setMotivoEliminacion('');
                                }}
                                style={styles.modalEliminarClose}
                            >
                                <Ionicons name="close" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                        </LinearGradient>

                        <ScrollView
                            style={styles.modalEliminarBodyScroll}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.modalEliminarBodyContent}
                        >
                            <View style={styles.modalEliminarWarning}>
                                <Ionicons name="warning-outline" size={22} color="#E53935" />
                                <Text style={styles.modalEliminarWarningText}>
                                    Esta acción es <Text style={{ fontWeight: '700', color: '#E53935' }}>permanente e irreversible</Text>
                                </Text>
                            </View>

                            <Text style={styles.modalEliminarSubtitle}>
                                Tu cuenta será eliminada <Text style={{ fontWeight: '700', color: '#F5C518' }}>en 30 días</Text>. Si iniciás sesión durante este período, la eliminación se cancelará automáticamente.{'\n\n'}
                                Perderás acceso a:{'\n'}• Todos tus pedidos e historial{'\n'}• Tus puntos y recompensas acumulados{'\n'}• Tus datos personales guardados
                            </Text>

                            <View style={styles.modalEliminarInputGroup}>
                                <Text style={styles.modalEliminarLabel}>
                                    <Ionicons name="lock-closed-outline" size={16} color="#F5C518" /> Confirmá tu contraseña <Text style={{ color: '#E53935' }}>*</Text>
                                </Text>
                                <View style={styles.modalEliminarPasswordContainer}>
                                    <TextInput
                                        style={styles.modalEliminarInput}
                                        placeholder="Ingresá tu contraseña"
                                        placeholderTextColor="#94A3B8"
                                        secureTextEntry={!mostrarPassword}
                                        value={passwordConfirmacion}
                                        onChangeText={setPasswordConfirmacion}
                                        autoCapitalize="none"
                                        selectionColor="#F5C518"
                                    />
                                    <TouchableOpacity
                                        onPress={() => setMostrarPassword(!mostrarPassword)}
                                        style={styles.modalEliminarPasswordToggle}
                                    >
                                        <Ionicons
                                            name={mostrarPassword ? 'eye-off-outline' : 'eye-outline'}
                                            size={20}
                                            color="#94A3B8"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.modalEliminarInputGroup}>
                                <Text style={styles.modalEliminarLabel}>
                                    <Ionicons name="chatbubble-outline" size={16} color="#F5C518" /> ¿Por qué te vas? <Text style={{ color: '#E53935' }}>*</Text>
                                </Text>
                                <TextInput
                                    style={[styles.modalEliminarInput, styles.modalEliminarTextArea]}
                                    placeholder="Ayudanos a mejorar contándonos tu experiencia..."
                                    placeholderTextColor="#94A3B8"
                                    value={motivoEliminacion}
                                    onChangeText={setMotivoEliminacion}
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                    selectionColor="#F5C518"
                                />
                                {motivoEliminacion.length > 0 && (
                                    <Text style={[styles.modalEliminarContador, {
                                        color: motivoEliminacion.length >= 10 ? '#43A047' : '#E53935'
                                    }]}>
                                        {motivoEliminacion.length}/500 caracteres
                                    </Text>
                                )}
                            </View>

                            <View style={styles.modalEliminarBotones}>
                                <TouchableOpacity
                                    style={[styles.modalEliminarBoton, styles.modalEliminarBotonSecundario]}
                                    onPress={() => {
                                        setMostrarModalEliminar(false);
                                        setPasswordConfirmacion('');
                                        setMotivoEliminacion('');
                                    }}
                                    disabled={cargandoEliminar}
                                >
                                    <Text style={styles.modalEliminarBotonSecundarioText}>Cancelar</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.modalEliminarBoton, styles.modalEliminarBotonPeligro,
                                    (!passwordConfirmacion || motivoEliminacion.length < 10) && styles.modalEliminarBotonDisabled]}
                                    onPress={solicitarEliminacionCuenta}
                                    disabled={cargandoEliminar || !passwordConfirmacion || motivoEliminacion.length < 10}
                                >
                                    {cargandoEliminar ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <>
                                            <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                                            <Text style={styles.modalEliminarBotonPeligroText}>Solicitar eliminación</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.modalEliminarFooter}>
                                🔒 Tendrás 30 días para cancelar la eliminación si cambias de opinión
                            </Text>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

// ============================================================
// 🎨 ESTILOS
// ============================================================
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
    // ✅ TÍTULO CON SIMPSONFONT
    title: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
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
    // ✅ VERSION BADGE CON FUENTE REGULAR
    versionBadgeText: {
        fontFamily: FUENTES.regular,
        color: DISENO.colors.textTertiary,
        fontWeight: '500',
    },
    // ✅ SECTION TITLE CON SIMPSONFONT
    sectionTitle: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        color: DISENO.colors.text,
        marginTop: 20,
        marginBottom: 8,
    },
    // ✅ TEXT CON FUENTE REGULAR
    text: {
        fontFamily: FUENTES.regular,
        color: DISENO.colors.textSecondary,
        lineHeight: 22,
    },
    // ============================================================
    // 🆕 SECCIÓN DE ELIMINAR CUENTA
    // ============================================================
    seccionEliminar: {
        marginTop: 24,
        padding: 16,
        backgroundColor: DISENO.colors.fondo,
        borderRadius: DISENO.radius.md,
        borderWidth: 1,
        borderColor: DISENO.colors.border,
    },
    bulletContainer: {
        gap: 8,
        marginVertical: 8,
    },
    bullet: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    // ✅ BULLET TEXT CON FUENTE REGULAR
    bulletText: {
        fontFamily: FUENTES.regular,
        color: DISENO.colors.textSecondary,
        flex: 1,
    },
    botonEliminarCuenta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginTop: 12,
        paddingVertical: 14,
        paddingHorizontal: 20,
        backgroundColor: DISENO.colors.surface,
        borderRadius: DISENO.radius.md,
        borderWidth: 1.5,
        borderColor: DISENO.colors.danger + '40',
    },
    // ✅ BOTÓN ELIMINAR CON SIMPSONFONT
    botonEliminarCuentaTexto: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        color: DISENO.colors.danger,
    },
    solicitudActivaContainer: {
        marginTop: 12,
        padding: 14,
        backgroundColor: DISENO.colors.accentSecondary + '10',
        borderRadius: DISENO.radius.md,
        borderWidth: 1,
        borderColor: DISENO.colors.accentSecondary + '30',
    },
    solicitudActivaHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    // ✅ TÍTULO CON SIMPSONFONT
    solicitudActivaTitulo: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        color: DISENO.colors.accentSecondary,
    },
    // ✅ TEXTO CON FUENTE REGULAR
    solicitudActivaTexto: {
        fontFamily: FUENTES.regular,
        color: DISENO.colors.textSecondary,
        marginBottom: 10,
    },
    botonCancelarEliminacion: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: DISENO.colors.success + '10',
        borderRadius: DISENO.radius.sm,
        borderWidth: 1,
        borderColor: DISENO.colors.success + '30',
    },
    // ✅ TEXTO CON SIMPSONFONT
    botonCancelarEliminacionTexto: {
        fontFamily: FUENTES.display,
        fontWeight: '400',
        color: DISENO.colors.success,
    },
    // ============================================================
    // 🎨 FOOTER
    // ============================================================
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
    // ✅ FOOTER LINK CON FUENTE REGULAR
    footerLinkText: {
        fontFamily: FUENTES.regular,
        color: DISENO.colors.accent,
        fontWeight: '500',
        textDecorationLine: 'underline',
    },
    version: {
        fontFamily: FUENTES.regular,
        color: DISENO.colors.textTertiary,
        textAlign: 'center',
        opacity: 0.6,
    },
    // ============================================================
    // 🚨 ESTILOS DEL MODAL DE ELIMINACIÓN
    // ============================================================
    modalEliminarOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    modalEliminarContainer: {
        width: '100%',
        maxWidth: 480,
        backgroundColor: '#1A1A1A',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        maxHeight: '90%',
    },
    modalEliminarHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    modalEliminarHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    modalEliminarIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // ✅ TÍTULO CON SIMPSONFONT
    modalEliminarTitle: {
        fontFamily: FUENTES.display,
        fontSize: 16,
        fontWeight: '400',
        color: '#FFFFFF',
    },
    modalEliminarClose: {
        padding: 8,
    },
    modalEliminarBodyScroll: {
        maxHeight: '80%',
    },
    modalEliminarBodyContent: {
        padding: 20,
        paddingBottom: 8,
    },
    modalEliminarWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(229, 57, 53, 0.08)',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(229, 57, 53, 0.15)',
        marginBottom: 16,
    },
    // ✅ TEXTO CON FUENTE REGULAR
    modalEliminarWarningText: {
        fontFamily: FUENTES.regular,
        fontSize: 14,
        color: '#B0B0B0',
        flex: 1,
    },
    modalEliminarSubtitle: {
        fontFamily: FUENTES.regular,
        fontSize: 14,
        color: '#94A3B8',
        lineHeight: 22,
        marginBottom: 20,
    },
    modalEliminarInputGroup: {
        marginBottom: 16,
    },
    modalEliminarLabel: {
        fontFamily: FUENTES.regular,
        fontSize: 13,
        fontWeight: '500',
        color: '#B0B0B0',
        marginBottom: 8,
    },
    modalEliminarPasswordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        paddingHorizontal: 14,
    },
    // ✅ INPUT CON FUENTE REGULAR
    modalEliminarInput: {
        fontFamily: FUENTES.regular,
        flex: 1,
        paddingVertical: 14,
        fontSize: 15,
        color: '#FFFFFF',
    },
    modalEliminarPasswordToggle: {
        padding: 8,
    },
    modalEliminarTextArea: {
        minHeight: 80,
        paddingTop: 14,
        textAlignVertical: 'top',
    },
    modalEliminarContador: {
        fontFamily: FUENTES.regular,
        fontSize: 11,
        textAlign: 'right',
        marginTop: 4,
        opacity: 0.7,
    },
    modalEliminarBotones: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    modalEliminarBoton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    modalEliminarBotonSecundario: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    // ✅ BOTÓN CON SIMPSONFONT
    modalEliminarBotonSecundarioText: {
        fontFamily: FUENTES.display,
        fontSize: 13,
        fontWeight: '400',
        color: '#B0B0B0',
    },
    modalEliminarBotonPeligro: {
        backgroundColor: '#E53935',
    },
    // ✅ BOTÓN CON SIMPSONFONT
    modalEliminarBotonPeligroText: {
        fontFamily: FUENTES.display,
        fontSize: 13,
        fontWeight: '400',
        color: '#FFFFFF',
    },
    modalEliminarBotonDisabled: {
        opacity: 0.5,
    },
    modalEliminarFooter: {
        fontFamily: FUENTES.regular,
        fontSize: 12,
        color: '#64748B',
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 8,
    },
});