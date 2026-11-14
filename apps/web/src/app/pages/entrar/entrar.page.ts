import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LicencaService } from '../../core/services/licenca.service';

@Component({
  selector: 'app-entrar-page',
  imports: [RouterLink],
  template: `
    <main class="cartao">
      <img src="logo-icone.svg" alt="" width="48" height="48" />
      <h1>Entrar no Sonara</h1>

      @if (aviso()) {
        <p class="aviso" role="status">{{ aviso() }}</p>
      }

      <form (submit)="entrar($event)">
        <label>
          E-mail
          <input type="email" name="email" autocomplete="username" required [value]="email()" (input)="email.set(valor($event))" />
        </label>
        <label>
          Senha
          <input type="password" name="senha" autocomplete="current-password" required [value]="senha()" (input)="senha.set(valor($event))" />
        </label>

        @if (erro()) {
          <p class="erro" role="alert">{{ erro() }}</p>
        }

        <button type="submit" class="btn primario" [disabled]="carregando()">
          {{ carregando() ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>

      <p class="rodape">Ainda não tem conta? <a routerLink="/cadastro">Cadastre-se</a></p>
    </main>
  `,
  styleUrl: '../auth.scss'
})
export class EntrarPage {
  private readonly _auth = inject(AuthService);
  private readonly _licenca = inject(LicencaService);
  private readonly _roteador = inject(Router);

  readonly email = signal('');
  readonly senha = signal('');
  readonly erro = signal('');
  readonly carregando = signal(false);
  /** Motivo de ter caído aqui: licença vencida, relógio voltado etc. */
  readonly aviso = this._licenca.aviso;

  valor(evento: Event): string {
    return (evento.target as HTMLInputElement).value;
  }

  async entrar(evento: Event): Promise<void> {
    evento.preventDefault();
    if (this.carregando()) return;
    this.erro.set('');
    this.carregando.set(true);
    try {
      await this._auth.entrar(this.email().trim(), this.senha());
      await this._licenca.renovar();
      await this._roteador.navigateByUrl('/');
    } catch (e) {
      this.erro.set(e instanceof Error ? e.message : 'Não foi possível entrar.');
    } finally {
      this.carregando.set(false);
    }
  }
}
