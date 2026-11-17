import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Passo { n: string; titulo: string; texto: string }
interface Recurso { tag: string; titulo: string; texto: string }
interface Pergunta { pergunta: string; resposta: string }
interface Plano { tipo: string; nome: string; destaque: boolean; itens: string[]; acao: string; rota: string }

/** Página pública de apresentação do Sonara. Só fala do que o app já faz hoje. */
@Component({
  selector: 'sn-inicio',
  imports: [RouterLink],
  templateUrl: './inicio.page.html',
  styleUrl: './inicio.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InicioPage {
  readonly exames = ['Abdome total', 'Abdome superior', 'Pelve transvaginal', 'Pelve suprapúbica', 'Tireoide', 'Mamas'];

  readonly passos: Passo[] = [
    { n: '01', titulo: 'Escolha o exame', texto: 'Abdome, pelve, tireoide ou mamas. O modelo abre com tudo no normal, pronto para laudar.' },
    { n: '02', titulo: 'Marque o que mudou', texto: 'Toque só nos achados e informe as medidas. A frase certa entra no laudo, com a conclusão.' },
    { n: '03', titulo: 'Revise e copie', texto: 'Ajuste o texto no editor, como no Word, e copie para o seu sistema ou para o documento final.' }
  ];

  readonly recursos: Recurso[] = [
    { tag: 'REGRAS', titulo: 'Nada é inventado', texto: 'O texto parte do que você marcou e mediu. Cada frase vem de uma regra, nunca de um chute.' },
    { tag: 'OFFLINE', titulo: 'Funciona sem sinal', texto: 'Instale no computador ou no celular. Os modelos ficam no aparelho e o laudo não depende da internet.' },
    { tag: 'CÁLCULOS', titulo: 'TI-RADS e BI-RADS', texto: 'A classificação sai enquanto você descreve o nódulo e entra abaixo da conclusão.' },
    { tag: 'PADRÃO', titulo: 'Do seu jeito', texto: 'Cada médico ajusta as próprias frases em “Minhas frases”, sem mexer nas dos colegas.' },
    { tag: 'CONTA', titulo: 'Um aparelho por vez', texto: 'A conta fica ativa em um aparelho online por vez. Ao entrar em outro, o anterior é desconectado.' },
    { tag: 'SEGURANÇA', titulo: 'Acesso protegido', texto: 'Login obrigatório, sessões controladas e licença validada no próprio aparelho.' }
  ];

  readonly planos: Plano[] = [
    {
      tipo: 'Individual', nome: 'Para médicos', destaque: false, acao: 'Criar conta', rota: '/cadastro',
      itens: ['Todos os exames disponíveis', 'Computador e celular', 'Modo offline', 'Suas frases personalizadas']
    },
    {
      tipo: 'Clínica', nome: 'Para equipes', destaque: true, acao: 'Entrar', rota: '/entrar',
      itens: ['Vários médicos na mesma clínica', 'Controle de aparelhos por médico', 'Frases padrão da clínica', 'Acompanhamento da implantação']
    }
  ];

  readonly perguntas: Pergunta[] = [
    { pergunta: 'O texto do laudo é gerado por inteligência artificial?', resposta: 'Não. O texto vem de regras, a partir do que você marca e mede. Quem revisa e assume o laudo é você.' },
    { pergunta: 'Funciona mesmo sem internet?', resposta: 'Sim. Depois de instalado e com a licença ativa, os exames e o editor funcionam sem conexão. A licença é renovada quando o aparelho volta a ficar online.' },
    { pergunta: 'O laudo vai ficar com a minha cara?', resposta: 'Você ajusta as frases de cada achado em “Minhas frases”. As alterações valem só para a sua conta.' },
    { pergunta: 'Posso usar em mais de um aparelho?', resposta: 'Sim, dentro do limite de dispositivos da sua licença. Só um fica conectado por vez: ao entrar em outro, o anterior sai.' },
    { pergunta: 'Como começo a usar?', resposta: 'Crie a sua conta, entre e instale o app no aparelho pelo navegador.' }
  ];

  readonly ano = new Date().getFullYear();
}
