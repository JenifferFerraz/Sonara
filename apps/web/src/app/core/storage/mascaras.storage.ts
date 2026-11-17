import { Injectable } from '@angular/core';
import { MascarasInstaladas } from '../models/mascara-instalada.model';
import { ArmazenamentoLocalJson } from './armazenamento-local';

/**
 * Máscaras instaladas, com as versões antigas. A chave v2 descarta máscaras instaladas com ids que
 * não existem mais (ex.: pelve-suprapubica, hoje pelvico).
 */
@Injectable({ providedIn: 'root' })
export class MascarasStorage extends ArmazenamentoLocalJson<MascarasInstaladas> {
  constructor() {
    super('sonara.mascaras.v2', {});
  }
}
