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
  template: `
    <main class="pagina">
      <a routerLink="/" class="voltar">← Voltar ao laudo</a>
      <h1>Meus dispositivos</h1>
      <p class="intro">
        Sua conta pode ter até {{ max }} dispositivos ativos, e até 3 trocas a cada 30 dias.
        Desative um para liberar o lugar de outro aparelho.
      </p>

      @if (erro()) {
        <p class="erro" role="alert">{{ erro() }}</p>
      }

      @if (carregando()) {
        <p class="suave">Carregando...</p>
      } @else {
        <p class="contagem">{{ lista().length }} de {{ max }} dispositivos ativos</p>
        <ul class="lista">
          @for (d of lista(); track d.id) {
            <li>
              <div>
                <strong>{{ d.name }}</strong>
                @if (d.id === atual()) {
                  <span class="selo">este aparelho</span>
                }
                <div class="suave">Último acesso: {{ quando(d.lastSeenAt) }}</div>
              </div>
              <button
                type="button"
                class="btn pequeno"
                [disabled]="d.id === atual() || desativando() === d.id"
                [title]="d.id === atual() ? 'Para sair deste aparelho, use Sair' : ''"
                (click)="desativar(d)">
                {{ desativando() === d.id ? 'Desativando...' : 'Desativar' }}
              </button>
            </li>
          } @empty {
            <li class="suave">Nenhum dispositivo ativo.</li>
          }
        </ul>
      }
    </main>
  `,
  styles: `
    .pagina { max-width: 640px; margin: 0 auto; padding: 24px 16px; }
    .voltar { color: var(--sn-primaria); font-weight: 600; text-decoration: none; }
    h1 { margin: 12px 0 4px; color: var(--sn-primaria); }
    .intro, .suave { color: var(--sn-texto-suave); font-size: 13px; }
    .contagem { font-weight: 600; margin: 14px 0 6px; }
    .lista { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
    li {
      display: flex; justify-content: space-between; align-items: center; gap: 12px;
      background: var(--sn-superficie); border: 1px solid var(--sn-borda);
      border-radius: var(--sn-raio); padding: 10px 14px;
    }
    .selo { margin-left: 8px; font-size: 11px; background: #e3f6f3; color: var(--sn-primaria); border-radius: 999px; padding: 1px 8px; }
    .erro { padding: 8px 10px; border-radius: 6px; background: var(--sn-alerta-fundo); color: var(--sn-alerta); }
  `
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
