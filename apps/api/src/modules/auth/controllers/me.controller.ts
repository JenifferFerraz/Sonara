import { AuthGuard } from '@guards/auth.guard';
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { MeUseCase } from '../use-cases/me.use-case';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiTags('auth')
@Controller('auth')
export class MeController {
  constructor(private readonly _me: MeUseCase) {}

  @ApiOperation({ summary: 'Dados do médico logado' })
  @Get('me')
  execute(@Req() req: Request) {
    return this._me.execute(req.user!);
  }
}
