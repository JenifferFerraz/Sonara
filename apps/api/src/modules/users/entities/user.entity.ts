export type StatusAssinatura = 'TRIAL' | 'ACTIVE' | 'SUSPENDED';

export class UserEntity {
  id: string;
  email: string;
  name: string;
  cpf: string;
  crm: string;
  crmUf: string;
  emailVerifiedAt: Date | null;
  modulos: string[];
  statusAssinatura: StatusAssinatura;
  createdAt: Date;
}

/** Usuário com hash de senha, usado só no login. */
export class UserWithPasswordEntity extends UserEntity {
  passwordHash: string;
}
