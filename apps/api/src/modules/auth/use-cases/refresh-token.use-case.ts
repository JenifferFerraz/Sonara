import { UnauthorizedException } from '@errors/exceptions';
import { FindActiveDeviceUseCase } from '@modules/devices/use-cases/find-active.use-case';
import { Injectable } from '@nestjs/common';
import { RefreshTokensRepository } from '../repositories/refresh-tokens.repository';
import { hashToken, IssueSessionUseCase } from './issue-session.use-case';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly _refreshTokens: RefreshTokensRepository,
    private readonly _findActiveDevice: FindActiveDeviceUseCase,
    private readonly _issueSession: IssueSessionUseCase,
  ) {}

  async execute(refreshToken: string) {
    const [id, secret] = refreshToken.split('.');
    if (!id || !secret) throw new UnauthorizedException();

    const stored = await this._refreshTokens.findById(id);
    if (!stored || stored.tokenHash !== hashToken(secret)) {
      throw new UnauthorizedException();
    }

    // Reuso de token já rotacionado: possível roubo, encerra todas as sessões.
    if (stored.revokedAt) {
      await this._refreshTokens.revokeAllByUser(stored.userId);
      throw new UnauthorizedException();
    }
    if (stored.expiresAt < new Date()) throw new UnauthorizedException();

    const device = await this._findActiveDevice.execute({
      userId: stored.userId,
      deviceId: stored.deviceId,
    });
    if (!device) throw new UnauthorizedException('Dispositivo desativado.');

    await this._refreshTokens.revoke(stored.id);
    return this._issueSession.execute({ userId: stored.userId, deviceId: stored.deviceId });
  }
}
