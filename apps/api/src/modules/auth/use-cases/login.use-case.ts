import { RegisterDeviceUseCase } from '@modules/devices/use-cases/register.use-case';
import { FindUserByEmailUseCase } from '@modules/users/use-cases/find.use-case';
import { UnauthorizedException, ForbiddenException } from '@errors/exceptions';
import { Injectable } from '@nestjs/common';
import { compare } from 'bcrypt';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokensRepository } from '../repositories/refresh-tokens.repository';
import { IssueSessionUseCase } from './issue-session.use-case';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly _findUserByEmail: FindUserByEmailUseCase,
    private readonly _registerDevice: RegisterDeviceUseCase,
    private readonly _refreshTokens: RefreshTokensRepository,
    private readonly _issueSession: IssueSessionUseCase,
  ) {}

  async execute(data: LoginDto) {
    const user = await this._findUserByEmail.execute(data.email);

    if (!user || !(await compare(data.password, user.passwordHash))) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }
    if (user.statusAssinatura === 'SUSPENDED') {
      throw new ForbiddenException(
        'Assinatura suspensa',
        'Sua assinatura está suspensa. Regularize o pagamento para continuar.',
      );
    }

    const device = await this._registerDevice.execute({
      userId: user.id,
      deviceId: data.deviceId,
      name: data.deviceName ?? 'Dispositivo',
    });

    // Uma sessão online por vez.
    await this._refreshTokens.revokeAllByUser(user.id);
    const session = await this._issueSession.execute({ userId: user.id, deviceId: device.id });

    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, deviceId: device.id, ...session };
  }
}
