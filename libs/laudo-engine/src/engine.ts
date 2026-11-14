import jsonLogic from 'json-logic-js';
import { FALTA, formatarNumero, lerNumero, volume } from './numeros';
import { calcularTirads } from './tirads';
import type { Composicao, Ecogenicidade, Forma, Foco, Margem, Nodulo } from './tirads';
import type {
  Alerta, Campo, Dims, Estado, ItemLista, ListaValor, Mudanca, Preferencias, Resultado, Template, Variante,
} from './types';

type Ctx = Record<string, unknown>;

const FRASES_PADRAO = {
  normal: 'Exame sem anormalidades detectáveis pelo método.',
  restante: 'Restante do exame sem particularidades.',
};

function hoje(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function valorInicial(c: Campo): unknown {
  switch (c.tipo) {
    case 'seg':
    case 'select':
      return c.padrao ?? c.opcoes?.[0]?.valor ?? '';
    case 'check':
      return c.padrao ?? false;
    case 'multi':
      return [];
    case 'dims':
      return { a: '', b: '', c: '' } satisfies Dims;
    case 'list':
      return { multiplos: false, maior: '', itens: [] } satisfies ListaValor;
    default:
      return '';
  }
}

/** Estado inicial: tudo normal; medidas obrigatórias vazias. */
export function criarEstado(template: Template): Estado {
  const valores: Record<string, unknown> = {};
  for (const s of template.secoes) for (const c of s.campos) if (c.tipo !== 'calc') valores[c.id] = valorInicial(c);
  return {
    templateId: template.id,
    versao: template.versao,
    cabecalho: { paciente: '', sexo: '', idade: '', solicitante: '', data: hoje() },
    valores,
  };
}

/** Devolve um novo estado (imutável). */
export function aplicar(estado: Estado, m: Mudanca): Estado {
  if (m.tipo === 'cabecalho') return { ...estado, cabecalho: { ...estado.cabecalho, [m.campo]: m.valor } };
  return { ...estado, valores: { ...estado.valores, [m.id]: m.valor } };
}

// ---------- Contexto ----------

interface Contextos {
  /** Valores tipados, para JSON Logic. */
  logica: Ctx;
  /** Valores formatados, para interpolar nas frases. */
  texto: Ctx;
  calculos: Record<string, number | null>;
}

function fmt(n: number | null, casas: number): string {
  return n === null ? FALTA : formatarNumero(n, casas);
}

function montarContextos(t: Template, e: Estado): Contextos {
  const fator = t.fatorVolume ?? 0.523;
  const logica: Ctx = { sexo: e.cabecalho.sexo, idade: lerNumero(e.cabecalho.idade) };
  const texto: Ctx = { sexo: e.cabecalho.sexo, idade: e.cabecalho.idade || FALTA };
  const calculos: Record<string, number | null> = {};

  for (const s of t.secoes) {
    for (const c of s.campos) {
      const v = e.valores[c.id];
      const casas = c.casas ?? 1;
      switch (c.tipo) {
        case 'num': {
          const n = lerNumero(v);
          logica[c.id] = n;
          logica[`${c.id}__nc`] = Boolean(e.valores[`${c.id}__nc`]);
          texto[c.id] = fmt(n, casas);
          break;
        }
        case 'dims': {
          const d = (v as Dims) ?? { a: '', b: '', c: '' };
          const [a, b, cc] = [lerNumero(d.a), lerNumero(d.b), lerNumero(d.c)];
          const vol = volume(a, b, cc, fator);
          logica[c.id] = { a, b, c: cc, vol };
          texto[c.id] = { a: fmt(a, casas), b: fmt(b, casas), c: fmt(cc, casas), vol: fmt(vol, 1) };
          calculos[`${c.id}.vol`] = vol;
          break;
        }
        case 'list': {
          const l = (v as ListaValor) ?? { multiplos: false, maior: '', itens: [] };
          logica[c.id] = { multiplos: l.multiplos, maior: lerNumero(l.maior), n: l.itens.length };
          texto[c.id] = { maior: fmt(lerNumero(l.maior), casas) };
          break;
        }
        case 'calc':
          break; // depois
        case 'multi':
          logica[c.id] = Array.isArray(v) ? v : [];
          break;
        default:
          logica[c.id] = v;
          texto[c.id] = c.opcoes
            ? (c.opcoes.find((o) => o.valor === v)?.rotulo ?? FALTA)
            : typeof v === 'string' && v !== '' ? v : FALTA;
      }
    }
  }
  // calc: depende dos demais
  for (const s of t.secoes) {
    for (const c of s.campos) {
      if (c.tipo !== 'calc') continue;
      const r = jsonLogic.apply(c.expressao as never, logica) as number | null;
      const n = typeof r === 'number' && Number.isFinite(r) ? r : null;
      logica[c.id] = n;
      texto[c.id] = fmt(n, c.casas ?? 1);
      calculos[c.id] = n;
    }
  }
  return { logica, texto, calculos };
}

function buscar(ctx: Ctx, caminho: string): unknown {
  let atual: unknown = ctx;
  for (const p of caminho.split('.')) {
    if (atual && typeof atual === 'object' && p in (atual as Ctx)) atual = (atual as Ctx)[p];
    else return FALTA;
  }
  return atual;
}

function interpolar(frase: string, ...ctxs: Ctx[]): string {
  return frase.replace(/\{([\w.]+)\}/g, (_m, caminho: string) => {
    for (const c of ctxs) {
      const r = buscar(c, caminho);
      if (r !== FALTA || ctxs.at(-1) === c) return typeof r === 'string' || typeof r === 'number' ? String(r) : FALTA;
    }
    return FALTA;
  });
}

function visivel(c: Campo, logica: Ctx): boolean {
  return c.showIf === undefined || Boolean(jsonLogic.apply(c.showIf as never, logica));
}

// ---------- Geração ----------

/** Frase escolhida pelo médico para a chave, ou a padrão da máscara. */
function frase(chave: string, padrao: string | undefined, variantes: Variante[] | undefined, prefs: Preferencias): string | undefined {
  const id = prefs[chave];
  const v = id ? variantes?.find((x) => x.id === id) : undefined;
  return v ? v.texto : padrao;
}

export function gerar(template: Template, estado: Estado, preferencias: Preferencias = {}): Resultado {
  const { logica, texto, calculos } = montarContextos(template, estado);
  const alertas: Alerta[] = [];
  const impressao: string[] = [];
  const paragrafos: string[] = [];
  const frases = template.frases ?? FRASES_PADRAO;

  const pedir = (campo: Campo, mensagem = `${campo.rotulo}: preenchimento obrigatório.`) =>
    alertas.push({ campo: campo.id, tipo: 'obrigatorio', mensagem });

  for (const secao of template.secoes) {
    const frasesSecao: string[] = [];
    /** Campo com `paragrafo`: as frases novas (a partir de `desde`) saem da seção e viram parágrafos próprios. */
    const separar = (c: Campo, desde: number) => {
      if (!c.paragrafo || frasesSecao.length <= desde) return;
      const novas = frasesSecao.splice(desde);
      if (frasesSecao.length) {
        paragrafos.push(frasesSecao.join(' '));
        frasesSecao.length = 0;
      }
      paragrafos.push(...novas);
    };
    for (const c of secao.campos) {
      if (c.tipo === 'calc') {
        // Campo calculado com frase (ex.: volume total da tireoide).
        if (visivel(c, logica) && c.laudo) {
          frasesSecao.push(interpolar(frase(c.id, c.laudo, c.variantes, preferencias) ?? c.laudo, texto));
          separar(c, frasesSecao.length - 1);
        }
        continue;
      }
      if (!visivel(c, logica)) continue;
      const v = estado.valores[c.id];
      const naoCitar = Boolean(estado.valores[`${c.id}__nc`]);
      const antes = frasesSecao.length;

      switch (c.tipo) {
        case 'seg': {
          // Só `seg` escreve a frase da opção. `select` apenas fornece o valor para as frases de outros campos.
          const o = c.opcoes?.find((x) => x.valor === v);
          const f = o && frase(`${c.id}.${o.valor}`, o.laudo, o.variantes, preferencias);
          if (f) frasesSecao.push(interpolar(f, texto));
          if (o?.impressao) impressao.push(interpolar(o.impressao, texto));
          break;
        }
        case 'check':
          if (v) {
            const f = frase(c.id, c.laudo, c.variantes, preferencias);
            if (f) frasesSecao.push(interpolar(f, texto));
            if (c.impressao) impressao.push(interpolar(c.impressao, texto));
          }
          break;
        case 'multi': {
          const sel = Array.isArray(v) ? (v as string[]) : [];
          for (const o of c.opcoes ?? []) {
            if (!sel.includes(o.valor)) continue;
            if (o.laudo) frasesSecao.push(interpolar(o.laudo, texto));
            if (o.impressao) impressao.push(interpolar(o.impressao, texto));
          }
          break;
        }
        case 'num': {
          if (naoCitar) break;
          if (c.obrigatorio && lerNumero(v) === null) pedir(c);
          const f = frase(c.id, c.laudo, c.variantes, preferencias);
          if (f) frasesSecao.push(interpolar(f, texto));
          if (c.impressao && lerNumero(v) !== null) impressao.push(interpolar(c.impressao, texto));
          break;
        }
        case 'dims': {
          const d = v as Dims;
          const falta = [d.a, d.b, d.c].some((x) => lerNumero(x) === null);
          if (c.obrigatorio && falta) pedir(c, `${c.rotulo}: medidas obrigatórias não preenchidas.`);
          const f = frase(c.id, c.laudo, c.variantes, preferencias);
          if (f) frasesSecao.push(interpolar(f, texto));
          if (c.impressao) impressao.push(interpolar(c.impressao, texto));
          break;
        }
        case 'list': {
          const l = v as ListaValor;
          if (l.multiplos) {
            if (c.laudoMultiplos) frasesSecao.push(interpolar(c.laudoMultiplos, texto));
            if (c.impressaoMultiplos) impressao.push(interpolar(c.impressaoMultiplos, texto));
            if (c.obrigatorio && lerNumero(l.maior) === null) pedir(c, `${c.rotulo}: informe o maior.`);
            break;
          }
          l.itens.forEach((item, i) => {
            const ictx = contextoItem(c, item);
            if (c.tirads) {
              const r = tiradsDoItem(c.tirads, item);
              if (item[c.tirads.modo] === 'auto') {
                ictx[c.tirads.modo] = r ? `, ACR TI-RADS ${r.nivel.slice(2)}` : '';
              }
              if (r) {
                const conduta =
                  r.conduta === 'paaf'
                    ? 'a tabela indica PAAF para este tamanho'
                    : r.conduta === 'seguimento'
                      ? 'a tabela indica seguimento por imagem para este tamanho'
                      : 'a tabela não indica PAAF nem seguimento para este tamanho';
                alertas.push({
                  campo: `${c.id}[${i}].tirads`,
                  tipo: 'referencia',
                  mensagem: `${c.rotulo} ${i + 1}: ACR TI-RADS calculado ${r.nivel} (${r.pontos} ponto${r.pontos === 1 ? '' : 's'}); ${conduta}. A conduta é do médico e só entra no laudo se você a escrever.`,
                });
              }
            }
            for (const sub of c.itens ?? []) {
              if (sub.obrigatorio && sub.tipo === 'num' && lerNumero(item[sub.id]) === null)
                alertas.push({
                  campo: `${c.id}[${i}].${sub.id}`,
                  tipo: 'obrigatorio',
                  mensagem: `${c.rotulo} ${i + 1}: ${sub.rotulo} obrigatória.`,
                });
            }
            if (c.laudoItem) frasesSecao.push(interpolar(c.laudoItem, ictx, texto));
            if (c.impressaoItem) impressao.push(interpolar(c.impressaoItem, ictx, texto));
          });
          break;
        }
        case 'text':
          if (typeof v === 'string' && v.trim() !== '') frasesSecao.push(interpolar(frase(c.id, c.laudo, c.variantes, preferencias) ?? '{valor}', { valor: v.trim() }));
          break;
      }
      separar(c, antes);
    }
    if (frasesSecao.length) paragrafos.push(frasesSecao.join(' '));
  }

  for (const a of template.avisos ?? []) {
    if (jsonLogic.apply(a.se as never, logica)) alertas.push({ campo: a.id, tipo: 'referencia', mensagem: a.mensagem });
  }

  const unicas = [...new Set(impressao)];
  return {
    titulo: template.titulo,
    paragrafos,
    impressao: unicas.length ? [...unicas, frases.restante] : [frases.normal],
    alertas,
    calculos,
  };
}

function contextoItem(lista: Campo, item: ItemLista): Ctx {
  const ctx: Ctx = {};
  for (const sub of lista.itens ?? []) {
    const raw = item[sub.id] ?? '';
    if (sub.tipo === 'num') ctx[sub.id] = fmt(lerNumero(raw), sub.casas ?? 1);
    else if (sub.opcoes) {
      const o = sub.opcoes.find((x) => x.valor === raw);
      ctx[sub.id] = o ? (o.laudo ?? o.rotulo) : FALTA;
    }
    else ctx[sub.id] = raw || FALTA;
  }
  return ctx;
}

/** Só alertas obrigatórios ("campos vazios"). */
export const camposVazios = (r: Resultado) => r.alertas.filter((a) => a.tipo === 'obrigatorio');

// ---------- Saída ----------

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function formatar(r: Resultado, formato: 'texto' | 'html'): string {
  if (formato === 'texto') {
    return [r.titulo, ...r.paragrafos, 'IMPRESSÃO DIAGNÓSTICA:\n' + r.impressao.join('\n')].join('\n\n');
  }
  const marca = (s: string) => esc(s).replaceAll(FALTA, `<mark>${FALTA}</mark>`);
  return [
    `<p style="text-align:center"><b>${esc(r.titulo)}</b></p>`,
    ...r.paragrafos.map((p) => `<p style="text-align:justify">${marca(p)}</p>`),
    '<p><b>IMPRESSÃO DIAGNÓSTICA:</b></p>',
    ...r.impressao.map((i) => `<p>${marca(i)}</p>`),
  ].join('\n');
}

/** Ids dos campos visíveis (showIf avaliado), para a tela montar o formulário. */
export function camposVisiveis(template: Template, estado: Estado): Set<string> {
  const { logica } = montarContextos(template, estado);
  const ids = new Set<string>();
  for (const s of template.secoes) for (const c of s.campos) if (visivel(c, logica)) ids.add(c.id);
  return ids;
}

/** Monta o nódulo ACR a partir dos sub-campos do item; null se faltar dado ou valor inválido. */
function tiradsDoItem(m: NonNullable<Campo['tirads']>, item: ItemLista) {
  const medidas = m.medidas.map((id) => lerNumero(item[id])).filter((x): x is number => x !== null);
  if (medidas.length === 0) return null;
  const nodulo: Nodulo = {
    composicao: item[m.composicao] as Composicao,
    ecogenicidade: item[m.ecogenicidade] as Ecogenicidade,
    forma: item[m.forma] as Forma,
    margem: item[m.margem] as Margem,
    focos: item[m.foco] ? [item[m.foco] as Foco] : [],
    maiorCm: Math.max(...medidas),
  };
  try {
    const r = calcularTirads(nodulo);
    return Number.isFinite(r.pontos) ? r : null;
  } catch {
    return null;
  }
}
