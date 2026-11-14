import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LicencaService } from '../../core/services/licenca.service';
import { AuthLayoutComponent } from '../../shared/auth-layout/auth-layout.component';

@Component({
  selector: 'app-entrar-page',
  imports: [RouterLink, AuthLayoutComponent],
  template: `
    <app-auth-layout>
      <span class="selo">Acesso ao Sonara</span>
      <h2 class="titulo">Entrar</h2>
      <p class="sub">
        Ainda não tem conta? <a routerLink="/cadastro">Criar conta</a>
      </p>

      @if (aviso()) {
        <p class="aviso" role="status">{{ aviso() }}</p>
      }

      <form (submit)="entrar($event)">
        <label>
          E-mail
          <input
            type="email"
            name="email"
            autocomplete="username"
            placeholder="voce@clinica.com.br"
            required
            [value]="email()"
            (input)="email.set(valor($event))" />
        </label>

        <label>
          Senha
          <span class="campo-senha">
            <input
              [type]="mostrar() ? 'text' : 'password'"
              name="senha"
              autocomplete="current-password"
              placeholder="Sua senha"
              required
              [value]="senha()"
              (input)="senha.set(valor($event))" />
            <button
              type="button"
              class="mostrar"
              [attr.aria-pressed]="mostrar()"
              (click)="mostrar.set(!mostrar())">
              {{ mostrar() ? 'Ocultar' : 'Mostrar' }}
            </button>
          </span>
        </label>

        @if (erro()) {
          <p class="erro" role="alert">{{ erro() }}</p>
        }

        <button type="submit" class="acao" [disabled]="carregando()">
          {{ carregando() ? 'Entrando...' : 'Entrar' }}
          @if (!carregando()) {
            <span class="seta" aria-hidden="true">→</span>
          }
        </button>
      </form>
    </app-auth-layout>
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
  readonly mostrar = signal(false);
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
