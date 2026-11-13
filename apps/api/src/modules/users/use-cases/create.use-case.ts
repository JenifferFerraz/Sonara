import { AlreadyExistsException } from '@errors/exceptions';
import { Injectable } from '@nestjs/common';
import { hash } from 'bcrypt';
import { UserEntity } from '../entities/user.entity';
import { UsersRepository } from '../repositories/users.repository';

export type CreateUserParams = {
  email: string;
  password: string;
  name: string;
  cpf: string;
  crm: string;
  crmUf: string;
};

@Injectable()
export class CreateUserUseCase {
  constructor(private readonly _repository: UsersRepository) {}

  async execute({ password, ...data }: CreateUserParams): Promise<UserEntity> {
    const email = data.email.trim().toLowerCase();
    const cpf = data.cpf.replace(/\D/g, '');

    if (await this._repository.findByEmail(email)) {
      throw new AlreadyExistsException('E-mail');
    }
    if (await this._repository.findByCpf(cpf)) {
      throw new AlreadyExistsException('CPF');
    }

    return this._repository.create({
      ...data,
      email,
      cpf,
      crmUf: data.crmUf.toUpperCase(),
      passwordHash: await hash(password, 10),
    });
  }
}
