/** Erro da API (ou de rede) com a mensagem que pode ser mostrada ao médico. */
export class ApiErro extends Error {
  constructor(
    mensagem: string,
    readonly status: number,
    readonly titulo = '',
    /** Código legível pelo app (ex.: SESSAO_ENCERRADA). */
    readonly codigo = ''
  ) {
    super(mensagem);
  }
}

/** A sessão foi encerrada no servidor: o médico entrou em outro aparelho ou o aparelho foi desativado. */
export const CODIGO_SESSAO_ENCERRADA = 'SESSAO_ENCERRADA';
