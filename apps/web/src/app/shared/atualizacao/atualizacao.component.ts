import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';

const UMA_HORA = 60 * 60 * 1000;

/**
 * Atualização do app instalado (PWA). O service worker baixa a versão nova sozinho; aqui a pessoa
 * decide quando trocar, para não perder um laudo em andamento.
 * - Nas telas de entrada (nada a perder), troca sozinho.
 * - Nas demais, mostra um aviso fixo na parte de baixo.
 * Confere se há versão nova ao abrir, ao voltar para a janela e de hora em hora.
 */
@Component({
  selector: 'app-atualizacao',
  templateUrl: './atualizacao.component.html',
  styleUrl: './atualizacao.component.scss'
})
export class AtualizacaoComponent {
  private readonly _sw = inject(SwUpdate);
  private readonly _roteador = inject(Router);

  readonly pronta = signal(false);

  constructor() {
    if (!this._sw.isEnabled) return; // desenvolvimento: sem service worker

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
