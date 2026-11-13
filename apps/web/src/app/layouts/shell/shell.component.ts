import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MascaraService } from '../../core/services/mascara.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet],
  template: `
    <header class="topo">
      <img src="logo-icone.svg" alt="" width="34" height="34" />
      <span class="marca">Sonara</span>
      <span class="aviso-legal">
        O sistema só redige. Quem interpreta o exame e responde pelo laudo é o médico.
      </span>
    </header>
    <router-outlet />
  `,
  styles: `
    :host { display: flex; flex-direction: column; height: 100vh; }
    .topo {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 16px;
      background: var(--sn-superficie);
      border-bottom: 1px solid var(--sn-borda);
    }
    .marca { font-size: 20px; font-weight: 700; color: var(--sn-primaria); letter-spacing: 0.2px; }
    .aviso-legal { margin-left: auto; font-size: 12px; color: var(--sn-texto-suave); }
    @media (max-width: 700px) { .aviso-legal { display: none; } }
  `
})
export class ShellComponent implements OnInit {
  private readonly _mascaras = inject(MascaraService);

  ngOnInit(): void {
    // Com internet e sessão, procura máscaras novas. Sem rede, segue com as instaladas.
    void this._mascaras.buscarAtualizacoes();
  }
}
