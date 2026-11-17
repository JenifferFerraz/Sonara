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

/** Só o que a tela usa. O CPF e outros dados da conta ficam no servidor, não no navegador. */
export function reduzirUsuario(u: Usuario): Usuario {
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
