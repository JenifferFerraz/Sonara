import { randomUUID } from 'node:crypto';
import { UserEntity, UserWithPasswordEntity } from '../entities/user.entity';
import { CreateUserData, UsersRepository } from './users.repository';

export class InMemoryUsersRepository implements UsersRepository {
  public items: UserWithPasswordEntity[] = [];

  async create(data: CreateUserData): Promise<UserEntity> {
    const user: UserWithPasswordEntity = {
      id: randomUUID(),
      ...data,
      emailVerifiedAt: null,
      modulos: ['abdome', 'pelve', 'tireoide', 'mamas'],
      statusAssinatura: 'TRIAL',
      createdAt: new Date(),
    };
    this.items.push(user);
    return this.sanitize(user);
  }

  async findById(id: string) {
    const user = this.items.find(item => item.id === id);
    return user ? this.sanitize(user) : null;
  }

  async findByEmail(email: string) {
    const user = this.items.find(item => item.email === email);
    return user ? this.sanitize(user) : null;
  }

  async findByCpf(cpf: string) {
    const user = this.items.find(item => item.cpf === cpf);
    return user ? this.sanitize(user) : null;
  }

  async findByEmailWithPassword(email: string) {
    return this.items.find(item => item.email === email) ?? null;
  }

  private sanitize({ passwordHash: _, ...user }: UserWithPasswordEntity): UserEntity {
    return user;
  }
}
