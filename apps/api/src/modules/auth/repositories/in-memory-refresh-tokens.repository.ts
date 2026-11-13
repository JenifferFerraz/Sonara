import { RefreshTokenEntity, RefreshTokensRepository } from './refresh-tokens.repository';

export class InMemoryRefreshTokensRepository implements RefreshTokensRepository {
  public items: RefreshTokenEntity[] = [];

  async create(data: Omit<RefreshTokenEntity, 'revokedAt'>) {
    this.items.push({ ...data, revokedAt: null });
  }

  async findById(id: string) {
    return this.items.find(item => item.id === id) ?? null;
  }

  async revoke(id: string) {
    const token = await this.findById(id);
    if (token) token.revokedAt = new Date();
  }

  async revokeAllByUser(userId: string) {
    this.items
      .filter(item => item.userId === userId && !item.revokedAt)
      .forEach(item => (item.revokedAt = new Date()));
  }
}
