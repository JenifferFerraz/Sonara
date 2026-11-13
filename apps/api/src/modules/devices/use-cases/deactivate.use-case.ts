import { ForbiddenException, NotFoundException } from '@errors/exceptions';
import { Injectable } from '@nestjs/common';
import { MAX_TROCAS_POR_MES } from '../entities/device.entity';
import { DevicesRepository } from '../repositories/devices.repository';

const DIAS_30_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class DeactivateDeviceUseCase {
  constructor(private readonly _repository: DevicesRepository) {}

  async execute({ userId, deviceId }: { userId: string; deviceId: string }): Promise<void> {
    const device = await this._repository.findById(deviceId);
    if (!device || device.userId !== userId || !device.active) {
      throw new NotFoundException('Dispositivo');
    }

    const trocas = await this._repository.countDeactivatedSince(
      userId,
      new Date(Date.now() - DIAS_30_MS),
    );
    if (trocas >= MAX_TROCAS_POR_MES) {
      throw new ForbiddenException(
        'Limite de trocas atingido',
        `Você já trocou de dispositivo ${MAX_TROCAS_POR_MES} vezes nos últimos 30 dias.`,
      );
    }

    await this._repository.deactivate(deviceId);
  }
}
