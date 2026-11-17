import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { LicencaService } from './licenca.service';
import { noNavegador } from '../utils/plataforma';

/**
 * Cuida de uma sessão online por vez:
 * - não há polling: o servidor valida a sessão em toda requisição (AuthGuard) e responde 401 SESSAO_ENCERRADA;
 * - só ao voltar para a janela ou ao reconectar (eventos, não timer) o app confere uma vez;
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
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.conferir();
    });
    window.addEventListener('online', () => this.conferir());
  }

  private conferir(): void {
    if (this._auth.logado() && navigator.onLine) this._auth.conferirSessao().catch(() => undefined);
  }
}
