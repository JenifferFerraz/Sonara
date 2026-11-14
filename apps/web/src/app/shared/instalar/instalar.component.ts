import { Component, inject, signal } from '@angular/core';
import { InstalacaoService } from '../../core/services/instalacao.service';

/**
 * Botão "Instalar o Sonara". Só aparece quando faz sentido: o navegador ofereceu a instalação
 * (Chrome, Edge, Android) ou é iPhone/iPad (que ensina o caminho pelo menu Compartilhar).
 * Some quando o app já está instalado.
 */
@Component({
  selector: 'app-instalar',
  template: `
    @if (!inst.instalado()) {
      @if (inst.podeInstalar()) {
        <button type="button" class="botao" (click)="instalar()">
          <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 3v9M6.5 9 10 12.5 13.5 9M4 16h12" />
          </svg>
          Instalar o Sonara
        </button>
      } @else if (inst.instrucoesIos()) {
        <button type="button" class="botao" (click)="dica.set(!dica())">Instalar o Sonara</button>
        @if (dica()) {
          <span class="dica" role="status">
            Toque em <strong>Compartilhar</strong> e depois em <strong>Adicionar à Tela de Início</strong>.
          </span>
        }
      }
    }
  `,
  styles: `
    :host { display: inline-flex; align-items: center; gap: 10px; }
    .botao {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border: 1.5px solid var(--sn-primaria);
      background: var(--sn-superficie);
      color: var(--sn-primaria);
      border-radius: var(--sn-raio);
      padding: 7px 14px;
      font-weight: 700;
      transition: background 0.15s, color 0.15s;
      &:hover { background: var(--sn-primaria); color: #fff; }
      &:focus-visible { outline: 3px solid var(--sn-secundaria); outline-offset: 2px; }
    }
    .dica { font-size: 12px; color: var(--sn-texto-suave); max-width: 260px; }
  `
})
export class InstalarComponent {
  readonly inst = inject(InstalacaoService);
  readonly dica = signal(false);

  async instalar(): Promise<void> {
    await this.inst.instalar();
  }
}
