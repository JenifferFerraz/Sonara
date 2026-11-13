import { Injectable } from '@nestjs/common';
import { RefreshTokensRepository } from '../repositories/refresh-tokens.repository';

@Injectable()
export class LogoutUseCase {
  constructor(private readonly _refreshTokens: RefreshTokensRepository) {}

  async execute(refreshToken: string): Promise<void> {
    const [id] = refreshToken.split('.');
    if (id) await this._refreshTokens.revoke(id).catch(() => undefined);
  }
}
