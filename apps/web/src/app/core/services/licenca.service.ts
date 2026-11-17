import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { LicencaPayload, StatusLicenca, verificarLicenca } from '@sonara/laudo-engine';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LicencaStorage, UltimaDataStorage } from '../storage/licenca.storage';
import { AuthService } from './auth.service';

export type EstadoLicenca = StatusLicenca | { status: 'sem-licenca' };

/** Renova com antecedência: o médico quase nunca vê a licença vencer. */
const RENOVAR_COM_ATE_DIAS = 25;

/**
 * Licença offline: o servidor assina um token de 30 dias e o app confere a assinatura sem internet.
 * Cobre carência de 7 dias, relógio voltado e troca de aparelho.
 */
@Injectable({ providedIn: 'root' })
export class LicencaService {
  private readonly _http = inject(HttpClient);
  private readonly _auth = inject(AuthService);
  private readonly _token = inject(LicencaStorage);
  private readonly _ultimaData = inject(UltimaDataStorage);
  private _iniciado = false;

  readonly estado = signal<EstadoLicenca>({ status: 'sem-licenca' });

  /** O app pode ser usado: licença em dia ou na carência. */
  readonly liberada = computed(() => {
    const s = this.estado().status;
    return s === 'ok' || s === 'carencia';
  });

  readonly payload = computed<LicencaPayload | null>(() => {
    const e = this.estado();
    return e.status === 'ok' || e.status === 'carencia' ? e.payload : null;
  });

  readonly modulos = computed(() => this.payload()?.modulos ?? []);

  /** Mensagem sobre o estado da licença para quem não pode entrar, ou aviso de carência. */
  readonly aviso = computed(() => {
    const e = this.estado();
    switch (e.status) {
      case 'carencia':
        return `Sua licença venceu. Conecte-se à internet nos próximos ${e.diasCarencia} dia(s) para renová-la.`;
      case 'expirada':
        return 'Sua licença expirou. Entre com a internet ligada para renová-la.';
      case 'relogio':
        return 'A data do computador voltou no tempo. Acerte o relógio e entre novamente.';
      case 'outro-dispositivo':
        return 'Esta licença pertence a outro aparelho. Entre com sua conta para ativar este.';
      case 'invalida':
        return 'A licença guardada não é válida. Entre novamente para obter uma nova.';
      default:
        return '';
    }
  });

  /** Confere a licença guardada e, com internet e sessão, renova quando está perto do fim. */
  async iniciar(): Promise<void> {
    await this.avaliar();
    if (this._iniciado) return;
    this._iniciado = true;

    const e = this.estado();
    const precisa =
      e.status === 'carencia' ||
      e.status === 'expirada' ||
      e.status === 'sem-licenca' ||
      (e.status === 'ok' && e.diasRestantes <= RENOVAR_COM_ATE_DIAS);
    if (precisa && this._auth.logado() && navigator.onLine) {
      try {
        await this.renovar();
      } catch {
        // Sem rede ou servidor fora: segue com a licença atual (e a carência, se houver).
      }
    }
  }

  /** Pede uma licença nova ao servidor (precisa de sessão) e a confere. */
  async renovar(): Promise<void> {
    const { token } = await firstValueFrom(
      this._http.post<{ token: string; validoAte: number }>(`${environment.apiUrl}/licenses/renew`, {})
    );
    this._token.gravar(token);
    await this.avaliar();
  }

  /** Remove a licença deste aparelho (sair da conta). */
  esquecer(): void {
    this._token.limpar();
    this.estado.set({ status: 'sem-licenca' });
  }

  private async avaliar(): Promise<void> {
    const token = this._token.obter();
    const dispositivo = this._auth.dispositivoId;
    if (!token || !dispositivo || !environment.chavePublica) {
      this.estado.set({ status: 'sem-licenca' });
      return;
    }
    const agora = Date.now();
    const ultima = this._ultimaData.obter();
    const resultado = await verificarLicenca(token, environment.chavePublica, dispositivo, agora, ultima);
    // Guarda a maior data já vista: voltar o relógio passa a ser detectado.
    if (resultado.status !== 'relogio') this._ultimaData.gravar(Math.max(ultima, agora));
    this.estado.set(resultado);
  }
}
