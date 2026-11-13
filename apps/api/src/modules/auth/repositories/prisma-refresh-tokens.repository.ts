import { PrismaService } from '@database/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { RefreshTokenEntity, RefreshTokensRepository } from './refresh-tokens.repository';

@Injectable()
export class PrismaRefreshTokensRepository implements RefreshTokensRepository {
  constructor(private readonly _prisma: PrismaService) {}

  async create(data: Omit<RefreshTokenEntity, 'revokedAt'>): Promise<void> {
    await this._prisma.refreshToken.create({ data });
  }

  findById(id: string): Promise<RefreshTokenEntity | null> {
    return this._prisma.refreshToken.findUnique({ where: { id } });
  }

  async revoke(id: string): Promise<void> {
    await this._prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllByUser(userId: string): Promise<void> {
    await this._prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
