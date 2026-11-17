export class RefreshTokenEntity {
  id: string;
  userId: string;
  deviceId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export abstract class RefreshTokensRepository {
  abstract create(data: Omit<RefreshTokenEntity, 'revokedAt'>): Promise<void>;
  abstract findById(id: string): Promise<RefreshTokenEntity | null>;
  abstract revoke(id: string): Promise<void>;
  /** Uma sessão online por vez: um login novo encerra as anteriores. */
  abstract revokeAllByUser(userId: string): Promise<void>;
  /** Desativar um aparelho encerra as sessões dele. */
  abstract revokeAllByDevice(deviceId: string): Promise<void>;
  /** Sessões que ainda valem (não revogadas e não vencidas). */
  abstract listActiveByUser(userId: string): Promise<RefreshTokenEntity[]>;
}
