// ACR TI-RADS (white paper 2017). Tabela da seção 13 da spec.

export type Composicao = 'cistico' | 'espongiforme' | 'misto' | 'solido';
export type Ecogenicidade = 'anecoico' | 'iso_hiper' | 'hipoecoico' | 'muito_hipoecoico';
export type Forma = 'mais_largo' | 'mais_alto';
export type Margem = 'lisa' | 'mal_definida' | 'lobulada_irregular' | 'extensao';
export type Foco = 'nenhum' | 'cauda_cometa' | 'macro' | 'periferica' | 'puntiforme';

export interface Nodulo {
  composicao: Composicao;
  ecogenicidade: Ecogenicidade;
  forma: Forma;
  margem: Margem;
  focos: Foco[];
  /** Maior diâmetro em cm. */
  maiorCm: number;
}

const P_COMP: Record<Composicao, number> = { cistico: 0, espongiforme: 0, misto: 1, solido: 2 };
const P_ECO: Record<Ecogenicidade, number> = { anecoico: 0, iso_hiper: 1, hipoecoico: 2, muito_hipoecoico: 3 };
const P_FORMA: Record<Forma, number> = { mais_largo: 0, mais_alto: 3 };
const P_MARGEM: Record<Margem, number> = { lisa: 0, mal_definida: 0, lobulada_irregular: 2, extensao: 3 };
const P_FOCO: Record<Foco, number> = { nenhum: 0, cauda_cometa: 0, macro: 1, periferica: 2, puntiforme: 3 };

export type Nivel = 'TR1' | 'TR2' | 'TR3' | 'TR4' | 'TR5';

export interface ResultadoTirads {
  pontos: number;
  nivel: Nivel;
  conduta: 'nenhuma' | 'seguimento' | 'paaf';
  /** Limiar em cm usado para a conduta; null se não se aplica. */
  limiarPaafCm: number | null;
  limiarSeguimentoCm: number | null;
}

export function pontosTirads(n: Nodulo): number {
  // Cístico ou espongiforme: TR1 direto, demais critérios ignorados.
  if (n.composicao === 'cistico' || n.composicao === 'espongiforme') return 0;
  const focos = n.focos.reduce((s, f) => s + P_FOCO[f], 0);
  return P_COMP[n.composicao] + P_ECO[n.ecogenicidade] + P_FORMA[n.forma] + P_MARGEM[n.margem] + focos;
}

export function nivelTirads(pontos: number): Nivel {
  if (pontos <= 0) return 'TR1';
  if (pontos === 2) return 'TR2';
  if (pontos === 3) return 'TR3';
  if (pontos <= 6) return 'TR4';
  return 'TR5';
}

// 1 ponto não existe na tabela ACR; trata como TR2 (benigno) para não quebrar.
const LIMIARES: Record<Nivel, [number | null, number | null]> = {
  TR1: [null, null],
  TR2: [null, null],
  TR3: [2.5, 1.5],
  TR4: [1.5, 1.0],
  TR5: [1.0, 0.5],
};

export function calcularTirads(n: Nodulo): ResultadoTirads {
  const pontos = pontosTirads(n);
  const nivel = pontos === 1 ? 'TR2' : nivelTirads(pontos);
  const [paaf, seg] = LIMIARES[nivel];
  let conduta: ResultadoTirads['conduta'] = 'nenhuma';
  if (paaf !== null && n.maiorCm >= paaf) conduta = 'paaf';
  else if (seg !== null && n.maiorCm >= seg) conduta = 'seguimento';
  return { pontos, nivel, conduta, limiarPaafCm: paaf, limiarSeguimentoCm: seg };
}
