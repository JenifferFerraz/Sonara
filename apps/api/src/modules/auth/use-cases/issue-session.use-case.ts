import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { env } from '../../../env';
import { RefreshTokensRepository } from '../repositories/refresh-tokens.repository';

const UNIDADES_MS: Record<string, number> = {
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

/** "30d" -> milissegundos. */
export function duracaoEmMs(valor: string): number {
  const match = /^(\d+)([mhd])$/.exec(valor);
  if (!match) throw new Error(`Duração inválida: ${valor}`);
  return Number(match[1]) * UNIDADES_MS[match[2]];
}

export const hashToken = (secret: string) =>
  createHash('sha256').update(secret).digest('hex');

export type Session = { accessToken: string; refreshToken: string };

@Injectable()
export class IssueSessionUseCase {
  constructor(
    private readonly _jwt: JwtService,
    private readonly _refreshTokens: RefreshTokensRepository,
  ) {}

  /** Refresh token no formato `id.segredo`; só o hash do segredo é guardado. */
  async execute({ userId, deviceId }: { userId: string; deviceId: string }): Promise<Session> {
    const id = randomUUID();
    const secret = randomBytes(32).toString('base64url');

    await this._refreshTokens.create({
      id,
      userId,
      deviceId,
      tokenHash: hashToken(secret),
      expiresAt: new Date(Date.now() + duracaoEmMs(env.EXPIRES_IN_REFRESH_TOKEN)),
    });

    const accessToken = await this._jwt.signAsync({ sub: userId, deviceId });
    return { accessToken, refreshToken: `${id}.${secret}` };
  }
}
