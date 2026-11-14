import { describe, expect, it } from 'vitest';
import { aplicar, criarEstado, formatar, gerar } from '../src';
import type { Template } from '../src';

const t: Template = {
  id: 'mini',
  versao: '1.0.0',
  titulo: 'TESTE',
  referencias: {},
  secoes: [
    {
      id: 's',
      titulo: 'S',
      campos: [
        {
          id: 'figado', tipo: 'seg', rotulo: 'Fígado', padrao: 'normal',
          opcoes: [
            {
              valor: 'normal', rotulo: 'Normal', laudo: 'Fígado de aspecto habitual.',
              variantes: [{ id: 'curta', texto: 'Fígado sem alterações.' }],
            },
          ],
        },
        {
          id: 'cisto', tipo: 'check', rotulo: 'Cisto', laudo: 'Cisto simples.',
          variantes: [{ id: 'v1', texto: 'Imagem cística simples.' }],
        },
      ],
    },
  ],
};

describe('phrase preferences', () => {
  it('uses the default phrase when the doctor has no preference', () => {
    const r = gerar(t, criarEstado(t));
    expect(formatar(r, 'texto')).toContain('Fígado de aspecto habitual.');
  });

  it('uses the variant chosen by the doctor for an option', () => {
    const r = gerar(t, criarEstado(t), { 'figado.normal': 'curta' });
    expect(formatar(r, 'texto')).toContain('Fígado sem alterações.');
    expect(formatar(r, 'texto')).not.toContain('habitual');
  });

  it('uses the variant chosen by the doctor for a check', () => {
    const e = aplicar(criarEstado(t), { tipo: 'campo', id: 'cisto', valor: true });
    const r = gerar(t, e, { cisto: 'v1' });
    expect(formatar(r, 'texto')).toContain('Imagem cística simples.');
  });

  it('ignores a preference that points to an unknown variant', () => {
    const r = gerar(t, criarEstado(t), { 'figado.normal': 'nao-existe' });
    expect(formatar(r, 'texto')).toContain('Fígado de aspecto habitual.');
  });
});
