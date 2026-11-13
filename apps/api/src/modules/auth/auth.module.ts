import { AuthGuard } from '@guards/auth.guard';
import { DevicesModule } from '@modules/devices/devices.module';
import { UsersModule } from '@modules/users/users.module';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { env } from '../../env';
import { AuthController } from './controllers/auth.controller';
import { PrismaRefreshTokensRepository } from './repositories/prisma-refresh-tokens.repository';
import { RefreshTokensRepository } from './repositories/refresh-tokens.repository';
import { IssueSessionUseCase } from './use-cases/issue-session.use-case';
import { LoginUseCase } from './use-cases/login.use-case';
import { LogoutUseCase } from './use-cases/logout.use-case';
import { MeUseCase } from './use-cases/me.use-case';
import { RefreshTokenUseCase } from './use-cases/refresh-token.use-case';
import { RegisterUseCase } from './use-cases/register.use-case';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: env.JWT_SECRET,
      signOptions: { expiresIn: env.EXPIRES_IN as never },
    }),
    UsersModule,
    DevicesModule,
  ],
  providers: [
    { provide: RefreshTokensRepository, useClass: PrismaRefreshTokensRepository },
    IssueSessionUseCase,
    RegisterUseCase,
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    MeUseCase,
    AuthGuard,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
