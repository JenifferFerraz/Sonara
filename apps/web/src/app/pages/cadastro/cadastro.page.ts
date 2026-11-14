import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LicencaService } from '../../core/services/licenca.service';
import { aplicarMascara, mascaraCpf } from '../../shared/mascaras';

const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

@Component({
  selector: 'app-cadastro-page',
  imports: [RouterLink],
  template: `
    <main class="cartao largo">
      <img src="logo-icone.svg" alt="" width="48" height="48" />
      <h1>Criar conta</h1>
      <p class="intro">
        O Sonara só redige o laudo. Quem interpreta o exame e responde por ele é o médico.
      </p>

      <form (submit)="cadastrar($event)">
        <label>
          Nome completo
          <input name="nome" autocomplete="name" required [value]="nome()" (input)="nome.set(valor($event))" />
        </label>
        <label>
          E-mail
          <input type="email" name="email" autocomplete="username" required [value]="email()" (input)="email.set(valor($event))" />
        </label>
        <label>
          Senha (mínimo de 8 caracteres)
          <input type="password" name="senha" autocomplete="new-password" minlength="8" required [value]="senha()" (input)="senha.set(valor($event))" />
        </label>
        <label>
          CPF
          <input name="cpf" inputmode="numeric" autocomplete="off" required [value]="cpf()" (input)="cpf.set(mascara($event))" />
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

        <button type="submit" class="btn primario" [disabled]="carregando()">
          {{ carregando() ? 'Criando...' : 'Criar conta e entrar' }}
        </button>
      </form>

      <p class="rodape">Já tem conta? <a routerLink="/entrar">Entrar</a></p>
    </main>
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
