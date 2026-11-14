// Gera libs/templates/src/mamas.json. Rode: npm run templates
// RASCUNHO CLÍNICO: frases e regra de BI-RADS dependem de revisão e assinatura do médico revisor.
import { e, op, opcional } from './lib.mjs';
import { salvar } from './lib.mjs';

const num = (id, rotulo, extra = {}) => ({ id, tipo: 'num', rotulo, unidade: 'cm', obrigatorio: true, ...extra });

// ---------- seletores ----------
// Em lista (sub-campo): o texto do laudo vem do 3º argumento de op().
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
// Fora de lista: o texto do laudo é o próprio rótulo da opção.
const ladoTopo = (id, rotulo = 'Mama') => ({
  id, tipo: 'select', rotulo, padrao: 'direita',
  opcoes: [op('direita', 'direita'), op('esquerda', 'esquerda')],
});
const horaTopo = (id) => ({
  id, tipo: 'select', rotulo: 'Hora', padrao: '12',
  opcoes: Array.from({ length: 12 }, (_, i) => op(String(i + 1), i === 0 ? 'à 1 hora' : `às ${i + 1} horas`)),
});

const comCistos = { or: [e('lesoes', 'cistos'), e('lesoes', 'ambos')] };
const comNodulos = { or: [e('lesoes', 'nodulos'), e('lesoes', 'ambos')] };

// ---------- cistos ----------
const cistos = {
  id: 'cistos', tipo: 'list', rotulo: 'Cisto', obrigatorio: true, paragrafo: true, semMultiplos: true,
  showIf: comCistos,
  birads: { categoria: 'tipo' },
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
  ],
  laudoItem: 'Imagem cística de conteúdo {tipo}, medindo {d1} cm, localizada {hora} da mama {lado}.',
  impressaoItem: 'Cisto mamário na mama {lado}, medindo {d1} cm.',
};

// ---------- nódulos sólidos ----------
// Valores das opções iguais aos de libs/laudo-engine/src/birads.ts.
const nodulos = {
  id: 'nodulos', tipo: 'list', rotulo: 'Nódulo sólido', obrigatorio: true, paragrafo: true, semMultiplos: true,
  showIf: comNodulos,
  birads: {
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
    {
      id: 'dist', tipo: 'select', rotulo: 'Citar distâncias', padrao: 'nao',
      opcoes: [
        op('nao', 'Não citar distâncias', ''),
        op('sim', 'Citar distâncias', ', situado a {mamilo} cm do mamilo e a {pele} cm da pele'),
      ],
    },
    { id: 'mamilo', tipo: 'num', rotulo: 'Do mamilo (cm)', unidade: 'cm', linha: 'Distância:' },
    { id: 'pele', tipo: 'num', rotulo: 'Da pele (cm)', unidade: 'cm', linha: 'Distância:' },
    {
      id: 'pseudo', tipo: 'select', rotulo: 'Possível pseudonódulo', padrao: 'nao',
      opcoes: [
        op('nao', 'Não', ''),
        op('ilhota', 'Ilhota de gordura', ', podendo corresponder a pseudonódulo (ilhota de gordura)'),
        op('cisto', 'Cisto de conteúdo espesso', ', podendo corresponder a pseudonódulo (cisto de conteúdo espesso)'),
      ],
    },
  ],
  laudoItem: 'Nódulo sólido {forma}, {eco}, de margens {margem}, orientação {orientacao}, {posterior}{calcificacoes}, medindo {d1} x {d2} x {d3} cm, localizado {hora} da mama {lado}{dist}{pseudo}.',
  impressaoItem: 'Nódulo sólido na mama {lado}, {hora}, medindo {d1} x {d2} x {d3} cm.',
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
            id: 'motivos', tipo: 'multi', rotulo: 'Motivos', paragrafo: true,
            laudoMulti: 'Exame realizado para {lista}.',
            opcoes: [
              op('rotina', 'Rotina', 'rotina'),
              op('familiar', 'História familiar positiva', 'avaliação de história familiar positiva'),
              op('nodulo', 'Controle de nódulo', 'controle de nódulo'),
              op('cisto', 'Controle de cisto', 'controle de cisto'),
              op('mastalgia', 'Mastalgia', 'investigação de mastalgia'),
              op('mamografia', 'Complementação de mamografia', 'complementação de mamografia'),
              op('neoplasia', 'História pregressa de neoplasia', 'seguimento de história pregressa de neoplasia de mama'),
            ],
          },
        ]),
      ],
    },
    {
      id: 'exame', titulo: 'Exame normal, composição e lesões',
      campos: [
        { id: 'mamas', tipo: 'check', rotulo: 'Mamas normais', padrao: true, paragrafo: true, laudo: 'Mamas com morfologia e contornos habituais.' },
        { id: 'pele', tipo: 'check', rotulo: 'Pele e tecido subcutâneo preservados', padrao: true, paragrafo: true, laudo: 'Pele e tela subcutânea sem alterações ecográficas.' },
        {
          id: 'comp', tipo: 'seg', rotulo: 'Composição da mama', padrao: 'nc', paragrafo: true,
          opcoes: [
            op('nc', 'Não citar', ''),
            op('fibro', 'Homogênea, fibroglandular', 'Tecido mamário de ecotextura homogênea, predominantemente fibroglandular.'),
            op('adiposa', 'Homogênea, adiposa', 'Tecido mamário de ecotextura homogênea, predominantemente adiposo.'),
            op('heterogenea', 'Heterogênea', 'Tecido mamário de ecotextura heterogênea, com áreas adiposas e fibroglandulares intercaladas.'),
          ],
        },
        {
          id: 'lesoes', tipo: 'seg', rotulo: 'Imagens nodulares', padrao: 'ausentes', paragrafo: true,
          opcoes: [
            op('ausentes', 'Ausentes', 'Não há nódulos sólidos nem cistos.'),
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
          id: 'implantes', tipo: 'multi', rotulo: 'Implantes mamários', paragrafo: true,
          laudoMulti: 'Implantes mamários {implante_lado}, {lista}.',
          opcoes: [
            op('normal', 'Sem anormalidades', 'sem alterações ecográficas'),
            op('dobras', 'Dobras do elastômero', 'com dobras do elastômero'),
            { ...op('intra', 'Rotura intracapsular', 'com sinais de rotura intracapsular'), impressao: 'Sinais de rotura intracapsular de implante.' },
            { ...op('extra', 'Rotura extracapsular', 'com sinais de rotura extracapsular'), impressao: 'Sinais de rotura extracapsular de implante.' },
            op('heterogeneo', 'Conteúdo heterogêneo', 'com conteúdo heterogêneo'),
          ],
        },
        {
          id: 'implante_lado', tipo: 'select', rotulo: 'Lado dos implantes', padrao: 'bilaterais',
          showIf: { '!!': [{ var: 'implantes' }] },
          opcoes: [op('bilaterais', 'bilaterais'), op('direita', 'à direita'), op('esquerda', 'à esquerda')],
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
            op('mastectomia', 'Mastectomia', 'Status pós-mastectomia {cir_lado}.', 'Status pós-mastectomia {cir_lado}.'),
            op('quadrantectomia', 'Quadrantectomia', 'Status pós-quadrantectomia {cir_lado}.', 'Status pós-quadrantectomia {cir_lado}.'),
            op('mamoplastia', 'Mamoplastia', 'Status pós-mamoplastia {cir_lado}.', 'Status pós-mamoplastia {cir_lado}.'),
          ],
        },
        {
          id: 'cir_lado', tipo: 'select', rotulo: 'Lado da cirurgia', padrao: 'direita',
          showIf: { '!=': [{ var: 'cirurgia' }, 'nenhuma'] },
          opcoes: [op('direita', 'à direita'), op('esquerda', 'à esquerda'), op('bilateral', 'bilateral')],
        },
        ...opcional('recon', 'Reconstrução mamária', [
          {
            id: 'recon_tipo', tipo: 'select', rotulo: 'Reconstrução com', padrao: 'retalho',
            opcoes: [op('retalho', 'retalho miocutâneo'), op('protese', 'prótese'), op('expansor', 'expansor tecidual')],
          },
        ], { laudo: 'Reconstrução mamária com {recon_tipo}.', showIf: e('cirurgia', 'mastectomia') }),
      ],
    },
    {
      id: 'cistos', titulo: 'Cistos',
      campos: [
        cistos,
        ...opcional('micro', 'Agrupamento de microcistos', [
          num('micro_cm', 'Medida (cm)'),
          ladoTopo('micro_lado'),
          horaTopo('micro_hora'),
        ], {
          showIf: comCistos, paragrafo: true,
          laudo: 'Agrupamento de microcistos com {micro_cm} cm, localizado {micro_hora} da mama {micro_lado}.',
          impressao: 'Microcistos agrupados na mama {micro_lado}.',
        }),
        ...opcional('cmult', 'Múltiplos cistos simples', [
          num('cmult_max', 'Maior (cm)'),
          {
            id: 'cmult_lado', tipo: 'select', rotulo: 'Distribuição', padrao: 'bilat',
            opcoes: [op('bilat', 'nas duas mamas'), op('dir', 'na mama direita'), op('esq', 'na mama esquerda')],
          },
        ], {
          showIf: comCistos, paragrafo: true,
          laudo: 'Múltiplos cistos simples {cmult_lado}, o maior com {cmult_max} cm.',
          impressao: 'Cistos mamários simples.',
        }),
      ],
    },
    {
      id: 'nodulos', titulo: 'Nódulos sólidos',
      campos: [
        nodulos,
        ...opcional('nmult', 'Múltiplos nódulos sólidos', [
          num('nmult_d', 'Maior na mama direita (cm)'),
          num('nmult_e', 'Maior na mama esquerda (cm)'),
          {
            id: 'nmult_eco', tipo: 'select', rotulo: 'Ecogenicidade', padrao: 'hipo',
            opcoes: [op('hipo', 'hipoecogênicos'), op('iso', 'isoecogênicos'), op('hiper', 'hiperecogênicos')],
          },
          {
            id: 'nmult_margem', tipo: 'select', rotulo: 'Margens', padrao: 'circ',
            opcoes: [op('circ', 'circunscritas'), op('indist', 'indistintas')],
          },
        ], {
          showIf: comNodulos, paragrafo: true,
          laudo: 'Múltiplos nódulos sólidos {nmult_eco}, de margens {nmult_margem}, medindo até {nmult_d} cm à direita e {nmult_e} cm à esquerda.',
          impressao: 'Nódulos sólidos mamários múltiplos.',
        }),
      ],
    },
    {
      id: 'ductos', titulo: 'Ectasias ductais',
      campos: [
        {
          id: 'ectasias', tipo: 'seg', rotulo: 'Ectasias ductais', padrao: 'nc', paragrafo: true,
          opcoes: [op('nc', 'Não citar', ''), op('ausentes', 'Ausentes', 'Não há ectasias ductais.'), ...ectasias],
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
            op('ausente', 'Ausente', 'Não há ginecomastia.'),
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
        { id: 'planos', tipo: 'check', rotulo: 'Citar planos musculares normais', paragrafo: true, laudo: 'Planos musculares sem alterações.' },
      ],
    },
    {
      id: 'axilas', titulo: 'Axilas',
      campos: [
        {
          id: 'axilas', tipo: 'seg', rotulo: 'Axilas', padrao: 'ausencia', paragrafo: true,
          opcoes: [
            op('nc', 'Não citar', ''),
            op('ausencia', 'Sem linfonodomegalias', 'Não há linfonodomegalia axilar.'),
            op('normais', 'Linfonodos normais', 'Linfonodos axilares com aspecto ecográfico habitual.'),
            op('isolada', 'Linfonodomegalia isolada', ''),
            op(
              'bilaterais', 'Linfonodomegalias bilaterais',
              'Linfonodomegalias axilares bilaterais, a maior {axb_lado}, {axb_aspecto}, medindo {axb.a} x {axb.b} x {axb.c} cm.',
              'Linfonodomegalias axilares bilaterais.',
            ),
          ],
        },
        {
          id: 'linf_axilares', tipo: 'list', rotulo: 'Linfonodo axilar', obrigatorio: true, paragrafo: true, semMultiplos: true,
          showIf: e('axilas', 'isolada'),
          itens: [
            num('d1', 'Medida 1 (cm)', { linha: 'Mede:' }),
            num('d2', 'Medida 2 (cm)', { linha: 'Mede:' }),
            num('d3', 'Medida 3 (cm)', { linha: 'Mede:' }),
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
          laudoItem: 'Linfonodo axilar à {lado}, {aspecto}, medindo {d1} x {d2} x {d3} cm.',
          impressaoItem: 'Linfonodomegalia axilar à {lado}.',
        },
        {
          id: 'axb', tipo: 'dims', rotulo: 'Maior linfonodo (cm)', obrigatorio: true, showIf: e('axilas', 'bilaterais'),
        },
        {
          id: 'axb_lado', tipo: 'select', rotulo: 'Maior situado', padrao: 'direita', showIf: e('axilas', 'bilaterais'),
          opcoes: [op('direita', 'à direita'), op('esquerda', 'à esquerda')],
        },
        {
          id: 'axb_aspecto', tipo: 'select', rotulo: 'Aspecto', padrao: 'habitual', showIf: e('axilas', 'bilaterais'),
          opcoes: [
            op('habitual', 'de aspecto ovalado, com hilo gorduroso preservado'),
            op('espessado', 'com córtex espessado'),
            op('sem_hilo', 'arredondado, com perda do hilo gorduroso'),
          ],
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
            ].map(([k, r]) => ({ ...op(`m${k}`, r, ''), classificacao: `BI-RADS ${k}` })),
          ],
        },
      ],
    },
  ],
  avisos: [],
};

salvar(t);
