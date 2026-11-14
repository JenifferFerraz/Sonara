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
  template: `
    @if (pronta()) {
      <div class="aviso" role="status">
        <span>Há uma nova versão do Sonara. Copie o laudo em andamento antes de atualizar.</span>
        <button type="button" (click)="atualizar()">Atualizar agora</button>
      </div>
    }
  `,
  styles: `
    .aviso {
      position: fixed;
      left: 50%;
      bottom: 16px;
      transform: translateX(-50%);
      z-index: 50;
      display: flex;
      align-items: center;
      gap: 14px;
      max-width: min(560px, calc(100vw - 24px));
      padding: 10px 14px;
      border-radius: 10px;
      background: var(--sn-profunda);
      color: #fff;
      font-size: 13px;
      box-shadow: 0 10px 28px -10px rgba(0, 0, 0, 0.5);
    }
    button {
      flex: none;
      border: 0;
      border-radius: 8px;
      padding: 6px 12px;
      background: var(--sn-secundaria);
      color: var(--sn-profunda);
      font-weight: 700;
      &:hover { background: #fff; }
      &:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
    }
  `
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
