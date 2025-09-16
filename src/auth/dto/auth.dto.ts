import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../common/enums/user-role.enum';

export class SignUpDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Passw0rd!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.CLIENT })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ example: 'New York' })
  @IsOptional()
  @IsString()
  jurisdiction?: string;

  @ApiPropertyOptional({ example: '12345' })
  @IsOptional()
  @IsString()
  barNumber?: string;
}

export class SignInDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Passw0rd!' })
  @IsString()
  password: string;
}