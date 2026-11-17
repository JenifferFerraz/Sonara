import { HttpContext, HttpContextToken } from '@angular/common/http';

/**
 * Marca uma chamada que não leva o token de acesso (login, cadastro, renovação da sessão).
 * Mesmo molde do `applySanitizationContextToken` do frontend do trabalho.
 */
export const SEM_TOKEN = new HttpContextToken<boolean>(() => false);

export const semToken = (): HttpContext => new HttpContext().set(SEM_TOKEN, true);
