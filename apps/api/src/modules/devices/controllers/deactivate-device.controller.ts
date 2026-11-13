import { AuthGuard } from '@guards/auth.guard';
import { Controller, Delete, HttpCode, HttpStatus, Param, ParseUUIDPipe, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { DeactivateDeviceUseCase } from '../use-cases/deactivate.use-case';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiTags('devices')
@Controller('devices')
export class DeactivateDeviceController {
  constructor(private readonly _deactivateDevice: DeactivateDeviceUseCase) {}

  @ApiOperation({ summary: 'Desativar um dispositivo (limite de trocas por mês)' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async execute(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string) {
    await this._deactivateDevice.execute({ userId: req.user!, deviceId: id });
  }
}
