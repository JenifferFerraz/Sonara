import { ForbiddenException, NotFoundException, UnauthorizedException } from '@errors/exceptions';
import { FindActiveDeviceUseCase } from '@modules/devices/use-cases/find-active.use-case';
import { FindUserByIdUseCase } from '@modules/users/use-cases/find.use-case';
import { SignatureService } from '@services/signature/signature.service';
import { Injectable } from '@nestjs/common';

export const VALIDADE_LICENCA_DIAS = 30;

/** Mesmo formato lido por verificarLicenca() em @sonara/laudo-engine. */
export type LicencaPayload = {
  medicoId: string;
  nome: string;
  crm: string;
  modulos: string[];
  dispositivoId: string;
  emitidoEm: number;
  validoAte: number;
};

@Injectable()
export class IssueLicenseUseCase {
  constructor(
    private readonly _findUserById: FindUserByIdUseCase,
    private readonly _findActiveDevice: FindActiveDeviceUseCase,
    private readonly _signature: SignatureService,
  ) {}

  async execute({ userId, deviceId }: { userId: string; deviceId: string }) {
    const user = await this._findUserById.execute(userId);
    if (!user) throw new NotFoundException('Usuário');

    if (user.statusAssinatura === 'SUSPENDED') {
      throw new ForbiddenException('Assinatura suspensa', 'Regularize o pagamento para renovar a licença.');
    }

    const device = await this._findActiveDevice.execute({ userId, deviceId });
    if (!device) throw new UnauthorizedException('Dispositivo desativado.');

    const agora = Date.now();
    const payload: LicencaPayload = {
      medicoId: user.id,
      nome: user.name,
      crm: `${user.crm}/${user.crmUf}`,
      modulos: user.modulos,
      dispositivoId: device.id,
      emitidoEm: agora,
      validoAte: agora + VALIDADE_LICENCA_DIAS * 86_400_000,
    };

    const corpo = Buffer.from(JSON.stringify(payload));
    return {
      token: `${corpo.toString('base64url')}.${this._signature.sign(corpo)}`,
      validoAte: payload.validoAte,
    };
  }
}
