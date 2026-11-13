import { AuthGuard } from '@guards/auth.guard';
import { Module } from '@nestjs/common';
import { DeactivateDeviceController } from './controllers/deactivate-device.controller';
import { ListDevicesController } from './controllers/list-devices.controller';
import { DevicesRepository } from './repositories/devices.repository';
import { PrismaDevicesRepository } from './repositories/prisma-devices.repository';
import { DeactivateDeviceUseCase } from './use-cases/deactivate.use-case';
import { FindActiveDeviceUseCase } from './use-cases/find-active.use-case';
import { ListDevicesUseCase } from './use-cases/list.use-case';
import { RegisterDeviceUseCase } from './use-cases/register.use-case';

@Module({
  providers: [
    { provide: DevicesRepository, useClass: PrismaDevicesRepository },
    RegisterDeviceUseCase,
    ListDevicesUseCase,
    DeactivateDeviceUseCase,
    FindActiveDeviceUseCase,
    AuthGuard,
  ],
  controllers: [ListDevicesController, DeactivateDeviceController],
  exports: [RegisterDeviceUseCase, FindActiveDeviceUseCase],
})
export class DevicesModule {}
