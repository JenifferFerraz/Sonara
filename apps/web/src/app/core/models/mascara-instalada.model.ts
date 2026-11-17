import { Template } from '@sonara/laudo-engine';

/** Versões instaladas de uma máscara. As antigas ficam guardadas: o médico decide quando trocar. */
export interface MascaraInstalada {
  emUso: string;
  versoes: Record<string, Template>;
  /** Versão nova baixada, aguardando a decisão do médico. */
  pendente: string | null;
  /** Versões novas que o médico já recusou (não avisa de novo). */
  recusadas: string[];
}

export type MascarasInstaladas = Record<string, MascaraInstalada>;
