/** Converte "1,5" ou "1.5" em número; vazio ou inválido vira null. */
export function lerNumero(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  const t = v.trim().replace(',', '.');
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** Formata com vírgula e N casas (padrão pt-BR). */
export function formatarNumero(n: number, casas = 1): string {
  return n.toFixed(casas).replace('.', ',');
}

export const FALTA = '___';

/** Volume elipsoide: a × b × c × fator. */
export function volume(a: number | null, b: number | null, c: number | null, fator = 0.523): number | null {
  if (a === null || b === null || c === null) return null;
  return a * b * c * fator;
}
