import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { noNavegador } from '../utils/plataforma';

const UMA_HORA = 60 * 60 * 1000;

/**
 * Atualização do app instalado (PWA). O service worker baixa a versão nova sozinho; a pessoa decide
 * quando trocar, para não perder um laudo em andamento.
 * - Nas telas de entrada (nada a perder), troca sozinho.
 * - Nas demais, `pronta` fica verdadeiro e a tela mostra o aviso.
 * Confere se há versão nova ao abrir, ao voltar para a janela e de hora em hora.
 */
@Injectable({ providedIn: 'root' })
export class AtualizacaoService {
  private readonly _sw = inject(SwUpdate);
  private readonly _roteador = inject(Router);

  /** Há versão nova baixada, esperando a pessoa. */
  readonly pronta = signal(false);

  constructor() {
    if (!noNavegador() || !this._sw.isEnabled) return; // sem navegador ou em desenvolvimento

    this._sw.versionUpdates.subscribe(e => {
      if (e.type !== 'VERSION_READY') return;
      if (this.emTelaDeEntrada()) void this.atualizar();
      else this.pronta.set(true);
    });

    this.verificar();
    setInterval(() => this.verificar(), UMA_HORA);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.verificar();
    });
  }

  async atualizar(): Promise<void> {
    await this._sw.activateUpdate();
    location.reload();
  }

  private verificar(): void {
    if (navigator.onLine) this._sw.checkForUpdate().catch(() => undefined);
  }

  private emTelaDeEntrada(): boolean {
    const url = this._roteador.url;
    return url.startsWith('/entrar') || url.startsWith('/cadastro');
  }
}
