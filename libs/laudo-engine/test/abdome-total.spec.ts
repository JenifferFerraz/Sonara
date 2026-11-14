import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { aplicar, camposVazios, criarEstado, formatar, gerar } from '../src';
import type { Estado, Template } from '../src';

const t = JSON.parse(
  readFileSync(new URL('../../templates/src/abdome-total.json', import.meta.url), 'utf8'),
) as Template;

const com = (e: Estado, id: string, valor: unknown) => aplicar(e, { tipo: 'campo', id, valor });
const texto = (e: Estado) => formatar(gerar(t, e), 'texto');

describe('abdome total mask', () => {
  it('generates a normal exam without required alerts', () => {
    const r = gerar(t, criarEstado(t));
    expect(camposVazios(r)).toHaveLength(0);
    expect(r.impressao).toEqual(['Exame sem anormalidades detectáveis pelo método.']);
    expect(r.paragrafos.some(p => p.startsWith('Fígado com dimensões normais'))).toBe(true);
    expect(r.paragrafos.some(p => p.startsWith('Bexiga com boa repleção'))).toBe(true);
  });

  it('keeps hidden optional groups out of the report', () => {
    expect(texto(criarEstado(t))).not.toContain('Cisto simples');
  });

  it('requires the cyst size and shows ___ when the group is on but empty', () => {
    const e = com(criarEstado(t), 'fig_cisto', true);
    const r = gerar(t, e);
    expect(camposVazios(r).map(a => a.campo)).toContain('fig_cisto_cm');
    expect(formatar(r, 'texto')).toContain('medindo ___ cm');
  });

  it('writes a hepatic cyst with segment and size', () => {
    let e = com(criarEstado(t), 'fig_cisto', true);
    e = com(e, 'fig_cisto_cm', '1,2');
    e = com(e, 'fig_cisto_seg', '7');
    expect(texto(e)).toContain('Cisto simples no segmento VII, medindo 1,2 cm.');
  });

  it('adds gallstones to the findings and impression', () => {
    let e = com(criarEstado(t), 'ves', 'calc');
    e = com(e, 'ves_calc_cm', '0,8');
    const r = gerar(t, e);
    expect(formatar(r, 'texto')).toContain('medindo 0,8 cm, compatível com cálculo');
    expect(r.impressao).toContain('Colelitíase.');
  });

  it('describes kidney findings only when the kidneys are marked with findings', () => {
    const e = com(criarEstado(t), 'rime_dilatacao', 'leve');
    expect(texto(e)).not.toContain('Dilatação pielocalicinal');
    const f = com(com(criarEstado(t), 'rins', 'achados'), 'rime_dilatacao', 'leve');
    expect(texto(f)).toContain('Dilatação pielocalicinal leve no rim esquerdo.');
    expect(gerar(t, f).impressao).toContain('Hidronefrose leve à esquerda.');
  });

  it('computes the bladder volumes before and after voiding', () => {
    let e = com(criarEstado(t), 'vol_vesical', true);
    e = com(e, 'vesical_pre', { a: '8,0', b: '8,0', c: '8,0' });
    e = com(e, 'vesical_pos', { a: '3,0', b: '3,0', c: '3,0' });
    expect(texto(e)).toContain('pré-miccional estimado em 267,8 ml e pós-miccional em 14,1 ml');
  });
});
