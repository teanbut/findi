import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export type RegisterRole = 'customer' | 'supplier' | 'fundraising_org';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEnum(['customer', 'supplier', 'fundraising_org'])
  role!: RegisterRole;
}
