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
  templateUrl: './cadastro.page.html',
  styleUrl: './cadastro.page.scss'
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
