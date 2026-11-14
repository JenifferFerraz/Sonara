import { Injectable, computed, inject, signal } from '@angular/core';
import { LicencaPayload, StatusLicenca, verificarLicenca } from '@sonara/laudo-engine';
import { config } from '../config';
import { AuthService } from './auth.service';

export type EstadoLicenca = StatusLicenca | { status: 'sem-licenca' };

const CHAVE_TOKEN = 'sonara.licenca';
const CHAVE_ULTIMA_DATA = 'sonara.ultimaData';
/** Renova com antecedência: o médico quase nunca vê a licença vencer. */
const RENOVAR_COM_ATE_DIAS = 25;

function ler(chave: string): string | null {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
}

function gravar(chave: string, valor: string | null): void {
  try {
    if (valor === null) localStorage.removeItem(chave);
    else localStorage.setItem(chave, valor);
  } catch {
    // Armazenamento bloqueado: a licença vale só nesta sessão do navegador.
  }
}

/**
 * Licença offline: o servidor assina um token de 30 dias e o app confere a assinatura sem internet.
 * Cobre carência de 7 dias, relógio voltado e troca de aparelho.
 */
@Injectable({ providedIn: 'root' })
export class LicencaService {
  private readonly _auth = inject(AuthService);
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
    const { token } = await this._auth.chamar<{ token: string; validoAte: number }>('POST', '/licenses/renew');
    gravar(CHAVE_TOKEN, token);
    await this.avaliar();
  }

  /** Remove a licença deste aparelho (sair da conta). */
  esquecer(): void {
    gravar(CHAVE_TOKEN, null);
    this.estado.set({ status: 'sem-licenca' });
  }

  private async avaliar(): Promise<void> {
    const token = ler(CHAVE_TOKEN);
    const dispositivo = this._auth.dispositivoId;
    if (!token || !dispositivo || !config.chavePublica) {
      this.estado.set({ status: 'sem-licenca' });
      return;
    }
    const agora = Date.now();
    const ultima = Number(ler(CHAVE_ULTIMA_DATA)) || 0;
    const resultado = await verificarLicenca(token, config.chavePublica, dispositivo, agora, ultima);
    // Guarda a maior data já vista: voltar o relógio passa a ser detectado.
    if (resultado.status !== 'relogio') gravar(CHAVE_ULTIMA_DATA, String(Math.max(ultima, agora)));
    this.estado.set(resultado);
  }
}
