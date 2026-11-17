import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { tap } from 'rxjs';
import { AbstractAuthService } from '../abstractions/abstract-auth.service';

export const authGuardActivate: CanActivateFn = () => authGuard();

export const authGuardActivateChild: CanActivateChildFn = () => authGuard();

/** Só entra quem pode usar o app; os demais vão para o login. */
const authGuard = () => {
  const auth = inject(AbstractAuthService);
  const router = inject(Router);

  return auth.estaAutenticado().pipe(
    tap(autenticado => {
      if (!autenticado) router.navigate(['/', 'entrar']);
    })
  );
};
