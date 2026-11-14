// Gera libs/templates/src/tireoide.json. Rode: npm run templates
// RASCUNHO CLÍNICO: toda frase e valor de referência dependem de revisão e assinatura do médico revisor.
import { and, e, op, opcional, salvar, v } from './lib.mjs';

const semCirurgia = e('cirurgia', 'nenhuma');
const num = (id, rotulo, extra = {}) => ({ id, tipo: 'num', rotulo, unidade: 'cm', obrigatorio: true, ...extra });

// Lobo presente = não operado. Hemitireoidectomia direita remove o lobo direito, e assim por diante.
const loboDireito = { and: [{ '!=': [v('cirurgia'), 'total'] }, { '!=': [v('cirurgia'), 'hemi_d'] }] };
const loboEsquerdo = { and: [{ '!=': [v('cirurgia'), 'total'] }, { '!=': [v('cirurgia'), 'hemi_e'] }] };

// Valores das opções iguais aos de libs/laudo-engine/src/tirads.ts.
const nodulo = {
  id: 'nodulos', tipo: 'list', rotulo: 'Nódulo', obrigatorio: true, paragrafo: true,
  showIf: e('nod_status', 'presentes'),
  tirads: {
    composicao: 'composicao', ecogenicidade: 'eco', forma: 'forma', margem: 'margem',
    foco: 'foco', medidas: ['d1', 'd2', 'd3'], modo: 'modo',
  },
  itens: [
    num('d1', 'Medida 1 (cm)', { linha: 'Mede:' }),
    num('d2', 'Medida 2 (cm)', { linha: 'Mede:' }),
    num('d3', 'Medida 3 (cm)', { linha: 'Mede:' }),
    {
      id: 'local', tipo: 'select', rotulo: 'Localização', padrao: 'ld_medio',
      opcoes: [
        op('ld_sup', 'Lobo direito, terço superior', 'terço superior do lobo direito'),
        op('ld_medio', 'Lobo direito, terço médio', 'terço médio do lobo direito'),
        op('ld_inf', 'Lobo direito, terço inferior', 'terço inferior do lobo direito'),
        op('le_sup', 'Lobo esquerdo, terço superior', 'terço superior do lobo esquerdo'),
        op('le_medio', 'Lobo esquerdo, terço médio', 'terço médio do lobo esquerdo'),
        op('le_inf', 'Lobo esquerdo, terço inferior', 'terço inferior do lobo esquerdo'),
        op('istmo', 'Istmo', 'istmo'),
      ],
    },
    {
      id: 'composicao', tipo: 'select', rotulo: 'Composição', padrao: 'solido',
      opcoes: [
        op('solido', 'Sólido', 'sólido'),
        op('misto', 'Misto (sólido-cístico)', 'sólido-cístico'),
        op('cistico', 'Cístico', 'cístico'),
        op('espongiforme', 'Espongiforme', 'espongiforme'),
      ],
    },
    {
      id: 'eco', tipo: 'select', rotulo: 'Ecogenicidade', padrao: 'hipoecoico',
      opcoes: [
        op('anecoico', 'Anecogênico', 'anecogênico'),
        op('iso_hiper', 'Iso ou hiperecogênico', 'iso ou hiperecogênico'),
        op('hipoecoico', 'Hipoecogênico', 'hipoecogênico'),
        op('muito_hipoecoico', 'Acentuadamente hipoecogênico', 'acentuadamente hipoecogênico'),
      ],
    },
    {
      id: 'forma', tipo: 'select', rotulo: 'Forma', padrao: 'mais_largo',
      opcoes: [
        op('mais_largo', 'Mais largo que alto', 'mais largo do que alto'),
        op('mais_alto', 'Mais alto que largo', 'mais alto do que largo'),
      ],
    },
    {
      id: 'margem', tipo: 'select', rotulo: 'Margens', padrao: 'lisa',
      opcoes: [
        op('lisa', 'Lisas', 'contornos regulares'),
        op('mal_definida', 'Mal definidas', 'margens mal definidas'),
        op('lobulada_irregular', 'Lobuladas ou irregulares', 'contornos lobulados ou irregulares'),
        op('extensao', 'Com extensão extratireoidiana', 'margens com extensão extratireoidiana'),
      ],
    },
    {
      id: 'foco', tipo: 'select', rotulo: 'Focos ecogênicos', padrao: 'nenhum',
      opcoes: [
        op('nenhum', 'Nenhum', ''),
        op('cauda_cometa', 'Artefato em cauda de cometa', ', com artefato em cauda de cometa'),
        op('macro', 'Macrocalcificações', ', com macrocalcificações'),
        op('periferica', 'Calcificações periféricas', ', com calcificações periféricas'),
        op('puntiforme', 'Focos ecogênicos puntiformes', ', com focos ecogênicos puntiformes'),
      ],
    },
    {
      id: 'modo', tipo: 'select', rotulo: 'TI-RADS no laudo', padrao: 'nc',
      opcoes: [
        op('nc', 'Não citar', ''),
        op('auto', 'Citar o calculado', undefined),
        ...[1, 2, 3, 4, 5].map((n) => op(`TR${n}`, `Citar TR${n} (manual)`, `, ACR TI-RADS ${n}`)),
      ],
    },
  ],
  laudoItem: 'Nódulo {composicao}, {eco}, {forma}, com {margem}{foco}, situado no {local}, medindo {d1} x {d2} x {d3} cm{modo}.',
  impressaoItem: 'Nódulo tireoidiano no {local}, medindo {d1} x {d2} x {d3} cm{modo}.',
  laudoMultiplos: 'Múltiplos nódulos tireoidianos, o maior com {nodulos.maior} cm.',
  impressaoMultiplos: 'Nódulos tireoidianos.',
};

const t = {
  id: 'tireoide',
  versao: '0.1.0',
  exame: 'Tireoide / Cervical',
  subtipo: 'Tireoide',
  titulo: 'ULTRASSONOGRAFIA DA TIREOIDE',
  mudancas: {
    url: 'https://sonara.example/mudancas/tireoide/0.1.0', // TODO: link real do changelog aprovado
    resumo: 'Primeira versão da máscara (rascunho, sem revisão médica).',
  },
  referencias: { tirads: 'ACR TI-RADS (2017), somente cálculo e aviso' },
  secoes: [
    {
      id: 'cirurgias', titulo: 'Cirurgias',
      campos: [
        {
          id: 'cirurgia', tipo: 'seg', rotulo: 'Cirurgia da tireoide', padrao: 'nenhuma',
          opcoes: [
            op('nenhuma', 'Nenhuma', ''),
            op('total', 'Tireoidectomia total', 'Tireoide não visualizada (status pós-tireoidectomia total).', 'Status pós-tireoidectomia total.'),
            op('hemi_d', 'Hemitireoidectomia direita', 'Lobo direito não visualizado (status pós-hemitireoidectomia direita).', 'Status pós-hemitireoidectomia direita.'),
            op('hemi_e', 'Hemitireoidectomia esquerda', 'Lobo esquerdo não visualizado (status pós-hemitireoidectomia esquerda).', 'Status pós-hemitireoidectomia esquerda.'),
          ],
        },
      ],
    },
    {
      id: 'glandula', titulo: 'Glândula',
      campos: [
        {
          id: 'tam', tipo: 'seg', rotulo: 'Dimensões', padrao: 'normais', showIf: semCirurgia,
          opcoes: [
            op('normais', 'Normais', 'Tireoide tópica, com dimensões normais e contornos regulares.'),
            op('aumentadas', 'Aumentadas', 'Tireoide tópica, com dimensões aumentadas e contornos regulares.', 'Aumento volumétrico da tireoide.'),
            op('reduzidas', 'Reduzidas', 'Tireoide tópica, com dimensões reduzidas e contornos regulares.', 'Redução volumétrica da tireoide.'),
          ],
        },
        {
          id: 'eco', tipo: 'seg', rotulo: 'Ecotextura', padrao: 'normal',
          showIf: { '!=': [v('cirurgia'), 'total'] },
          opcoes: [
            op('normal', 'Homogênea', 'A ecotextura é homogênea.'),
            op('difusa', 'Alteração difusa inespecífica', 'Ecotextura heterogênea, com alteração textural difusa inespecífica.', 'Alteração textural difusa da tireoide.'),
            op('tireoidite', 'Padrão de tireoidite', 'Ecotextura heterogênea difusa, com aspecto que pode corresponder a tireoidite.', 'Alteração textural difusa, a correlacionar com tireoidite.'),
          ],
        },
        {
          id: 'nod_status', tipo: 'seg', rotulo: 'Nódulos', padrao: 'ausentes', showIf: { '!=': [v('cirurgia'), 'total'] },
          opcoes: [
            op('ausentes', 'Ausentes', 'Não se observam lesões nodulares.'),
            op('presentes', 'Presentes', ''),
          ],
        },
        ...opcional('doppler', 'Descrever Doppler do parênquima', [
          {
            id: 'doppler_tipo', tipo: 'select', rotulo: 'Doppler', padrao: 'normal',
            opcoes: [
              op('normal', 'normal', 'fluxo vascular habitual'),
              op('hiper', 'hiperfluxo difuso', 'hiperfluxo difuso'),
              op('hipo', 'hipofluxo difuso', 'hipofluxo difuso'),
            ],
          },
        ], { laudo: 'Ao estudo Doppler, o parênquima apresenta {doppler_tipo}.', showIf: { '!=': [v('cirurgia'), 'total'] } }),
      ],
    },
    {
      id: 'medidas', titulo: 'Medidas',
      campos: [
        { id: 'lobo_d', tipo: 'dims', rotulo: 'Lobo direito (L × AP × T, cm)', obrigatorio: true, showIf: loboDireito, paragrafo: true, laudo: 'O lobo direito mede {lobo_d.a} x {lobo_d.b} x {lobo_d.c} cm.' },
        { id: 'lobo_e', tipo: 'dims', rotulo: 'Lobo esquerdo (L × AP × T, cm)', obrigatorio: true, showIf: loboEsquerdo, paragrafo: true, laudo: 'O lobo esquerdo mede {lobo_e.a} x {lobo_e.b} x {lobo_e.c} cm.' },
        num('istmo', 'Istmo (espessura, cm)', { showIf: and(semCirurgia, { '!': [v('istmo_fil')] }), paragrafo: true, laudo: 'O istmo tem espessura de {istmo} cm.' }),
        { id: 'istmo_fil', tipo: 'check', rotulo: 'Istmo filiforme (não mensurável)', showIf: semCirurgia, paragrafo: true, laudo: 'O istmo é filiforme, não mensurável.' },
        {
          id: 'vol_total', tipo: 'calc', rotulo: 'Volume tireoidiano', casas: 1, showIf: semCirurgia, paragrafo: true,
          expressao: { '+': [{ var: 'lobo_d.vol' }, { var: 'lobo_e.vol' }] },
          laudo: 'Volume tireoidiano estimado em {vol_total} cm³.',
        },
      ],
    },
    {
      id: 'nodulos', titulo: 'Nódulos',
      campos: [
        nodulo,
      ],
    },
    {
      id: 'coloides', titulo: 'Cistos coloides',
      campos: [
        ...opcional('coloide', 'Cistos coloides', [
          num('coloide_max', 'Maior (cm)'),
        ], { laudo: 'Cistos coloides esparsos, o maior com {coloide_max} cm.', showIf: { '!=': [v('cirurgia'), 'total'] } }),
      ],
    },
    {
      id: 'linfonodos', titulo: 'Linfonodos cervicais',
      campos: [
        {
          id: 'linf_status', tipo: 'seg', rotulo: 'Linfonodos', padrao: 'ausentes',
          opcoes: [
            op('ausentes', 'Sem linfonodomegalias', 'Ausência de linfonodomegalias cervicais.'),
            op('presentes', 'Linfonodomegalia', ''),
          ],
        },
        {
          id: 'linfonodos', tipo: 'list', rotulo: 'Linfonodo', obrigatorio: true, paragrafo: true, showIf: e('linf_status', 'presentes'),
          itens: [
            num('d1', 'Maior eixo (cm)', { linha: 'Mede:' }),
            num('d2', 'Menor eixo (cm)', { linha: 'Mede:' }),
            {
              id: 'nivel', tipo: 'select', rotulo: 'Nível', padrao: 'II',
              opcoes: ['IA', 'IB', 'II', 'III', 'IV', 'V', 'VI'].map((n) => op(n, `Nível ${n}`, n)),
            },
            {
              id: 'lado', tipo: 'select', rotulo: 'Lado', padrao: 'direito',
              opcoes: [op('direito', 'Direito', 'à direita'), op('esquerdo', 'Esquerdo', 'à esquerda')],
            },
            {
              id: 'aspecto', tipo: 'select', rotulo: 'Aspecto', padrao: 'habitual',
              opcoes: [
                op('habitual', 'Ovalado, hilo preservado', 'de aspecto ovalado, com hilo gorduroso preservado'),
                op('alterado', 'Arredondado, sem hilo', 'arredondado, com perda do hilo gorduroso'),
                op('hipoecoico', 'Hipoecogênico', 'hipoecogênico'),
              ],
            },
          ],
          laudoItem: 'Linfonodo {aspecto}, no nível {nivel} {lado}, medindo {d1} x {d2} cm.',
          impressaoItem: 'Linfonodomegalia cervical {lado}.',
          laudoMultiplos: 'Múltiplos linfonodos cervicais, o maior com {linfonodos.maior} cm.',
          impressaoMultiplos: 'Linfonodomegalias cervicais.',
        },
      ],
    },
    {
      id: 'paratireoides', titulo: 'Paratireoides',
      campos: [
        ...opcional('paratireoides', 'Citar ausência de nódulos nas paratireoides', [], {
          laudo: 'Ausência de nódulos na topografia das paratireoides.',
        }),
      ],
    },
  ],
  avisos: [
    {
      id: 'aviso_mais_de_4_nodulos',
      mensagem: 'Mais de 4 nódulos descritos. Considere "múltiplos nódulos, o maior com..." para um laudo mais objetivo.',
      se: and(e('nod_status', 'presentes'), { '!': [{ var: 'nodulos.multiplos' }] }, { '>': [{ var: 'nodulos.n' }, 4] }),
    },
    {
      id: 'aviso_volume_fora_da_faixa',
      mensagem: 'Volume tireoidiano fora da faixa de referência usada (10 a 15 cm³ em mulheres; 12 a 18 cm³ em homens). Valores a validar com o médico revisor. O sistema não conclui nada a partir disso.',
      se: {
        and: [
          semCirurgia,
          { '!!': [{ var: 'vol_total' }] },
          {
            or: [
              { and: [e('sexo', 'F'), { or: [{ '<': [{ var: 'vol_total' }, 10] }, { '>': [{ var: 'vol_total' }, 15] }] }] },
              { and: [e('sexo', 'M'), { or: [{ '<': [{ var: 'vol_total' }, 12] }, { '>': [{ var: 'vol_total' }, 18] }] }] },
            ],
          },
        ],
      },
    },
  ],
};

salvar(t);
