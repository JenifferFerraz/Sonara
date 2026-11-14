import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { camposVazios, criarEstado, formatar, gerar } from '../src';
import type { Template } from '../src';

const ler = (nome: string) =>
  JSON.parse(readFileSync(new URL(`../../templates/src/${nome}.json`, import.meta.url), 'utf8')) as Template;
const total = ler('abdome-total');
const superior = ler('abdome-superior');

describe('abdome superior mask', () => {
  it('shares the upper abdomen sections with the total mask', () => {
    const ids = superior.secoes.map(s => s.id);
    expect(ids).toEqual(expect.arrayContaining(['figado', 'vesicula', 'vias', 'pancreas', 'baco', 'aorta', 'liquido']));
  });

  it('leaves out kidneys, bladder and bowel loops', () => {
    const ids = superior.secoes.map(s => s.id);
    for (const fora of ['rins', 'bexiga', 'alcas']) expect(ids).not.toContain(fora);
    const texto = formatar(gerar(superior, criarEstado(superior)), 'texto');
    expect(texto).not.toMatch(/Rins|Bexiga/);
  });

  it('has its own title and id, and the total mask is untouched', () => {
    expect(superior.titulo).toBe('ULTRASSONOGRAFIA DO ABDOME SUPERIOR');
    expect(superior.id).toBe('abdome-superior');
    expect(total.secoes.map(s => s.id)).toContain('rins');
  });

  it('generates a normal exam with no required alerts', () => {
    const r = gerar(superior, criarEstado(superior));
    expect(camposVazios(r)).toHaveLength(0);
    expect(r.impressao).toEqual(['Exame sem alterações ecográficas relevantes.']);
  });
});
