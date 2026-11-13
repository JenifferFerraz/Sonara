import { Injectable } from '@nestjs/common';
import { DeviceEntity } from '../entities/device.entity';
import { DevicesRepository } from '../repositories/devices.repository';

@Injectable()
export class ListDevicesUseCase {
  constructor(private readonly _repository: DevicesRepository) {}

  execute(userId: string): Promise<DeviceEntity[]> {
    return this._repository.listActiveByUser(userId);
  }
}
