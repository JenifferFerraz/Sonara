import { Global, Module } from '@nestjs/common';
import { PrismaRefreshTokensRepository } from './repositories/prisma-refresh-tokens.repository';
import { RefreshTokensRepository } from './repositories/refresh-tokens.repository';

/** Global: o `AuthGuard` (usado em vários módulos) precisa consultar as sessões. */
@Global()
@Module({
  providers: [{ provide: RefreshTokensRepository, useClass: PrismaRefreshTokensRepository }],
  exports: [RefreshTokensRepository],
})
export class SessionsModule {}
