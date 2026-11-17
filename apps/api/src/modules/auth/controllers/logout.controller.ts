import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { opcoesLimparCookieRefresh, REFRESH_COOKIE } from '../cookies/refresh-cookie';
import { RefreshTokenDto } from '../dto/login.dto';
import { LogoutUseCase } from '../use-cases/logout.use-case';

@ApiTags('auth')
@Controller('auth')
export class LogoutController {
  constructor(private readonly _logout: LogoutUseCase) {}

  @ApiOperation({ summary: 'Sair' })
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async execute(
    @Req() req: Request,
    @Body() { refreshToken: doCorpo }: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = (req.cookies?.[REFRESH_COOKIE] as string | undefined) ?? doCorpo;
    if (token) await this._logout.execute(token);
    res.clearCookie(REFRESH_COOKIE, opcoesLimparCookieRefresh());
  }
}
