// config/tema.ts

// ✅ TEMÁTICA KRUSTY - CENTRALIZADA
export const temaApp = {
    primario: '#E53935',
    secundario: '#F5C518',
    verde: '#43A047',
    fondo: '#1A1A1A',
    texto: '#FFFFFF',
    textoGris: '#B0B0B0',
    gradiente: ['#E53935', '#F5C518'] as const,
};

// ✅ HEADER CONFIGURACIÓN - CENTRALIZADA
export const HEADER_OPTIONS = {
    headerStyle: {
        backgroundColor: temaApp.fondo,
    },
    headerTintColor: temaApp.texto,
    headerTitleStyle: {
        fontWeight: 'bold' as const,
        fontSize: 18,
        color: temaApp.secundario,
    },
    headerBackTitle: '',
    headerShadowVisible: false,
};

// ✅ HEADER PARA PÁGINAS LEGALES
export const HEADER_LEGAL_OPTIONS = {
    ...HEADER_OPTIONS,
    headerBackTitle: 'Volver',
    headerBackVisible: true,
    headerTitleStyle: {
        fontWeight: 'bold' as const,
        fontSize: 18,
        color: temaApp.secundario,
    },
};

// ✅ HEADER PARA PANTALLAS CON TÍTULO PERSONALIZADO
export const crearHeaderConTitulo = (titulo: string) => ({
    ...HEADER_OPTIONS,
    headerTitle: titulo,
});