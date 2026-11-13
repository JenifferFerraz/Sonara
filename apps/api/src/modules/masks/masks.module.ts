import { AuthGuard } from '@guards/auth.guard';
import { UsersModule } from '@modules/users/users.module';
import { Module } from '@nestjs/common';
import { MasksController } from './controllers/masks.controller';
import { ListMasksUseCase } from './use-cases/list.use-case';

@Module({
  imports: [UsersModule],
  providers: [ListMasksUseCase, AuthGuard],
  controllers: [MasksController],
})
export class MasksModule {}
