import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { environment } from '../../../environments/environment';

/** No modo de teste (sem login), as telas de entrada não existem: vai direto para o laudo. */
export const semLoginGuard: CanActivateFn = () => {
  if (environment.exigirLogin) return true;
  return inject(Router).createUrlTree(['/']);
};
