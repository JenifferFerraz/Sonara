import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { generateKeyPairSync, sign } from 'node:crypto';
import {
  aplicar, calcularTirads, camposVazios, criarEstado, formatar, gerar, verificarLicenca, volume,
} from '../src';
import type { Template } from '../src';
import { bytesParaB64url } from '../src/seguranca';

const tv = JSON.parse(
  readFileSync(new URL('../../templates/src/transvaginal.json', import.meta.url), 'utf8'),
) as Template;

const medidas = (estado = criarEstado(tv)) => {
  let e = estado;
  e = aplicar(e, { tipo: 'campo', id: 'utero', valor: { a: '7,0', b: '4,0', c: '3,5' } });
  e = aplicar(e, { tipo: 'campo', id: 'ovd', valor: { a: '3,0', b: '2,0', c: '1,5' } });
  e = aplicar(e, { tipo: 'campo', id: 'ove', valor: { a: '2,8', b: '1,9', c: '1,5' } });
  e = aplicar(e, { tipo: 'campo', id: 'endo_mm', valor: '6' });
  return e;
};

describe('volume', () => {
  it('computes the ellipsoid volume with factor 0.523', () => {
    expect(volume(7, 4, 3.5, 0.523)).toBeCloseTo(51.254, 3);
  });
  it('returns null when a dimension is missing', () => {
    expect(volume(7, null, 3.5)).toBeNull();
  });
});

describe('transvaginal', () => {
  it('starts with required measures empty and raises alerts', () => {
    const r = gerar(tv, criarEstado(tv));
    expect(camposVazios(r).map(a => a.campo).sort()).toEqual(['endo_mm', 'ovd', 'ove', 'utero']);
    expect(r.paragrafos.join(' ')).toContain('___');
  });

  it('generates a normal exam with no alerts after required measures', () => {
    const r = gerar(tv, medidas());
    expect(camposVazios(r)).toHaveLength(0);
    expect(r.impressao).toEqual(['Exame sem alterações ecográficas relevantes.']);
    expect(r.paragrafos.join(' ')).toContain('7,0 x 4,0 x 3,5 cm');
    expect(r.paragrafos.join(' ')).toContain('51,3 cm³');
  });

  it('skips the endometrium alert when the doctor chooses not to cite it', () => {
    let e = aplicar(criarEstado(tv), { tipo: 'campo', id: 'endo_mm__nc', valor: true });
    e = medidas(e);
    e = aplicar(e, { tipo: 'campo', id: 'endo_mm', valor: '' });
    const r = gerar(tv, e);
    expect(camposVazios(r)).toHaveLength(0);
    expect(r.paragrafos.join(' ')).not.toContain('Espessura endometrial');
  });

  it('lists findings and the closing sentence when something is altered', () => {
    let e = medidas();
    e = aplicar(e, { tipo: 'campo', id: 'miomas', valor: {
      multiplos: false, maior: '',
      itens: [{ medida: '2,1', tipo: 'subseroso', local: 'fundica' }],
    } });
    e = aplicar(e, { tipo: 'campo', id: 'liquido', valor: 'pequena' });
    const r = gerar(tv, e);
    expect(r.impressao).toEqual([
      'Mioma uterino subseroso, medindo 2,1 cm.',
      'Líquido livre na pelve.',
      'Demais estruturas avaliadas sem alterações.',
    ]);
  });

  it('flags an ovarian cyst without measure', () => {
    const e = aplicar(medidas(), { tipo: 'campo', id: 'ovd_cistos', valor: {
      multiplos: false, maior: '', itens: [{ medida: '', tipo: 'simples', orads: '2' }],
    } });
    const r = gerar(tv, e);
    expect(camposVazios(r)[0].campo).toBe('ovd_cistos[0].medida');
    expect(r.impressao[0]).toContain('___');
    expect(r.impressao[0]).toContain('O-RADS 2');
  });

  it('warns (without concluding) for endometrium above 4 mm in postmenopause', () => {
    const r = gerar(tv, aplicar(medidas(), { tipo: 'campo', id: 'status', valor: 'pos' }));
    expect(r.alertas.some(a => a.tipo === 'referencia')).toBe(true);
    expect(r.impressao).toEqual(['Exame sem alterações ecográficas relevantes.']);
  });

  it('hides uterine fields after total hysterectomy', () => {
    const e = aplicar(criarEstado(tv), { tipo: 'campo', id: 'cirurgia', valor: 'total' });
    const r = gerar(tv, e);
    expect(camposVazios(r).map(a => a.campo)).not.toContain('utero');
    expect(r.impressao).toContain('Status pós-histerectomia total.');
  });

  it('formats plain text and html', () => {
    const r = gerar(tv, criarEstado(tv));
    expect(formatar(r, 'texto')).toContain('IMPRESSÃO DIAGNÓSTICA:');
    expect(formatar(r, 'html')).toContain('<mark>___</mark>');
    expect(formatar(r, 'html')).toContain('text-align:center');
  });
});

describe('ACR TI-RADS', () => {
  const base = { composicao: 'solido', ecogenicidade: 'hipoecoico', forma: 'mais_largo',
    margem: 'lisa', focos: ['nenhum'], maiorCm: 1.6 } as const;

  it('scores a solid hypoechoic nodule as TR4 and suggests FNA from 1.5 cm', () => {
    const r = calcularTirads({ ...base, focos: [...base.focos] });
    expect(r.pontos).toBe(4);
    expect(r.nivel).toBe('TR4');
    expect(r.conduta).toBe('paaf');
  });

  it('sums every echogenic focus', () => {
    const r = calcularTirads({ ...base, focos: ['macro', 'puntiforme'] });
    expect(r.pontos).toBe(2 + 2 + 1 + 3);
    expect(r.nivel).toBe('TR5');
  });

  it('forces TR1 for cystic composition', () => {
    const r = calcularTirads({ ...base, composicao: 'cistico', focos: ['puntiforme'] });
    expect(r.nivel).toBe('TR1');
    expect(r.conduta).toBe('nenhuma');
  });

  it('suggests follow-up below the FNA threshold', () => {
    const r = calcularTirads({ ...base, focos: [...base.focos], maiorCm: 1.2 });
    expect(r.conduta).toBe('seguimento');
  });
});

describe('license', () => {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const pub = String(publicKey.export({ format: 'jwk' }).x);
  const emitir = (payload: object) => {
    const corpo = Buffer.from(JSON.stringify(payload));
    return `${corpo.toString('base64url')}.${sign(null, corpo, privateKey).toString('base64url')}`;
  };
  const DIA = 86_400_000;
  const agora = Date.UTC(2026, 10, 12);
  const payload = (validoAte: number) => ({
    medicoId: 'm', nome: 'Dra. Teste', crm: '1/SP', modulos: ['transvaginal'],
    dispositivoId: 'd1', emitidoEm: agora - 30 * DIA, validoAte,
  });

  it('accepts a valid token', async () => {
    const r = await verificarLicenca(emitir(payload(agora + 5 * DIA)), pub, 'd1', agora, agora - 1000);
    expect(r.status).toBe('ok');
  });
  it('enters the 7-day grace period after expiry', async () => {
    const r = await verificarLicenca(emitir(payload(agora - 3 * DIA)), pub, 'd1', agora, agora - 1000);
    expect(r.status).toBe('carencia');
  });
  it('blocks after the grace period', async () => {
    const r = await verificarLicenca(emitir(payload(agora - 8 * DIA)), pub, 'd1', agora, agora - 1000);
    expect(r.status).toBe('expirada');
  });
  it('rejects another device and a rolled-back clock', async () => {
    const t = emitir(payload(agora + DIA));
    expect((await verificarLicenca(t, pub, 'outro', agora, 0)).status).toBe('outro-dispositivo');
    expect((await verificarLicenca(t, pub, 'd1', agora, agora + DIA)).status).toBe('relogio');
  });
  it('rejects a tampered token', async () => {
    const [corpo, sig] = emitir(payload(agora + DIA)).split('.');
    const adulterado = bytesParaB64url(new TextEncoder().encode(
      Buffer.from(corpo, 'base64url').toString().replace('transvaginal', 'tudo')));
    expect((await verificarLicenca(`${adulterado}.${sig}`, pub, 'd1', agora, 0)).status).toBe('invalida');
  });
});

describe('formatar', () => {
  it('puts a blank line after the diagnostic impression title in plain text', () => {
    const txt = formatar(gerar(tv, criarEstado(tv)), 'texto');
    expect(txt).toContain('IMPRESSÃO DIAGNÓSTICA:\n\n');
  });

  it('writes the HTML in Times New Roman 12pt so Word keeps the font', () => {
    const html = formatar(gerar(tv, criarEstado(tv)), 'html');
    expect(html).toContain("font-family:'Times New Roman'");
    expect(html).toContain('font-size:12pt');
    expect(html).not.toMatch(/<p>/); // todo parágrafo leva o estilo
  });
});

