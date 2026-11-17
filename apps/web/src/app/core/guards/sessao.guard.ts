import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Telas que falam com o servidor (ex.: dispositivos) pedem sessão. */
export const sessaoGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const roteador = inject(Router);
  return auth.logado() ? true : roteador.createUrlTree(['/entrar']);
};
