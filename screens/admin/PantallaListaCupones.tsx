// screens/admin/PantallaListaCupones.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
    useWindowDimensions,
    Modal,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';

import { cuponService } from '../../lib/cupones/cuponService';
import { Cupon } from '../../lib/cupones/cuponTypes';
import { Colores } from '../../lib/colores';
import {
    formatearDescuento,
    colorPorTipo,
    iconoPorTipo,
    validarCuponActivo
} from '../../lib/cupones/cuponUtils';
import { useToast, Toast } from '../../components/Toast';
import CuponQRGenerator from '../../screens/admin/CuponQRGenerator';
import { supabase } from '../../lib/supabase';

import ModalGenerarCuponesFisicos from './ModalGenerarCuponesFisicos';

// ============================================================
// 🎨 DISEÑO
// ============================================================
const DESIGN = {
    colors: {
        fondo: '#F5F2ED',
        surface: '#FFFFFF',
        text: '#1A1A1A',
        textSecondary: 'rgba(0,0,0,0.55)',
        textTertiary: 'rgba(0,0,0,0.30)',
        border: 'rgba(0,0,0,0.06)',
        accent: '#E53935',
        accentSecondary: '#F5C518',
        verde: '#43A047',
        morado: '#7B1FA2',
        fondoOscuro: '#1A1A1A',
        surfaceHover: '#F8F6F2',
        azul: '#1A237E',
        naranja: '#FF9800',
    },
};

// ============================================================
// 🎯 HOOK RESPONSIVE
// ============================================================
const useResponsive = () => {
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;
    const isSmallPhone = width < 375;
    return { isTablet, isSmallPhone, width };
};

export default function PantallaListaCupones({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const responsive = useResponsive();
    const toast = useToast();

    const [cupones, setCupones] = useState<Cupon[]>([]);
    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const [cuponSeleccionado, setCuponSeleccionado] = useState<Cupon | null>(null);
    const [mostrarQR, setMostrarQR] = useState(false);
    const [filtro, setFiltro] = useState<'todos' | 'activos' | 'inactivos'>('todos');

    // ✅ Estados para asignación
    const [mostrarAsignar, setMostrarAsignar] = useState(false);
    const [cuponParaAsignar, setCuponParaAsignar] = useState<Cupon | null>(null);
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [usuariosFiltrados, setUsuariosFiltrados] = useState<any[]>([]);
    const [busquedaUsuario, setBusquedaUsuario] = useState('');
    const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
    const [usuariosSeleccionados, setUsuariosSeleccionados] = useState<any[]>([]);
    const [asignando, setAsignando] = useState(false);
    const [contadoresUsuarios, setContadoresUsuarios] = useState<Record<number, number>>({});
    const [filtroRol, setFiltroRol] = useState<'todos' | 'clientes' | 'admins'>('todos');
    const [seleccionarTodos, setSeleccionarTodos] = useState(false);

    // ✅ Estados para cupones físicos (PDF)
    const [mostrarGenerarFisicos, setMostrarGenerarFisicos] = useState(false);
    const [cuponParaFisicos, setCuponParaFisicos] = useState<Cupon | null>(null);

    const isTablet = responsive.isTablet;
    const isSmallPhone = responsive.isSmallPhone;
    const padding = isTablet ? 40 : 16;

    // ============================================================
    // 📋 CARGAR CUPONES
    // ============================================================
    const cargarCupones = async () => {
        try {
            const data = await cuponService.obtenerCupones();
            setCupones(data);
            await cargarContadoresUsuarios(data);
        } catch (error) {
            console.error('Error cargando cupones:', error);
            toast.error('Error al cargar los cupones');
        } finally {
            setCargando(false);
            setRefrescando(false);
        }
    };

    const cargarContadoresUsuarios = async (cuponesData: Cupon[]) => {
        try {
            const contadores: Record<number, number> = {};
            for (const cupon of cuponesData) {
                const { count, error } = await supabase
                    .from('cupones_usuarios')
                    .select('*', { count: 'exact', head: true })
                    .eq('cupon_id', cupon.id);

                if (!error) {
                    contadores[cupon.id] = count || 0;
                }
            }
            setContadoresUsuarios(contadores);
        } catch (error) {
            console.error('Error cargando contadores:', error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            cargarCupones();
        }, [])
    );

    // ============================================================
    // 👥 CARGAR USUARIOS PARA ASIGNAR
    // ============================================================
    const cargarUsuarios = async (filtro?: string, rolFiltro?: string) => {
        setCargandoUsuarios(true);
        try {
            let query = supabase
                .from('perfiles')
                .select('id, nombre_cliente, email, rol')
                .order('nombre_cliente');

            if (rolFiltro === 'clientes') {
                query = query.eq('rol', 'cliente');
            } else if (rolFiltro === 'admins') {
                query = query.eq('rol', 'admin');
            }

            if (filtro && filtro.length > 2) {
                query = query.or(
                    `nombre_cliente.ilike.%${filtro}%,email.ilike.%${filtro}%`
                );
            }

            const { data, error } = await query.limit(50);
            if (error) throw error;

            const usuariosData = data || [];
            setUsuarios(usuariosData);
            setUsuariosFiltrados(usuariosData);
            setUsuariosSeleccionados([]);
            setSeleccionarTodos(false);
        } catch (error) {
            console.error('Error cargando usuarios:', error);
            toast.error('Error al cargar usuarios');
        } finally {
            setCargandoUsuarios(false);
        }
    };

    // ============================================================
    // 🎯 SELECCIÓN DE USUARIOS (MÚLTIPLE)
    // ============================================================
    const toggleSeleccionUsuario = (usuario: any) => {
        setUsuariosSeleccionados(prev => {
            const existe = prev.find(u => u.id === usuario.id);
            if (existe) {
                return prev.filter(u => u.id !== usuario.id);
            } else {
                return [...prev, usuario];
            }
        });
        if (seleccionarTodos) {
            setSeleccionarTodos(false);
        }
    };

    const toggleSeleccionarTodos = () => {
        const nuevoEstado = !seleccionarTodos;
        setSeleccionarTodos(nuevoEstado);
        if (nuevoEstado) {
            setUsuariosSeleccionados([...usuariosFiltrados]);
        } else {
            setUsuariosSeleccionados([]);
        }
    };

    // ============================================================
    // 🎯 ASIGNAR CUPÓN A USUARIOS (MÚLTIPLE)
    // ============================================================
    const handleAsignarMultiples = async () => {
        if (!cuponParaAsignar) {
            toast.advertencia('No hay cupón seleccionado');
            return;
        }

        if (usuariosSeleccionados.length === 0) {
            toast.advertencia('Selecciona al menos un usuario');
            return;
        }

        try {
            const estado = await cuponService.verificarEstadoCupon(cuponParaAsignar.id);

            if (estado.mensaje) {
                toast.error(estado.mensaje);
                return;
            }

            if (estado.usosRestantes !== null && estado.usosRestantes < usuariosSeleccionados.length) {
                toast.advertencia(
                    `Solo quedan ${estado.usosRestantes} usos disponibles. ` +
                    `Seleccionaste ${usuariosSeleccionados.length} usuarios.`
                );
                return;
            }

        } catch (error) {
            console.error('Error verificando estado del cupón:', error);
            toast.error('Error al verificar el estado del cupón');
            return;
        }

        let usuariosYaUsaron: any[] = [];
        let usuariosYaTienen: any[] = [];
        let usuariosDisponibles: any[] = [];
        let usuariosConError: any[] = [];

        for (const usuario of usuariosSeleccionados) {
            try {
                const { data, error } = await supabase
                    .from('cupones_usuarios')
                    .select('id, usado_en_pedido, cantidad_usos')
                    .eq('cupon_id', cuponParaAsignar.id)
                    .eq('usuario_id', usuario.id)
                    .maybeSingle();

                if (error) {
                    usuariosConError.push(usuario);
                    continue;
                }

                if (data) {
                    if (data.usado_en_pedido) {
                        usuariosYaUsaron.push(usuario);
                    } else {
                        usuariosYaTienen.push(usuario);
                    }
                } else {
                    usuariosDisponibles.push(usuario);
                }
            } catch (error) {
                usuariosConError.push(usuario);
            }
        }

        if (usuariosYaUsaron.length === usuariosSeleccionados.length && usuariosDisponibles.length === 0) {
            toast.advertencia('Todos los usuarios ya utilizaron este cupón');
            setUsuariosSeleccionados([]);
            return;
        }

        if (usuariosYaTienen.length === usuariosSeleccionados.length && usuariosDisponibles.length === 0) {
            toast.info('Todos los usuarios ya tienen este cupón asignado');
            setUsuariosSeleccionados([]);
            return;
        }

        if (usuariosYaUsaron.length > 0) {
            const disponibles = [...usuariosYaTienen, ...usuariosDisponibles];
            if (disponibles.length === 0) {
                toast.advertencia('No hay usuarios disponibles para asignar');
                setUsuariosSeleccionados([]);
                return;
            }
            if (usuariosDisponibles.length === 0) {
                toast.info('Los usuarios restantes ya tienen este cupón');
                setUsuariosSeleccionados([]);
                return;
            }
            toast.info(`${usuariosYaUsaron.length} usuario(s) ya usaron el cupón. Continuando con el resto...`);
            setUsuariosSeleccionados(disponibles);
            realizarAsignacion(disponibles);
            return;
        }

        if (usuariosYaTienen.length > 0 && usuariosDisponibles.length > 0) {
            toast.info(`${usuariosYaTienen.length} usuario(s) ya tienen el cupón. Continuando con el resto...`);
            setUsuariosSeleccionados(usuariosDisponibles);
            realizarAsignacion(usuariosDisponibles);
            return;
        }

        realizarAsignacion(usuariosSeleccionados);
    };

    // ============================================================
    // 🎯 FUNCIÓN AUXILIAR PARA REALIZAR LA ASIGNACIÓN
    // ============================================================
    const realizarAsignacion = async (usuarios: any[]) => {
        if (usuarios.length === 0) {
            toast.advertencia('No hay usuarios disponibles para asignar');
            return;
        }

        if (cuponParaAsignar) {
            try {
                const estado = await cuponService.verificarEstadoCupon(cuponParaAsignar.id);
                if (estado.mensaje) {
                    toast.error(estado.mensaje);
                    return;
                }
            } catch (error) {
                toast.error('Error al verificar el estado del cupón');
                return;
            }
        }

        setAsignando(true);
        let exito = 0;
        let errores = 0;
        let yaAsignados = 0;
        let yaUsados = 0;
        let expirados = 0;
        let inactivos = 0;
        let agotados = 0;
        let ultimoError = '';

        for (const usuario of usuarios) {
            try {
                const resultado = await cuponService.asignarCuponAUsuario(
                    cuponParaAsignar!.id,
                    usuario.id
                );

                if (resultado.success) {
                    if (resultado.yaAsignado) {
                        yaAsignados++;
                    } else {
                        exito++;
                    }
                } else {
                    const errorMsg = (resultado.error || '').toLowerCase();
                    ultimoError = resultado.error || '';
                    if (errorMsg.includes('expirado') || errorMsg.includes('expiró')) {
                        expirados++;
                    } else if (errorMsg.includes('inactivo') || errorMsg.includes('desactivado')) {
                        inactivos++;
                    } else if (errorMsg.includes('ya fue utilizado') || errorMsg.includes('usado')) {
                        yaUsados++;
                    } else if (errorMsg.includes('agotado') || errorMsg.includes('límite')) {
                        agotados++;
                    } else {
                        errores++;
                    }
                }
            } catch (error) {
                errores++;
            }
        }

        setAsignando(false);

        let mensaje = '';
        let tieneExito = false;

        if (exito > 0) {
            mensaje += `✅ ${exito} cupón(es) asignados\n`;
            tieneExito = true;
        }
        if (yaAsignados > 0) {
            mensaje += `ℹ️ ${yaAsignados} ya tenían el cupón\n`;
            tieneExito = true;
        }
        if (yaUsados > 0) {
            mensaje += `❌ ${yaUsados} ya usaron el cupón\n`;
        }
        if (expirados > 0) {
            mensaje += `⏰ ${expirados} - cupón expirado\n`;
        }
        if (inactivos > 0) {
            mensaje += `❌ ${inactivos} - cupón inactivo\n`;
        }
        if (agotados > 0) {
            mensaje += `❌ ${agotados} - cupón agotado\n`;
        }
        if (errores > 0) {
            mensaje += `⚠️ ${errores} - error inesperado`;
        }

        if (tieneExito) {
            toast.exito(mensaje.trim());
            await cargarCupones();
            cerrarModalAsignar();
        } else {
            if (expirados > 0) {
                toast.error(`⏰ ${expirados} usuario(s) - el cupón expiró`);
            } else if (inactivos > 0) {
                toast.error('❌ El cupón está inactivo');
            } else if (agotados > 0) {
                toast.error('❌ Cupón agotado');
            } else if (yaUsados > 0) {
                toast.error('⚠️ Los usuarios ya usaron el cupón');
            } else if (errores > 0) {
                toast.error(ultimoError || '❌ No se pudo asignar');
            }
            setUsuariosSeleccionados([]);
        }
    };

    const abrirModalAsignar = (cupon: Cupon) => {
        setCuponParaAsignar(cupon);
        setUsuariosSeleccionados([]);
        setSeleccionarTodos(false);
        setBusquedaUsuario('');
        setFiltroRol('todos');
        setMostrarAsignar(true);
        cargarUsuarios('', 'todos');
    };

    const cerrarModalAsignar = () => {
        setMostrarAsignar(false);
        setCuponParaAsignar(null);
        setUsuariosSeleccionados([]);
        setSeleccionarTodos(false);
        setBusquedaUsuario('');
    };

    const handleBuscarUsuario = (text: string) => {
        setBusquedaUsuario(text);
        cargarUsuarios(text, filtroRol);
    };

    const handleFiltroRol = (rol: 'todos' | 'clientes' | 'admins') => {
        setFiltroRol(rol);
        setUsuariosSeleccionados([]);
        setSeleccionarTodos(false);
        cargarUsuarios(busquedaUsuario, rol);
    };

    // ============================================================
    // 🗑️ VERIFICAR ASIGNACIONES
    // ============================================================
    const verificarAsignaciones = async (cuponId: number): Promise<{
        tieneAsignaciones: boolean;
        total: number;
        usados: number;
        disponibles: number;
    }> => {
        try {
            const { count: total } = await supabase
                .from('cupones_usuarios')
                .select('*', { count: 'exact', head: true })
                .eq('cupon_id', cuponId);

            const { count: usados } = await supabase
                .from('cupones_usuarios')
                .select('*', { count: 'exact', head: true })
                .eq('cupon_id', cuponId)
                .eq('usado_en_pedido', true);

            const totalNum = total || 0;
            const usadosNum = usados || 0;
            const disponiblesNum = totalNum - usadosNum;

            return {
                tieneAsignaciones: totalNum > 0,
                total: totalNum,
                usados: usadosNum,
                disponibles: disponiblesNum,
            };
        } catch (error) {
            console.error('Error verificando asignaciones:', error);
            return {
                tieneAsignaciones: false,
                total: 0,
                usados: 0,
                disponibles: 0,
            };
        }
    };

    // ============================================================
    // 🗑️ ELIMINAR CUPÓN CON VERIFICACIÓN
    // ============================================================
    const handleEliminar = async (cupon: Cupon) => {
        try {
            const asignaciones = await verificarAsignaciones(cupon.id);

            if (asignaciones.usados > 0) {
                toast.advertencia(
                    `⚠️ Este cupón ya fue usado por ${asignaciones.usados} usuario(s). ` +
                    `Solo podés desactivarlo para mantener el historial.`
                );
                return;
            }

            if (asignaciones.tieneAsignaciones) {
                Alert.alert(
                    '⚠️ Cupón con asignaciones',
                    `Este cupón está asignado a ${asignaciones.total} usuario(s) que aún no lo usaron.\n\n` +
                    `Si lo eliminás, esos usuarios perderán el cupón.\n\n` +
                    `📌 Recomendación: Desactivarlo en su lugar.`,
                    [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                            text: '🔴 Desactivar',
                            onPress: () => handleToggleActivo(cupon),
                        },
                        {
                            text: '🗑️ Eliminar igual',
                            style: 'destructive',
                            onPress: () => confirmarEliminacion(cupon, asignaciones.total),
                        },
                    ]
                );
                return;
            }

            confirmarEliminacion(cupon, 0);

        } catch (error) {
            console.error('Error verificando asignaciones:', error);
            toast.error('Error al verificar el cupón');
        }
    };

    // ============================================================
    // 🗑️ CONFIRMAR ELIMINACIÓN
    // ============================================================
    const confirmarEliminacion = (cupon: Cupon, totalAsignaciones: number) => {
        const mensajeExtra = totalAsignaciones > 0
            ? `\n⚠️ Se eliminarán ${totalAsignaciones} asignación(es) existente(s).`
            : '';

        Alert.alert(
            '🗑️ Eliminar cupón',
            `¿Estás seguro de que querés eliminar permanentemente el cupón "${cupon.titulo}"?${mensajeExtra}\n\n⚠️ Esta acción NO se puede deshacer.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const resultado = await cuponService.eliminarCupon(cupon.id);

                            if (resultado.success) {
                                toast.exito('✅ Cupón eliminado permanentemente');
                                setCupones(prev => prev.filter(c => c.id !== cupon.id));
                                await cargarContadoresUsuarios(
                                    cupones.filter(c => c.id !== cupon.id)
                                );
                            } else {
                                toast.error(resultado.error || '❌ Error al eliminar el cupón');
                            }
                        } catch (error) {
                            console.error('Error eliminando cupón:', error);
                            toast.error('❌ Error al eliminar el cupón');
                        }
                    },
                },
            ]
        );
    };

    // ============================================================
    // 🔄 TOGGLE ACTIVO
    // ============================================================
    const handleToggleActivo = async (cupon: Cupon) => {
        try {
            const resultado = await cuponService.actualizarCupon(cupon.id, {
                activo: !cupon.activo,
            });
            if (resultado.success) {
                toast.exito(`✅ Cupón ${cupon.activo ? 'desactivado' : 'activado'}`);
                setCupones(prev => prev.map(c =>
                    c.id === cupon.id ? { ...c, activo: !cupon.activo } : c
                ));
            } else {
                toast.error(resultado.error || '❌ Error al actualizar');
            }
        } catch (error) {
            console.error('Error actualizando cupón:', error);
            toast.error('❌ Error al actualizar');
        }
    };

    // ============================================================
    // 🎨 RENDER ITEM
    // ============================================================
    const renderItem = ({ item }: { item: Cupon }) => {
        const tipoColor = colorPorTipo(item.tipo);
        const tipoIcono = iconoPorTipo(item.tipo);
        const estado = validarCuponActivo(item);
        const isActivo = estado.valido;
        const usuariosAsignados = contadoresUsuarios[item.id] || 0;

        const estaAgotado = item.usos_maximos !== null && item.usos_totales >= item.usos_maximos;
        const usosRestantes = item.usos_maximos !== null
            ? item.usos_maximos - item.usos_totales
            : Infinity;

        if (filtro === 'activos' && !isActivo) return null;
        if (filtro === 'inactivos' && isActivo) return null;

        return (
            <View style={[styles.cuponCard, { backgroundColor: DESIGN.colors.surface }]}>
                <View style={styles.cuponHeader}>
                    <View style={styles.cuponTipo}>
                        <Text style={styles.cuponIcon}>{tipoIcono}</Text>
                        <Text style={[styles.cuponTipoText, { color: tipoColor }]}>
                            {item.tipo.replace('_', ' ').toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.headerBadges}>
                        {estaAgotado && (
                            <View style={[styles.estadoBadge, { backgroundColor: DESIGN.colors.naranja, marginRight: 4 }]}>
                                <Text style={styles.estadoText}>AGOTADO</Text>
                            </View>
                        )}
                        <TouchableOpacity
                            style={[styles.estadoBadge, { backgroundColor: isActivo ? DESIGN.colors.verde : DESIGN.colors.accent }]}
                            onPress={() => handleToggleActivo(item)}
                        >
                            <Text style={styles.estadoText}>{isActivo ? 'ACTIVO' : 'INACTIVO'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={styles.cuponTitulo}>{item.titulo}</Text>
                {item.descripcion && (
                    <Text style={styles.cuponDescripcion} numberOfLines={2}>
                        {item.descripcion}
                    </Text>
                )}

                <View style={styles.cuponFooter}>
                    <Text style={[styles.cuponDescuento, { color: tipoColor }]}>
                        {formatearDescuento(item)}
                    </Text>
                    <View style={styles.cuponUsos}>
                        <Ionicons name="people-outline" size={14} color={DESIGN.colors.textSecondary} />
                        <Text style={styles.cuponUsosText}>
                            {usuariosAsignados} usuarios
                        </Text>
                    </View>
                </View>

                <View style={styles.cuponUsosRestantes}>
                    <Ionicons name="repeat-outline" size={14} color={DESIGN.colors.textSecondary} />
                    <Text style={styles.cuponUsosText}>
                        Usos: {item.usos_totales}
                        {item.usos_maximos !== null ? ` / ${item.usos_maximos}` : ' ∞'}
                        {!estaAgotado && item.usos_maximos !== null && (
                            <Text style={{ color: DESIGN.colors.verde, fontWeight: 'bold' }}>
                                {' '}({usosRestantes} disponibles)
                            </Text>
                        )}
                    </Text>
                </View>

                <View style={styles.cuponCodigo}>
                    <Text style={styles.cuponCodigoText}>🔑 {item.codigo}</Text>
                </View>

                <View style={styles.cuponAcciones}>
                    <TouchableOpacity
                        style={[styles.accionBoton, styles.accionAsignar, estaAgotado && styles.accionDisabled]}
                        onPress={() => abrirModalAsignar(item)}
                        disabled={estaAgotado}
                    >
                        <Ionicons
                            name="person-add-outline"
                            size={20}
                            color={estaAgotado ? DESIGN.colors.textTertiary : DESIGN.colors.morado}
                        />
                        {!isSmallPhone && (
                            <Text style={[styles.accionTexto, { color: estaAgotado ? DESIGN.colors.textTertiary : DESIGN.colors.morado }]}>
                                {estaAgotado ? 'Agotado' : 'Asignar'}
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.accionBoton, styles.accionQR]}
                        onPress={() => {
                            setCuponSeleccionado(item);
                            setMostrarQR(true);
                        }}
                    >
                        <Ionicons name="qr-code-outline" size={20} color={DESIGN.colors.accentSecondary} />
                        {!isSmallPhone && (
                            <Text style={[styles.accionTexto, { color: DESIGN.colors.accentSecondary }]}>QR</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.accionBoton, styles.accionEditar]}
                        onPress={() => navigation.navigate('EditarCupon', { cuponId: item.id })}
                    >
                        <Ionicons name="create-outline" size={20} color={DESIGN.colors.verde} />
                        {!isSmallPhone && (
                            <Text style={[styles.accionTexto, { color: DESIGN.colors.verde }]}>Editar</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.accionBoton, styles.accionEliminar]}
                        onPress={() => handleEliminar(item)}
                    >
                        <Ionicons name="trash-outline" size={20} color={DESIGN.colors.accent} />
                        {!isSmallPhone && (
                            <Text style={[styles.accionTexto, { color: DESIGN.colors.accent }]}>Eliminar</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.accionBoton, styles.accionPDF]}
                        onPress={() => {
                            setCuponParaFisicos(item);
                            setMostrarGenerarFisicos(true);
                        }}
                    >
                        <Ionicons name="print-outline" size={20} color={DESIGN.colors.morado} />
                        {!isSmallPhone && (
                            <Text style={[styles.accionTexto, { color: DESIGN.colors.morado }]}>PDF</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    // ============================================================
    // 🖥️ RENDER PRINCIPAL
    // ============================================================
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[Colores.secundario, Colores.primario]}
                style={styles.backgroundGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <View style={[styles.header, { paddingTop: insets.top + 16, paddingHorizontal: padding }]}>
                <Text style={styles.headerTitle}>🎟️ Cupones</Text>
                <TouchableOpacity
                    style={styles.headerBoton}
                    onPress={() => navigation.navigate('CrearCupon')}
                    activeOpacity={0.7}
                >
                    <Ionicons name="add" size={24} color={Colores.textoOscuro} />
                </TouchableOpacity>
            </View>

            <View style={[styles.filtrosContainer, { paddingHorizontal: padding }]}>
                {['todos', 'activos', 'inactivos'].map((f) => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filtroBoton, filtro === f && styles.filtroBotonActivo]}
                        onPress={() => setFiltro(f as any)}
                    >
                        <Text style={[styles.filtroTexto, filtro === f && styles.filtroTextoActivo]}>
                            {f === 'todos' && 'Todos'}
                            {f === 'activos' && 'Activos'}
                            {f === 'inactivos' && 'Inactivos'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {cargando ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colores.secundario} />
                    <Text style={styles.loadingText}>Cargando cupones...</Text>
                </View>
            ) : cupones.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>🎫</Text>
                    <Text style={styles.emptyTitle}>No hay cupones</Text>
                    <Text style={styles.emptyText}>Creá tu primer cupón para empezar</Text>
                    <TouchableOpacity
                        style={styles.emptyButton}
                        onPress={() => navigation.navigate('CrearCupon')}
                        activeOpacity={0.7}
                    >
                        <LinearGradient
                            colors={[Colores.secundario, Colores.primario]}
                            style={styles.emptyButtonGradient}
                        >
                            <Ionicons name="add-circle-outline" size={20} color={Colores.textoOscuro} />
                            <Text style={styles.emptyButtonText}>Crear Cupón</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={cupones}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={[
                        styles.listContent,
                        { paddingHorizontal: padding, paddingBottom: insets.bottom + 40 }
                    ]}
                    refreshControl={
                        <RefreshControl refreshing={refrescando} onRefresh={() => {
                            setRefrescando(true);
                            cargarCupones();
                        }} />
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}

            <CuponQRGenerator
                visible={mostrarQR}
                cupon={cuponSeleccionado}
                onClose={() => {
                    setMostrarQR(false);
                    setCuponSeleccionado(null);
                }}
            />

            {/* Modal Generar Cupones Físicos (PDF) */}
            <ModalGenerarCuponesFisicos
                visible={mostrarGenerarFisicos}
                cupon={cuponParaFisicos}
                onClose={() => {
                    setMostrarGenerarFisicos(false);
                    setCuponParaFisicos(null);
                }}
                onSuccess={() => {
                    cargarCupones();
                }}
            />

            {/* Modal Asignar Cupón */}
            <Modal visible={mostrarAsignar} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: DESIGN.colors.surface }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>🎯 Asignar Cupón</Text>
                            <TouchableOpacity onPress={cerrarModalAsignar}>
                                <Ionicons name="close" size={24} color={DESIGN.colors.text} />
                            </TouchableOpacity>
                        </View>

                        {cuponParaAsignar && (
                            <View style={styles.cuponInfoModal}>
                                <Text style={styles.cuponInfoTitulo}>{cuponParaAsignar.titulo}</Text>
                                <Text style={styles.cuponInfoCodigo}>Código: {cuponParaAsignar.codigo}</Text>

                                <View style={styles.cuponInfoUsos}>
                                    <Text style={styles.cuponInfoUsosLabel}>Usos disponibles:</Text>
                                    <Text style={[
                                        styles.cuponInfoUsosValor,
                                        {
                                            color: (cuponParaAsignar.usos_maximos !== null &&
                                                cuponParaAsignar.usos_totales >= cuponParaAsignar.usos_maximos)
                                                ? DESIGN.colors.accent
                                                : DESIGN.colors.verde
                                        }
                                    ]}>
                                        {cuponParaAsignar.usos_maximos !== null
                                            ? `${cuponParaAsignar.usos_maximos - cuponParaAsignar.usos_totales} de ${cuponParaAsignar.usos_maximos}`
                                            : 'Ilimitado'}
                                    </Text>
                                </View>

                                {cuponParaAsignar.usos_maximos !== null &&
                                    cuponParaAsignar.usos_totales >= cuponParaAsignar.usos_maximos && (
                                        <View style={styles.cuponAgotadoWarning}>
                                            <Ionicons name="warning" size={16} color={DESIGN.colors.naranja} />
                                            <Text style={styles.cuponAgotadoText}>
                                                ⚠️ Este cupón ha alcanzado su límite de usos
                                            </Text>
                                        </View>
                                    )}
                            </View>
                        )}

                        <View style={styles.filtrosRolContainer}>
                            {['todos', 'clientes', 'admins'].map((rol) => (
                                <TouchableOpacity
                                    key={rol}
                                    style={[
                                        styles.filtroRolBoton,
                                        filtroRol === rol && styles.filtroRolBotonActivo,
                                    ]}
                                    onPress={() => handleFiltroRol(rol as any)}
                                >
                                    <Text style={[
                                        styles.filtroRolTexto,
                                        filtroRol === rol && styles.filtroRolTextoActivo,
                                    ]}>
                                        {rol === 'todos' && '👥 Todos'}
                                        {rol === 'clientes' && '👤 Clientes'}
                                        {rol === 'admins' && '👑 Admins'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.busquedaContainer}>
                            <TextInput
                                style={styles.busquedaInput}
                                value={busquedaUsuario}
                                onChangeText={handleBuscarUsuario}
                                placeholder="Buscar por nombre o email..."
                                placeholderTextColor={DESIGN.colors.textTertiary}
                            />
                        </View>

                        <View style={styles.seleccionInfo}>
                            <Text style={styles.seleccionInfoText}>
                                {usuariosSeleccionados.length} usuario{usuariosSeleccionados.length !== 1 ? 's' : ''} seleccionado{usuariosSeleccionados.length !== 1 ? 's' : ''}
                            </Text>
                            {usuariosSeleccionados.length > 0 && (
                                <TouchableOpacity onPress={() => setUsuariosSeleccionados([])}>
                                    <Text style={styles.seleccionLimpiar}>Limpiar</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {cargandoUsuarios ? (
                            <View style={styles.cargandoUsuariosContainer}>
                                <ActivityIndicator size="small" color={DESIGN.colors.morado} />
                                <Text style={styles.cargandoUsuariosText}>Cargando usuarios...</Text>
                            </View>
                        ) : usuariosFiltrados.length === 0 ? (
                            <View style={styles.emptyUsuariosContainer}>
                                <Text style={styles.emptyUsuariosText}>No se encontraron usuarios</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={usuariosFiltrados}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => {
                                    const seleccionado = usuariosSeleccionados.some(u => u.id === item.id);
                                    return (
                                        <TouchableOpacity
                                            style={[
                                                styles.usuarioItem,
                                                seleccionado && styles.usuarioItemSeleccionado,
                                            ]}
                                            onPress={() => toggleSeleccionUsuario(item)}
                                        >
                                            <View style={styles.usuarioInfo}>
                                                <Text style={styles.usuarioNombre}>
                                                    {item.nombre_cliente || 'Sin nombre'}
                                                </Text>
                                                <Text style={styles.usuarioEmail}>{item.email}</Text>
                                            </View>
                                            <View style={styles.usuarioBadges}>
                                                <View style={[styles.usuarioRolBadge, {
                                                    backgroundColor: item.rol === 'admin' ? DESIGN.colors.morado : DESIGN.colors.verde
                                                }]}>
                                                    <Text style={styles.usuarioRolText}>
                                                        {item.rol || 'usuario'}
                                                    </Text>
                                                </View>
                                                <Ionicons
                                                    name={seleccionado ? 'checkbox' : 'square-outline'}
                                                    size={22}
                                                    color={seleccionado ? DESIGN.colors.morado : DESIGN.colors.textTertiary}
                                                />
                                            </View>
                                        </TouchableOpacity>
                                    );
                                }}
                                ListHeaderComponent={
                                    <TouchableOpacity
                                        style={styles.seleccionarTodosBoton}
                                        onPress={toggleSeleccionarTodos}
                                    >
                                        <Ionicons
                                            name={seleccionarTodos ? 'checkbox' : 'square-outline'}
                                            size={20}
                                            color={DESIGN.colors.morado}
                                        />
                                        <Text style={styles.seleccionarTodosText}>
                                            {seleccionarTodos ? 'Deseleccionar todos' : 'Seleccionar todos'}
                                        </Text>
                                    </TouchableOpacity>
                                }
                            />
                        )}

                        <View style={styles.modalAcciones}>
                            <TouchableOpacity
                                style={[styles.modalBoton, styles.modalBotonCancelar]}
                                onPress={cerrarModalAsignar}
                            >
                                <Text style={styles.modalBotonTexto}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.modalBoton,
                                    styles.modalBotonAsignar,
                                    (usuariosSeleccionados.length === 0 || asignando) && styles.modalBotonDisabled
                                ]}
                                onPress={handleAsignarMultiples}
                                disabled={usuariosSeleccionados.length === 0 || asignando}
                            >
                                {asignando ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.modalBotonTexto}>Asignar</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Toast visible={toast.visible} mensaje={toast.mensaje} tipo={toast.tipo} ocultar={toast.ocultar} />
        </View>
    );
}

// ============================================================
// 📐 ESTILOS
// ============================================================
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: DESIGN.colors.fondo,
    },
    backgroundGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.08,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 16,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: DESIGN.colors.text,
        letterSpacing: -0.5,
    },
    headerBoton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: DESIGN.colors.accentSecondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filtrosContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        gap: 8,
    },
    filtroBoton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: DESIGN.colors.surface,
        borderWidth: 1,
        borderColor: DESIGN.colors.border,
    },
    filtroBotonActivo: {
        backgroundColor: DESIGN.colors.morado,
        borderColor: DESIGN.colors.morado,
    },
    filtroTexto: {
        fontSize: 14,
        fontWeight: '500',
        color: DESIGN.colors.textSecondary,
    },
    filtroTextoActivo: {
        color: '#FFFFFF',
    },
    listContent: {
        paddingTop: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: DESIGN.colors.textSecondary,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: DESIGN.colors.text,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        color: DESIGN.colors.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
    },
    emptyButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    emptyButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        gap: 8,
    },
    emptyButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colores.textoOscuro,
    },
    cuponCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    cuponHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cuponTipo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    cuponIcon: {
        fontSize: 16,
    },
    cuponTipoText: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    headerBadges: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    estadoBadge: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12,
    },
    estadoText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    cuponTitulo: {
        fontSize: 18,
        fontWeight: '700',
        color: DESIGN.colors.text,
        marginBottom: 4,
    },
    cuponDescripcion: {
        fontSize: 14,
        color: DESIGN.colors.textSecondary,
        marginBottom: 12,
    },
    cuponFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cuponDescuento: {
        fontSize: 16,
        fontWeight: '700',
    },
    cuponUsos: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    cuponUsosText: {
        fontSize: 13,
        color: DESIGN.colors.textSecondary,
    },
    cuponUsosRestantes: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 8,
    },
    cuponCodigo: {
        backgroundColor: DESIGN.colors.fondo,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    cuponCodigoText: {
        fontSize: 14,
        fontWeight: '600',
        color: DESIGN.colors.textSecondary,
        fontFamily: 'monospace',
    },
    cuponAcciones: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: DESIGN.colors.border,
        paddingTop: 10,
        gap: 2,
    },
    accionBoton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 8,
        paddingHorizontal: 6,
        borderRadius: 8,
        backgroundColor: DESIGN.colors.fondo,
        flex: 1,
        minWidth: 36,
        maxWidth: '20%',
    },
    accionDisabled: {
        opacity: 0.5,
    },
    accionAsignar: {
        backgroundColor: 'rgba(123, 31, 162, 0.08)',
    },
    accionQR: {
        backgroundColor: 'rgba(245, 197, 24, 0.12)',
    },
    accionEditar: {
        backgroundColor: 'rgba(67, 160, 71, 0.08)',
    },
    accionEliminar: {
        backgroundColor: 'rgba(229, 57, 53, 0.08)',
    },
    accionPDF: {
        backgroundColor: 'rgba(123, 31, 162, 0.08)',
    },
    accionTexto: {
        fontSize: 10,
        fontWeight: '500',
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        maxHeight: '90%',
        borderRadius: 20,
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: DESIGN.colors.text,
    },
    cuponInfoModal: {
        backgroundColor: DESIGN.colors.fondo,
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
    },
    cuponInfoTitulo: {
        fontSize: 16,
        fontWeight: '600',
        color: DESIGN.colors.text,
    },
    cuponInfoCodigo: {
        fontSize: 14,
        color: DESIGN.colors.textSecondary,
        marginTop: 2,
    },
    cuponInfoUsos: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    cuponInfoUsosLabel: {
        fontSize: 14,
        color: DESIGN.colors.textSecondary,
    },
    cuponInfoUsosValor: {
        fontSize: 14,
        fontWeight: '600',
    },
    cuponAgotadoWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
        padding: 8,
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        borderRadius: 8,
    },
    cuponAgotadoText: {
        fontSize: 13,
        color: DESIGN.colors.naranja,
        fontWeight: '500',
    },
    filtrosRolContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    filtroRolBoton: {
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 16,
        backgroundColor: DESIGN.colors.fondo,
        borderWidth: 1,
        borderColor: DESIGN.colors.border,
    },
    filtroRolBotonActivo: {
        backgroundColor: DESIGN.colors.morado,
        borderColor: DESIGN.colors.morado,
    },
    filtroRolTexto: {
        fontSize: 13,
        fontWeight: '500',
        color: DESIGN.colors.textSecondary,
    },
    filtroRolTextoActivo: {
        color: '#FFFFFF',
    },
    busquedaContainer: {
        marginBottom: 12,
    },
    busquedaInput: {
        backgroundColor: DESIGN.colors.fondo,
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 14,
        fontSize: 15,
        color: DESIGN.colors.text,
        borderWidth: 1,
        borderColor: DESIGN.colors.border,
    },
    seleccionInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    seleccionInfoText: {
        fontSize: 14,
        color: DESIGN.colors.textSecondary,
    },
    seleccionLimpiar: {
        fontSize: 14,
        color: DESIGN.colors.accent,
        fontWeight: '500',
    },
    cargandoUsuariosContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    cargandoUsuariosText: {
        marginTop: 8,
        fontSize: 14,
        color: DESIGN.colors.textSecondary,
    },
    emptyUsuariosContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyUsuariosText: {
        fontSize: 16,
        color: DESIGN.colors.textSecondary,
    },
    seleccionarTodosBoton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginBottom: 8,
        backgroundColor: DESIGN.colors.fondo,
        borderRadius: 8,
    },
    seleccionarTodosText: {
        fontSize: 14,
        fontWeight: '500',
        color: DESIGN.colors.text,
    },
    usuarioItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: DESIGN.colors.border,
    },
    usuarioItemSeleccionado: {
        backgroundColor: 'rgba(123, 31, 162, 0.06)',
        borderRadius: 8,
    },
    usuarioInfo: {
        flex: 1,
        marginRight: 12,
    },
    usuarioNombre: {
        fontSize: 15,
        fontWeight: '500',
        color: DESIGN.colors.text,
    },
    usuarioEmail: {
        fontSize: 13,
        color: DESIGN.colors.textSecondary,
    },
    usuarioBadges: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    usuarioRolBadge: {
        paddingVertical: 2,
        paddingHorizontal: 8,
        borderRadius: 10,
    },
    usuarioRolText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#FFFFFF',
        textTransform: 'uppercase',
    },
    modalAcciones: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    modalBoton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalBotonCancelar: {
        backgroundColor: DESIGN.colors.fondo,
        borderWidth: 1,
        borderColor: DESIGN.colors.border,
    },
    modalBotonAsignar: {
        backgroundColor: DESIGN.colors.morado,
    },
    modalBotonDisabled: {
        opacity: 0.5,
    },
    modalBotonTexto: {
        fontSize: 16,
        fontWeight: '600',
        color: DESIGN.colors.text,
    },
});