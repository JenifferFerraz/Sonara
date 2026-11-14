import { Injectable, signal } from '@angular/core';
import { PREFIXO_TEXTO, Preferencias } from '@sonara/laudo-engine';

const CHAVE = 'sonara.preferencias';

/**
 * Frases escolhidas pelo médico (chave da frase → id da variante).
 * Hoje fica no aparelho; com o login, passa a ser guardado na conta e segue o médico.
 * Só guarda escolhas de redação, nunca texto de laudo nem dado de paciente.
 */
@Injectable({ providedIn: 'root' })
export class PreferenciasService {
  private readonly _frases = signal<Preferencias>(this.carregar());

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
    try {
      localStorage.setItem(CHAVE, JSON.stringify(proximo));
    } catch {
      // Armazenamento bloqueado: vale só nesta sessão.
    }
  }

  private carregar(): Preferencias {
    try {
      return JSON.parse(localStorage.getItem(CHAVE) ?? '{}') as Preferencias;
    } catch {
      return {};
    }
  }
}
