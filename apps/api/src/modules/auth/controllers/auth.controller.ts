import { AuthGuard } from '@guards/auth.guard';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { seconds, Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { opcoesCookieRefresh, opcoesLimparCookieRefresh, REFRESH_COOKIE } from '../cookies/refresh-cookie';
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
  async login(@Body() data: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { refreshToken, ...resposta } = await this._login.execute(data);
    res.cookie(REFRESH_COOKIE, refreshToken, opcoesCookieRefresh());
    return resposta;
  }

  @ApiOperation({ summary: 'Renovar sessão (rotação do refresh token, lido do cookie httpOnly)' })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
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

  @ApiOperation({ summary: 'Sair' })
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() req: Request,
    @Body() { refreshToken: doCorpo }: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = (req.cookies?.[REFRESH_COOKIE] as string | undefined) ?? doCorpo;
    if (token) await this._logout.execute(token);
    res.clearCookie(REFRESH_COOKIE, opcoesLimparCookieRefresh());
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Confere se a sessão continua valendo (o app chama de tempos em tempos)' })
  @Get('session')
  @HttpCode(HttpStatus.NO_CONTENT)
  session(): void {
    // O AuthGuard já fez a conferência: chegou aqui, a sessão vale.
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Dados do médico logado' })
  @Get('me')
  me(@Req() req: Request) {
    return this._me.execute(req.user!);
  }
}
