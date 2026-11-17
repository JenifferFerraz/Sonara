/** Há navegador (window, document, localStorage)? Falso no servidor, caso o app passe a ter SSR. */
export const noNavegador = (): boolean => typeof window !== 'undefined' && typeof document !== 'undefined';
