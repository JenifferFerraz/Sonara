import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { opcoesCookieRefresh, REFRESH_COOKIE } from '../cookies/refresh-cookie';
import { RefreshTokenDto } from '../dto/login.dto';
import { RefreshTokenUseCase } from '../use-cases/refresh-token.use-case';

@ApiTags('auth')
@Controller('auth')
export class RefreshTokenController {
  constructor(private readonly _refresh: RefreshTokenUseCase) {}

  @ApiOperation({ summary: 'Renovar sessão (rotação do refresh token, lido do cookie httpOnly)' })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async execute(
    @Req() req: Request,
    @Body() { refreshToken: doCorpo }: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const doCookie = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    const sessao = await this._refresh.execute(doCookie ?? doCorpo ?? '');
    res.cookie(REFRESH_COOKIE, sessao.refreshToken, opcoesCookieRefresh());
    // O refresh token só volta no corpo para quem o mandou no corpo (cliente sem cookie).
    return doCookie ? { accessToken: sessao.accessToken } : sessao;
  }
}
