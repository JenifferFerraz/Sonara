import { AuthGuard } from '@guards/auth.guard';
import { Controller, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiTags('auth')
@Controller('auth')
export class CheckSessionController {
  @ApiOperation({ summary: 'Confere se a sessão continua valendo (o app chama de tempos em tempos)' })
  @Get('session')
  @HttpCode(HttpStatus.NO_CONTENT)
  execute(): void {
    // O AuthGuard já fez a conferência: se chegou aqui, a sessão vale. Se foi encerrada (o médico
    // entrou em outro aparelho), o guard responde 401 SESSAO_ENCERRADA antes de chegar a este método.
  }
}
