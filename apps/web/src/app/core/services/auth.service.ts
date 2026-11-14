import { Injectable, computed, signal } from '@angular/core';
import { config } from '../config';

export interface Usuario {
  id: string;
  email: string;
  name: string;
  crm: string;
  crmUf: string;
  modulos: string[];
  statusAssinatura: string;
}

export interface DadosCadastro {
  email: string;
  password: string;
  name: string;
  cpf: string;
  crm: string;
  crmUf: string;
}

/** Erro da API (ou de rede) com a mensagem que pode ser mostrada ao médico. */
export class ApiErro extends Error {
  constructor(
    mensagem: string,
    readonly status: number,
    readonly titulo = ''
  ) {
    super(mensagem);
  }
}

const CHAVES = {
  dispositivo: 'sonara.deviceId',
  usuario: 'sonara.usuario'
} as const;

/** Chaves de versões anteriores, que guardavam tokens no navegador. Removidas ao iniciar. */
const CHAVES_ANTIGAS = ['sonara.accessToken', 'sonara.refreshToken'];

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
    // Armazenamento bloqueado: segue só em memória.
  }
}

/** Só o que a tela usa. O CPF e outros dados da conta ficam no servidor, não no navegador. */
function reduzirUsuario(u: Usuario): Usuario {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    crm: u.crm,
    crmUf: u.crmUf,
    modulos: u.modulos,
    statusAssinatura: u.statusAssinatura
  };
}

function lerUsuario(): Usuario | null {
  try {
    const guardado = JSON.parse(ler(CHAVES.usuario) ?? 'null') as Usuario | null;
    return guardado ? reduzirUsuario(guardado) : null;
  } catch {
    return null;
  }
}

/** Nome do aparelho para o painel de dispositivos. */
function nomeDoAparelho(): string {
  const ua = navigator.userAgent;
  const navegador = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : 'Navegador';
  const sistema = /Windows/.test(ua) ? 'Windows' : /Mac OS/.test(ua) ? 'macOS' : /Android/.test(ua) ? 'Android' : /Linux/.test(ua) ? 'Linux' : '';
  return sistema ? `${navegador} no ${sistema}` : navegador;
}

/**
 * Sessão do médico: cadastro, login, renovação e chamadas à API.
 *
 * Os tokens não ficam no armazenamento do navegador:
 * - o token de renovação vive num cookie `httpOnly` definido pela API (o JavaScript não o lê);
 * - o token de acesso (curto) fica só em memória e é pedido de novo ao recarregar a página.
 * Só dados não sensíveis (nome, CRM, ID do aparelho) ficam no `localStorage`.
 *
 * Nenhum texto de laudo passa por aqui.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _usuario = signal<Usuario | null>(lerUsuario());
  private _acesso: string | null = null;
  private _renovando: Promise<boolean> | null = null;

  readonly usuario = this._usuario.asReadonly();
  /** Há conta entrada neste aparelho. O servidor ainda pode recusar a sessão (aí volta para o login). */
  readonly logado = computed(() => this._usuario() !== null);

  constructor() {
    for (const chave of CHAVES_ANTIGAS) gravar(chave, null);
  }

  /** ID deste aparelho, devolvido pela API no login e reenviado nos logins seguintes. */
  get dispositivoId(): string | null {
    return ler(CHAVES.dispositivo);
  }

  async cadastrar(dados: DadosCadastro): Promise<void> {
    await this.chamar('POST', '/auth/register', dados, false);
  }

  async entrar(email: string, senha: string): Promise<void> {
    const resposta = await this.chamar<{ user: Usuario; deviceId: string; accessToken: string }>(
      'POST',
      '/auth/login',
      {
        email,
        password: senha,
        deviceName: nomeDoAparelho(),
        ...(this.dispositivoId ? { deviceId: this.dispositivoId } : {})
      },
      false
    );
    gravar(CHAVES.dispositivo, resposta.deviceId);
    this._acesso = resposta.accessToken;
    const usuario = reduzirUsuario(resposta.user);
    gravar(CHAVES.usuario, JSON.stringify(usuario));
    this._usuario.set(usuario);
  }

  /** Encerra a sessão neste aparelho. Se estiver sem internet, encerra só aqui. */
  async sair(): Promise<void> {
    try {
      await this.chamar('POST', '/auth/logout', {}, false);
    } catch {
      // Sem rede ou sessão já encerrada no servidor: segue com a saída local.
    }
    this.limparSessao();
  }

  /** Chama a API com o token; se vier 401, renova a sessão uma vez e tenta de novo. */
  async chamar<T = unknown>(metodo: string, caminho: string, corpo?: unknown, comToken = true): Promise<T> {
    // Recarregou a página: o token de acesso (em memória) sumiu. Pede outro pelo cookie.
    if (comToken && !this._acesso && this._usuario()) await this.renovar();

    const enviar = () => this.enviar(metodo, caminho, corpo, comToken);
    let resp = await enviar();
    if (resp.status === 401 && comToken && (await this.renovar())) resp = await enviar();

    if (resp.status === 204) return undefined as T;
    const dados = await resp.json().catch(() => null);
    if (!resp.ok) {
      const msg = dados?.userMessage;
      throw new ApiErro(msg?.description ?? 'Não foi possível concluir a operação.', resp.status, msg?.title ?? '');
    }
    return dados as T;
  }

  private async enviar(metodo: string, caminho: string, corpo: unknown, comToken: boolean): Promise<Response> {
    const cabecalhos: Record<string, string> = { 'Content-Type': 'application/json' };
    if (comToken && this._acesso) cabecalhos['Authorization'] = `Bearer ${this._acesso}`;
    try {
      return await fetch(`${config.apiUrl}${caminho}`, {
        method: metodo,
        headers: cabecalhos,
        // Leva e recebe o cookie httpOnly do refresh token (o navegador o envia só às rotas /auth).
        credentials: 'include',
        body: corpo === undefined ? undefined : JSON.stringify(corpo)
      });
    } catch {
      throw new ApiErro('Sem conexão com o servidor. Verifique a internet e tente de novo.', 0);
    }
  }

  /** Troca o cookie de renovação por um novo token de acesso. Chamadas simultâneas compartilham uma só. */
  private renovar(): Promise<boolean> {
    this._renovando ??= (async () => {
      try {
        const resp = await this.enviar('POST', '/auth/refresh', {}, false);
        if (!resp.ok) {
          // Sessão recusada pelo servidor (expirada ou aberta em outro aparelho).
          if (resp.status === 401 || resp.status === 403) this.limparSessao();
          return false;
        }
        const dados = (await resp.json()) as { accessToken: string };
        this._acesso = dados.accessToken;
        return true;
      } catch {
        // Sem rede: mantém a conta entrada; a licença offline continua valendo.
        return false;
      } finally {
        this._renovando = null;
      }
    })();
    return this._renovando;
  }

  private limparSessao(): void {
    this._acesso = null;
    gravar(CHAVES.usuario, null);
    this._usuario.set(null);
  }
}
