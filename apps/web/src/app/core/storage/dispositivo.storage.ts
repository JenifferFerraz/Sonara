import { Injectable } from '@angular/core';
import { ArmazenamentoLocalTexto } from './armazenamento-local';

/** ID deste aparelho, devolvido pela API no login e reenviado nos logins seguintes. */
@Injectable({ providedIn: 'root' })
export class DispositivoStorage extends ArmazenamentoLocalTexto {
  constructor() {
    super('sonara.deviceId');
  }
}
