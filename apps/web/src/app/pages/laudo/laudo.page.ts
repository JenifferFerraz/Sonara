import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
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
import { CampoComponent, MudancaCampo } from '../../shared/campo/campo.component';
import { aplicarMascara, mascaraInteiro } from '../../shared/mascaras';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

@Component({
  selector: 'app-laudo-page',
  imports: [CampoComponent],
  templateUrl: './laudo.page.html',
  styleUrl: './laudo.page.scss'
})
export class LaudoPage {
  private readonly _mascaras = inject(MascaraService);
  private readonly _clipboard = inject(ClipboardService);
  private readonly _sanitizer = inject(DomSanitizer);

  readonly abas = computed(() => this._mascaras.emUso().map(t => ({ id: t.id, titulo: t.titulo })));
  readonly abaAtiva = signal('transvaginal');
  readonly pendencias = this._mascaras.pendencias;

  /** Máscara em uso do exame aberto. */
  readonly template = computed(
    () => this._mascaras.emUso().find(t => t.id === this.abaAtiva()) ?? this._mascaras.emUso()[0]
  );
  readonly versoes = computed(() => {
    const m = this._mascaras.instaladas()[this.template().id];
    return Object.values(m.versoes).map(t => t.versao);
  });

  readonly estado = signal<Estado>(criarEstado(this.template()));
  readonly resultado = computed(() => gerar(this.template(), this.estado()));
  readonly visiveis = computed(() => camposVisiveis(this.template(), this.estado()));
  readonly vazios = computed(() => this.resultado().alertas.filter(a => a.tipo === 'obrigatorio'));
  readonly avisos = computed(() => this.resultado().alertas.filter(a => a.tipo === 'referencia'));

  /** Texto editado à mão: o laudo para de se atualizar sozinho. */
  readonly textoEditado = signal<string | null>(null);
  readonly copiado = signal(false);
  readonly mensagem = signal('');
  readonly abertas = signal<Record<string, boolean>>({});

  readonly textoAutomatico = computed(() => formatar(this.resultado(), 'texto'));
  readonly htmlLaudo = computed(() =>
    // O HTML é montado pelo engine com todo texto escapado.
    this._sanitizer.bypassSecurityTrustHtml(formatar(this.resultado(), 'html'))
  );

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

  /** Seções com medida obrigatória ficam sempre abertas. */
  fixa(secao: Secao): boolean {
    return secao.campos.some(c => c.obrigatorio && c.tipo !== 'check');
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
    this.textoEditado.set(null);
  }

  // ----- texto, edição e cópia -----

  editar(): void {
    this.textoEditado.set(this.textoAutomatico());
  }

  editando(evento: Event): void {
    this.textoEditado.set((evento.target as HTMLTextAreaElement).value);
    this.copiado.set(false);
  }

  voltarAoAutomatico(): void {
    this.textoEditado.set(null);
  }

  private textoParaHtml(texto: string): string {
    return texto
      .split(/\n{2,}/)
      .map((bloco, i) => {
        const linhas = esc(bloco).replace(/\n/g, '<br>');
        if (i === 0) return `<p style="text-align:center"><b>${linhas}</b></p>`;
        if (bloco.startsWith('IMPRESSÃO DIAGNÓSTICA:')) {
          const [titulo, ...resto] = linhas.split('<br>');
          return `<p><b>${titulo}</b><br>${resto.join('<br>')}</p>`;
        }
        return `<p style="text-align:justify">${linhas}</p>`;
      })
      .join('\n');
  }

  async copiar(): Promise<void> {
    const editado = this.textoEditado();
    const texto = editado ?? this.textoAutomatico();
    const html = editado === null ? formatar(this.resultado(), 'html') : this.textoParaHtml(editado);

    const ok = await this._clipboard.copiar(texto, html);
    this.copiado.set(ok);
    this.avisar(ok ? 'Laudo copiado. Cole com Ctrl+V.' : 'Não foi possível copiar. Selecione o texto e use Ctrl+C.');
  }

  novoLaudo(): void {
    if (!this.copiado() && !confirm('O laudo atual não foi copiado. Começar um novo mesmo assim?')) {
      return;
    }
    this.estado.set(criarEstado(this.template()));
    this.textoEditado.set(null);
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
