import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, of, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { TokenAcessoStorage } from '../storage/token-acesso.storage';
import { SEM_TOKEN } from './contexto-http';

/**
 * Põe o token de acesso nas chamadas à nossa API e cuida da sessão:
 * - recarregou a página (o token em memória sumiu): pede um novo pelo cookie antes de chamar;
 * - a API respondeu 401: renova a sessão uma vez e repete a chamada.
 */
export const autenticacaoInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl) || req.context.get(SEM_TOKEN)) return next(req);

  const auth = inject(AuthService);
  const token = inject(TokenAcessoStorage);

  const comToken = (r: HttpRequest<unknown>) => {
    const t = token.obter();
    return t ? r.clone({ setHeaders: { Authorization: `Bearer ${t}` } }) : r;
  };

  const pronto$ = !token.obter() && auth.temUsuario() ? from(auth.renovarSessao()) : of(true);

  return pronto$.pipe(
    switchMap(() => next(comToken(req))),
    catchError((erro: unknown) => {
      if (!(erro instanceof HttpErrorResponse) || erro.status !== 401) return throwError(() => erro);
      return from(auth.renovarSessao()).pipe(
        switchMap(renovou => (renovou ? next(comToken(req)) : throwError(() => erro)))
      );
    })
  );
};
