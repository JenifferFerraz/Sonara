import { UserEntity, UserWithPasswordEntity } from '../entities/user.entity';

export type CreateUserData = {
  email: string;
  passwordHash: string;
  name: string;
  cpf: string;
  crm: string;
  crmUf: string;
};

export abstract class UsersRepository {
  abstract create(data: CreateUserData): Promise<UserEntity>;
  abstract findById(id: string): Promise<UserEntity | null>;
  abstract findByEmail(email: string): Promise<UserEntity | null>;
  abstract findByCpf(cpf: string): Promise<UserEntity | null>;
  abstract findByEmailWithPassword(
    email: string,
  ): Promise<UserWithPasswordEntity | null>;
}
