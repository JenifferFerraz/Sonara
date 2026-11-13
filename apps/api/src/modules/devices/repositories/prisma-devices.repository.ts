import { PrismaService } from '@database/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { DeviceEntity } from '../entities/device.entity';
import { DevicesRepository } from './devices.repository';

@Injectable()
export class PrismaDevicesRepository implements DevicesRepository {
  constructor(private readonly _prisma: PrismaService) {}

  create(data: { userId: string; name: string }): Promise<DeviceEntity> {
    return this._prisma.device.create({ data });
  }

  findById(id: string): Promise<DeviceEntity | null> {
    return this._prisma.device.findUnique({ where: { id } });
  }

  listActiveByUser(userId: string): Promise<DeviceEntity[]> {
    return this._prisma.device.findMany({
      where: { userId, active: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  countDeactivatedSince(userId: string, since: Date): Promise<number> {
    return this._prisma.device.count({
      where: { userId, deactivatedAt: { gte: since } },
    });
  }

  async touch(id: string): Promise<void> {
    await this._prisma.device.update({
      where: { id },
      data: { lastSeenAt: new Date() },
    });
  }

  async deactivate(id: string): Promise<void> {
    await this._prisma.device.update({
      where: { id },
      data: { active: false, deactivatedAt: new Date() },
    });
  }
}
