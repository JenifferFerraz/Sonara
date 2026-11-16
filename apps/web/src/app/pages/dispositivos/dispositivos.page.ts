import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface Dispositivo {
  id: string;
  name: string;
  active: boolean;
  lastSeenAt: string;
  createdAt: string;
}

const MAX_ATIVOS = 2;

@Component({
  selector: 'app-dispositivos-page',
  imports: [RouterLink],
  templateUrl: './dispositivos.page.html',
  styleUrl: './dispositivos.page.scss'
})
export class DispositivosPage implements OnInit {
  private readonly _auth = inject(AuthService);

  readonly max = MAX_ATIVOS;
  readonly lista = signal<Dispositivo[]>([]);
  readonly carregando = signal(true);
  readonly erro = signal('');
  readonly desativando = signal('');
  readonly atual = computed(() => this._auth.dispositivoId);

  async ngOnInit(): Promise<void> {
    await this.carregar();
  }

  quando(iso: string): string {
    return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  }

  async desativar(d: Dispositivo): Promise<void> {
    if (!confirm(`Desativar "${d.name}"? Esse aparelho perde a licença na próxima conexão.`)) return;
    this.erro.set('');
    this.desativando.set(d.id);
    try {
      await this._auth.chamar('DELETE', `/devices/${d.id}`);
      await this.carregar();
    } catch (e) {
      this.erro.set(e instanceof Error ? e.message : 'Não foi possível desativar.');
    } finally {
      this.desativando.set('');
    }
  }

  private async carregar(): Promise<void> {
    this.carregando.set(true);
    this.erro.set('');
    try {
      this.lista.set(await this._auth.chamar<Dispositivo[]>('GET', '/devices'));
    } catch (e) {
      this.erro.set(e instanceof Error ? e.message : 'Não foi possível carregar os dispositivos.');
    } finally {
      this.carregando.set(false);
    }
  }
}
