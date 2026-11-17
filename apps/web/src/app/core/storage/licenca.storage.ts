import { Injectable } from '@angular/core';
import { ArmazenamentoLocal, ArmazenamentoLocalTexto } from './armazenamento-local';

/** Token de licença assinado (Ed25519). Não é segredo: só vale neste aparelho. */
@Injectable({ providedIn: 'root' })
export class LicencaStorage extends ArmazenamentoLocalTexto {
  constructor() {
    super('sonara.licenca');
  }
}

/** Maior data já vista neste aparelho: voltar o relógio passa a ser detectado. */
@Injectable({ providedIn: 'root' })
export class UltimaDataStorage extends ArmazenamentoLocal<number> {
  constructor() {
    super('sonara.ultimaData', 0);
  }
  protected ler(bruto: string): number {
    return Number(bruto) || 0;
  }
  protected escrever(valor: number): string {
    return String(valor);
  }
}
