import { AuthGuard } from '@guards/auth.guard';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { seconds, Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { LoginDto, RefreshTokenDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { LoginUseCase } from '../use-cases/login.use-case';
import { LogoutUseCase } from '../use-cases/logout.use-case';
import { MeUseCase } from '../use-cases/me.use-case';
import { RefreshTokenUseCase } from '../use-cases/refresh-token.use-case';
import { RegisterUseCase } from '../use-cases/register.use-case';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly _register: RegisterUseCase,
    private readonly _login: LoginUseCase,
    private readonly _refresh: RefreshTokenUseCase,
    private readonly _logout: LogoutUseCase,
    private readonly _me: MeUseCase,
  ) {}

  @ApiOperation({ summary: 'Cadastrar médico' })
  @Throttle({ default: { limit: 5, ttl: seconds(60) } })
  @Post('register')
  register(@Body() data: RegisterDto) {
    return this._register.execute(data);
  }

  @ApiOperation({ summary: 'Entrar (registra o dispositivo e encerra outras sessões)' })
  @Throttle({ default: { limit: 10, ttl: seconds(10) } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() data: LoginDto) {
    return this._login.execute(data);
  }

  @ApiOperation({ summary: 'Renovar sessão (rotação do refresh token)' })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() { refreshToken }: RefreshTokenDto) {
    return this._refresh.execute(refreshToken);
  }

  @ApiOperation({ summary: 'Sair' })
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() { refreshToken }: RefreshTokenDto) {
    await this._logout.execute(refreshToken);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Dados do médico logado' })
  @Get('me')
  me(@Req() req: Request) {
    return this._me.execute(req.user!);
  }
}
