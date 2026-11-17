import { Injectable } from '@angular/core';
import { ArmazenamentoLocal } from './armazenamento-local';

/**
 * Sinalizador de que há uma conta entrada neste aparelho (o cookie httpOnly do refresh token o
 * JavaScript não enxerga, então guardamos só um "sim"). Nenhum dado pessoal: nome e CRM vêm da
 * licença assinada, e o servidor identifica o médico pelo token.
 */
@Injectable({ providedIn: 'root' })
export class SessaoStorage extends ArmazenamentoLocal<boolean> {
  constructor() {
    super('sonara.sessao', false);
  }
  protected ler(bruto: string): boolean {
    return bruto === '1';
  }
  protected escrever(valor: boolean): string {
    return valor ? '1' : '0';
  }
}
