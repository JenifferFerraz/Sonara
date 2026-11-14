// Gera libs/templates/src/transvaginal.json. Rode: npm run templates
import { and, e, op, salvar, v } from './lib.mjs';

const semCirurgia = e('cirurgia', 'nenhuma');

const ovarioVisivel = (k) =>
  and({ '!=': [v(`ov${k}_aspecto`), 'naocar'] }, { '!=': [v(`ov${k}_aspecto`), 'ausente'] });

const ovario = (k, lado) => ({
  id: `ov_${k}`,
  titulo: `Ovário ${lado}`,
  campos: [
    {
      id: `ov${k}_aspecto`, tipo: 'seg', rotulo: `Aspecto do ovário ${lado}`, padrao: 'normal',
      opcoes: [
        op('normal', 'Normal', ''),
        op('naocar', 'Não caracterizado', `Ovário ${lado} não caracterizado.`),
        op('ausente', 'Ausente (ooforectomia)', `Ovário ${lado} não visualizado (status pós-ooforectomia).`, `Status pós-ooforectomia ${lado.replace(/o$/, 'a')}.`),
        op('multifolicular', 'Multifolicular', `Ovário ${lado} com aspecto multifolicular.`),
        op('policistico', 'Policístico', `Ovário ${lado} com padrão policístico.`, `Padrão policístico no ovário ${lado}.`),
      ],
    },
    {
      id: `ov${k}`, tipo: 'dims', rotulo: `Ovário ${lado} (L × AP × T, cm)`, obrigatorio: true,
      showIf: ovarioVisivel(k),
      laudo: `Ovário ${lado} de contornos regulares, medindo {ov${k}.a} x {ov${k}.b} x {ov${k}.c} cm, com volume estimado em {ov${k}.vol} cm³.`,
    },
    {
      id: `ov${k}_cistos`, tipo: 'list', rotulo: `Cistos no ovário ${lado}`,
      showIf: ovarioVisivel(k),
      itens: [
        { id: 'medida', tipo: 'num', rotulo: 'Medida (cm)', obrigatorio: true, unidade: 'cm' },
        {
          id: 'tipo', tipo: 'select', rotulo: 'Tipo', padrao: 'simples',
          opcoes: [
            op('simples', 'simples'),
            op('hemorragico', 'com aspecto hemorrágico'),
            op('endometrioma', 'com aspecto de endometrioma'),
            op('dermoide', 'com aspecto de dermoide'),
            op('complexo', 'complexa, com componente sólido ou septos'),
          ],
        },
        {
          id: 'orads', tipo: 'select', rotulo: 'O-RADS (manual)', padrao: 'nc',
          opcoes: [
            { valor: 'nc', rotulo: 'Não citar', laudo: '' },
            ...[1, 2, 3, 4, 5].map((n) => ({ valor: String(n), rotulo: `O-RADS ${n}`, laudo: `, O-RADS ${n}` })),
          ],
        },
      ],
      laudoItem: `Formação cística {tipo} no ovário ${lado}, medindo {medida} cm{orads}.`,
      impressaoItem: `Cisto ovariano ${lado} {tipo}, medindo {medida} cm{orads}.`,
      laudoMultiplos: `Múltiplos cistos simples no ovário ${lado}, o maior com {ov${k}_cistos.maior} cm.`,
      impressaoMultiplos: `Cistos ovarianos ${lado}.`,
    },
  ],
});

const semEndo = and(semCirurgia, { '!': [v('endo_nid')] });

const t = {
  id: 'transvaginal',
  versao: '0.1.0',
  modulo: 'pelve',
  exame: 'Pelve',
  subtipo: 'Transvaginal',
  titulo: 'ULTRASSONOGRAFIA PÉLVICA TRANSVAGINAL',
  mudancas: {
    url: 'https://sonara.example/mudancas/transvaginal/0.1.0', // TODO: link real do changelog aprovado
    resumo: 'Primeira versão da máscara.',
  },
  referencias: { orads: 'ACR O-RADS US v2022', endometrio: 'ACOG 2026 (somente aviso)' },
  fatorVolume: 0.523,
  secoes: [
    {
      id: 'hormonal', titulo: 'Status hormonal',
      campos: [
        {
          id: 'status', tipo: 'seg', rotulo: 'Status', padrao: 'fertil',
          opcoes: [op('fertil', 'Idade fértil', ''), op('pos', 'Pós-menopausa', 'Paciente em pós-menopausa.')],
        },
        { id: 'dum', tipo: 'text', mascara: 'data', rotulo: 'DUM (data ou "há X dias")', showIf: and(e('status', 'fertil'), semCirurgia), laudo: 'Data da última menstruação: {valor}.' },
        { id: 'gestacoes', tipo: 'text', rotulo: 'Gestações', laudo: 'Antecedentes obstétricos: {valor}.' },
      ],
    },
    {
      id: 'cirurgias', titulo: 'Cirurgias',
      campos: [
        {
          id: 'cirurgia', tipo: 'seg', rotulo: 'Cirurgia uterina', padrao: 'nenhuma',
          opcoes: [
            op('nenhuma', 'Nenhuma', ''),
            op('total', 'Histerectomia total', 'Útero e colo não visualizados (status pós-histerectomia total).', 'Status pós-histerectomia total.'),
            op('parcial', 'Histerectomia parcial', 'Coto cervical medindo {coto.a} x {coto.b} x {coto.c} cm (status pós-histerectomia parcial).', 'Status pós-histerectomia parcial.'),
          ],
        },
        { id: 'coto', tipo: 'dims', rotulo: 'Coto (L × AP × T, cm)', obrigatorio: true, showIf: e('cirurgia', 'parcial') },
      ],
    },
    {
      id: 'utero', titulo: 'Útero',
      campos: [
        {
          id: 'posicao', tipo: 'seg', rotulo: 'Posição', padrao: 'antev', showIf: semCirurgia,
          opcoes: [op('antev', 'anteversoflexão', ''), op('retrov', 'retroversoflexão', ''), op('medio', 'mediversão', '')],
        },
        {
          id: 'utero', tipo: 'dims', rotulo: 'Útero (L × AP × T, cm)', obrigatorio: true, showIf: semCirurgia,
          laudo: 'Útero em {posicao}, de contornos regulares, medindo {utero.a} x {utero.b} x {utero.c} cm, com volume estimado em {utero.vol} cm³.',
        },
        {
          id: 'utero_aumentado', tipo: 'check', rotulo: 'Marcar útero aumentado', showIf: semCirurgia,
          laudo: 'Útero com dimensões aumentadas.', impressao: 'Útero de dimensões aumentadas.',
        },
      ],
    },
    {
      id: 'endometrio', titulo: 'Endométrio e cavidade',
      campos: [
        { id: 'endo_nid', tipo: 'check', rotulo: 'Endométrio não identificado', showIf: semCirurgia, laudo: 'Endométrio não identificado.' },
        {
          id: 'endo_mm', tipo: 'num', rotulo: 'Espessura endometrial (mm)', unidade: 'mm', obrigatorio: true, permiteNaoCitar: true,
          showIf: semEndo, laudo: 'Espessura endometrial de {endo_mm} mm.',
        },
        {
          id: 'endo_aspecto', tipo: 'seg', rotulo: 'Aspecto', padrao: 'nc', showIf: semEndo,
          opcoes: [
            op('nc', 'Não citar', ''),
            op('linear', 'Linear', 'Endométrio de aspecto linear.'),
            op('trilaminar', 'Trilaminar', 'Endométrio de aspecto trilaminar.'),
            op('homogeneo', 'Homogêneo', 'Endométrio de aspecto homogêneo.'),
            op('heterogeneo', 'Heterogêneo', 'Endométrio de aspecto heterogêneo, com áreas císticas.'),
          ],
        },
        { id: 'lamina', tipo: 'check', rotulo: 'Lâmina líquida', showIf: semCirurgia, laudo: 'Lâmina líquida na cavidade endometrial.', impressao: 'Lâmina líquida endometrial.' },
        { id: 'polipo', tipo: 'check', rotulo: 'Pólipo endometrial', showIf: semCirurgia, impressao: 'Pólipo endometrial.' },
        {
          id: 'polipo_local', tipo: 'seg', rotulo: 'Local do pólipo', padrao: 'fundo', showIf: and(semCirurgia, v('polipo')),
          opcoes: [op('fundo', 'no fundo uterino'), op('ant', 'na parede anterior'), op('post', 'na parede posterior')],
        },
        {
          id: 'polipo_mm', tipo: 'num', rotulo: 'Medida do pólipo (cm)', unidade: 'cm', obrigatorio: true, showIf: and(semCirurgia, v('polipo')),
          laudo: 'Imagem nodular hiperecogênica, sugestiva de pólipo endometrial {polipo_local}, medindo {polipo_mm} cm.',
        },
        { id: 'polipo_endocervical', tipo: 'check', rotulo: 'Pólipo endocervical', showIf: semCirurgia, laudo: 'Imagem sugestiva de pólipo endocervical.', impressao: 'Pólipo endocervical.' },
        { id: 'espessamento_endocervice', tipo: 'check', rotulo: 'Espessamento da endocérvice', showIf: semCirurgia, laudo: 'Espessamento da endocérvice.' },
      ],
    },
    {
      id: 'diu', titulo: 'DIU',
      campos: [
        {
          id: 'diu', tipo: 'seg', rotulo: 'DIU', padrao: 'ausente', showIf: semCirurgia,
          opcoes: [
            op('ausente', 'Ausente', ''),
            op('normo', 'Bem posicionado', 'Dispositivo intrauterino (DIU) normoposicionado na cavidade endometrial.', 'DIU normoposicionado.'),
            op('desloc', 'Deslocado / com distâncias', 'Dispositivo intrauterino (DIU) a {diu_fundo} cm do fundo da cavidade e a {diu_serosa} cm da serosa.', 'DIU deslocado.'),
          ],
        },
        { id: 'diu_fundo', tipo: 'num', rotulo: 'Distância do fundo da cavidade (cm)', obrigatorio: true, showIf: e('diu', 'desloc') },
        { id: 'diu_serosa', tipo: 'num', rotulo: 'Distância da serosa (cm)', obrigatorio: true, showIf: e('diu', 'desloc') },
      ],
    },
    {
      id: 'colo', titulo: 'Colo',
      campos: [
        {
          id: 'colo', tipo: 'seg', rotulo: 'Colo', padrao: 'normal', showIf: semCirurgia,
          opcoes: [
            op('normal', 'Normal', 'Colo uterino de aspecto ecográfico habitual.'),
            op('naboth', 'Cistos de Naboth', 'Cistos de retenção (Naboth) no colo uterino, o maior com {naboth_maior} cm.', 'Cistos de Naboth.'),
          ],
        },
        { id: 'naboth_maior', tipo: 'num', rotulo: 'Maior cisto de Naboth (cm)', obrigatorio: true, showIf: and(semCirurgia, e('colo', 'naboth')) },
      ],
    },
    {
      id: 'miometrio', titulo: 'Miométrio',
      campos: [
        {
          id: 'miometrio', tipo: 'seg', rotulo: 'Miométrio', padrao: 'homogeneo', showIf: semCirurgia,
          opcoes: [
            op('homogeneo', 'Homogêneo', 'Miométrio de textura homogênea.'),
            op('heterogeneo', 'Heterogêneo, sem nódulos', 'Miométrio de textura heterogênea, sem nódulos definidos.'),
            op('adenomiose', 'Sinais de adenomiose', 'Miométrio com sinais ecográficos de adenomiose, acometendo a parede {adeno_parede}.', 'Sinais de adenomiose.'),
          ],
        },
        {
          id: 'adeno_parede', tipo: 'seg', rotulo: 'Parede acometida', padrao: 'posterior', showIf: and(semCirurgia, e('miometrio', 'adenomiose')),
          opcoes: [op('anterior', 'anterior'), op('posterior', 'posterior'), op('difusa', 'difusamente (anterior e posterior)')],
        },
        {
          id: 'miomas', tipo: 'list', rotulo: 'Nódulos miometriais', showIf: semCirurgia,
          itens: [
            { id: 'medida', tipo: 'num', rotulo: 'Medida (cm)', obrigatorio: true, unidade: 'cm' },
            {
              id: 'tipo', tipo: 'select', rotulo: 'Tipo (FIGO simplificado)', padrao: 'intramural',
              opcoes: [op('subseroso', 'subseroso'), op('intramural', 'intramural'), op('submucoso', 'submucoso')],
            },
            {
              id: 'local', tipo: 'select', rotulo: 'Localização', padrao: 'anterior',
              opcoes: [
                op('anterior', 'na parede anterior'), op('posterior', 'na parede posterior'), op('fundica', 'na região fúndica'),
                op('lateral_d', 'na parede lateral direita'), op('lateral_e', 'na parede lateral esquerda'),
              ],
            },
          ],
          laudoItem: 'Nódulo miometrial sólido, hipoecogênico, {tipo}, {local}, medindo {medida} cm.',
          impressaoItem: 'Mioma uterino {tipo}, medindo {medida} cm.',
          laudoMultiplos: 'Múltiplos nódulos miometriais sólidos, o maior com {miomas.maior} cm.',
          impressaoMultiplos: 'Útero miomatoso.',
        },
      ],
    },
    ovario('d', 'direito'),
    ovario('e', 'esquerdo'),
    {
      id: 'anexos', titulo: 'Anexos',
      campos: [
        { id: 'paraovariano', tipo: 'check', rotulo: 'Cisto paraovariano', laudo: 'Imagem cística paraovariana.', impressao: 'Cisto paraovariano.' },
        { id: 'inclusao', tipo: 'check', rotulo: 'Cisto de inclusão peritoneal', laudo: 'Imagem cística compatível com cisto de inclusão peritoneal.', impressao: 'Cisto de inclusão peritoneal.' },
        { id: 'hidro_d', tipo: 'check', rotulo: 'Hidrossalpinge D', laudo: 'Imagem tubular anecogênica à direita, compatível com hidrossalpinge.', impressao: 'Hidrossalpinge à direita.' },
        { id: 'hidro_e', tipo: 'check', rotulo: 'Hidrossalpinge E', laudo: 'Imagem tubular anecogênica à esquerda, compatível com hidrossalpinge.', impressao: 'Hidrossalpinge à esquerda.' },
        {
          id: 'orads', tipo: 'seg', rotulo: 'O-RADS final (manual)', padrao: 'nc',
          opcoes: [
            op('nc', 'Não citar', ''),
            ...[1, 2, 3, 4, 5].map((n) => op(String(n), `O-RADS ${n}`, `Classificação O-RADS US: ${n}.`, `O-RADS ${n}.`)),
          ],
        },
      ],
    },
    {
      id: 'liquido', titulo: 'Líquido livre',
      campos: [
        {
          id: 'liquido', tipo: 'seg', rotulo: 'Líquido livre', padrao: 'ausente',
          opcoes: [
            op('ausente', 'Ausente', 'Não há líquido livre na pelve.'),
            ...[['pequena', 'Pequena'], ['moderada', 'Moderada'], ['grande', 'Grande']].map(([k, r]) =>
              op(k, r, `${r} quantidade de líquido livre na pelve.`, 'Líquido livre na pelve.')),
          ],
        },
      ],
    },
  ],
  avisos: [
    {
      id: 'aviso_endometrio_pos',
      mensagem: 'Endométrio acima de 4 mm na pós-menopausa. O sistema não sugere conduta: avalie conforme seu critério (ACOG 2026).',
      se: and(e('status', 'pos'), semCirurgia, { '!': [v('endo_mm__nc')] }, { '>': [v('endo_mm'), 4] }),
    },
  ],
};

salvar(t);

export default t;
