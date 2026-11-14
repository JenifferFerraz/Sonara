// Gera libs/templates/src/mamas.json. Rode: npm run templates
// RASCUNHO CLÍNICO: frases e regra de BI-RADS dependem de revisão e assinatura do médico revisor.
import { and, e, op, opcional, salvar, v } from './lib.mjs';

const num = (id, rotulo, extra = {}) => ({ id, tipo: 'num', rotulo, unidade: 'cm', obrigatorio: true, ...extra });

const lado = () => ({
  id: 'lado', tipo: 'select', rotulo: 'Mama', padrao: 'direita',
  opcoes: [op('direita', 'Direita', 'direita'), op('esquerda', 'Esquerda', 'esquerda')],
});
const hora = () => ({
  id: 'hora', tipo: 'select', rotulo: 'Hora', padrao: '12',
  opcoes: Array.from({ length: 12 }, (_, i) => {
    const n = i + 1;
    return op(String(n), `${n} h`, n === 1 ? 'à 1 hora' : `às ${n} horas`);
  }),
});

const modoBirads = () => ({
  id: 'modo', tipo: 'select', rotulo: 'BI-RADS no laudo', padrao: 'nc',
  opcoes: [
    op('nc', 'Não citar', ''),
    op('auto', 'Citar o sugerido', undefined),
    ...['1', '2', '3', '4A', '4B', '4C', '5'].map((c) => op(c, `Citar ${c} (manual)`, `, BI-RADS ${c}`)),
  ],
});

const cistos = {
  id: 'cistos', tipo: 'list', rotulo: 'Cisto', obrigatorio: true, paragrafo: true,
  showIf: { or: [e('lesoes', 'cistos'), e('lesoes', 'ambos')] },
  birads: { modo: 'modo', categoria: 'tipo' },
  itens: [
    num('d1', 'Medida (cm)'),
    lado(),
    hora(),
    {
      id: 'tipo', tipo: 'select', rotulo: 'Conteúdo', padrao: 'simples',
      opcoes: [
        { ...op('simples', 'Anecogênico (simples)', 'anecogênico'), pontos: 2 },
        { ...op('complicado', 'Espesso (complicado)', 'espesso'), pontos: 3 },
      ],
    },
    modoBirads(),
  ],
  laudoItem: 'Imagem cística de conteúdo {tipo}, medindo {d1} cm, localizada {hora} da mama {lado}.',
  impressaoItem: 'Cisto mamário na mama {lado}, medindo {d1} cm{modo}.',
  laudoMultiplos: 'Múltiplos cistos simples, o maior com {cistos.maior} cm.',
  impressaoMultiplos: 'Cistos mamários simples.',
};

// Valores das opções iguais aos de libs/laudo-engine/src/birads.ts.
const nodulos = {
  id: 'nodulos', tipo: 'list', rotulo: 'Nódulo sólido', obrigatorio: true, paragrafo: true,
  showIf: { or: [e('lesoes', 'nodulos'), e('lesoes', 'ambos')] },
  birads: {
    modo: 'modo',
    nodulo: { forma: 'forma', orientacao: 'orientacao', margem: 'margem', posterior: 'posterior', calcificacoes: 'calcificacoes' },
  },
  itens: [
    num('d1', 'Medida 1 (cm)', { linha: 'Mede:' }),
    num('d2', 'Medida 2 (cm)', { linha: 'Mede:' }),
    num('d3', 'Medida 3 (cm)', { linha: 'Mede:' }),
    lado(),
    hora(),
    {
      id: 'forma', tipo: 'select', rotulo: 'Forma', padrao: 'oval',
      opcoes: [op('oval', 'Oval', 'oval'), op('redonda', 'Redonda', 'redondo'), op('irregular', 'Irregular', 'irregular')],
    },
    {
      id: 'orientacao', tipo: 'select', rotulo: 'Orientação', padrao: 'paralela',
      opcoes: [op('paralela', 'Paralela à pele', 'paralela à pele'), op('nao_paralela', 'Não paralela', 'não paralela à pele')],
    },
    {
      id: 'margem', tipo: 'select', rotulo: 'Margens', padrao: 'circunscrita',
      opcoes: [
        op('circunscrita', 'Circunscritas', 'circunscritas'),
        op('indistinta', 'Indistintas', 'indistintas'),
        op('angular', 'Angulares', 'angulares'),
        op('microlobulada', 'Microlobuladas', 'microlobuladas'),
        op('espiculada', 'Espiculadas', 'espiculadas'),
      ],
    },
    {
      id: 'eco', tipo: 'select', rotulo: 'Ecogenicidade', padrao: 'hipoecoico',
      opcoes: [
        op('hipoecoico', 'Hipoecogênico', 'hipoecogênico'),
        op('iso', 'Isoecogênico', 'isoecogênico'),
        op('hiper', 'Hiperecogênico', 'hiperecogênico'),
        op('heterogeneo', 'Heterogêneo', 'heterogêneo'),
      ],
    },
    {
      id: 'posterior', tipo: 'select', rotulo: 'Característica posterior', padrao: 'nenhum',
      opcoes: [
        op('nenhum', 'Sem alteração', 'sem repercussão acústica posterior'),
        op('reforco', 'Reforço acústico', 'com reforço acústico posterior'),
        op('sombra', 'Sombra acústica', 'com sombra acústica posterior'),
        op('combinado', 'Padrão combinado', 'com padrão posterior combinado'),
      ],
    },
    {
      id: 'calcificacoes', tipo: 'select', rotulo: 'Calcificações', padrao: 'ausentes',
      opcoes: [op('ausentes', 'Ausentes', ''), op('presentes', 'Presentes', ', com calcificações')],
    },
    modoBirads(),
  ],
  laudoItem: 'Nódulo sólido {forma}, {eco}, de margens {margem}, orientação {orientacao}, {posterior}{calcificacoes}, medindo {d1} x {d2} x {d3} cm, localizado {hora} da mama {lado}{modo}.',
  impressaoItem: 'Nódulo sólido na mama {lado}, {hora}, medindo {d1} x {d2} x {d3} cm{modo}.',
  laudoMultiplos: 'Múltiplos nódulos sólidos, o maior com {nodulos.maior} cm.',
  impressaoMultiplos: 'Nódulos sólidos mamários.',
};

const ectasias = [['anecoico', 'de conteúdo anecogênico'], ['espesso', 'de conteúdo espesso']].flatMap(([k, r]) => [
  op(`${k}_d`, `${k === 'anecoico' ? 'Anecogênica' : 'Espessa'}, à direita`, `Ectasia ductal ${r} à direita.`, 'Ectasia ductal à direita.'),
  op(`${k}_e`, `${k === 'anecoico' ? 'Anecogênica' : 'Espessa'}, à esquerda`, `Ectasia ductal ${r} à esquerda.`, 'Ectasia ductal à esquerda.'),
  op(`${k}_b`, `${k === 'anecoico' ? 'Anecogênica' : 'Espessa'}, bilateral`, `Ectasia ductal ${r}, bilateral.`, 'Ectasia ductal bilateral.'),
]);

const t = {
  id: 'mamas',
  versao: '0.1.0',
  exame: 'Mamas',
  subtipo: 'Mamas',
  titulo: 'ULTRASSONOGRAFIA DE MAMAS',
  mudancas: {
    url: 'https://sonara.example/mudancas/mamas/0.1.0', // TODO: link real do changelog aprovado
    resumo: 'Primeira versão da máscara (rascunho, sem revisão médica).',
  },
  referencias: { birads: 'ACR BI-RADS (US), sugestão por regra provisória, somente aviso' },
  secoes: [
    {
      id: 'motivo', titulo: 'Motivo do exame',
      campos: [
        ...opcional('motivo', 'Descrever motivo do exame', [
          {
            id: 'motivo_tipo', tipo: 'select', rotulo: 'Motivo', padrao: 'rotina',
            opcoes: [
              op('rotina', 'Rotina', 'rotina'),
              op('familiar', 'História familiar positiva', 'avaliação por história familiar positiva'),
              op('nodulo', 'Controle de nódulo', 'controle de nódulo'),
              op('cisto', 'Controle de cisto', 'controle de cisto'),
              op('mastalgia', 'Mastalgia', 'investigação de mastalgia'),
              op('mamografia', 'Complementação de mamografia', 'complementação de mamografia'),
              op('neoplasia', 'História pregressa de neoplasia', 'seguimento de história pregressa de neoplasia de mama'),
            ],
          },
        ], { laudo: 'Exame realizado para {motivo_tipo}.', paragrafo: true }),
      ],
    },
    {
      id: 'exame', titulo: 'Exame normal, composição e lesões',
      campos: [
        { id: 'mamas', tipo: 'check', rotulo: 'Mamas normais', padrao: true, paragrafo: true, laudo: 'Mamas de morfologia normal e contornos regulares.' },
        { id: 'pele', tipo: 'check', rotulo: 'Pele e tecido subcutâneo preservados', padrao: true, paragrafo: true, laudo: 'Pele e tecido adiposo subcutâneo de aspecto ecográfico preservado.' },
        {
          id: 'comp', tipo: 'seg', rotulo: 'Composição da mama', padrao: 'nc', paragrafo: true,
          opcoes: [
            op('nc', 'Não citar', ''),
            op('fibro', 'Homogênea, fibroglandular', 'A composição mamária apresenta ecotextura de fundo homogênea, fibroglandular.'),
            op('adiposa', 'Homogênea, adiposa', 'A composição mamária apresenta ecotextura de fundo homogênea, adiposa.'),
            op('heterogenea', 'Heterogênea', 'A composição mamária apresenta ecotextura de fundo heterogênea, entremeando áreas adiposas com áreas de tecido fibroglandular.'),
          ],
        },
        {
          id: 'lesoes', tipo: 'seg', rotulo: 'Imagens nodulares', padrao: 'ausentes', paragrafo: true,
          opcoes: [
            op('ausentes', 'Ausentes', 'Não se observam imagens nodulares sólidas ou císticas.'),
            op('cistos', 'Cistos', ''),
            op('nodulos', 'Nódulos sólidos', ''),
            op('ambos', 'Cistos e nódulos', ''),
          ],
        },
      ],
    },
    {
      id: 'implantes', titulo: 'Implantes',
      campos: [
        {
          id: 'implante', tipo: 'seg', rotulo: 'Implantes mamários', padrao: 'nenhum',
          opcoes: [
            op('nenhum', 'Sem implantes', ''),
            op('normal', 'Sem anormalidades', 'Implantes mamários sem alterações ecográficas.'),
            op('dobras', 'Dobras do elastômero', 'Implantes mamários com dobras do elastômero.'),
            op('intra', 'Rotura intracapsular', 'Implantes mamários com sinais de rotura intracapsular.', 'Sinais de rotura intracapsular de implante.'),
            op('extra', 'Rotura extracapsular', 'Implantes mamários com sinais de rotura extracapsular.', 'Sinais de rotura extracapsular de implante.'),
          ],
        },
      ],
    },
    {
      id: 'cirurgias', titulo: 'Cirurgias',
      campos: [
        {
          id: 'cirurgia', tipo: 'seg', rotulo: 'Cirurgia mamária', padrao: 'nenhuma',
          opcoes: [
            op('nenhuma', 'Nenhuma', ''),
            op('mastectomia_d', 'Mastectomia direita', 'Mama direita ausente (status pós-mastectomia).', 'Status pós-mastectomia direita.'),
            op('mastectomia_e', 'Mastectomia esquerda', 'Mama esquerda ausente (status pós-mastectomia).', 'Status pós-mastectomia esquerda.'),
            op('mastectomia_b', 'Mastectomia bilateral', 'Mamas ausentes (status pós-mastectomia bilateral).', 'Status pós-mastectomia bilateral.'),
            op('quadrantectomia', 'Quadrantectomia', 'Alterações cicatriciais compatíveis com status pós-quadrantectomia.', 'Status pós-quadrantectomia.'),
            op('mamoplastia', 'Mamoplastia', 'Alterações compatíveis com status pós-mamoplastia.', 'Status pós-mamoplastia.'),
          ],
        },
      ],
    },
    { id: 'cistos', titulo: 'Cistos', campos: [cistos] },
    { id: 'nodulos', titulo: 'Nódulos sólidos', campos: [nodulos] },
    {
      id: 'ductos', titulo: 'Ectasias ductais',
      campos: [
        {
          id: 'ectasias', tipo: 'seg', rotulo: 'Ectasias ductais', padrao: 'nc', paragrafo: true,
          opcoes: [op('nc', 'Não citar', ''), op('ausentes', 'Ausentes', 'Ausência de ectasias ductais.'), ...ectasias],
        },
      ],
    },
    {
      id: 'ginecomastia', titulo: 'Ginecomastia',
      campos: [
        {
          id: 'gineco', tipo: 'seg', rotulo: 'Ginecomastia (mama masculina)', padrao: 'nc', showIf: e('sexo', 'M'), paragrafo: true,
          opcoes: [
            op('nc', 'Não citar', ''),
            op('ausente', 'Ausente', 'Ausência de ginecomastia.'),
            op('bilateral', 'Bilateral', 'Ginecomastia bilateral.', 'Ginecomastia bilateral.'),
            op('direita', 'À direita', 'Ginecomastia à direita.', 'Ginecomastia à direita.'),
            op('esquerda', 'À esquerda', 'Ginecomastia à esquerda.', 'Ginecomastia à esquerda.'),
            op('pseudo', 'Pseudoginecomastia', 'Pseudoginecomastia (tecido adiposo retroareolar).', 'Pseudoginecomastia.'),
          ],
        },
      ],
    },
    {
      id: 'planos', titulo: 'Planos musculares',
      campos: [
        { id: 'planos', tipo: 'check', rotulo: 'Citar planos musculares normais', paragrafo: true, laudo: 'Planos musculares de aspecto ecográfico preservado.' },
      ],
    },
    {
      id: 'axilas', titulo: 'Axilas',
      campos: [
        {
          id: 'axilas', tipo: 'seg', rotulo: 'Axilas', padrao: 'ausencia', paragrafo: true,
          opcoes: [
            op('nc', 'Não citar', ''),
            op('ausencia', 'Sem linfonodomegalias', 'Ausência de linfonodomegalias axilares.'),
            op('normais', 'Linfonodos normais', 'Linfonodos axilares de aspecto ecográfico habitual.'),
            op('alterados', 'Linfonodomegalia', ''),
          ],
        },
        {
          id: 'linf_axilares', tipo: 'list', rotulo: 'Linfonodo axilar', obrigatorio: true, paragrafo: true,
          showIf: e('axilas', 'alterados'),
          itens: [
            num('d1', 'Maior eixo (cm)', { linha: 'Mede:' }),
            num('d2', 'Menor eixo (cm)', { linha: 'Mede:' }),
            lado(),
            {
              id: 'aspecto', tipo: 'select', rotulo: 'Aspecto', padrao: 'habitual',
              opcoes: [
                op('habitual', 'Ovalado, hilo preservado', 'de aspecto ovalado, com hilo gorduroso preservado'),
                op('espessado', 'Córtex espessado', 'com córtex espessado'),
                op('sem_hilo', 'Sem hilo', 'arredondado, com perda do hilo gorduroso'),
              ],
            },
          ],
          laudoItem: 'Linfonodo axilar {lado} {aspecto}, medindo {d1} x {d2} cm.',
          impressaoItem: 'Linfonodomegalia axilar {lado}.',
          laudoMultiplos: 'Múltiplos linfonodos axilares, o maior com {linf_axilares.maior} cm.',
          impressaoMultiplos: 'Linfonodomegalias axilares.',
        },
      ],
    },
    {
      id: 'final', titulo: 'Classificação BI-RADS',
      campos: [
        {
          id: 'birads_final', tipo: 'seg', rotulo: 'Categoria final', padrao: 'nc',
          categoriaFinal: { listas: ['cistos', 'nodulos'] },
          opcoes: [
            op('nc', 'Não citar', ''),
            op('auto', 'Maior categoria sugerida', undefined),
            ...[
              ['0', 'BI-RADS 0 (avaliação adicional)'], ['1', 'BI-RADS 1'], ['2', 'BI-RADS 2'], ['3', 'BI-RADS 3'],
              ['4A', 'BI-RADS 4A'], ['4B', 'BI-RADS 4B'], ['4C', 'BI-RADS 4C'], ['5', 'BI-RADS 5'], ['6', 'BI-RADS 6'],
            ].map(([k, r]) => op(`m${k}`, r, '', `Categoria BI-RADS ${k}.`)),
          ],
        },
      ],
    },
  ],
  avisos: [],
};

salvar(t);
