// Gera libs/templates/src/abdome-superior.json a partir do Abdome total.
// RASCUNHO CLÍNICO: depende de revisão e assinatura do médico revisor.
// Hipótese a confirmar com o revisor: o superior não inclui rins, ureteres, bexiga nem alças.
import abdomeTotal from './gerar-abdome-total.mjs';
import { salvar } from './lib.mjs';

const fora = new Set(['alcas', 'rins', 'bexiga']);

const t = {
  ...abdomeTotal,
  id: 'abdome-superior',
  versao: '0.1.0',
  subtipo: 'Abdome superior',
  titulo: 'ULTRASSONOGRAFIA DO ABDOME SUPERIOR',
  mudancas: {
    url: 'https://sonara.example/mudancas/abdome-superior/0.1.0', // TODO: link real do changelog aprovado
    resumo: 'Primeira versão da máscara (rascunho, sem revisão médica).',
  },
  secoes: abdomeTotal.secoes.filter((s) => !fora.has(s.id)),
};

salvar(t);
