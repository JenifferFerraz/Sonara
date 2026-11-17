import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { LicencaService } from './licenca.service';
import { noNavegador } from '../utils/plataforma';

const A_CADA = 60 * 1000;

/**
 * Cuida de uma sessão online por vez:
 * - de minuto em minuto (e ao voltar para a janela), pergunta ao servidor se a sessão continua valendo;
 * - se o médico entrou em outro aparelho, este é desconectado: a licença deste aparelho sai e a tela
 *   volta para o login com a explicação.
 * Sem internet não há o que conferir: o app segue com a licença, e a conferência acontece ao reconectar.
 */
@Injectable({ providedIn: 'root' })
export class SessaoMonitorService {
  private readonly _auth = inject(AuthService);
  private readonly _licenca = inject(LicencaService);
  private readonly _roteador = inject(Router);

  constructor() {
    this._auth.sessaoEncerrada.subscribe(() => {
      this._licenca.esquecer();
      void this._roteador.navigateByUrl('/entrar');
    });

    if (!noNavegador()) return;
    setInterval(() => this.conferir(), A_CADA);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.conferir();
    });
    window.addEventListener('online', () => this.conferir());
  }

  private conferir(): void {
    if (this._auth.logado() && navigator.onLine) this._auth.conferirSessao().catch(() => undefined);
  }
}
