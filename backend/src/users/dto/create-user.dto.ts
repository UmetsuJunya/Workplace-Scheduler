import { IsString, IsOptional, IsEmail, IsEnum, MinLength, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'パスワードは6文字以上である必要があります' })
  @MaxLength(100)
  password?: string;

  @IsOptional()
  @IsEnum(['ADMIN', 'USER'])
  role?: 'ADMIN' | 'USER';
}
