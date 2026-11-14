import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { aplicar, camposVazios, criarEstado, formatar, gerar } from '../src';
import type { Estado, Template } from '../src';

const t = JSON.parse(
  readFileSync(new URL('../../templates/src/pelvico.json', import.meta.url), 'utf8'),
) as Template;

const com = (e: Estado, id: string, valor: unknown) => aplicar(e, { tipo: 'campo', id, valor });
const ids = new Set(t.secoes.flatMap(s => s.campos.map(c => c.id)));

describe('pelvico mask', () => {
  it('opens with the bladder and keeps uterus and ovaries', () => {
    expect(t.secoes[1].id).toBe('bexiga');
    for (const id of ['utero', 'ovd', 'ove', 'liquido']) expect(ids.has(id)).toBe(true);
  });

  it('drops the cervix fields that the suprapubic route does not assess', () => {
    for (const id of ['colo', 'naboth_maior', 'polipo_endocervical', 'espessamento_endocervice']) {
      expect(ids.has(id)).toBe(false);
    }
  });

  it('asks for the mandatory measurements and shows ___ until they are filled', () => {
    const r = gerar(t, criarEstado(t));
    expect(camposVazios(r).map(a => a.campo)).toEqual(expect.arrayContaining(['utero', 'ovd', 'ove']));
    expect(formatar(r, 'texto')).toContain('___');
  });

  it('writes the uterus and the bladder in a complete exam', () => {
    let e = criarEstado(t);
    e = com(e, 'utero', { a: '7,0', b: '4,0', c: '3,5' });
    e = com(e, 'ovd', { a: '3,0', b: '2,0', c: '1,5' });
    e = com(e, 'ove', { a: '2,8', b: '1,9', c: '1,5' });
    e = com(e, 'endo_mm', '6');
    const r = gerar(t, e);
    expect(camposVazios(r)).toHaveLength(0);
    expect(r.paragrafos.some(p => p.startsWith('Bexiga com boa repleção'))).toBe(true);
    expect(formatar(r, 'texto')).toContain('7,0 x 4,0 x 3,5');
  });

  it('keeps the total hysterectomy rule', () => {
    const e = com(criarEstado(t), 'cirurgia', 'total');
    expect(formatar(gerar(t, e), 'texto')).toContain('status pós-histerectomia total');
  });
});
