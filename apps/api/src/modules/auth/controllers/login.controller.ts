import { Body, Controller, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { seconds, Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { opcoesCookieRefresh, REFRESH_COOKIE } from '../cookies/refresh-cookie';
import { LoginDto } from '../dto/login.dto';
import { LoginUseCase } from '../use-cases/login.use-case';

@ApiTags('auth')
@Controller('auth')
export class LoginController {
  constructor(private readonly _login: LoginUseCase) {}

  @ApiOperation({ summary: 'Entrar (registra o dispositivo e encerra outras sessões)' })
  @Throttle({ default: { limit: 10, ttl: seconds(10) } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async execute(@Body() data: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { refreshToken, ...resposta } = await this._login.execute(data);
    // O refresh token vai só no cookie httpOnly: o JavaScript do app nunca o enxerga.
    res.cookie(REFRESH_COOKIE, refreshToken, opcoesCookieRefresh());
    return resposta;
  }
}
