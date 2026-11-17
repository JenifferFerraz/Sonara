import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { map, tap } from 'rxjs';
import { AbstractAuthService } from '../abstractions/abstract-auth.service';

export const noAuthGuardActivate: CanActivateFn = () => noAuthGuard();

export const noAuthGuardActivateChild: CanActivateChildFn = () => noAuthGuard();

/**
 * Telas de entrada: quem já está com a licença em dia vai direto para o laudo.
 * Na carência a tela de login continua aberta, para a pessoa poder renovar.
 */
const noAuthGuard = () => {
  const auth = inject(AbstractAuthService);
  const router = inject(Router);

  return auth.estaComLicencaEmDia().pipe(
    tap(emDia => {
      if (emDia) router.navigate(['/']);
    }),
    map(emDia => !emDia)
  );
};
