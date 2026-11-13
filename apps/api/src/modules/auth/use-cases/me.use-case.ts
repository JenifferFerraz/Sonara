import { NotFoundException } from '@errors/exceptions';
import { FindUserByIdUseCase } from '@modules/users/use-cases/find.use-case';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MeUseCase {
  constructor(private readonly _findUserById: FindUserByIdUseCase) {}

  async execute(userId: string) {
    const user = await this._findUserById.execute(userId);
    if (!user) throw new NotFoundException('Usuário');
    return user;
  }
}
