import { describe, expect, it } from 'vitest';
import { aplicar, chaveFrase, criarEstado, formatar, frasesEditaveis, gerar, PREFIXO_TEXTO, validarFrase } from '../src';
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
    const r = gerar(t, criarEstado(t), { 'mini/figado.normal': 'curta' });
    expect(formatar(r, 'texto')).toContain('Fígado sem alterações.');
    expect(formatar(r, 'texto')).not.toContain('habitual');
  });

  it('uses the variant chosen by the doctor for a check', () => {
    const e = aplicar(criarEstado(t), { tipo: 'campo', id: 'cisto', valor: true });
    const r = gerar(t, e, { 'mini/cisto': 'v1' });
    expect(formatar(r, 'texto')).toContain('Imagem cística simples.');
  });

  it('ignores a preference that points to an unknown variant', () => {
    const r = gerar(t, criarEstado(t), { 'mini/figado.normal': 'nao-existe' });
    expect(formatar(r, 'texto')).toContain('Fígado de aspecto habitual.');
  });
  it('scopes the preference by mask: the same key in another mask is untouched', () => {
    const r = gerar(t, criarEstado(t), { 'outra/figado.normal': 'curta' });
    expect(formatar(r, 'texto')).toContain('Fígado de aspecto habitual.');
  });
});

describe('free text phrases', () => {
  const medida: Template = {
    id: 'med',
    versao: '1.0.0',
    titulo: 'TESTE',
    referencias: {},
    secoes: [
      {
        id: 's',
        titulo: 'Medidas',
        campos: [
          {
            id: 'lobo', tipo: 'dims', rotulo: 'Lobo', obrigatorio: true,
            laudo: 'Lobo com {lobo.a} x {lobo.b} x {lobo.c} cm.',
          },
          { id: 'obs', tipo: 'text', rotulo: 'Observação', laudo: 'Observação: {valor}.' },
        ],
      },
    ],
  };
  const comMedidas = () => aplicar(criarEstado(medida), { tipo: 'campo', id: 'lobo', valor: { a: '4,0', b: '1,2', c: '1,1' } });
  const chave = chaveFrase('med', 'lobo');

  it('uses the doctor text when it keeps the same fields', () => {
    const prefs = { [chave]: `${PREFIXO_TEXTO}O lobo mede {lobo.a} x {lobo.b} x {lobo.c} cm.` };
    expect(formatar(gerar(medida, comMedidas(), prefs), 'texto')).toContain('O lobo mede 4,0 x 1,2 x 1,1 cm.');
  });

  it('falls back to the default when the text loses a measurement', () => {
    const prefs = { [chave]: `${PREFIXO_TEXTO}O lobo mede {lobo.a} x {lobo.b} cm.` };
    expect(formatar(gerar(medida, comMedidas(), prefs), 'texto')).toContain('Lobo com 4,0 x 1,2 x 1,1 cm.');
  });

  it('falls back to the default when the text cites a field that does not exist', () => {
    const prefs = { [chave]: `${PREFIXO_TEXTO}Lobo {lobo.a} x {lobo.b} x {lobo.c} cm, {inexistente}.` };
    expect(formatar(gerar(medida, comMedidas(), prefs), 'texto')).toContain('Lobo com 4,0 x 1,2 x 1,1 cm.');
  });

  it('explains what is missing or unknown in a doctor text', () => {
    const padrao = 'Lobo com {lobo.a} x {lobo.b} cm.';
    expect(validarFrase(padrao, 'Lobo {lobo.a} cm.').faltando).toEqual(['lobo.b']);
    expect(validarFrase(padrao, 'Lobo {lobo.a} x {lobo.b} {x}').desconhecidos).toEqual(['x']);
    expect(validarFrase(padrao, '   ').ok).toBe(false);
    expect(validarFrase(padrao, 'Lobo medindo {lobo.b} por {lobo.a} cm.').ok).toBe(true);
  });

  it('lists the phrases a doctor can rewrite', () => {
    const lista = frasesEditaveis(medida);
    expect(lista.map(f => f.chave)).toEqual(['lobo', 'obs']);
    expect(lista[0].padrao).toBe('Lobo com {lobo.a} x {lobo.b} x {lobo.c} cm.');
  });
});
