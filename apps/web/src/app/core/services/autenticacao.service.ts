import { Injectable, inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { AbstractAuthService } from '../abstractions/abstract-auth.service';
import { LicencaService } from './licenca.service';
import { MascaraService } from './mascara.service';

/** Implementação da autenticação do app: a licença assinada vale mesmo sem internet. */
@Injectable({ providedIn: 'root' })
export class AutenticacaoService extends AbstractAuthService {
  private readonly _licenca = inject(LicencaService);
  private readonly _mascaras = inject(MascaraService);

  estaAutenticado(): Observable<boolean> {
    return from(this._licenca.iniciar()).pipe(
      map(() => this._licenca.liberada() && this._mascaras.emUso().length > 0)
    );
  }

  estaComLicencaEmDia(): Observable<boolean> {
    return from(this._licenca.iniciar()).pipe(map(() => this._licenca.estado().status === 'ok'));
  }
}
