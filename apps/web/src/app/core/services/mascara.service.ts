import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Template, verificarMascara } from '@sonara/laudo-engine';
import { templates } from '@sonara/templates';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CacheService } from '../cache/cache.service';
import { MascaraInstalada, MascarasInstaladas } from '../models/mascara-instalada.model';
import { MascarasStorage } from '../storage/mascaras.storage';
import { AuthService } from './auth.service';
import { LicencaService } from './licenca.service';

export type { MascaraInstalada } from '../models/mascara-instalada.model';

/** Não pergunta ao servidor por máscaras novas mais de uma vez por hora. */
const VALIDADE_BUSCA_MS = 60 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class MascaraService {
  private readonly _http = inject(HttpClient);
  private readonly _armazenamento = inject(MascarasStorage);
  private readonly _cache = inject(CacheService);
  private readonly _licenca = inject(LicencaService);
  private readonly _auth = inject(AuthService);

  private readonly _instaladas = signal<MascarasInstaladas>(this._armazenamento.obter());

  readonly instaladas = this._instaladas.asReadonly();

  /** Máscaras em uso, uma por exame, só dos módulos que a licença libera. */
  readonly emUso = computed(() => {
    const modulos = this._licenca.modulos();
    return Object.values(this._instaladas())
      .map((m: MascaraInstalada) => m.versoes[m.emUso])
      .filter(t => !t.modulo || modulos.includes(t.modulo));
  });

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
   * Precisa de sessão; sem sessão ou sem internet, não faz nada. Repete no máximo a cada hora.
   */
  async buscarAtualizacoes(): Promise<void> {
    if (!this._auth.logado() || !environment.chavePublica || !navigator.onLine) return;

    try {
      const lista = await this._cache.obterOuBuscar('mascaras', VALIDADE_BUSCA_MS, () =>
        firstValueFrom(this._http.get<{ json: string; assinatura: string }[]>(`${environment.apiUrl}/masks`))
      );
      for (const item of lista) {
        if (await verificarMascara(item.json, item.assinatura, environment.chavePublica)) {
          this.registrar(JSON.parse(item.json) as Template);
        }
      }
    } catch {
      // Sem rede ou API fora do ar: segue com o que já está instalado.
    }
  }

  private salvar(valor: MascarasInstaladas): void {
    this._instaladas.set(valor);
    this._armazenamento.gravar(valor);
  }
}
