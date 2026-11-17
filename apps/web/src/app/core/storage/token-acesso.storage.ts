import { Injectable } from '@angular/core';
import { Armazenamento } from './armazenamento';

/**
 * Token de acesso (curto): fica SÓ em memória, nunca no armazenamento do navegador.
 * Ao recarregar a página ele some e é pedido de novo pelo cookie httpOnly do refresh token.
 */
@Injectable({ providedIn: 'root' })
export class TokenAcessoStorage extends Armazenamento<string | null> {
  private _token: string | null = null;

  obter(): string | null {
    return this._token;
  }
  gravar(valor: string | null): void {
    this._token = valor;
  }
  limpar(): void {
    this._token = null;
  }
}
