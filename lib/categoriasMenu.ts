// lib/categoriasMenu.ts
import { ImageSourcePropType } from 'react-native';

// ✅ IMPORTAR IMÁGENES LOCALES - Usando require para evitar errores de tipos
const hamburguesasImg = require('../assets/imagenes/categorias/hamburguesaCat.jpg');
const combosImg = require('../assets/imagenes/categorias/combosCat.jpg');
const bebidasImg = require('../assets/imagenes/categorias/bebidasCat.jpg');
const postresImg = require('../assets/imagenes/categorias/postresCat.jpg');

export interface CategoriaMenu {
    id: string;
    nombre: string;
    imagen: ImageSourcePropType;
    color: string;

    // ❌ ELIMINADO: cantidad - Debe ser dinámico desde la BD
}

export const CATEGORIAS_MENU: CategoriaMenu[] = [
    {
        id: 'hamburguesas',
        nombre: 'Burgers',
        imagen: hamburguesasImg,
        color: '#E53935',

    },
    {
        id: 'combos',
        nombre: 'Combos',
        imagen: combosImg,
        color: '#F5C518',
    },

    {
        id: 'bebidas',
        nombre: 'Bebidas',
        imagen: bebidasImg,
        color: '#1A237E',

    },
    {
        id: 'postres',
        nombre: 'Postres',
        imagen: postresImg,
        color: '#F48FB1',

    },
];

export default CATEGORIAS_MENU;