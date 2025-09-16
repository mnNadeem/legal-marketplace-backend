import { IsNumber, IsString, IsOptional, IsEnum, IsUUID, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuoteStatus } from '../../common/enums/quote-status.enum';

export class CreateQuoteDto {
  @ApiProperty({ example: 1500.00 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: 30 })
  @IsNumber()
  @Min(1)
  @Max(365)
  expectedDays: number;

  @ApiPropertyOptional({ example: 'I have extensive experience in this area...' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateQuoteDto {
  @ApiPropertyOptional({ example: 1500.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  expectedDays?: number;

  @ApiPropertyOptional({ example: 'I have extensive experience in this area...' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class GetQuotesQueryDto {
  @ApiPropertyOptional({ enum: QuoteStatus })
  @IsOptional()
  @IsEnum(QuoteStatus)
  status?: QuoteStatus;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  limit?: number = 10;
}