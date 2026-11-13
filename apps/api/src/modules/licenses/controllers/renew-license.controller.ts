import { AuthGuard } from '@guards/auth.guard';
import { Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { IssueLicenseUseCase } from '../use-cases/issue.use-case';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiTags('licenses')
@Controller('licenses')
export class RenewLicenseController {
  constructor(private readonly _issueLicense: IssueLicenseUseCase) {}

  @ApiOperation({ summary: 'Emitir ou renovar a licença offline (token Ed25519, 30 dias)' })
  @Post('renew')
  @HttpCode(HttpStatus.OK)
  async execute(@Req() req: Request) {
    return this._issueLicense.execute({ userId: req.user!, deviceId: req.deviceId! });
  }
}
