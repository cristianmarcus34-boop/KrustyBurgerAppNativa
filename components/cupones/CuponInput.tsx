
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colores } from '../../lib/colores';

interface CuponInputProps {
    onAplicar: (codigo: string) => Promise<void> | void;
    loading?: boolean;
    codigoInicial?: string;
    placeholder?: string;
}

export const CuponInput: React.FC<CuponInputProps> = ({
    onAplicar,
    loading = false,
    codigoInicial = '',
    placeholder = 'Ingresá el código del cupón',
}) => {
    const [codigo, setCodigo] = useState(codigoInicial);

    const handleAplicar = async () => {
        const codigoLimpio = codigo.trim().toUpperCase();

        if (!codigoLimpio || loading) {
            return;
        }

        await onAplicar(codigoLimpio);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>
                ¿Tenés un cupón?
            </Text>

            <View style={styles.row}>
                {/* Campo de código */}
                <View style={styles.inputContainer}>
                    <Ionicons
                        name="pricetag-outline"
                        size={20}
                        color={Colores.textoGrisOscuro}
                        style={styles.icon}
                    />

                    <TextInput
                        value={codigo}
                        onChangeText={setCodigo}
                        placeholder={placeholder}
                        placeholderTextColor={Colores.textoGris}
                        autoCapitalize="characters"
                        autoCorrect={false}
                        editable={!loading}
                        returnKeyType="done"
                        onSubmitEditing={handleAplicar}
                        style={styles.input}
                    />
                </View>

                {/* Botón aplicar */}
                <TouchableOpacity
                    style={[
                        styles.button,
                        (!codigo.trim() || loading) &&
                        styles.buttonDisabled,
                    ]}
                    onPress={handleAplicar}
                    disabled={!codigo.trim() || loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator
                            size="small"
                            color={Colores.krustyBlanco}
                        />
                    ) : (
                        <Text style={styles.buttonText}>
                            Aplicar
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginBottom: 16,
    },

    label: {
        fontSize: 15,
        fontWeight: '600',
        color: Colores.textoOscuro,
        marginBottom: 8,
    },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    inputContainer: {
        flex: 1,
        minHeight: 48,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.12)',
        borderRadius: 12,
        backgroundColor: Colores.fondoBlanco,
        paddingHorizontal: 12,
    },

    icon: {
        marginRight: 8,
    },

    input: {
        flex: 1,
        fontSize: 15,
        color: Colores.textoOscuro,
        paddingVertical: 10,
    },

    button: {
        minHeight: 48,
        paddingHorizontal: 18,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colores.primario,
    },

    buttonDisabled: {
        opacity: 0.5,
    },

    buttonText: {
        color: Colores.krustyBlanco,
        fontSize: 14,
        fontWeight: '700',
    },
});

export default CuponInput;

