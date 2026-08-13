// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const URL_SUPABASE = 'https://nurhcmttnwankriplcwv.supabase.co';
const CLAVE_ANONIMA = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51cmhjbXR0bndhbmtyaXBsY3d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MTM1NDUsImV4cCI6MjEwMDk4OTU0NX0.oJP8uXhgb0sUKaB_kZntyuOxf1AKDpVKhLDjWCYV-Hg';
const CLAVE_SERVICIO = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51cmhjbXR0bndhbmtyaXBsY3d2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTQxMzU0NSwiZXhwIjoyMTAwOTg5NTQ1fQ.-oLs30IvZ7mxTD8qPVtbyegNPOGSJjc6aygTeGnp3A0';

// ✅ Adaptador simple que SOLO usa AsyncStorage
const adaptadorSimple = {
    getItem: async (clave: string) => {
        try {
            return await AsyncStorage.getItem(clave);
        } catch {
            return null;
        }
    },
    setItem: async (clave: string, valor: string) => {
        try {
            await AsyncStorage.setItem(clave, valor);
        } catch (error) {
            console.warn('Error al guardar:', error);
        }
    },
    removeItem: async (clave: string) => {
        try {
            await AsyncStorage.removeItem(clave);
        } catch (error) {
            console.warn('Error al eliminar:', error);
        }
    },
};

// ✅ Cliente normal (para usuarios)
export const supabase = createClient(URL_SUPABASE, CLAVE_ANONIMA, {
    auth: {
        storage: adaptadorSimple,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

// ✅ Cliente ADMIN (para operaciones de administración)
export const supabaseAdmin = createClient(URL_SUPABASE, CLAVE_SERVICIO, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});