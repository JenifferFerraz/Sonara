import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * Leva e recebe o cookie httpOnly do refresh token nas chamadas à nossa API
 * (o navegador só o envia às rotas /auth). Outros endereços não recebem cookie.
 */
export const credenciaisInterceptor: HttpInterceptorFn = (req, next) =>
  req.url.startsWith(environment.apiUrl) ? next(req.clone({ withCredentials: true })) : next(req);
