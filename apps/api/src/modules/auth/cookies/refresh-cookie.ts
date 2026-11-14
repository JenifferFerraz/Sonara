import { CookieOptions } from 'express';
import { env } from '../../../env';

/** O refresh token do navegador vive só neste cookie: o JavaScript da página nunca o enxerga. */
export const REFRESH_COOKIE = 'sonara_refresh';

/** "30d", "12h", "45m" → milissegundos (padrão: 30 dias). */
function paraMs(valor: string): number {
  const m = /^(\d+)\s*([dhm])$/.exec(valor.trim());
  if (!m) return 30 * 86_400_000;
  const n = Number(m[1]);
  return n * (m[2] === 'd' ? 86_400_000 : m[2] === 'h' ? 3_600_000 : 60_000);
}

export function opcoesCookieRefresh(): CookieOptions {
  return {
    httpOnly: true,
    // Em produção só trafega por HTTPS. Em dev, o Chrome aceita no localhost sem HTTPS.
    secure: env.NODE_ENV === 'production',
    // Nunca vai em requisição vinda de outro site (barra CSRF).
    sameSite: 'strict',
    // Só é enviado às rotas de autenticação, não a /masks, /devices etc.
    path: '/auth',
    maxAge: paraMs(env.EXPIRES_IN_REFRESH_TOKEN),
  };
}

export function opcoesLimparCookieRefresh(): CookieOptions {
  const { maxAge: _ignorado, ...resto } = opcoesCookieRefresh();
  return resto;
}
