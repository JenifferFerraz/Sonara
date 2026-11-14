import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { config } from '../../core/config';
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
      @if (modoTeste) {
        <span class="chip" title="O login está desligado nesta versão">Modo de teste</span>
      }
      @if (!online()) {
        <span class="chip alerta" role="status" title="O Sonara continua funcionando sem internet">Sem conexão</span>
      }
      @if (!modoTeste) {
        @if (medico(); as m) {
          <span class="medico" title="Médico da licença">{{ m.nome }} · CRM {{ m.crm }}</span>
        }
        @if (auth.logado()) {
          <a routerLink="/dispositivos" class="link">Dispositivos</a>
        }
        <button type="button" class="link" (click)="sair()">Sair</button>
      }
    </header>

    @if (atualizacao()) {
      <div class="faixa" role="status">
        Há uma nova versão do Sonara. Copie o laudo em andamento antes de atualizar.
        <button type="button" class="link" (click)="atualizar()">Atualizar agora</button>
      </div>
    }

    @if (!modoTeste && licenca.aviso(); as aviso) {
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
    :host { display: flex; flex-direction: column; height: 100vh; height: 100dvh; }
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
    .chip {
      font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;
      padding: 3px 10px; border-radius: 999px; background: #e3f6f3; color: var(--sn-primaria);
      &.alerta { background: var(--sn-aviso-fundo); color: var(--sn-aviso); }
    }
    .medico { font-weight: 600; font-size: 13px; }
    .link { border: 0; background: none; color: var(--sn-primaria); font-weight: 600; text-decoration: underline; padding: 0; }
    .faixa {
      padding: 6px 16px; background: var(--sn-aviso-fundo); color: var(--sn-aviso); font-size: 13px;
      a, .link { margin-left: 8px; color: inherit; }
    }
    @media (max-width: 900px) { .aviso-legal { display: none; } .chip:first-of-type, .medico { margin-left: auto; } }
  `
})
export class ShellComponent implements OnInit {
  private readonly _mascaras = inject(MascaraService);
  private readonly _roteador = inject(Router);
  private readonly _atualizacoes = inject(SwUpdate);
  readonly auth = inject(AuthService);
  readonly licenca = inject(LicencaService);

  /** Login desligado (config.exigirLogin = false): o app abre direto no laudo. */
  readonly modoTeste = !config.exigirLogin;
  readonly online = signal(navigator.onLine);
  /** Há uma versão nova baixada, esperando a pessoa decidir quando atualizar. */
  readonly atualizacao = signal(false);

  /** Nome e CRM vêm da licença assinada, então aparecem mesmo sem internet. */
  readonly medico = computed(() => {
    const p = this.licenca.payload();
    return p ? { nome: p.nome, crm: p.crm } : null;
  });

  constructor() {
    window.addEventListener('online', () => this.online.set(true));
    window.addEventListener('offline', () => this.online.set(false));
  }

  ngOnInit(): void {
    // Com internet e sessão, procura máscaras novas. Sem rede, segue com as instaladas.
    void this._mascaras.buscarAtualizacoes();

    // O service worker baixa a versão nova sozinho; quem decide quando recarregar é o médico,
    // para não perder um laudo em andamento.
    if (this._atualizacoes.isEnabled) {
      this._atualizacoes.versionUpdates.subscribe(e => {
        if (e.type === 'VERSION_READY') this.atualizacao.set(true);
      });
    }
  }

  async atualizar(): Promise<void> {
    await this._atualizacoes.activateUpdate();
    location.reload();
  }

  async sair(): Promise<void> {
    await this.auth.sair();
    this.licenca.esquecer();
    await this._roteador.navigateByUrl('/entrar');
  }
}
