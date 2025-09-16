import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CaseStatus } from '../../common/enums/case-status.enum';

export class CreateCaseDto {
  @ApiProperty({ example: 'Contract Dispute Resolution' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Contract Law' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'Need help resolving a contract dispute...' })
  @IsString()
  @IsNotEmpty()
  description: string;
}

export class UpdateCaseDto {
  @ApiPropertyOptional({ example: 'Contract Dispute Resolution' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @ApiPropertyOptional({ example: 'Contract Law' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  category?: string;

  @ApiPropertyOptional({ example: 'Need help resolving a contract dispute...' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @ApiPropertyOptional({ enum: CaseStatus })
  @IsOptional()
  @IsEnum(CaseStatus)
  status?: CaseStatus;
}

export class GetCasesQueryDto {
  @ApiPropertyOptional({ example: 'Contract Law' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsString()
  createdSince?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  limit?: number = 10;
}

export class AcceptQuoteDto {
  @ApiProperty({ example: 'quote-uuid-here' })
  @IsUUID()
  quoteId: string;
}