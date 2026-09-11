// services/servicioPreciosPedido.ts

export interface CuponComercialPrecio {
    tipo?: string | null;
    valor_descuento?: number | string | null;
    es_porcentaje?: boolean | null;
}

export interface CuponPuntosPrecio {
    recompensas?: {
        tipo?: string | null;
        valor_descuento?: number | string | null;
    } | null;
}

export interface CalcularResumenPedidoParams {
    subtotal: number;
    cuponAplicado?: CuponComercialPrecio | null;
    cuponPuntosAplicado?: CuponPuntosPrecio | null;
    descuentoNivel?: number | null;
    costoEnvio?: number | null;
    tipoEntrega?: string | null;
    envioGratisNivel?: boolean | null;
}

export interface ResumenPedido {
    subtotal: number;
    descuentoNivel: number;
    descuentoPuntos: number;
    descuentoCupon: number;
    descuentoTotal: number;
    envioBase: number;
    costoEnvioFinal: number;
    envioGratisPorNivel: boolean;
    envioGratisPorPuntos: boolean;
    envioGratisPorCupon: boolean;
    envioGratis: boolean;
    totalFinal: number;
}

const numeroSeguro = (valor: unknown): number => {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : 0;
};

const limitarDescuento = (
    descuento: number,
    subtotal: number
): number => {
    return Math.min(
        Math.max(0, descuento),
        Math.max(0, subtotal)
    );
};

const calcularDescuentoPuntos = (
    subtotal: number,
    cuponPuntos?: CuponPuntosPrecio | null
): number => {
    if (!cuponPuntos?.recompensas) {
        return 0;
    }

    const recompensa = cuponPuntos.recompensas;

    const tipo = String(
        recompensa.tipo || ''
    ).toUpperCase();

    const valor = numeroSeguro(
        recompensa.valor_descuento
    );

    if (tipo === 'DESCUENTO_FIJO') {
        return limitarDescuento(valor, subtotal);
    }

    if (tipo === 'DESCUENTO') {
        return limitarDescuento(
            (subtotal * valor) / 100,
            subtotal
        );
    }

    return 0;
};

const calcularDescuentoCupon = (
    subtotal: number,
    cupon?: CuponComercialPrecio | null
): number => {
    if (!cupon) {
        return 0;
    }

    const tipo = String(
        cupon.tipo || ''
    ).toLowerCase();

    const valor = numeroSeguro(
        cupon.valor_descuento
    );

    if (tipo !== 'descuento') {
        return 0;
    }

    if (Boolean(cupon.es_porcentaje)) {
        return limitarDescuento(
            (subtotal * valor) / 100,
            subtotal
        );
    }

    return limitarDescuento(
        valor,
        subtotal
    );
};

const cuponDaEnvioGratis = (
    cupon?: CuponComercialPrecio | null
): boolean => {
    return (
        String(cupon?.tipo || '').toLowerCase() ===
        'envio_gratis'
    );
};

const puntosDanEnvioGratis = (
    cupon?: CuponPuntosPrecio | null
): boolean => {
    return (
        String(
            cupon?.recompensas?.tipo || ''
        ).toUpperCase() === 'ENVIO_GRATIS'
    );
};

export const calcularResumenPedido = ({
    subtotal,
    cuponAplicado = null,
    cuponPuntosAplicado = null,
    descuentoNivel = 0,
    costoEnvio = 0,
    tipoEntrega = 'domicilio',
    envioGratisNivel = false,
}: CalcularResumenPedidoParams): ResumenPedido => {
    const subtotalSeguro = Math.max(
        0,
        numeroSeguro(subtotal)
    );

    const descuentoNivelSeguro =
        limitarDescuento(
            numeroSeguro(descuentoNivel),
            subtotalSeguro
        );

    const envioBase = Math.max(
        0,
        numeroSeguro(costoEnvio)
    );

    const descuentoPuntos =
        calcularDescuentoPuntos(
            subtotalSeguro,
            cuponPuntosAplicado
        );

    const descuentoCupon =
        calcularDescuentoCupon(
            subtotalSeguro,
            cuponAplicado
        );

    const envioGratisPorNivel =
        Boolean(envioGratisNivel);

    const envioGratisPorPuntos =
        puntosDanEnvioGratis(
            cuponPuntosAplicado
        );

    const envioGratisPorCupon =
        cuponDaEnvioGratis(
            cuponAplicado
        );

    const esRetiro =
        String(tipoEntrega || '').toLowerCase() ===
        'retiro';

    const envioGratis =
        esRetiro ||
        envioGratisPorNivel ||
        envioGratisPorPuntos ||
        envioGratisPorCupon;

    const costoEnvioFinal =
        envioGratis
            ? 0
            : envioBase;

    const descuentoTotal =
        descuentoNivelSeguro +
        descuentoPuntos +
        descuentoCupon;

    const totalFinal = Math.max(
        0,
        subtotalSeguro -
        descuentoTotal +
        costoEnvioFinal
    );

    return {
        subtotal: subtotalSeguro,

        descuentoNivel:
            descuentoNivelSeguro,

        descuentoPuntos,

        descuentoCupon,

        descuentoTotal,

        envioBase,

        costoEnvioFinal,

        envioGratisPorNivel,

        envioGratisPorPuntos,

        envioGratisPorCupon,

        envioGratis,

        totalFinal,
    };
};

export default calcularResumenPedido;