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
