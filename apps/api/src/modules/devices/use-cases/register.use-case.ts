import { ForbiddenException } from '@errors/exceptions';
import { Injectable } from '@nestjs/common';
import { DeviceEntity, MAX_DISPOSITIVOS_ATIVOS } from '../entities/device.entity';
import { DevicesRepository } from '../repositories/devices.repository';

export type RegisterDeviceParams = {
  userId: string;
  /** Enviado pelo app se ele já tem um ID de dispositivo guardado. */
  deviceId?: string;
  name: string;
};

@Injectable()
export class RegisterDeviceUseCase {
  constructor(private readonly _repository: DevicesRepository) {}

  async execute({ userId, deviceId, name }: RegisterDeviceParams): Promise<DeviceEntity> {
    if (deviceId) {
      const existing = await this._repository.findById(deviceId);
      if (existing && existing.userId === userId && existing.active) {
        await this._repository.touch(existing.id);
        return existing;
      }
    }

    const active = await this._repository.listActiveByUser(userId);
    if (active.length >= MAX_DISPOSITIVOS_ATIVOS) {
      throw new ForbiddenException(
        'Limite de dispositivos atingido',
        `Sua conta já tem ${MAX_DISPOSITIVOS_ATIVOS} dispositivos ativos. Desative um no painel para usar este.`,
      );
    }

    return this._repository.create({ userId, name });
  }
}
