import { AuthGuard } from '@guards/auth.guard';
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ListDevicesUseCase } from '../use-cases/list.use-case';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiTags('devices')
@Controller('devices')
export class ListDevicesController {
  constructor(private readonly _listDevices: ListDevicesUseCase) {}

  @ApiOperation({ summary: 'Listar dispositivos ativos do médico' })
  @Get()
  async execute(@Req() req: Request) {
    return this._listDevices.execute(req.user!);
  }
}
