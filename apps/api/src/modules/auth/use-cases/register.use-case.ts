import { CreateUserUseCase } from '@modules/users/use-cases/create.use-case';
import { Injectable } from '@nestjs/common';
import { RegisterDto } from '../dto/register.dto';

@Injectable()
export class RegisterUseCase {
  constructor(private readonly _createUser: CreateUserUseCase) {}

  // TODO: confirmar e-mail e conferir o CRM na consulta pública do CFM.
  async execute(data: RegisterDto) {
    return this._createUser.execute(data);
  }
}
