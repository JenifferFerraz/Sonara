import { Injectable } from '@angular/core';

interface Item {
  valor: unknown;
  expiraEm: number;
}

/**
 * Cache em memória com validade. Evita repetir a mesma chamada à API (ex.: lista de dispositivos,
 * máscaras) e junta pedidos simultâneos da mesma chave em um só.
 */
@Injectable({ providedIn: 'root' })
export class CacheService {
  private readonly _itens = new Map<string, Item>();
  private readonly _pendentes = new Map<string, Promise<unknown>>();

  /** Devolve o valor guardado se ainda vale; senão busca, guarda por `ttlMs` e devolve. */
  async obterOuBuscar<T>(chave: string, ttlMs: number, buscar: () => Promise<T>): Promise<T> {
    const guardado = this._itens.get(chave);
    if (guardado && guardado.expiraEm > Date.now()) return guardado.valor as T;

    const emAndamento = this._pendentes.get(chave);
    if (emAndamento) return emAndamento as Promise<T>;

    const busca = buscar()
      .then(valor => {
        this._itens.set(chave, { valor, expiraEm: Date.now() + ttlMs });
        return valor;
      })
      .finally(() => this._pendentes.delete(chave));
    this._pendentes.set(chave, busca);
    return busca;
  }

  invalidar(chave: string): void {
    this._itens.delete(chave);
  }

  /** Invalida todas as chaves que começam com o prefixo (ex.: `dispositivos`). */
  invalidarPrefixo(prefixo: string): void {
    for (const chave of [...this._itens.keys()]) if (chave.startsWith(prefixo)) this._itens.delete(chave);
  }

  limpar(): void {
    this._itens.clear();
    this._pendentes.clear();
  }
}
