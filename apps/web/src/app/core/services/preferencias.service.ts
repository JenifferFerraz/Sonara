import { Injectable, signal } from '@angular/core';
import { Preferencias } from '@sonara/laudo-engine';

const CHAVE = 'sonara.preferencias';
const CHAVE_FAVORITOS = 'sonara.achadosFavoritos';

/**
 * Frases escolhidas pelo médico (chave da frase → id da variante).
 * Hoje fica no aparelho; com o login, passa a ser guardado na conta e segue o médico.
 * Só guarda escolhas de redação, nunca texto de laudo nem dado de paciente.
 */
@Injectable({ providedIn: 'root' })
export class PreferenciasService {
  private readonly _frases = signal<Preferencias>(this.carregar());

  readonly frases = this._frases.asReadonly();

  /** Achados que o médico quer sempre na tela, por máscara (id da máscara → ids dos campos). */
  private readonly _favoritos = signal<Record<string, string[]>>(this.carregarFavoritos());
  readonly favoritos = this._favoritos.asReadonly();

  alternarFavorito(mascaraId: string, campoId: string): void {
    const atual = this._favoritos()[mascaraId] ?? [];
    const proximo = atual.includes(campoId) ? atual.filter(x => x !== campoId) : [...atual, campoId];
    const todos = { ...this._favoritos(), [mascaraId]: proximo };
    this._favoritos.set(todos);
    try {
      localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify(todos));
    } catch {
      // Armazenamento bloqueado: vale só nesta sessão.
    }
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

  private carregarFavoritos(): Record<string, string[]> {
    try {
      return JSON.parse(localStorage.getItem(CHAVE_FAVORITOS) ?? '{}') as Record<string, string[]>;
    } catch {
      return {};
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
