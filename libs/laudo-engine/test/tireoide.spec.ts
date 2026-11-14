import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { aplicar, camposVazios, criarEstado, formatar, gerar } from '../src';
import type { Estado, ItemLista, ListaValor, Template } from '../src';

const t = JSON.parse(
  readFileSync(new URL('../../templates/src/tireoide.json', import.meta.url), 'utf8'),
) as Template;

const com = (e: Estado, id: string, valor: unknown) => aplicar(e, { tipo: 'campo', id, valor });
const texto = (e: Estado) => formatar(gerar(t, e), 'texto');
const medidasNormais = (e = criarEstado(t)) => {
  let r = com(e, 'lobo_d', { a: '4,0', b: '1,2', c: '1,2' });
  r = com(r, 'lobo_e', { a: '4,0', b: '1,2', c: '1,2' });
  return com(r, 'istmo', '0,3');
};
const comNodulo = (item: ItemLista, extra: Partial<ListaValor> = {}) => {
  let e = com(medidasNormais(), 'nod_status', 'presentes');
  const base: ItemLista = {
    d1: '1,6', d2: '1,2', d3: '1,0', local: 'ld_medio', composicao: 'solido', eco: 'hipoecoico',
    forma: 'mais_largo', margem: 'lisa', foco: 'nenhum', modo: 'nc',
  };
  e = com(e, 'nodulos', { multiplos: false, maior: '', itens: [{ ...base, ...item }], ...extra });
  return e;
};

describe('tireoide mask', () => {
  it('asks for the mandatory measurements and shows ___', () => {
    const r = gerar(t, criarEstado(t));
    expect(camposVazios(r).map(a => a.campo)).toEqual(expect.arrayContaining(['lobo_d', 'lobo_e', 'istmo']));
    expect(formatar(r, 'texto')).toContain('___');
  });

  it('generates a normal exam with the total volume', () => {
    const r = gerar(t, medidasNormais());
    expect(camposVazios(r)).toHaveLength(0);
    const txt = formatar(r, 'texto');
    expect(txt).toContain('O lobo direito mede 4,0 x 1,2 x 1,2 cm.');
    expect(txt).toContain('O istmo tem espessura de 0,3 cm.');
    expect(txt).toContain('Volume tireoidiano estimado em 6,0 cm³.');
    expect(txt).toContain('Não se observam lesões nodulares.');
    expect(txt).toContain('Ausência de linfonodomegalias cervicais.');
    expect(r.impressao).toEqual(['Exame sem anormalidades detectáveis pelo método.']);
  });

  it('writes a nodule and computes ACR TI-RADS as a warning only', () => {
    const r = gerar(t, comNodulo({ eco: 'hipoecoico', composicao: 'solido', forma: 'mais_largo' }));
    // sólido 2 + hipoecogênico 2 = 4 pontos = TR4; 1,6 cm >= 1,5 cm
    const aviso = r.alertas.find(a => a.campo === 'nodulos[0].tirads');
    expect(aviso?.tipo).toBe('referencia');
    expect(aviso?.mensagem).toContain('TR4');
    expect(aviso?.mensagem).toContain('PAAF');
    expect(formatar(r, 'texto')).toContain('situado no terço médio do lobo direito, medindo 1,6 x 1,2 x 1,0 cm.');
    expect(formatar(r, 'texto')).not.toContain('TI-RADS');
  });

  it('cites the calculated TI-RADS only when the doctor asks', () => {
    const auto = gerar(t, comNodulo({ modo: 'auto' }));
    expect(formatar(auto, 'texto')).toContain('medindo 1,6 x 1,2 x 1,0 cm, ACR TI-RADS 4.');
    const manual = gerar(t, comNodulo({ modo: 'TR3' }));
    expect(formatar(manual, 'texto')).toContain('ACR TI-RADS 3.');
  });

  it('hides the thyroid fields after a total thyroidectomy', () => {
    const e = com(criarEstado(t), 'cirurgia', 'total');
    const r = gerar(t, e);
    expect(formatar(r, 'texto')).toContain('Tireoide não visualizada (status pós-tireoidectomia total).');
    expect(camposVazios(r)).toHaveLength(0);
    expect(formatar(r, 'texto')).not.toContain('Volume tireoidiano');
  });

  it('asks only for the remaining lobe after a hemithyroidectomy', () => {
    const e = com(criarEstado(t), 'cirurgia', 'hemi_d');
    const campos = camposVazios(gerar(t, e)).map(a => a.campo);
    expect(campos).toContain('lobo_e');
    expect(campos).not.toContain('lobo_d');
  });

  it('warns about more than 4 nodules and about the volume outside the reference', () => {
    const item: ItemLista = {
      d1: '0,8', d2: '0,6', d3: '0,5', local: 'ld_sup', composicao: 'solido', eco: 'iso_hiper',
      forma: 'mais_largo', margem: 'lisa', foco: 'nenhum', modo: 'nc',
    };
    let e = com(medidasNormais(), 'nod_status', 'presentes');
    e = com(e, 'nodulos', { multiplos: false, maior: '', itens: [item, item, item, item, item] });
    e = aplicar(e, { tipo: 'cabecalho', campo: 'sexo', valor: 'F' });
    const ids = gerar(t, e).alertas.filter(a => a.tipo === 'referencia').map(a => a.campo);
    expect(ids).toContain('aviso_mais_de_4_nodulos');
    expect(ids).toContain('aviso_volume_fora_da_faixa');
  });
});
