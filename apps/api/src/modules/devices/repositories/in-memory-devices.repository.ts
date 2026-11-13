import { randomUUID } from 'node:crypto';
import { DeviceEntity } from '../entities/device.entity';
import { DevicesRepository } from './devices.repository';

export class InMemoryDevicesRepository implements DevicesRepository {
  public items: DeviceEntity[] = [];

  async create(data: { userId: string; name: string }) {
    const device: DeviceEntity = {
      id: randomUUID(),
      ...data,
      active: true,
      lastSeenAt: new Date(),
      deactivatedAt: null,
      createdAt: new Date(),
    };
    this.items.push(device);
    return device;
  }

  async findById(id: string) {
    return this.items.find(item => item.id === id) ?? null;
  }

  async listActiveByUser(userId: string) {
    return this.items.filter(item => item.userId === userId && item.active);
  }

  async countDeactivatedSince(userId: string, since: Date) {
    return this.items.filter(
      item => item.userId === userId && item.deactivatedAt && item.deactivatedAt >= since,
    ).length;
  }

  async touch(id: string) {
    const device = await this.findById(id);
    if (device) device.lastSeenAt = new Date();
  }

  async deactivate(id: string) {
    const device = await this.findById(id);
    if (device) {
      device.active = false;
      device.deactivatedAt = new Date();
    }
  }
}
