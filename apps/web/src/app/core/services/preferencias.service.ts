import { Injectable, inject, signal } from '@angular/core';
import { PREFIXO_TEXTO } from '@sonara/laudo-engine';
import { PreferenciasStorage } from '../storage/preferencias.storage';

/**
 * Frases escolhidas ou reescritas pelo médico (chave da frase → variante ou texto livre).
 * Hoje fica no aparelho; com o login, passa a ser guardado na conta e segue o médico.
 * Só guarda escolhas de redação, nunca texto de laudo nem dado de paciente.
 */
@Injectable({ providedIn: 'root' })
export class PreferenciasService {
  private readonly _armazenamento = inject(PreferenciasStorage);
  private readonly _frases = signal(this._armazenamento.obter());

  readonly frases = this._frases.asReadonly();

  /** Frase que o médico escreveu com as próprias palavras; `null` volta ao texto padrão. */
  definirTexto(chave: string, texto: string | null): void {
    this.escolher(chave, texto === null ? null : PREFIXO_TEXTO + texto);
  }

  escolher(chave: string, varianteId: string | null): void {
    const proximo = { ...this._frases() };
    if (varianteId === null) delete proximo[chave];
    else proximo[chave] = varianteId;
    this._frases.set(proximo);
    this._armazenamento.gravar(proximo);
  }
}
