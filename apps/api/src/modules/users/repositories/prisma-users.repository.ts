import { PrismaService } from '@database/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { UserEntity, UserWithPasswordEntity } from '../entities/user.entity';
import { CreateUserData, UsersRepository } from './users.repository';

@Injectable()
export class PrismaUsersRepository implements UsersRepository {
  constructor(private readonly _prisma: PrismaService) {}

  create(data: CreateUserData): Promise<UserEntity> {
    return this._prisma.user.create({ data }) as Promise<UserEntity>;
  }

  findById(id: string): Promise<UserEntity | null> {
    return this._prisma.user.findUnique({ where: { id } }) as Promise<UserEntity | null>;
  }

  findByEmail(email: string): Promise<UserEntity | null> {
    return this._prisma.user.findUnique({ where: { email } }) as Promise<UserEntity | null>;
  }

  findByCpf(cpf: string): Promise<UserEntity | null> {
    return this._prisma.user.findUnique({ where: { cpf } }) as Promise<UserEntity | null>;
  }

  findByEmailWithPassword(email: string): Promise<UserWithPasswordEntity | null> {
    return this._prisma.user.findUnique({
      where: { email },
      omit: { passwordHash: false },
    }) as Promise<UserWithPasswordEntity | null>;
  }
}
