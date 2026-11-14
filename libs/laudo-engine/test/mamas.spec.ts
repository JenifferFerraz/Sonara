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
  margem: 'circunscrita', eco: 'hipoecoico', posterior: 'nenhum', calcificacoes: 'ausentes', modo: 'nc', ...extra,
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
      'Mamas de morfologia normal e contornos regulares.',
      'Pele e tecido adiposo subcutâneo de aspecto ecográfico preservado.',
      'Não se observam imagens nodulares sólidas ou císticas.',
      'Ausência de linfonodomegalias axilares.',
    ]);
    expect(r.impressao).toEqual(['Exame sem anormalidades detectáveis pelo método.']);
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

  it('cites the suggested BI-RADS on the lesion only when the doctor asks', () => {
    let e = com(criarEstado(t), 'lesoes', 'nodulos');
    e = com(e, 'nodulos', lista([nodulo({ modo: 'auto' })]));
    expect(texto(e)).toContain('localizado às 3 horas da mama direita, BI-RADS 3.');
  });

  it('final category auto uses the highest suggestion across cysts and nodules', () => {
    let e = com(criarEstado(t), 'lesoes', 'ambos');
    e = com(e, 'cistos', lista([cisto({ tipo: 'complicado' })]));
    e = com(e, 'nodulos', lista([nodulo({ forma: 'irregular' })]));
    e = com(e, 'birads_final', 'auto');
    expect(gerar(t, e).impressao).toContain('Categoria BI-RADS 4A.');
  });

  it('final category manual overrides the suggestion', () => {
    let e = com(criarEstado(t), 'lesoes', 'nodulos');
    e = com(e, 'nodulos', lista([nodulo({ margem: 'espiculada' })]));
    e = com(e, 'birads_final', 'm3');
    const r = gerar(t, e);
    expect(r.impressao).toContain('Categoria BI-RADS 3.');
    expect(r.impressao.join(' ')).not.toContain('BI-RADS 5');
  });

  it('asks for the lesion measurement and shows ___', () => {
    let e = com(criarEstado(t), 'lesoes', 'nodulos');
    e = com(e, 'nodulos', lista([{ ...nodulo(), d1: '' }]));
    const r = gerar(t, e);
    expect(camposVazios(r).map(a => a.campo)).toContain('nodulos[0].d1');
    expect(formatar(r, 'texto')).toContain('___');
  });

  it('describes a mastectomy', () => {
    const e = com(criarEstado(t), 'cirurgia', 'mastectomia_d');
    expect(texto(e)).toContain('Mama direita ausente (status pós-mastectomia).');
  });
});
