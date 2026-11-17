import { AuthGuard } from '@guards/auth.guard';
import { DevicesModule } from '@modules/devices/devices.module';
import { UsersModule } from '@modules/users/users.module';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { env } from '../../env';
import { CheckSessionController } from './controllers/check-session.controller';
import { LoginController } from './controllers/login.controller';
import { LogoutController } from './controllers/logout.controller';
import { MeController } from './controllers/me.controller';
import { RefreshTokenController } from './controllers/refresh-token.controller';
import { RegisterController } from './controllers/register.controller';
import { IssueSessionUseCase } from './use-cases/issue-session.use-case';
import { LoginUseCase } from './use-cases/login.use-case';
import { LogoutUseCase } from './use-cases/logout.use-case';
import { MeUseCase } from './use-cases/me.use-case';
import { RefreshTokenUseCase } from './use-cases/refresh-token.use-case';
import { RegisterUseCase } from './use-cases/register.use-case';
import { SessionsModule } from './sessions.module';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: env.JWT_SECRET,
      signOptions: { expiresIn: env.EXPIRES_IN as never },
    }),
    SessionsModule,
    UsersModule,
    DevicesModule,
  ],
  providers: [
    IssueSessionUseCase,
    RegisterUseCase,
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    MeUseCase,
    AuthGuard,
  ],
  controllers: [
    RegisterController,
    LoginController,
    RefreshTokenController,
    LogoutController,
    CheckSessionController,
    MeController,
  ],
})
export class AuthModule {}
