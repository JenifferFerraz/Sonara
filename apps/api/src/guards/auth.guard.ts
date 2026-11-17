import { SessionEndedException, UnauthorizedException } from '@errors/exceptions';
import { RefreshTokensRepository } from '@modules/auth/repositories/refresh-tokens.repository';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { env } from '../env';

/**
 * Valida o token de acesso (Bearer) e a sessão a que ele pertence.
 * - sem token, token inválido ou vencido: 401;
 * - sessão revogada (o médico entrou em outro aparelho, ou o aparelho foi desativado): 401 com o
 *   código SESSAO_ENCERRADA, para o app desconectar na hora em vez de esperar o token vencer.
 * Preenche `request.user` (id do médico) e `request.deviceId`.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly _sessoes: RefreshTokensRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    if (!token) throw new UnauthorizedException();

    let payload: { sub: string; deviceId: string; sid?: string };
    try {
      payload = await this.jwtService.verifyAsync(token, { secret: env.JWT_SECRET });
    } catch {
      throw new UnauthorizedException();
    }

    // Token sem sessão (emitido antes desta regra) não vale: o app renova e recebe um novo.
    const sessao = payload.sid ? await this._sessoes.findById(payload.sid) : null;
    if (!sessao || sessao.userId !== payload.sub || sessao.deviceId !== payload.deviceId) {
      throw new UnauthorizedException();
    }
    if (sessao.revokedAt) throw new SessionEndedException();
    if (sessao.expiresAt <= new Date()) throw new UnauthorizedException();

    request.user = payload.sub;
    request.deviceId = payload.deviceId;
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
