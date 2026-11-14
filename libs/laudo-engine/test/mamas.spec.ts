import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  aplicar, camposVazios, criarEstado, formatar, gerar, maiorCategoria, sugerirNoduloSolido,
} from '../src';
import type { Estado, ItemLista, Template } from '../src';

const t = JSON.parse(
  readFileSync(new URL('../../templates/src/mamas.json', import.meta.url), 'utf8'),
) as Template;

const com = (e: Estado, id: string, valor: unknown) => aplicar(e, { tipo: 'campo', id, valor });
const lista = (itens: ItemLista[]) => ({ multiplos: false, maior: '', itens });
const texto = (e: Estado) => formatar(gerar(t, e), 'texto');

const nodulo = (extra: ItemLista = {}): ItemLista => ({
  d1: '1,0', d2: '0,8', d3: '0,7', lado: 'direita', hora: '3', forma: 'oval', orientacao: 'paralela',
  margem: 'circunscrita', eco: 'hipoecoico', posterior: 'nenhum', calcificacoes: 'ausentes', dist: 'nao', pseudo: 'nao', modo: 'nc', ...extra,
});
const cisto = (extra: ItemLista = {}): ItemLista => ({
  d1: '0,6', lado: 'esquerda', hora: '1', tipo: 'simples', modo: 'nc', ...extra,
});

describe('BI-RADS provisional suggestion', () => {
  const base = {
    forma: 'oval', orientacao: 'paralela', margem: 'circunscrita', posterior: 'nenhum', calcificacoes: 'ausentes',
  } as const;

  it('counts the suspicious findings of a solid nodule', () => {
    expect(sugerirNoduloSolido({ ...base })).toBe('3');
    expect(sugerirNoduloSolido({ ...base, forma: 'irregular' })).toBe('4A');
    expect(sugerirNoduloSolido({ ...base, forma: 'irregular', margem: 'indistinta' })).toBe('4B');
    expect(sugerirNoduloSolido({ ...base, forma: 'irregular', margem: 'indistinta', calcificacoes: 'presentes' })).toBe('4C');
    expect(sugerirNoduloSolido({ ...base, margem: 'espiculada' })).toBe('5');
  });

  it('picks the highest category and orders 4A < 4B < 4C < 5', () => {
    expect(maiorCategoria([])).toBeNull();
    expect(maiorCategoria(['2', '4A', '3'])).toBe('4A');
    expect(maiorCategoria(['4C', '4B', '5'])).toBe('5');
  });
});

describe('mamas mask', () => {
  it('generates a normal exam in the Turing paragraph layout', () => {
    const r = gerar(t, criarEstado(t));
    expect(camposVazios(r)).toHaveLength(0);
    expect(r.paragrafos).toEqual([
      'Mamas com morfologia e contornos habituais.',
      'Pele e tela subcutânea sem alterações ecográficas.',
      'Não há nódulos sólidos nem cistos.',
      'Não há linfonodomegalia axilar.',
    ]);
    expect(r.impressao).toEqual(['Exame sem alterações ecográficas relevantes.']);
  });

  it('keeps cysts and solid nodules in separate lists', () => {
    expect(t.secoes.map(s => s.id)).toEqual(expect.arrayContaining(['cistos', 'nodulos']));
    const c = com(criarEstado(t), 'lesoes', 'cistos');
    c.valores['cistos'] = lista([cisto()]);
    const txt = texto(c);
    expect(txt).toContain('Imagem cística de conteúdo anecogênico, medindo 0,6 cm, localizada à 1 hora da mama esquerda.');
    expect(txt).not.toContain('Nódulo sólido');
  });

  it('writes a solid nodule and suggests BI-RADS only as a warning', () => {
    let e = com(criarEstado(t), 'lesoes', 'nodulos');
    e = com(e, 'nodulos', lista([nodulo({ margem: 'indistinta', forma: 'irregular' })]));
    const r = gerar(t, e);
    const aviso = r.alertas.find(a => a.campo === 'nodulos[0].birads');
    expect(aviso?.tipo).toBe('referencia');
    expect(aviso?.mensagem).toContain('4B');
    const txt = formatar(r, 'texto');
    expect(txt).toContain('Nódulo sólido irregular, hipoecogênico, de margens indistintas, orientação paralela à pele');
    expect(txt).toContain('medindo 1,0 x 0,8 x 0,7 cm, localizado às 3 horas da mama direita.');
    expect(txt).not.toContain('BI-RADS 4B');
  });

  it('keeps BI-RADS out of the lesion sentences and out of the conclusion', () => {
    let e = com(criarEstado(t), 'lesoes', 'nodulos');
    e = com(e, 'nodulos', lista([nodulo({ forma: 'irregular' })]));
    e = com(e, 'birads_final', 'auto');
    const r = gerar(t, e);
    expect(r.paragrafos.join(' ')).not.toContain('BI-RADS');
    expect(r.impressao.join(' ')).not.toContain('BI-RADS');
    expect(r.classificacao).toEqual(['BI-RADS 4A']);
  });

  it('final category auto uses the highest suggestion across cysts and nodules', () => {
    let e = com(criarEstado(t), 'lesoes', 'ambos');
    e = com(e, 'cistos', lista([cisto({ tipo: 'complicado' })]));
    e = com(e, 'nodulos', lista([nodulo({ forma: 'irregular' })]));
    e = com(e, 'birads_final', 'auto');
    expect(gerar(t, e).classificacao).toEqual(['BI-RADS 4A']);
  });

  it('final category manual overrides the suggestion', () => {
    let e = com(criarEstado(t), 'lesoes', 'nodulos');
    e = com(e, 'nodulos', lista([nodulo({ margem: 'espiculada' })]));
    e = com(e, 'birads_final', 'm3');
    const r = gerar(t, e);
    expect(r.classificacao).toEqual(['BI-RADS 3']);
  });

  it('asks for the lesion measurement and shows ___', () => {
    let e = com(criarEstado(t), 'lesoes', 'nodulos');
    e = com(e, 'nodulos', lista([{ ...nodulo(), d1: '' }]));
    const r = gerar(t, e);
    expect(camposVazios(r).map(a => a.campo)).toContain('nodulos[0].d1');
    expect(formatar(r, 'texto')).toContain('___');
  });

  it('describes a mastectomy with side and reconstruction', () => {
    let e = com(criarEstado(t), 'cirurgia', 'mastectomia');
    expect(texto(e)).toContain('Status pós-mastectomia à direita.');
    e = com(e, 'cir_lado', 'bilateral');
    e = com(e, 'recon', true);
    e = com(e, 'recon_tipo', 'protese');
    const txt = texto(e);
    expect(txt).toContain('Status pós-mastectomia bilateral.');
    expect(txt).toContain('Reconstrução mamária com prótese.');
  });

  it('joins several reasons for the exam in one sentence', () => {
    let e = com(criarEstado(t), 'motivo', true);
    e = com(e, 'motivos', ['rotina', 'familiar', 'mastalgia']);
    expect(texto(e)).toContain(
      'Exame realizado para rotina, avaliação de história familiar positiva e investigação de mastalgia.',
    );
  });

  it('allows independent implant findings with a side', () => {
    let e = com(criarEstado(t), 'implantes', ['dobras', 'intra']);
    e = com(e, 'implante_lado', 'direita');
    const r = gerar(t, e);
    expect(formatar(r, 'texto')).toContain(
      'Implantes mamários à direita, com dobras do elastômero e com sinais de rotura intracapsular.',
    );
    expect(r.impressao).toContain('Sinais de rotura intracapsular de implante.');
  });

  it('writes microcysts and multiple simple cysts', () => {
    let e = com(criarEstado(t), 'lesoes', 'cistos');
    e = com(e, 'micro', true);
    e = com(e, 'micro_cm', '0,4');
    e = com(e, 'micro_lado', 'esquerda');
    e = com(e, 'micro_hora', '3');
    e = com(e, 'cmult', true);
    e = com(e, 'cmult_max', '0,8');
    const txt = texto(e);
    expect(txt).toContain('Agrupamento de microcistos com 0,4 cm, localizado às 3 horas da mama esquerda.');
    expect(txt).toContain('Múltiplos cistos simples nas duas mamas, o maior com 0,8 cm.');
  });

  it('cites distances to the nipple and skin and a possible pseudonodule when marked', () => {
    let e = com(criarEstado(t), 'lesoes', 'nodulos');
    e = com(e, 'nodulos', lista([nodulo({ dist: 'sim', mamilo: '2,5', pele: '0,6', pseudo: 'ilhota' })]));
    const txt = texto(e);
    expect(txt).toContain('situado a 2,5 cm do mamilo e a 0,6 cm da pele');
    expect(txt).toContain('podendo corresponder a pseudonódulo (ilhota de gordura)');
  });

  it('writes multiple solid nodules with a size per breast', () => {
    let e = com(criarEstado(t), 'lesoes', 'nodulos');
    e = com(e, 'nmult', true);
    e = com(e, 'nmult_d', '1,0');
    e = com(e, 'nmult_e', '0,7');
    expect(texto(e)).toContain(
      'Múltiplos nódulos sólidos hipoecogênicos, de margens circunscritas, medindo até 1,0 cm à direita e 0,7 cm à esquerda.',
    );
  });

  it('describes an isolated axillary node with three measurements', () => {
    let e = com(criarEstado(t), 'axilas', 'isolada');
    e = com(e, 'linf_axilares', lista([{ d1: '2,5', d2: '2,0', d3: '1,5', lado: 'direita', aspecto: 'sem_hilo' }]));
    expect(texto(e)).toContain(
      'Linfonodo axilar à direita, arredondado, com perda do hilo gorduroso, medindo 2,5 x 2,0 x 1,5 cm.',
    );
  });

  it('describes bilateral axillary nodes with the largest one', () => {
    let e = com(criarEstado(t), 'axilas', 'bilaterais');
    e = com(e, 'axb', { a: '2,5', b: '2,0', c: '1,5' });
    e = com(e, 'axb_lado', 'esquerda');
    e = com(e, 'axb_aspecto', 'espessado');
    const r = gerar(t, e);
    expect(formatar(r, 'texto')).toContain(
      'Linfonodomegalias axilares bilaterais, a maior à esquerda, com córtex espessado, medindo 2,5 x 2,0 x 1,5 cm.',
    );
    expect(r.impressao).toContain('Linfonodomegalias axilares bilaterais.');
  });

  it('prints BI-RADS on its own line below the conclusion, cysts first', () => {
    let e = com(criarEstado(t), 'lesoes', 'cistos');
    e = com(e, 'cistos', lista([cisto()]));
    e = com(e, 'birads_final', 'auto');
    const txt = texto(e);
    const iCisto = txt.indexOf('Cisto mamário na mama esquerda, medindo 0,6 cm.');
    const iBirads = txt.indexOf('BI-RADS 2');
    expect(iCisto).toBeGreaterThan(txt.indexOf('IMPRESSÃO DIAGNÓSTICA:'));
    expect(iBirads).toBeGreaterThan(iCisto);
    expect(txt.endsWith('\n\nBI-RADS 2')).toBe(true);
  });
});
