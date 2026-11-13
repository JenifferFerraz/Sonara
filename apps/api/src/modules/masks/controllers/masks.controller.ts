import { NotFoundException } from '@errors/exceptions';
import { AuthGuard } from '@guards/auth.guard';
import { FindUserByIdUseCase } from '@modules/users/use-cases/find.use-case';
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SignatureService } from '@services/signature/signature.service';
import { Request } from 'express';
import { ListMasksUseCase } from '../use-cases/list.use-case';

@ApiTags('masks')
@Controller('masks')
export class MasksController {
  constructor(
    private readonly _listMasks: ListMasksUseCase,
    private readonly _findUserById: FindUserByIdUseCase,
    private readonly _signature: SignatureService,
  ) {}

  @ApiOperation({ summary: 'Chave pública Ed25519 (embutida no app)' })
  @Get('public-key')
  publicKey() {
    return { publicKey: this._signature.publicKey };
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Máscaras assinadas dos módulos comprados' })
  @Get()
  async list(@Req() req: Request) {
    const user = await this._findUserById.execute(req.user!);
    if (!user) throw new NotFoundException('Usuário');
    return this._listMasks.execute(user.modulos);
  }
}
