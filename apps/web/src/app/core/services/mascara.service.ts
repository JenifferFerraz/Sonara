import { Injectable, computed, signal } from '@angular/core';
import { Template, verificarMascara } from '@sonara/laudo-engine';
import { templates } from '@sonara/templates';
import { config } from '../config';

/** Versões instaladas de uma máscara. As antigas ficam guardadas: o médico decide quando trocar. */
export interface MascaraInstalada {
  emUso: string;
  versoes: Record<string, Template>;
  /** Versão nova baixada, aguardando a decisão do médico. */
  pendente: string | null;
  /** Versões novas que o médico já recusou (não avisa de novo). */
  recusadas: string[];
}

type Instaladas = Record<string, MascaraInstalada>;

const CHAVE = 'sonara.mascaras';

@Injectable({ providedIn: 'root' })
export class MascaraService {
  private readonly _instaladas = signal<Instaladas>(this.carregar());

  readonly instaladas = this._instaladas.asReadonly();

  /** Máscaras em uso, uma por exame. */
  readonly emUso = computed(() =>
    Object.values(this._instaladas()).map(m => m.versoes[m.emUso])
  );

  /** Máscaras com versão nova esperando decisão. */
  readonly pendencias = computed(() =>
    Object.entries(this._instaladas())
      .filter(([, m]) => m.pendente)
      .map(([id, m]) => ({
        id,
        atual: m.versoes[m.emUso],
        nova: m.versoes[m.pendente as string]
      }))
  );

  constructor() {
    // O build já traz as máscaras: funciona offline desde o primeiro acesso.
    for (const t of Object.values(templates)) this.registrar(t, false);
  }

  /** Registra uma máscara. Se for versão diferente da em uso, vira pendência. */
  registrar(template: Template, avisar = true): void {
    const atual = this._instaladas();
    const existente = atual[template.id];

    if (!existente) {
      this.salvar({
        ...atual,
        [template.id]: {
          emUso: template.versao,
          versoes: { [template.versao]: template },
          pendente: null,
          recusadas: []
        }
      });
      return;
    }

    const versoes = { ...existente.versoes, [template.versao]: template };
    const nova =
      avisar &&
      template.versao !== existente.emUso &&
      !existente.recusadas.includes(template.versao);

    this.salvar({
      ...atual,
      [template.id]: { ...existente, versoes, pendente: nova ? template.versao : existente.pendente }
    });
  }

  /** Passa a usar uma versão já instalada (nova ou antiga). */
  usar(id: string, versao: string): void {
    const m = this._instaladas()[id];
    if (!m?.versoes[versao]) return;
    this.salvar({
      ...this._instaladas(),
      [id]: { ...m, emUso: versao, pendente: m.pendente === versao ? null : m.pendente }
    });
  }

  /** Mantém a versão atual e não avisa mais desta versão nova (continua instalada). */
  manterAtual(id: string): void {
    const m = this._instaladas()[id];
    if (!m?.pendente) return;
    this.salvar({
      ...this._instaladas(),
      [id]: { ...m, recusadas: [...m.recusadas, m.pendente], pendente: null }
    });
  }

  /**
   * Baixa as máscaras assinadas. O app recusa qualquer arquivo cuja assinatura não confira.
   * Precisa de sessão (token guardado pelo login); sem token ou sem internet, não faz nada.
   */
  async buscarAtualizacoes(): Promise<void> {
    const token = this.lerToken();
    if (!token || !config.chavePublica || !navigator.onLine) return;

    try {
      const resp = await fetch(`${config.apiUrl}/masks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!resp.ok) return;
      const lista = (await resp.json()) as { json: string; assinatura: string }[];

      for (const item of lista) {
        if (await verificarMascara(item.json, item.assinatura, config.chavePublica)) {
          this.registrar(JSON.parse(item.json) as Template);
        }
      }
    } catch {
      // Sem rede ou API fora do ar: segue com o que já está instalado.
    }
  }

  private lerToken(): string | null {
    try {
      return localStorage.getItem('sonara.accessToken');
    } catch {
      return null;
    }
  }

  private carregar(): Instaladas {
    try {
      return JSON.parse(localStorage.getItem(CHAVE) ?? '{}') as Instaladas;
    } catch {
      return {};
    }
  }

  private salvar(valor: Instaladas): void {
    this._instaladas.set(valor);
    try {
      localStorage.setItem(CHAVE, JSON.stringify(valor));
    } catch {
      // Armazenamento bloqueado: continua só em memória.
    }
  }
}
