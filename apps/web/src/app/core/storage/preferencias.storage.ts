import { Injectable } from '@angular/core';
import { Preferencias } from '@sonara/laudo-engine';
import { ArmazenamentoLocalJson } from './armazenamento-local';

/** Frases escolhidas ou reescritas pelo médico. Só redação, nunca texto de laudo nem dado de paciente. */
@Injectable({ providedIn: 'root' })
export class PreferenciasStorage extends ArmazenamentoLocalJson<Preferencias> {
  constructor() {
    super('sonara.preferencias', {});
  }
}
