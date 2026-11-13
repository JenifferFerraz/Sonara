import { AuthGuard } from '@guards/auth.guard';
import { DevicesModule } from '@modules/devices/devices.module';
import { UsersModule } from '@modules/users/users.module';
import { Module } from '@nestjs/common';
import { RenewLicenseController } from './controllers/renew-license.controller';
import { IssueLicenseUseCase } from './use-cases/issue.use-case';

@Module({
  imports: [UsersModule, DevicesModule],
  providers: [IssueLicenseUseCase, AuthGuard],
  controllers: [RenewLicenseController],
})
export class LicensesModule {}
