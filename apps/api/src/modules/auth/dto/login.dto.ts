import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  /** ID guardado pelo app em logins anteriores neste dispositivo. */
  @IsOptional()
  @IsUUID()
  deviceId?: string;

  @IsOptional()
  @IsString()
  deviceName?: string;
}

export class RefreshTokenDto {
  /** Só para clientes sem cookie (ex.: app desktop). O navegador usa o cookie httpOnly. */
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
