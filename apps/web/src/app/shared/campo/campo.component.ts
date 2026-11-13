import { Component, computed, input, output } from '@angular/core';
import { Alerta, Campo, Dims, ItemLista, ListaValor } from '@sonara/laudo-engine';

export interface MudancaCampo {
  id: string;
  valor: unknown;
}

/** Monta o controle de um campo da máscara a partir do tipo (seg, check, num, dims, list...). */
@Component({
  selector: 'app-campo',
  templateUrl: './campo.component.html',
  styleUrl: './campo.component.scss'
})
export class CampoComponent {
  readonly campo = input.required<Campo>();
  readonly valores = input.required<Record<string, unknown>>();
  readonly alertas = input<Alerta[]>([]);
  readonly volume = input<number | null>(null);

  readonly mudou = output<MudancaCampo>();

  readonly naoCitar = computed(() => Boolean(this.valores()[`${this.campo().id}__nc`]));

  readonly comAlerta = computed(() => {
    const id = this.campo().id;
    return this.alertas().some(
      a => a.tipo === 'obrigatorio' && (a.campo === id || a.campo.startsWith(`${id}[`))
    );
  });

  texto(): string {
    const v = this.valores()[this.campo().id];
    return typeof v === 'string' ? v : '';
  }

  marcado(): boolean {
    return Boolean(this.valores()[this.campo().id]);
  }

  dims(): Dims {
    return (this.valores()[this.campo().id] as Dims) ?? { a: '', b: '', c: '' };
  }

  lista(): ListaValor {
    return (
      (this.valores()[this.campo().id] as ListaValor) ?? { multiplos: false, maior: '', itens: [] }
    );
  }

  selecionados(): string[] {
    const v = this.valores()[this.campo().id];
    return Array.isArray(v) ? (v as string[]) : [];
  }

  emitir(valor: unknown, id = this.campo().id): void {
    this.mudou.emit({ id, valor });
  }

  mudarDims(eixo: keyof Dims, valor: string): void {
    this.emitir({ ...this.dims(), [eixo]: valor });
  }

  alternarMulti(valor: string, ligado: boolean): void {
    const atual = this.selecionados();
    this.emitir(ligado ? [...atual, valor] : atual.filter(v => v !== valor));
  }

  // ----- listas -----

  itemVazio(): ItemLista {
    const item: ItemLista = {};
    for (const sub of this.campo().itens ?? []) {
      item[sub.id] = String(sub.padrao ?? sub.opcoes?.[0]?.valor ?? '');
    }
    return item;
  }

  adicionar(): void {
    const l = this.lista();
    this.emitir({ ...l, itens: [...l.itens, this.itemVazio()] });
  }

  remover(indice: number): void {
    const l = this.lista();
    this.emitir({ ...l, itens: l.itens.filter((_, i) => i !== indice) });
  }

  mudarItem(indice: number, subId: string, valor: string): void {
    const l = this.lista();
    this.emitir({
      ...l,
      itens: l.itens.map((item, i) => (i === indice ? { ...item, [subId]: valor } : item))
    });
  }

  mudarMultiplos(multiplos: boolean): void {
    this.emitir({ ...this.lista(), multiplos });
  }

  mudarMaior(maior: string): void {
    this.emitir({ ...this.lista(), maior });
  }

  itemSemMedida(indice: number, subId: string): boolean {
    return this.alertas().some(a => a.campo === `${this.campo().id}[${indice}].${subId}`);
  }

  valorEm(evento: Event): string {
    return (evento.target as HTMLInputElement).value;
  }

  checadoEm(evento: Event): boolean {
    return (evento.target as HTMLInputElement).checked;
  }
}
