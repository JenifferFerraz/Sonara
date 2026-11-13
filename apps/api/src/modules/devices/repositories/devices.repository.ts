import { DeviceEntity } from '../entities/device.entity';

export abstract class DevicesRepository {
  abstract create(data: { userId: string; name: string }): Promise<DeviceEntity>;
  abstract findById(id: string): Promise<DeviceEntity | null>;
  abstract listActiveByUser(userId: string): Promise<DeviceEntity[]>;
  abstract countDeactivatedSince(userId: string, since: Date): Promise<number>;
  abstract touch(id: string): Promise<void>;
  abstract deactivate(id: string): Promise<void>;
}
