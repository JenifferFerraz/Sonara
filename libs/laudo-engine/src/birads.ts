// BI-RADS (US de mama). REGRA PROVISÓRIA: a tabela oficial da spec ainda não foi conferida
// pelo médico revisor. A sugestão só aparece como aviso e nunca decide a categoria do laudo.

export type Categoria = '1' | '2' | '3' | '4A' | '4B' | '4C' | '5';

const ORDEM: Categoria[] = ['1', '2', '3', '4A', '4B', '4C', '5'];

export type FormaNodulo = 'oval' | 'redonda' | 'irregular';
export type Orientacao = 'paralela' | 'nao_paralela';
export type MargemNodulo = 'circunscrita' | 'indistinta' | 'angular' | 'microlobulada' | 'espiculada';
export type Posterior = 'nenhum' | 'reforco' | 'sombra' | 'combinado';
export type Calcificacoes = 'ausentes' | 'presentes';

export interface NoduloSolido {
  forma: FormaNodulo;
  orientacao: Orientacao;
  margem: MargemNodulo;
  posterior: Posterior;
  calcificacoes: Calcificacoes;
}

export function categoriaValida(x: unknown): x is Categoria {
  return typeof x === 'string' && (ORDEM as string[]).includes(x);
}

/** Nódulo sólido: conta os achados suspeitos. Nenhum suspeito = 3; cada um sobe a categoria. */
export function sugerirNoduloSolido(n: NoduloSolido): Categoria {
  const suspeitos = [
    n.forma === 'irregular',
    n.orientacao === 'nao_paralela',
    n.margem !== 'circunscrita',
    n.posterior === 'sombra' || n.posterior === 'combinado',
    n.calcificacoes === 'presentes',
  ].filter(Boolean).length;

  if (suspeitos >= 4 || n.margem === 'espiculada') return '5';
  if (suspeitos === 3) return '4C';
  if (suspeitos === 2) return '4B';
  if (suspeitos === 1) return '4A';
  return '3';
}

/** A maior categoria da lista (4A < 4B < 4C < 5); null se a lista estiver vazia. */
export function maiorCategoria(categorias: Categoria[]): Categoria | null {
  let maior: Categoria | null = null;
  for (const c of categorias) {
    if (maior === null || ORDEM.indexOf(c) > ORDEM.indexOf(maior)) maior = c;
  }
  return maior;
}
