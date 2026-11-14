// Gera libs/templates/src/pelve-suprapubica.json a partir da máscara transvaginal.
// RASCUNHO CLÍNICO: depende de revisão e assinatura do médico revisor.
import transvaginal from './gerar-transvaginal.mjs';
import { e, op, opcional, salvar } from './lib.mjs';

// Pela via suprapúbica o colo e a endocérvice não são avaliados com a mesma confiança.
const fora = new Set(['colo', 'polipo_endocervical', 'espessamento_endocervice']);

const secoes = transvaginal.secoes
  .filter((s) => !fora.has(s.id))
  .map((s) => ({ ...s, campos: s.campos.filter((c) => !fora.has(c.id)) }));

const num = (id, rotulo, extra = {}) => ({ id, tipo: 'num', rotulo, unidade: 'cm', obrigatorio: true, ...extra });

const bexiga = {
  id: 'bexiga', titulo: 'Bexiga',
  campos: [
    {
      id: 'bexiga', tipo: 'seg', rotulo: 'Bexiga', padrao: 'normal',
      opcoes: [
        op('normal', 'Normal', 'Bexiga com boa repleção, paredes finas e regulares, conteúdo anecogênico.'),
        op('trabeculada', 'Trabeculada', 'Bexiga com paredes espessadas e trabeculadas.', 'Bexiga com paredes trabeculadas.'),
        op('calculo', 'Cálculo', 'Bexiga contendo imagem calculosa de {bex_calc_cm} cm.', 'Cálculo vesical.'),
        op('lesao', 'Lesão vegetante', 'Lesão vegetante aderida à parede vesical, medindo {bex_lesao_cm} cm.', 'Lesão vegetante vesical.'),
        op('pouca', 'Repleção insuficiente', 'Bexiga com repleção insuficiente, o que limita a avaliação das estruturas pélvicas.'),
      ],
    },
    num('bex_calc_cm', 'Cálculo (cm)', { showIf: e('bexiga', 'calculo') }),
    num('bex_lesao_cm', 'Lesão (cm)', { showIf: e('bexiga', 'lesao') }),
    ...opcional('vol_vesical', 'Volume vesical pré e pós miccional', [
      { id: 'vesical_pre', tipo: 'dims', rotulo: 'Pré-miccional (cm)', obrigatorio: true },
      { id: 'vesical_pos', tipo: 'dims', rotulo: 'Pós-miccional (cm)', obrigatorio: true },
    ], { laudo: 'Volume vesical pré-miccional estimado em {vesical_pre.vol} ml e pós-miccional em {vesical_pos.vol} ml.' }),
  ],
};

// A bexiga abre o laudo: é a janela acústica do exame suprapúbico.
const t = {
  ...transvaginal,
  id: 'pelve-suprapubica',
  versao: '0.1.0',
  subtipo: 'Pelve feminina suprapúbica',
  titulo: 'ULTRASSONOGRAFIA PÉLVICA (VIA SUPRAPÚBICA)',
  mudancas: {
    url: 'https://sonara.example/mudancas/pelve-suprapubica/0.1.0', // TODO: link real do changelog aprovado
    resumo: 'Primeira versão da máscara (rascunho, sem revisão médica).',
  },
  secoes: [secoes[0], bexiga, ...secoes.slice(1)],
};

salvar(t);
