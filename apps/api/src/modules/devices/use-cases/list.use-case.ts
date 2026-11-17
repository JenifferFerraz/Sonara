import { RefreshTokensRepository } from '@modules/auth/repositories/refresh-tokens.repository';
import { Injectable } from '@nestjs/common';
import { DeviceEntity } from '../entities/device.entity';
import { DevicesRepository } from '../repositories/devices.repository';

/** Dispositivo ativo e se ele tem a sessão online em uso agora (só uma por conta). */
export type DeviceComSessao = DeviceEntity & { sessaoAtiva: boolean };

@Injectable()
export class ListDevicesUseCase {
  constructor(
    private readonly _repository: DevicesRepository,
    private readonly _sessoes: RefreshTokensRepository,
  ) {}

  async execute(userId: string): Promise<DeviceComSessao[]> {
    const [devices, sessoes] = await Promise.all([
      this._repository.listActiveByUser(userId),
      this._sessoes.listActiveByUser(userId),
    ]);
    const comSessao = new Set(sessoes.map(s => s.deviceId));
    return devices.map(d => ({ ...d, sessaoAtiva: comSessao.has(d.id) }));
  }
}
