export * from './types';
export * from './engine';
export * from './numeros';
export * from './tirads';
export * from './birads';
export * from './seguranca';

import type { Estado, LaudoRepository } from './types';

/** Implementação "nenhum" do MVP: nada é salvo. Fase 2 troca por local/nuvem. */
export const repositorioNenhum: LaudoRepository = {
  async salvar(_estado: Estado, _texto: string): Promise<void> {
    /* intencionalmente vazio: o MVP não salva nada */
  },
};
