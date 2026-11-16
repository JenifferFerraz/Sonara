import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LicencaService } from '../../core/services/licenca.service';
import { AuthLayoutComponent } from '../../shared/auth-layout/auth-layout.component';
import { InstalarComponent } from '../../shared/instalar/instalar.component';

@Component({
  selector: 'app-entrar-page',
  imports: [RouterLink, AuthLayoutComponent, InstalarComponent],
  templateUrl: './entrar.page.html',
  styleUrl: './entrar.page.scss'
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
