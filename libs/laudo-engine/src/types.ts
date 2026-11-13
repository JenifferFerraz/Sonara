// Tipos da máscara (template JSON) e do estado do formulário.

export type TipoCampo =
  | 'seg' | 'check' | 'multi' | 'select' | 'num' | 'dims' | 'list' | 'calc' | 'text';

export interface Opcao {
  valor: string;
  rotulo: string;
  /** Frase do laudo quando a opção é escolhida. */
  laudo?: string;
  /** Frase da impressão diagnóstica. */
  impressao?: string;
  /** Pontos (ex.: TI-RADS), usados por campos multi. */
  pontos?: number;
}

export interface Campo {
  id: string;
  tipo: TipoCampo;
  rotulo: string;
  /** Valor padrão (sempre o normal). */
  padrao?: string | boolean;
  obrigatorio?: boolean;
  permiteNaoCitar?: boolean;
  /** Condição de exibição em JSON Logic. Nunca código executável. */
  showIf?: unknown;
  unidade?: string;
  /** Máscara de digitação do campo texto. */
  mascara?: 'data';
  casas?: number;
  opcoes?: Opcao[];
  /** Frase do laudo (check, num, dims, text). Aceita {id}, {id.a}, {id.vol}. */
  laudo?: string;
  impressao?: string;
  /** Só tipo list: sub-campos de cada item e frases. */
  itens?: Campo[];
  laudoItem?: string;
  impressaoItem?: string;
  laudoMultiplos?: string;
  impressaoMultiplos?: string;
  /** Só tipo calc: expressão JSON Logic sobre o contexto. */
  expressao?: unknown;
}

export interface Secao {
  id: string;
  titulo: string;
  campos: Campo[];
}

export interface Aviso {
  id: string;
  /** JSON Logic; quando verdadeiro, gera o aviso. */
  se: unknown;
  mensagem: string;
}

export interface Template {
  id: string;
  versao: string;
  titulo: string;
  referencias: Record<string, string>;
  /** Mudanças desta versão, aprovadas pelo médico revisor. */
  mudancas?: { url: string; resumo: string; aprovadoPor?: string };
  /** Fator do volume elipsoide (0,52 a 0,524). */
  fatorVolume?: number;
  secoes: Secao[];
  avisos?: Aviso[];
  frases?: { normal: string; restante: string };
}

export interface Dims { a: string; b: string; c: string }
export type ItemLista = Record<string, string>;
export interface ListaValor { multiplos: boolean; maior: string; itens: ItemLista[] }

export interface Cabecalho {
  paciente: string;
  sexo: 'F' | 'M' | '';
  idade: string;
  solicitante: string;
  data: string;
}

export interface Estado {
  templateId: string;
  versao: string;
  cabecalho: Cabecalho;
  valores: Record<string, unknown>;
}

export type Mudanca =
  | { tipo: 'campo'; id: string; valor: unknown }
  | { tipo: 'cabecalho'; campo: keyof Cabecalho; valor: string };

export interface Alerta {
  campo: string;
  tipo: 'obrigatorio' | 'referencia';
  mensagem: string;
}

export interface Resultado {
  titulo: string;
  paragrafos: string[];
  impressao: string[];
  alertas: Alerta[];
  calculos: Record<string, number | null>;
}

export interface LaudoRepository {
  salvar(estado: Estado, texto: string): Promise<void>;
}
