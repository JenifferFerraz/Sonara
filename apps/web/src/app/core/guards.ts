import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { LicencaService } from './services/licenca.service';
import { MascaraService } from './services/mascara.service';

/** O laudo só abre com licença em dia (ou na carência) e pelo menos um exame liberado. */
export const licencaGuard: CanActivateFn = async () => {
  const licenca = inject(LicencaService);
  const mascaras = inject(MascaraService);
  const roteador = inject(Router);

  await licenca.iniciar();
  if (licenca.liberada() && mascaras.emUso().length > 0) return true;
  return roteador.createUrlTree(['/entrar']);
};

/** Telas que falam com o servidor (ex.: dispositivos) pedem sessão. */
export const sessaoGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const roteador = inject(Router);
  return auth.logado() ? true : roteador.createUrlTree(['/entrar']);
};
