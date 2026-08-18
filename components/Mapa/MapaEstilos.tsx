// components/Mapa/MapaEstilos.ts
import { StyleSheet } from 'react-native';
import { Colores } from '../../lib/colores';

export const estilos = StyleSheet.create({
    contenedor: {
        flex: 1,
        backgroundColor: Colores.textoOscuro,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 12,
        backgroundColor: Colores.textoOscuro,
        borderBottomWidth: 1,
        borderBottomColor: Colores.textoClaro + '10',
        gap: 8,
    },
    botonVolver: {
        padding: 4,
    },
    buscadorContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colores.textoOscuro + '60',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: Colores.textoClaro + '10',
        gap: 8,
    },
    buscadorInput: {
        flex: 1,
        color: Colores.textoClaro,
        fontSize: 16,
        paddingVertical: 4,
    },
    botonLimpiar: {
        padding: 4,
    },
    botonConfirmar: {
        overflow: 'hidden',
        borderRadius: 12,
    },
    botonConfirmarGradient: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    botonConfirmarTexto: {
        color: Colores.textoOscuro,
        fontWeight: 'bold',
        fontSize: 14,
    },
    mapa: {
        flex: 1,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colores.textoOscuro + '85',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colores.textoClaro + '10',
        gap: 12,
    },
    footerInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    footerDireccion: {
        color: Colores.textoClaro,
        fontSize: 13,
        flex: 1,
        fontWeight: '500',
    },
    botonMiUbicacion: {
        backgroundColor: Colores.bartNaranja + '20',
        padding: 10,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: Colores.bartNaranja + '30',
    },
    instrucciones: {
        position: 'absolute',
        bottom: 100,
        left: 16,
        right: 16,
        backgroundColor: Colores.textoOscuro + '80',
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colores.textoClaro + '10',
    },
    instruccionesTexto: {
        color: Colores.textoGris,
        fontSize: 12,
        textAlign: 'center',
    },
});