import { IsEmail, IsNotEmpty, IsString, Length, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @Matches(/^\D*(\d\D*){11}$/, { message: 'CPF deve ter 11 dígitos' })
  cpf: string;

  @IsNotEmpty()
  @IsString()
  crm: string;

  @IsString()
  @Length(2, 2)
  crmUf: string;
}
