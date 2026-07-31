import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { Colores } from '../../lib/colores';

interface Oferta {
  id: number;
  titulo: string;
  descripcion: string;
  descuento: string;
  precio_original: number;
  precio_oferta: number;
}

export default function PantallaOfertas() {
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarOfertas();
  }, []);

  const cargarOfertas = async () => {
    const { data } = await supabase.from('ofertas').select('*').eq('activa', true);
    setOfertas(data as Oferta[] || []);
    setCargando(false);
  };

  if (cargando) {
    return (
      <View style={estilos.contenedor}>
        <Text style={estilos.titulo}>🎫 Ofertas</Text>
        <ActivityIndicator size="large" color={Colores.secundario} style={{ marginTop: 60 }} />
      </View>
    );
  }

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>🎫 Ofertas</Text>

      {ofertas.length === 0 ? (
        <View style={estilos.vacio}>
          <Ionicons name="pricetag-outline" size={60} color={Colores.textoGris} />
          <Text style={estilos.vacioTexto}>No hay ofertas disponibles</Text>
          <Text style={estilos.vacioSub}>Vuelve pronto para ver nuevas promociones</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
          {ofertas.map(oferta => (
            <TouchableOpacity key={oferta.id} style={estilos.tarjeta} activeOpacity={0.8}>
              <View style={estilos.descuentoBadge}>
                <Text style={estilos.descuentoTexto}>{oferta.descuento}</Text>
              </View>
              <View style={estilos.tarjetaContenido}>
                <View style={estilos.emojiContenedor}>
                  <Text style={estilos.emoji}>🏷️</Text>
                </View>
                <View style={estilos.info}>
                  <Text style={estilos.ofertaTitulo}>{oferta.titulo}</Text>
                  <Text style={estilos.ofertaDesc}>{oferta.descripcion}</Text>
                  <View style={estilos.precios}>
                    <Text style={estilos.precioOriginal}>${oferta.precio_original?.toFixed(2)}</Text>
                    <Text style={estilos.precioOferta}>${oferta.precio_oferta?.toFixed(2)}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color={Colores.textoGris} />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: Colores.fondoOscuro, paddingTop: 60 },
  titulo: { fontSize: 28, fontWeight: 'bold', color: Colores.textoClaro, marginLeft: 20, marginBottom: 20 },
  scroll: { padding: 16 },
  tarjeta: {
    backgroundColor: Colores.fondoTarjeta,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  descuentoBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colores.acento,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomLeftRadius: 12,
    zIndex: 1,
  },
  descuentoTexto: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  tarjetaContenido: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  emojiContenedor: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: Colores.secundario + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  emoji: { fontSize: 30 },
  info: { flex: 1 },
  ofertaTitulo: { fontSize: 16, fontWeight: 'bold', color: Colores.textoClaro },
  ofertaDesc: { fontSize: 12, color: Colores.textoGris, marginTop: 4 },
  precios: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  precioOriginal: {
    fontSize: 14,
    color: Colores.textoGris,
    textDecorationLine: 'line-through',
  },
  precioOferta: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colores.primario,
  },
  vacio: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  vacioTexto: { fontSize: 18, color: Colores.textoGris, marginTop: 16, fontWeight: 'bold' },
  vacioSub: { fontSize: 14, color: Colores.textoGris, marginTop: 8, textAlign: 'center' },
});