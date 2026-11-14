import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LicencaService } from '../../core/services/licenca.service';
import { AuthLayoutComponent } from '../../shared/auth-layout/auth-layout.component';
import { aplicarMascara, mascaraCpf } from '../../shared/mascaras';

const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

@Component({
  selector: 'app-cadastro-page',
  imports: [RouterLink, AuthLayoutComponent],
  template: `
    <app-auth-layout>
      <span class="selo">Novo por aqui</span>
      <h2 class="titulo">Criar conta</h2>
      <p class="sub">
        Já tem conta? <a routerLink="/entrar">Entrar</a>
      </p>

      <form (submit)="cadastrar($event)">
        <label>
          Nome completo
          <input name="nome" autocomplete="name" required [value]="nome()" (input)="nome.set(valor($event))" />
        </label>
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
          Senha (mínimo de 8 caracteres)
          <span class="campo-senha">
            <input
              [type]="mostrar() ? 'text' : 'password'"
              name="senha"
              autocomplete="new-password"
              minlength="8"
              required
              [value]="senha()"
              (input)="senha.set(valor($event))" />
            <button type="button" class="mostrar" [attr.aria-pressed]="mostrar()" (click)="mostrar.set(!mostrar())">
              {{ mostrar() ? 'Ocultar' : 'Mostrar' }}
            </button>
          </span>
        </label>
        <label>
          CPF
          <input
            name="cpf"
            inputmode="numeric"
            autocomplete="off"
            placeholder="000.000.000-00"
            required
            [value]="cpf()"
            (input)="cpf.set(mascara($event))" />
        </label>
        <div class="par">
          <label>
            CRM
            <input name="crm" inputmode="numeric" autocomplete="off" required [value]="crm()" (input)="crm.set(valor($event))" />
          </label>
          <label class="uf">
            UF
            <select name="uf" required (change)="uf.set(valor($event))">
              <option value="" [selected]="!uf()">—</option>
              @for (u of ufs; track u) {
                <option [value]="u" [selected]="uf() === u">{{ u }}</option>
              }
            </select>
          </label>
        </div>

        @if (erro()) {
          <p class="erro" role="alert">{{ erro() }}</p>
        }

        <button type="submit" class="acao" [disabled]="carregando()">
          {{ carregando() ? 'Criando...' : 'Criar conta e entrar' }}
          @if (!carregando()) {
            <span class="seta" aria-hidden="true">→</span>
          }
        </button>
      </form>
    </app-auth-layout>
  `,
  styleUrl: '../auth.scss'
})
export class CadastroPage {
  private readonly _auth = inject(AuthService);
  private readonly _licenca = inject(LicencaService);
  private readonly _roteador = inject(Router);

  readonly ufs = UFS;
  readonly nome = signal('');
  readonly email = signal('');
  readonly senha = signal('');
  readonly cpf = signal('');
  readonly crm = signal('');
  readonly uf = signal('');
  readonly erro = signal('');
  readonly carregando = signal(false);
  readonly mostrar = signal(false);

  valor(evento: Event): string {
    return (evento.target as HTMLInputElement | HTMLSelectElement).value;
  }

  mascara(evento: Event): string {
    return aplicarMascara(evento, mascaraCpf);
  }

  async cadastrar(evento: Event): Promise<void> {
    evento.preventDefault();
    if (this.carregando()) return;
    this.erro.set('');
    this.carregando.set(true);
    try {
      await this._auth.cadastrar({
        name: this.nome().trim(),
        email: this.email().trim(),
        password: this.senha(),
        cpf: this.cpf(),
        crm: this.crm().trim(),
        crmUf: this.uf()
      });
      await this._auth.entrar(this.email().trim(), this.senha());
      await this._licenca.renovar();
      await this._roteador.navigateByUrl('/');
    } catch (e) {
      this.erro.set(e instanceof Error ? e.message : 'Não foi possível criar a conta.');
    } finally {
      this.carregando.set(false);
    }
  }
}
