import { noNavegador } from '../utils/plataforma';
import { Armazenamento } from './armazenamento';

/**
 * Guarda no `localStorage`, sem nunca quebrar: se o navegador bloquear o armazenamento (janela
 * anônima, dados desativados) ou não houver navegador, o valor fica só em memória.
 */
export abstract class ArmazenamentoLocal<T> extends Armazenamento<T> {
  private _memoria: T;

  protected constructor(
    private readonly _chave: string,
    private readonly _padrao: T
  ) {
    super();
    this._memoria = _padrao;
  }

  /** Texto guardado → valor. */
  protected abstract ler(bruto: string): T;
  /** Valor → texto a guardar. */
  protected abstract escrever(valor: T): string;

  obter(): T {
    try {
      if (!noNavegador()) return this._memoria;
      const bruto = localStorage.getItem(this._chave);
      return bruto === null ? this._memoria : this.ler(bruto);
    } catch {
      return this._memoria;
    }
  }

  gravar(valor: T): void {
    this._memoria = valor;
    try {
      if (noNavegador()) localStorage.setItem(this._chave, this.escrever(valor));
    } catch {
      // Armazenamento bloqueado: o valor vale só nesta sessão.
    }
  }

  limpar(): void {
    this._memoria = this._padrao;
    try {
      if (noNavegador()) localStorage.removeItem(this._chave);
    } catch {
      // Nada a fazer.
    }
  }
}

/** Valor em JSON (objetos, listas). */
export abstract class ArmazenamentoLocalJson<T> extends ArmazenamentoLocal<T> {
  protected ler(bruto: string): T {
    return JSON.parse(bruto) as T;
  }
  protected escrever(valor: T): string {
    return JSON.stringify(valor);
  }
}

/** Texto puro, sem aspas: compatível com o que versões anteriores já guardaram. */
export abstract class ArmazenamentoLocalTexto extends ArmazenamentoLocal<string | null> {
  protected constructor(chave: string) {
    super(chave, null);
  }
  protected ler(bruto: string): string | null {
    return bruto;
  }
  protected escrever(valor: string | null): string {
    return valor ?? '';
  }
}
