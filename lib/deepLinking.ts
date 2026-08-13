// lib/deepLinking.ts
import * as Linking from 'expo-linking';

export const PREFIX = Linking.createURL('/');

export const getDeepLink = (path: string) => {
    return Linking.createURL(path);
};

export const parseDeepLink = (url: string) => {
    const { path, queryParams } = Linking.parse(url);
    return { path, queryParams };
};