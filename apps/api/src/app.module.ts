import { DatabaseModule } from '@database/database.module';
import { AuthModule } from '@modules/auth/auth.module';
import { DevicesModule } from '@modules/devices/devices.module';
import { LicensesModule } from '@modules/licenses/licenses.module';
import { MasksModule } from '@modules/masks/masks.module';
import { UsersModule } from '@modules/users/users.module';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { seconds, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { SignatureModule } from '@services/signature/signature.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: seconds(60), limit: 100 }]),
    DatabaseModule,
    SignatureModule,
    UsersModule,
    DevicesModule,
    AuthModule,
    LicensesModule,
    MasksModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
