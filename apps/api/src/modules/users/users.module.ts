import { Module } from '@nestjs/common';
import { CreateUserUseCase } from './use-cases/create.use-case';
import { FindUserByEmailUseCase, FindUserByIdUseCase } from './use-cases/find.use-case';
import { PrismaUsersRepository } from './repositories/prisma-users.repository';
import { UsersRepository } from './repositories/users.repository';

@Module({
  providers: [
    { provide: UsersRepository, useClass: PrismaUsersRepository },
    CreateUserUseCase,
    FindUserByEmailUseCase,
    FindUserByIdUseCase,
  ],
  exports: [CreateUserUseCase, FindUserByEmailUseCase, FindUserByIdUseCase],
})
export class UsersModule {}
