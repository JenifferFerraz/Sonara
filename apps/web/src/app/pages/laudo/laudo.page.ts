import { Component, ElementRef, HostListener, computed, effect, inject, signal, viewChild } from '@angular/core';
import {
  Cabecalho,
  Estado,
  Secao,
  aplicar,
  camposVisiveis,
  criarEstado,
  formatar,
  gerar
} from '@sonara/laudo-engine';
import { ClipboardService } from '../../core/services/clipboard.service';
import { MascaraService } from '../../core/services/mascara.service';
import { PreferenciasService } from '../../core/services/preferencias.service';
import { CampoComponent, MudancaCampo } from '../../shared/campo/campo.component';
import { aplicarMascara, mascaraInteiro } from '../../shared/mascaras';

@Component({
  selector: 'app-laudo-page',
  imports: [CampoComponent],
  templateUrl: './laudo.page.html',
  styleUrl: './laudo.page.scss'
})
export class LaudoPage {
  private readonly _mascaras = inject(MascaraService);
  private readonly _clipboard = inject(ClipboardService);
  private readonly _preferencias = inject(PreferenciasService);

  /** Uma aba por exame; os subtipos (Abdome total, Pelve transvaginal...) ficam dentro da aba. */
  constructor() {
    // Enquanto ninguém editou à mão, o papel acompanha o formulário. Escrever o HTML direto
    // (sem binding) evita que o cursor pule quando a pessoa começa a digitar.
    effect(() => {
      const html = formatar(this.resultado(), 'html');
      const el = this._editor()?.nativeElement;
      if (el && this.htmlEditado() === null) el.innerHTML = html;
    });
  }

  readonly abas = computed(() => {
    const grupos = new Map<string, { nome: string; subtipos: { id: string; nome: string }[] }>();
    for (const t of this._mascaras.emUso()) {
      const nome = t.exame ?? t.titulo;
      const g = grupos.get(nome) ?? { nome, subtipos: [] };
      g.subtipos.push({ id: t.id, nome: t.subtipo ?? t.titulo });
      grupos.set(nome, g);
    }
    return [...grupos.values()];
  });
  readonly abaAtiva = signal(this._mascaras.emUso()[0].id);
  /** Aba (exame) em que a máscara ativa está. */
  readonly exameAtivo = computed(() => this.template().exame ?? this.template().titulo);
  readonly subtiposDoExame = computed(
    () => this.abas().find(a => a.nome === this.exameAtivo())?.subtipos ?? []
  );
  /** Estado guardado de cada máscara: trocar de aba não perde o que foi preenchido. */
  private readonly _estados = new Map<string, Estado>();
  readonly pendencias = this._mascaras.pendencias;

  /** Máscara em uso do exame aberto. */
  readonly template = computed(
    () => this._mascaras.emUso().find(t => t.id === this.abaAtiva()) ?? this._mascaras.emUso()[0]
  );
  /** Abre outra máscara, guardando o estado da atual e levando o cabeçalho junto. */
  abrirExame(id: string): void {
    if (id === this.abaAtiva()) return;
    const atual = this.estado();
    this._estados.set(this.template().id, atual);
    this.abaAtiva.set(id);
    const guardado = this._estados.get(id);
    const novo = guardado ?? criarEstado(this.template());
    this.estado.set({ ...novo, cabecalho: atual.cabecalho });
    this.htmlEditado.set(null);
    this.abertas.set({});
    this.copiado.set(false);
  }

  /** Abre o primeiro subtipo da aba, ou o que o médico usou por último nela. */
  abrirAba(nome: string): void {
    const aba = this.abas().find(a => a.nome === nome);
    if (aba) this.abrirExame(aba.subtipos[0].id);
  }

  escolherSubtipo(evento: Event): void {
    this.abrirExame((evento.target as HTMLSelectElement).value);
  }

  readonly versoes = computed(() => {
    const m = this._mascaras.instaladas()[this.template().id];
    return Object.values(m.versoes).map(t => t.versao);
  });

  readonly estado = signal<Estado>(criarEstado(this.template()));
  readonly resultado = computed(() => gerar(this.template(), this.estado(), this._preferencias.frases()));
  readonly visiveis = computed(() => camposVisiveis(this.template(), this.estado()));
  readonly vazios = computed(() => this.resultado().alertas.filter(a => a.tipo === 'obrigatorio'));
  readonly avisos = computed(() => this.resultado().alertas.filter(a => a.tipo === 'referencia'));

  /** HTML editado à mão: o laudo para de se atualizar sozinho. */
  readonly htmlEditado = signal<string | null>(null);
  private _textoEditado = '';
  private readonly _editor = viewChild<ElementRef<HTMLElement>>('editor');

  readonly fontes = ['Times New Roman', 'Arial', 'Calibri', 'Verdana'];
  readonly tamanhos = [
    { rotulo: '10', valor: '2' },
    { rotulo: '12', valor: '3' },
    { rotulo: '14', valor: '4' },
    { rotulo: '18', valor: '5' }
  ];
  readonly copiado = signal(false);
  readonly mensagem = signal('');
  readonly abertas = signal<Record<string, boolean>>({});

  readonly textoAutomatico = computed(() => formatar(this.resultado(), 'texto'));
  readonly rotuloCopiar = computed(() => {
    const n = this.vazios().length;
    if (n === 0) return 'Copiar laudo';
    return `Copiar mesmo assim (${n} ${n === 1 ? 'campo vazio' : 'campos vazios'})`;
  });

  readonly sexos = [
    { valor: 'F', rotulo: 'Feminino' },
    { valor: 'M', rotulo: 'Masculino' }
  ];

  // ----- formulário -----

  campos(secao: Secao) {
    const visiveis = this.visiveis();
    return secao.campos.filter(c => visiveis.has(c.id));
  }

  /** Seções com medida obrigatória visível ficam sempre abertas. */
  fixa(secao: Secao): boolean {
    const visiveis = this.visiveis();
    return secao.campos.some(c => c.obrigatorio && c.tipo !== 'check' && visiveis.has(c.id));
  }

  aberta(secao: Secao): boolean {
    return this.fixa(secao) || (this.abertas()[secao.id] ?? false);
  }

  /** "Normal" = todos os campos iguais ao padrão. */
  normal(secao: Secao): boolean {
    const padrao = criarEstado(this.template()).valores;
    const atual = this.estado().valores;
    return secao.campos.every(
      c =>
        JSON.stringify(atual[c.id]) === JSON.stringify(padrao[c.id]) &&
        !atual[`${c.id}__nc`]
    );
  }

  alternarNormal(secao: Secao, ligado: boolean): void {
    if (!ligado) {
      this.abertas.update(a => ({ ...a, [secao.id]: true }));
      return;
    }
    const padrao = criarEstado(this.template()).valores;
    this.estado.update(e => {
      const valores = { ...e.valores };
      for (const c of secao.campos) {
        valores[c.id] = padrao[c.id];
        delete valores[`${c.id}__nc`];
      }
      return { ...e, valores };
    });
    this.abertas.update(a => ({ ...a, [secao.id]: false }));
    this.copiado.set(false);
  }

  alterarSecaoAberta(secao: Secao): void {
    this.abertas.update(a => ({ ...a, [secao.id]: !this.aberta(secao) }));
  }

  mudou({ id, valor }: MudancaCampo): void {
    this.estado.update(e => aplicar(e, { tipo: 'campo', id, valor }));
    this.copiado.set(false);
  }

  mudouIdade(evento: Event): void {
    const valor = aplicarMascara(evento, mascaraInteiro);
    this.estado.update(e => aplicar(e, { tipo: 'cabecalho', campo: 'idade', valor }));
  }

  mudouCabecalho(campo: keyof Cabecalho, evento: Event): void {
    const valor = (evento.target as HTMLInputElement).value;
    this.estado.update(e => aplicar(e, { tipo: 'cabecalho', campo, valor }));
  }

  volume(id: string): number | null {
    return this.resultado().calculos[`${id}.vol`] ?? null;
  }

  // ----- máscaras: versão nova e antiga -----

  adotarNova(id: string, versao: string): void {
    this.trocarVersao(id, versao);
  }

  manterAtual(id: string): void {
    this._mascaras.manterAtual(id);
  }

  escolherVersao(evento: Event): void {
    this.trocarVersao(this.template().id, (evento.target as HTMLSelectElement).value);
  }

  /** Troca a máscara preservando o que o médico já preencheu nos campos que continuam existindo. */
  private trocarVersao(id: string, versao: string): void {
    const anterior = this.estado();
    this._mascaras.usar(id, versao);
    const novo = criarEstado(this.template());
    const valores = { ...novo.valores };
    for (const chave of Object.keys(valores)) {
      if (chave in anterior.valores) valores[chave] = anterior.valores[chave];
    }
    this.estado.set({ ...novo, cabecalho: anterior.cabecalho, valores });
    this.htmlEditado.set(null);
  }

  // ----- texto, edição e cópia -----

  editando(evento: Event): void {
    const el = evento.target as HTMLElement;
    this.htmlEditado.set(el.innerHTML);
    this._textoEditado = el.innerText;
    this.copiado.set(false);
  }

  /** Comando da barra (negrito, alinhamento...). O mousedown é cancelado para não perder a seleção. */
  formatarTexto(comando: string, valor?: string): void {
    document.execCommand(comando, false, valor);
  }

  valorEm(evento: Event): string {
    return (evento.target as HTMLSelectElement).value;
  }

  voltarAoAutomatico(): void {
    this.htmlEditado.set(null);
  }

  async copiar(): Promise<void> {
    const editado = this.htmlEditado();
    const texto = editado === null ? this.textoAutomatico() : this._textoEditado;
    const html = editado ?? formatar(this.resultado(), 'html');

    const ok = await this._clipboard.copiar(texto, html);
    this.copiado.set(ok);
    this.avisar(ok ? 'Laudo copiado. Cole com Ctrl+V.' : 'Não foi possível copiar. Selecione o texto e use Ctrl+C.');
  }

  novoLaudo(): void {
    if (!this.copiado() && !confirm('O laudo atual não foi copiado. Começar um novo mesmo assim?')) {
      return;
    }
    this.estado.set(criarEstado(this.template()));
    this.htmlEditado.set(null);
    this.abertas.set({});
    this.copiado.set(false);
  }

  @HostListener('document:keydown', ['$event'])
  atalhos(e: KeyboardEvent): void {
    if (!(e.ctrlKey || e.metaKey)) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      void this.copiar();
    } else if (e.key.toLowerCase() === 'n') {
      e.preventDefault();
      this.novoLaudo();
    }
  }

  private avisar(texto: string): void {
    this.mensagem.set(texto);
    setTimeout(() => this.mensagem.set(''), 3500);
  }
}
