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
  acesso: 'sonara.accessToken',
  renovacao: 'sonara.refreshToken',
  dispositivo: 'sonara.deviceId',
  usuario: 'sonara.usuario'
} as const;

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
    // Armazenamento bloqueado: a sessão dura só enquanto a aba estiver aberta.
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
 * Sessão do médico: cadastro, login, renovação do token e chamadas à API.
 * Só conta, dispositivos, licença e máscaras passam por aqui; nenhum texto de laudo.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _usuario = signal<Usuario | null>(lerUsuario());
  private readonly _comSessao = signal(Boolean(ler(CHAVES.renovacao)));
  private _renovando: Promise<boolean> | null = null;

  readonly usuario = this._usuario.asReadonly();
  /** Há sessão guardada (token de renovação). Não garante que o servidor ainda a aceite. */
  readonly logado = computed(() => this._comSessao() && this._usuario() !== null);

  /** ID deste aparelho, devolvido pela API no login e reenviado nos logins seguintes. */
  get dispositivoId(): string | null {
    return ler(CHAVES.dispositivo);
  }

  async cadastrar(dados: DadosCadastro): Promise<void> {
    await this.chamar('POST', '/auth/register', dados, false);
  }

  async entrar(email: string, senha: string): Promise<void> {
    const resposta = await this.chamar<{
      user: Usuario;
      deviceId: string;
      accessToken: string;
      refreshToken: string;
    }>(
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
    this.guardarSessao(resposta.accessToken, resposta.refreshToken);
    const usuario = reduzirUsuario(resposta.user);
    gravar(CHAVES.usuario, JSON.stringify(usuario));
    this._usuario.set(usuario);
  }

  /** Encerra a sessão neste aparelho. Se estiver sem internet, encerra só aqui. */
  async sair(): Promise<void> {
    const renovacao = ler(CHAVES.renovacao);
    if (renovacao) {
      try {
        await this.chamar('POST', '/auth/logout', { refreshToken: renovacao }, false);
      } catch {
        // Sem rede ou sessão já encerrada no servidor: segue com a saída local.
      }
    }
    this.limparSessao();
  }

  /** Chama a API com o token; se vier 401, renova a sessão uma vez e tenta de novo. */
  async chamar<T = unknown>(metodo: string, caminho: string, corpo?: unknown, comToken = true): Promise<T> {
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
    const token = ler(CHAVES.acesso);
    if (comToken && token) cabecalhos['Authorization'] = `Bearer ${token}`;
    try {
      return await fetch(`${config.apiUrl}${caminho}`, {
        method: metodo,
        headers: cabecalhos,
        body: corpo === undefined ? undefined : JSON.stringify(corpo)
      });
    } catch {
      throw new ApiErro('Sem conexão com o servidor. Verifique a internet e tente de novo.', 0);
    }
  }

  /** Troca o token de renovação por um novo par. Várias chamadas ao mesmo tempo compartilham uma só. */
  private renovar(): Promise<boolean> {
    this._renovando ??= (async () => {
      const renovacao = ler(CHAVES.renovacao);
      if (!renovacao) return false;
      try {
        const resp = await this.enviar('POST', '/auth/refresh', { refreshToken: renovacao }, false);
        if (!resp.ok) {
          this.limparSessao();
          return false;
        }
        const dados = (await resp.json()) as { accessToken: string; refreshToken: string };
        this.guardarSessao(dados.accessToken, dados.refreshToken);
        return true;
      } catch {
        return false;
      } finally {
        this._renovando = null;
      }
    })();
    return this._renovando;
  }

  private guardarSessao(acesso: string, renovacao: string): void {
    gravar(CHAVES.acesso, acesso);
    gravar(CHAVES.renovacao, renovacao);
    this._comSessao.set(true);
  }

  private limparSessao(): void {
    gravar(CHAVES.acesso, null);
    gravar(CHAVES.renovacao, null);
    gravar(CHAVES.usuario, null);
    this._comSessao.set(false);
    this._usuario.set(null);
  }
}
