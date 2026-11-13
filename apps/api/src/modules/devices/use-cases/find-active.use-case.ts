import { Injectable } from '@nestjs/common';
import { DeviceEntity } from '../entities/device.entity';
import { DevicesRepository } from '../repositories/devices.repository';

@Injectable()
export class FindActiveDeviceUseCase {
  constructor(private readonly _repository: DevicesRepository) {}

  async execute({ userId, deviceId }: { userId: string; deviceId: string }): Promise<DeviceEntity | null> {
    const device = await this._repository.findById(deviceId);
    return device && device.userId === userId && device.active ? device : null;
  }
}
