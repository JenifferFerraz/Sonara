import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { seconds, Throttle } from '@nestjs/throttler';
import { RegisterDto } from '../dto/register.dto';
import { RegisterUseCase } from '../use-cases/register.use-case';

@ApiTags('auth')
@Controller('auth')
export class RegisterController {
  constructor(private readonly _register: RegisterUseCase) {}

  @ApiOperation({ summary: 'Cadastrar médico' })
  @Throttle({ default: { limit: 5, ttl: seconds(60) } })
  @Post('register')
  execute(@Body() data: RegisterDto) {
    return this._register.execute(data);
  }
}
