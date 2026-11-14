import { Component, OnInit, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LicencaService } from '../../core/services/licenca.service';
import { MascaraService } from '../../core/services/mascara.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink],
  template: `
    <header class="topo">
      <img src="logo-icone.svg" alt="" width="38" height="34" />
      <span class="marca">sonara</span>
      <span class="aviso-legal">
        O sistema só redige. Quem interpreta o exame e responde pelo laudo é o médico.
      </span>
      @if (medico(); as m) {
        <span class="medico" title="Médico da licença">{{ m.nome }} · CRM {{ m.crm }}</span>
      }
      @if (auth.logado()) {
        <a routerLink="/dispositivos" class="link">Dispositivos</a>
      }
      <button type="button" class="link" (click)="sair()">Sair</button>
    </header>

    @if (licenca.aviso(); as aviso) {
      <div class="faixa" role="status">
        {{ aviso }}
        @if (!auth.logado()) {
          <a routerLink="/entrar">Entrar</a>
        }
      </div>
    }

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
    .marca { font-size: 24px; font-weight: 600; color: var(--sn-primaria); letter-spacing: -0.6px; line-height: 1; }
    .aviso-legal { margin-left: auto; font-size: 12px; color: var(--sn-texto-suave); }
    .medico { font-weight: 600; font-size: 13px; }
    .link { border: 0; background: none; color: var(--sn-primaria); font-weight: 600; text-decoration: underline; padding: 0; }
    .faixa { padding: 6px 16px; background: var(--sn-aviso-fundo); color: var(--sn-aviso); font-size: 13px; a { margin-left: 8px; } }
    @media (max-width: 900px) { .aviso-legal { display: none; } .medico { margin-left: auto; } }
  `
})
export class ShellComponent implements OnInit {
  private readonly _mascaras = inject(MascaraService);
  private readonly _roteador = inject(Router);
  readonly auth = inject(AuthService);
  readonly licenca = inject(LicencaService);

  /** Nome e CRM vêm da licença assinada, então aparecem mesmo sem internet. */
  readonly medico = computed(() => {
    const p = this.licenca.payload();
    return p ? { nome: p.nome, crm: p.crm } : null;
  });

  ngOnInit(): void {
    // Com internet e sessão, procura máscaras novas. Sem rede, segue com as instaladas.
    void this._mascaras.buscarAtualizacoes();
  }

  async sair(): Promise<void> {
    await this.auth.sair();
    this.licenca.esquecer();
    await this._roteador.navigateByUrl('/entrar');
  }
}
