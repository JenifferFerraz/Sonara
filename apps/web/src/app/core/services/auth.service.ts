import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Subject, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { semToken } from '../interceptors/contexto-http';
import { DadosCadastro } from '../models/usuario.model';
import { DispositivoStorage } from '../storage/dispositivo.storage';
import { SessaoStorage } from '../storage/sessao.storage';
import { TokenAcessoStorage } from '../storage/token-acesso.storage';
import { noNavegador } from '../utils/plataforma';

/** Chaves de versões anteriores, que guardavam tokens no navegador. Removidas ao iniciar. */
const CHAVES_ANTIGAS = ['sonara.accessToken', 'sonara.refreshToken', 'sonara.usuario'];

export type MotivoSaida = 'outro-aparelho' | 'expirou';

const MENSAGENS_SAIDA: Record<MotivoSaida, string> = {
  'outro-aparelho': 'Sua conta foi aberta em outro aparelho. Entre novamente para continuar neste.',
  expirou: 'Sua sessão expirou. Entre novamente.'
};

interface RespostaLogin {
  deviceId: string;
  accessToken: string;
}

/** Nome do aparelho para o painel de dispositivos. */
function nomeDoAparelho(): string {
  const ua = navigator.userAgent;
  const navegador = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : 'Navegador';
  const sistema = /Windows/.test(ua) ? 'Windows' : /Mac OS/.test(ua) ? 'macOS' : /Android/.test(ua) ? 'Android' : /Linux/.test(ua) ? 'Linux' : '';
  return sistema ? `${navegador} no ${sistema}` : navegador;
}

/**
 * Sessão do médico: cadastro, login, saída e renovação.
 *
 * Os tokens não ficam no armazenamento do navegador:
 * - o de renovação vive num cookie `httpOnly` definido pela API (o JavaScript não o lê);
 * - o de acesso (curto) fica só em memória (`TokenAcessoStorage`).
 * Os interceptors em `core/interceptors` põem o token nas chamadas e renovam a sessão quando preciso.
 *
 * Nenhum texto de laudo passa por aqui.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _http = inject(HttpClient);
  private readonly _token = inject(TokenAcessoStorage);
  private readonly _sessaoStorage = inject(SessaoStorage);
  private readonly _dispositivo = inject(DispositivoStorage);

  private readonly _sessao = signal(this._sessaoStorage.obter());
  private _renovando: Promise<boolean> | null = null;

  /** Há conta entrada neste aparelho. O servidor ainda pode recusar a sessão (aí volta para o login). */
  readonly logado = computed(() => this._sessao());

  /** Por que a sessão acabou, para a tela de login explicar. Vazio se a pessoa saiu por conta própria. */
  readonly motivoSaida = signal('');
  /** Avisa quem precisa reagir (limpar a licença, ir para o login) quando o servidor encerra a sessão. */
  readonly sessaoEncerrada = new Subject<MotivoSaida>();

  constructor() {
    this.apagarChavesAntigas();
  }

  /** ID deste aparelho, devolvido pela API no login e reenviado nos logins seguintes. */
  get dispositivoId(): string | null {
    return this._dispositivo.obter();
  }

  temSessao(): boolean {
    return this._sessao();
  }

  async cadastrar(dados: DadosCadastro): Promise<void> {
    await firstValueFrom(this._http.post(`${environment.apiUrl}/auth/register`, dados, { context: semToken() }));
  }

  async entrar(email: string, senha: string): Promise<void> {
    const dispositivoId = this.dispositivoId;
    const resposta = await firstValueFrom(
      this._http.post<RespostaLogin>(
        `${environment.apiUrl}/auth/login`,
        {
          email,
          password: senha,
          deviceName: nomeDoAparelho(),
          ...(dispositivoId ? { deviceId: dispositivoId } : {})
        },
        { context: semToken() }
      )
    );
    this.motivoSaida.set('');
    this._dispositivo.gravar(resposta.deviceId);
    this._token.gravar(resposta.accessToken);
    this._sessaoStorage.gravar(true);
    this._sessao.set(true);
  }

  /** Encerra a sessão neste aparelho. Se estiver sem internet, encerra só aqui. */
  async sair(): Promise<void> {
    try {
      await firstValueFrom(this._http.post(`${environment.apiUrl}/auth/logout`, {}, { context: semToken() }));
    } catch {
      // Sem rede ou sessão já encerrada no servidor: segue com a saída local.
    }
    this.limparSessao();
  }

  /**
   * Troca o cookie de renovação por um novo token de acesso. Chamadas simultâneas compartilham uma só.
   * Devolve `false` se não deu (sessão recusada ou sem rede).
   */
  renovarSessao(): Promise<boolean> {
    this._renovando ??= (async () => {
      try {
        const { accessToken } = await firstValueFrom(
          this._http.post<{ accessToken: string }>(`${environment.apiUrl}/auth/refresh`, {}, { context: semToken() })
        );
        this._token.gravar(accessToken);
        return true;
      } catch (erro) {
        // 401 e 403: sessão expirada ou aberta em outro aparelho. Sem rede mantém a conta entrada;
        // a licença offline continua valendo.
        const status = (erro as { status?: number }).status;
        if (status === 401 || status === 403) this.encerrarSessaoRemota('expirou');
        return false;
      } finally {
        this._renovando = null;
      }
    })();
    return this._renovando;
  }

  /**
   * Confere no servidor se a sessão continua valendo. O app chama de tempos em tempos para descobrir
   * logo que o médico entrou em outro aparelho (aí o interceptor encerra a sessão aqui).
   */
  async conferirSessao(): Promise<void> {
    await firstValueFrom(this._http.get(`${environment.apiUrl}/auth/session`));
  }

  /** O servidor encerrou a sessão (outro aparelho entrou, ou ela venceu): desconecta aqui. */
  encerrarSessaoRemota(motivo: MotivoSaida): void {
    if (!this._sessao()) return;
    this.limparSessao();
    this.motivoSaida.set(MENSAGENS_SAIDA[motivo]);
    this.sessaoEncerrada.next(motivo);
  }

  private limparSessao(): void {
    this._token.limpar();
    this._sessaoStorage.limpar();
    this._sessao.set(false);
  }

  private apagarChavesAntigas(): void {
    if (!noNavegador()) return;
    for (const chave of CHAVES_ANTIGAS) {
      try {
        localStorage.removeItem(chave);
      } catch {
        // Armazenamento bloqueado: nada a apagar.
      }
    }
  }
}
