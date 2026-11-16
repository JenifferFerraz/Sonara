import { Component, inject, signal } from '@angular/core';
import { InstalacaoService } from '../../core/services/instalacao.service';

/**
 * Botão "Instalar o Sonara". Só aparece quando faz sentido: o navegador ofereceu a instalação
 * (Chrome, Edge, Android) ou é iPhone/iPad (que ensina o caminho pelo menu Compartilhar).
 * Some quando o app já está instalado.
 */
@Component({
  selector: 'app-instalar',
  templateUrl: './instalar.component.html',
  styleUrl: './instalar.component.scss'
})
export class InstalarComponent {
  readonly inst = inject(InstalacaoService);
  readonly dica = signal(false);

  async instalar(): Promise<void> {
    await this.inst.instalar();
  }
}
