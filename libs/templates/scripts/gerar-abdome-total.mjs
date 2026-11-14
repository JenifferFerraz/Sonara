// Gera libs/templates/src/abdome-total.json. Rode: npm run templates
// RASCUNHO CLÍNICO: toda frase aqui depende de revisão e assinatura do médico revisor.
import { and, e, op, opcional, salvar, v } from './lib.mjs';

const seg = [['1', 'I'], ['2', 'II'], ['3', 'III'], ['4a', 'IVa'], ['4b', 'IVb'], ['5', 'V'], ['6', 'VI'], ['7', 'VII'], ['8', 'VIII']];
const segmentos = (id) => ({
  id, tipo: 'select', rotulo: 'Segmento', padrao: '6',
  opcoes: seg.map(([k, r]) => op(k, `segmento ${r}`, `segmento ${r}`)),
});
const polos = () => ({
  id: 'polo', tipo: 'select', rotulo: 'Terço', padrao: 'medio',
  opcoes: [op('superior', 'terço superior'), op('medio', 'terço médio'), op('inferior', 'terço inferior')],
});
const num = (id, rotulo, extra = {}) => ({ id, tipo: 'num', rotulo, unidade: 'cm', obrigatorio: true, ...extra });

// ---------- Rins ----------
const rim = (k, lado) => {
  const ativo = e('rins', 'achados');
  const doLado = (c) => ({ ...c, showIf: c.showIf ? and(ativo, c.showIf) : ativo });
  const lateral = lado === 'direito' ? 'à direita' : 'à esquerda';
  const temRim = { '!=': [v(`rim${k}_aspecto`), 'ausente'] };
  return [
    doLado({
      id: `rim${k}_aspecto`, tipo: 'seg', rotulo: `Rim ${lado}`, padrao: 'normal',
      opcoes: [
        op('normal', 'Normal', `Rim ${lado} tópico, de dimensões normais, contornos regulares e ecotextura habitual.`),
        op('ausente', 'Não visualizado', `Rim ${lado} não visualizado.`, `Rim ${lado} não visualizado.`),
        op('atrofico', 'Atrófico', `Rim ${lado} de dimensões reduzidas, com ecotextura aumentada.`, `Rim ${lado} com sinais de atrofia.`),
      ],
    }),
    doLado({
      id: `rim${k}_cistos`, tipo: 'list', rotulo: `Cistos no rim ${lado}`, showIf: temRim,
      itens: [num('medida', 'Medida (cm)'), polos()],
      laudoItem: `Cisto cortical simples no {polo} do rim ${lado}, medindo {medida} cm.`,
      impressaoItem: `Cisto renal simples ${lateral}.`,
      laudoMultiplos: `Múltiplos cistos corticais simples no rim ${lado}, o maior com {rim${k}_cistos.maior} cm.`,
      impressaoMultiplos: `Cistos renais simples ${lateral}.`,
    }),
    doLado({
      id: `rim${k}_calculos`, tipo: 'list', rotulo: `Cálculos no rim ${lado}`, showIf: temRim,
      itens: [num('medida', 'Medida (cm)'), polos()],
      laudoItem: `Imagem hiperecogênica com sombra acústica posterior no {polo} do rim ${lado}, medindo {medida} cm, compatível com cálculo.`,
      impressaoItem: `Litíase renal ${lateral}.`,
      laudoMultiplos: `Múltiplas imagens calculosas no rim ${lado}, a maior com {rim${k}_calculos.maior} cm.`,
      impressaoMultiplos: `Litíase renal ${lateral}.`,
    }),
    doLado({
      id: `rim${k}_dilatacao`, tipo: 'seg', rotulo: `Dilatação pielocalicinal ${lado}`, padrao: 'ausente', showIf: temRim,
      opcoes: [
        op('ausente', 'Ausente', ''),
        op('leve', 'Leve', `Dilatação pielocalicinal leve no rim ${lado}.`, `Hidronefrose leve ${lateral}.`),
        op('moderada', 'Moderada', `Dilatação pielocalicinal moderada no rim ${lado}.`, `Hidronefrose moderada ${lateral}.`),
        op('acentuada', 'Acentuada', `Dilatação pielocalicinal acentuada no rim ${lado}, com adelgaçamento do parênquima.`, `Hidronefrose acentuada ${lateral}.`),
      ],
    }),
  ];
};

const t = {
  id: 'abdome-total',
  versao: '0.1.0',
  exame: 'Abdome',
  subtipo: 'Abdome total',
  titulo: 'ULTRASSONOGRAFIA DO ABDOME TOTAL',
  mudancas: {
    url: 'https://sonara.example/mudancas/abdome-total/0.1.0', // TODO: link real do changelog aprovado
    resumo: 'Primeira versão da máscara (rascunho, sem revisão médica).',
  },
  referencias: {},
  secoes: [
    {
      id: 'limitacoes', titulo: 'Limitações técnicas',
      campos: [
        {
          id: 'limitacao', tipo: 'seg', rotulo: 'Limitação', padrao: 'nenhuma',
          opcoes: [
            op('nenhuma', 'Nenhuma', ''),
            op('gas', 'Interposição gasosa', 'Exame limitado por interposição gasosa intestinal.'),
            op('biotipo', 'Biotipo', 'Exame limitado pelo biotipo do paciente.'),
            op('gas_biotipo', 'Gás + biotipo', 'Exame limitado por interposição gasosa intestinal e pelo biotipo do paciente.'),
            op('leito', 'À beira do leito', 'Exame realizado à beira do leito, com limitações de posicionamento.'),
          ],
        },
      ],
    },
    {
      id: 'figado', titulo: 'Fígado',
      campos: [
        {
          id: 'fig_dim', tipo: 'seg', rotulo: 'Dimensões', padrao: 'normais',
          opcoes: [
            op('normais', 'Normais', 'Fígado com dimensões normais, contornos regulares e bordas finas. Veia porta e veias hepáticas sem alterações.'),
            op('aumentadas', 'Aumentadas', 'Fígado com dimensões aumentadas.', 'Hepatomegalia.'),
            op('reduzidas', 'Reduzidas', 'Fígado com dimensões reduzidas.', 'Redução das dimensões hepáticas.'),
          ],
        },
        {
          id: 'fig_eco', tipo: 'seg', rotulo: 'Ecotextura', padrao: 'homogenea',
          opcoes: [
            op('homogenea', 'Homogênea', 'Ecotextura homogênea.'),
            op('est_nd', 'Esteatose (grau não especificado)', 'Ecotextura hiperecogênica difusa, compatível com esteatose.', 'Esteatose hepática.'),
            op('est_leve', 'Esteatose leve', 'Ecotextura hiperecogênica difusa, compatível com esteatose leve.', 'Esteatose hepática leve.'),
            op('est_mod', 'Esteatose moderada', 'Ecotextura hiperecogênica difusa, com atenuação do feixe, compatível com esteatose moderada.', 'Esteatose hepática moderada.'),
            op('est_acent', 'Esteatose acentuada', 'Ecotextura hiperecogênica difusa, com acentuada atenuação do feixe, compatível com esteatose acentuada.', 'Esteatose hepática acentuada.'),
            op('hepatopatia', 'Hepatopatia crônica', 'Ecotextura heterogênea, com contornos irregulares, sugestivos de hepatopatia crônica.', 'Sinais de hepatopatia crônica.'),
          ],
        },
        ...opcional('fig_med', 'Citar medidas dos lobos', [
          num('fig_ld', 'Lobo direito (cm)', { laudo: 'Lobo direito medindo {fig_ld} cm.' }),
          num('fig_le', 'Lobo esquerdo (cm)', { laudo: 'Lobo esquerdo medindo {fig_le} cm.' }),
        ]),
        ...opcional('fig_cisto', 'Cisto simples', [
          num('fig_cisto_cm', 'Medida (cm)'),
          segmentos('fig_cisto_seg'),
        ], { laudo: 'Cisto simples no {fig_cisto_seg}, medindo {fig_cisto_cm} cm.', impressao: 'Cisto hepático simples.' }),
        ...opcional('fig_cistos', 'Vários cistos simples', [
          num('fig_cistos_max', 'Maior (cm)'),
        ], { laudo: 'Múltiplos cistos simples hepáticos, o maior com {fig_cistos_max} cm.', impressao: 'Cistos hepáticos simples.' }),
        ...opcional('fig_nodulo', 'Nódulo hepático', [
          {
            id: 'fig_nodulo_eco', tipo: 'select', rotulo: 'Ecogenicidade', padrao: 'hiper',
            opcoes: [op('hiper', 'hiperecogênico'), op('hipo', 'hipoecogênico'), op('iso', 'isoecogênico')],
          },
          {
            id: 'fig_nodulo_cont', tipo: 'select', rotulo: 'Contornos', padrao: 'regulares',
            opcoes: [op('regulares', 'regulares'), op('irregulares', 'irregulares')],
          },
          num('fig_nodulo_cm', 'Medida (cm)'),
          segmentos('fig_nodulo_seg'),
        ], { laudo: 'Nódulo {fig_nodulo_eco}, de contornos {fig_nodulo_cont}, no {fig_nodulo_seg}, medindo {fig_nodulo_cm} cm.', impressao: 'Nódulo hepático.' }),
        ...opcional('fig_calc', 'Calcificação grosseira', [
          num('fig_calc_cm', 'Medida (cm)'),
          segmentos('fig_calc_seg'),
        ], { laudo: 'Calcificação grosseira no {fig_calc_seg}, medindo {fig_calc_cm} cm.' }),
      ],
    },
    {
      id: 'vesicula', titulo: 'Vesícula biliar',
      campos: [
        {
          id: 'ves', tipo: 'seg', rotulo: 'Vesícula', padrao: 'normal',
          opcoes: [
            op('normal', 'Normal', 'Vesícula biliar com forma e dimensões normais, paredes finas e regulares, apresentando conteúdo anecogênico sem imagens calculosas.'),
            op('calc', 'Cálculo único', 'Vesícula biliar contendo imagem hiperecogênica com sombra acústica posterior, medindo {ves_calc_cm} cm, compatível com cálculo.', 'Colelitíase.'),
            op('calcs', 'Múltiplos cálculos', 'Vesícula biliar contendo múltiplas imagens hiperecogênicas com sombra acústica posterior, a maior com {ves_calcs_max} cm, compatíveis com cálculos.', 'Colelitíase.'),
            op('polipo', 'Pólipo', 'Vesícula biliar com imagem polipoide séssil aderida à parede, medindo {ves_polipo_cm} cm.', 'Pólipo vesicular.'),
            op('colesterolose', 'Colesterolose', 'Vesícula biliar com pequenos focos ecogênicos aderidos à parede, sem sombra acústica, sugestivos de colesterolose.', 'Sinais de colesterolose vesicular.'),
            op('vazia', 'Vazia / contraída', 'Vesícula biliar contraída, de avaliação limitada.'),
            op('ausente', 'Ausente', 'Vesícula biliar não visualizada.', 'Vesícula biliar não visualizada.'),
          ],
        },
        num('ves_calc_cm', 'Cálculo (cm)', { showIf: e('ves', 'calc') }),
        num('ves_calcs_max', 'Maior cálculo (cm)', { showIf: e('ves', 'calcs') }),
        num('ves_polipo_cm', 'Pólipo (cm)', { showIf: e('ves', 'polipo') }),
        ...opcional('ves_parede', 'Citar espessura da parede', [
          num('ves_parede_cm', 'Espessura (cm)'),
        ], { laudo: 'Parede vesicular com espessura de {ves_parede_cm} cm.' }),
      ],
    },
    {
      id: 'vias', titulo: 'Vias biliares',
      campos: [
        {
          id: 'vias', tipo: 'seg', rotulo: 'Vias biliares', padrao: 'normal',
          opcoes: [
            op('normal', 'Normais', 'Não há dilatação das vias biliares intra ou extra-hepáticas.'),
            op('coledoco', 'Colédoco ectasiado', 'Colédoco com calibre aumentado, medindo {vias_calibre} cm.', 'Dilatação do colédoco.'),
            op('intra', 'Dilatação intra-hepática', 'Dilatação das vias biliares intra-hepáticas.', 'Dilatação das vias biliares intra-hepáticas.'),
          ],
        },
        num('vias_calibre', 'Calibre do colédoco (cm)', { showIf: e('vias', 'coledoco') }),
      ],
    },
    {
      id: 'pancreas', titulo: 'Pâncreas',
      campos: [
        {
          id: 'panc', tipo: 'seg', rotulo: 'Pâncreas', padrao: 'normal',
          opcoes: [
            op('normal', 'Normal', 'Pâncreas de dimensões normais, contornos regulares e ecotextura homogênea. Não há dilatação do ducto pancreático.'),
            op('parcial', 'Parcialmente acessível', 'Pâncreas parcialmente visualizado por interposição gasosa.'),
            op('inacessivel', 'Inacessível', 'Pâncreas não avaliável por interposição gasosa.'),
          ],
        },
        ...opcional('panc_med', 'Citar dimensões (espessura)', [
          num('panc_cab', 'Cabeça (cm)', { laudo: 'Cabeça pancreática com espessura de {panc_cab} cm.' }),
          num('panc_corpo', 'Corpo (cm)', { laudo: 'Corpo com {panc_corpo} cm.' }),
          num('panc_cauda', 'Cauda (cm)', { laudo: 'Cauda com {panc_cauda} cm.' }),
        ]),
      ],
    },
    {
      id: 'baco', titulo: 'Baço',
      campos: [
        {
          id: 'baco', tipo: 'seg', rotulo: 'Baço', padrao: 'normal',
          opcoes: [
            op('normal', 'Normal', 'Baço com dimensões normais, contornos regulares e ecotextura homogênea.'),
            op('aumentado', 'Aumentado', 'Baço com dimensões aumentadas e ecotextura homogênea.', 'Esplenomegalia.'),
            op('ausente', 'Ausente', 'Baço não visualizado.', 'Baço não visualizado.'),
          ],
        },
        ...opcional('baco_med', 'Citar medidas', [
          num('baco_long', 'Longitudinal (cm)', { laudo: 'Eixo longitudinal do baço medindo {baco_long} cm.' }),
          num('baco_transv', 'Transverso (cm)', { laudo: 'Eixo transverso medindo {baco_transv} cm.' }),
        ]),
        ...opcional('baco_acess', 'Baço acessório', [
          num('baco_acess_cm', 'Medida (cm)'),
        ], { laudo: 'Baço acessório medindo {baco_acess_cm} cm.' }),
        ...opcional('baco_calc', 'Calcificação esplênica', [
          num('baco_calc_cm', 'Medida (cm)'),
        ], { laudo: 'Calcificação esplênica medindo {baco_calc_cm} cm.' }),
      ],
    },
    {
      id: 'aorta', titulo: 'Aorta e retroperitônio',
      campos: [
        {
          id: 'aorta', tipo: 'seg', rotulo: 'Aorta', padrao: 'normal',
          opcoes: [
            op('normal', 'Normal', 'Aorta e veia cava inferior com calibre e trajeto preservados. Ausência de linfonodomegalias retroperitoneais detectáveis.'),
            op('ateromatosa', 'Ateromatosa', 'Aorta com paredes ateromatosas e calibre preservado. Ausência de linfonodomegalias retroperitoneais detectáveis.', 'Aortoateromatose.'),
            op('aneurisma', 'Aneurisma', 'Dilatação aneurismática da aorta abdominal, de calibre máximo de {aorta_cm} cm.', 'Aneurisma da aorta abdominal.'),
            op('inacessivel', 'Inacessível', 'Aorta e retroperitônio não avaliáveis por interposição gasosa.'),
          ],
        },
        num('aorta_cm', 'Calibre máximo (cm)', { showIf: e('aorta', 'aneurisma') }),
      ],
    },
    {
      id: 'alcas', titulo: 'Alças intestinais',
      campos: [
        ...opcional('apendicite', 'Sinais de apendicite', [
          num('apend_cm', 'Calibre (cm)'),
        ], { laudo: 'Estrutura tubular em fundo cego, não compressível, com calibre de {apend_cm} cm, em topografia apendicular.', impressao: 'Sinais ultrassonográficos de apendicite.' }),
        ...opcional('divert', 'Diverticulite', [
          {
            id: 'divert_seg', tipo: 'select', rotulo: 'Segmento', padrao: 'sigmoide',
            opcoes: [op('sigmoide', 'sigmoide'), op('descendente', 'cólon descendente'), op('ascendente', 'cólon ascendente')],
          },
        ], { laudo: 'Espessamento parietal com borramento da gordura adjacente no {divert_seg}, associado a divertículos.', impressao: 'Sinais de diverticulite.' }),
      ],
    },
    {
      id: 'rins', titulo: 'Rins e ureteres',
      campos: [
        {
          id: 'rins', tipo: 'seg', rotulo: 'Rins', padrao: 'normais',
          opcoes: [
            op('normais', 'Normais', 'Rins tópicos, com dimensões normais, contornos regulares e ecotextura habitual. Não há evidências de imagens calculosas calicinais. Não há dilatação do sistema coletor.'),
            op('achados', 'Com achados', ''),
          ],
        },
        ...rim('d', 'direito'),
        ...rim('e', 'esquerdo'),
        ...opcional('ureter_calc', 'Cálculo ureteral', [
          { id: 'ureter_lado', tipo: 'select', rotulo: 'Lado', padrao: 'direito', opcoes: [op('direito', 'direito'), op('esquerdo', 'esquerdo')] },
          num('ureter_cm', 'Medida (cm)'),
          {
            id: 'ureter_terco', tipo: 'select', rotulo: 'Local', padrao: 'distal',
            opcoes: [op('proximal', 'terço proximal'), op('medio', 'terço médio'), op('distal', 'terço distal')],
          },
        ], { laudo: 'Imagem calculosa de {ureter_cm} cm no {ureter_terco} do ureter {ureter_lado}.', impressao: 'Cálculo ureteral.' }),
        ...opcional('duplo_j', 'Cateter duplo J', [
          { id: 'duplo_j_lado', tipo: 'select', rotulo: 'Lado', padrao: 'direito', opcoes: [op('direito', 'direito'), op('esquerdo', 'esquerdo'), op('bilateral', 'bilateral')] },
        ], { laudo: 'Cateter duplo J posicionado ({duplo_j_lado}).' }),
      ],
    },
    {
      id: 'bexiga', titulo: 'Bexiga',
      campos: [
        {
          id: 'bexiga', tipo: 'seg', rotulo: 'Bexiga', padrao: 'normal',
          opcoes: [
            op('normal', 'Normal', 'Bexiga com boa repleção, paredes finas e regulares, conteúdo anecogênico.'),
            op('trabeculada', 'Trabeculada', 'Bexiga com paredes espessadas e trabeculadas.', 'Bexiga com paredes trabeculadas.'),
            op('calculo', 'Cálculo', 'Bexiga contendo imagem calculosa de {bex_calc_cm} cm.', 'Cálculo vesical.'),
            op('lesao', 'Lesão vegetante', 'Lesão vegetante aderida à parede vesical, medindo {bex_lesao_cm} cm.', 'Lesão vegetante vesical.'),
            op('pouca', 'Repleção insuficiente', 'Bexiga com repleção insuficiente, de avaliação limitada.'),
            op('nao_citar', 'Não citar', ''),
          ],
        },
        num('bex_calc_cm', 'Cálculo (cm)', { showIf: e('bexiga', 'calculo') }),
        num('bex_lesao_cm', 'Lesão (cm)', { showIf: e('bexiga', 'lesao') }),
        { id: 'foley', tipo: 'check', rotulo: 'Sonda de Foley', laudo: 'Sonda vesical de demora em posição.' },
        ...opcional('vol_vesical', 'Volume vesical pré e pós miccional', [
          { id: 'vesical_pre', tipo: 'dims', rotulo: 'Pré-miccional (cm)', obrigatorio: true },
          { id: 'vesical_pos', tipo: 'dims', rotulo: 'Pós-miccional (cm)', obrigatorio: true },
        ], { laudo: 'Volume vesical pré-miccional estimado em {vesical_pre.vol} ml e pós-miccional em {vesical_pos.vol} ml.' }),
      ],
    },
    {
      id: 'liquido', titulo: 'Líquido livre',
      campos: [
        {
          id: 'liquido', tipo: 'seg', rotulo: 'Líquido livre', padrao: 'ausente',
          opcoes: [
            op('ausente', 'Ausente', 'Ausência de líquido livre na cavidade abdominal.'),
            ...[['pequena', 'Pequena'], ['moderada', 'Moderada'], ['grande', 'Grande']].map(([k, r]) =>
              op(k, r, `${r} quantidade de líquido livre na cavidade abdominal.`, 'Líquido livre na cavidade abdominal.')),
          ],
        },
      ],
    },
  ],
  avisos: [],
};

salvar(t);

export default t;
