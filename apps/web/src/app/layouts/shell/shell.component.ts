import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { config } from '../../core/config';
import { AuthService } from '../../core/services/auth.service';
import { LicencaService } from '../../core/services/licenca.service';
import { MascaraService } from '../../core/services/mascara.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss'
})
export class ShellComponent implements OnInit {
  private readonly _mascaras = inject(MascaraService);
  private readonly _roteador = inject(Router);
  readonly auth = inject(AuthService);
  readonly licenca = inject(LicencaService);

  /** Login desligado (config.exigirLogin = false): o app abre direto no laudo. */
  readonly modoTeste = !config.exigirLogin;
  readonly online = signal(navigator.onLine);

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
  }

  async sair(): Promise<void> {
    await this.auth.sair();
    this.licenca.esquecer();
    await this._roteador.navigateByUrl('/entrar');
  }
}
