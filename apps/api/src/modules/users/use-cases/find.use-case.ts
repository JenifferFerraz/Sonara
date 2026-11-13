import { Injectable } from '@nestjs/common';
import { UserEntity, UserWithPasswordEntity } from '../entities/user.entity';
import { UsersRepository } from '../repositories/users.repository';

@Injectable()
export class FindUserByIdUseCase {
  constructor(private readonly _repository: UsersRepository) {}

  execute(id: string): Promise<UserEntity | null> {
    return this._repository.findById(id);
  }
}

/** Retorna o hash da senha: use só para autenticar. */
@Injectable()
export class FindUserByEmailUseCase {
  constructor(private readonly _repository: UsersRepository) {}

  execute(email: string): Promise<UserWithPasswordEntity | null> {
    return this._repository.findByEmailWithPassword(email.trim().toLowerCase());
  }
}
