import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({ enum: ['EXPENSE', 'INCOME'], example: 'EXPENSE' })
  @IsString()
  @IsIn(['EXPENSE', 'INCOME'])
  type!: 'EXPENSE' | 'INCOME';

  @ApiProperty({
    description: 'Transaction amount in cents',
    example: 3200,
  })
  @IsInt()
  @Min(1)
  amountCent!: number;

  @ApiProperty({ example: 'cmqzftzo0000104v5xlb39m5d' })
  @IsString()
  categoryId!: string;

  @ApiProperty({
    description: 'Occurred time in ISO-8601 format',
    example: '2026-06-30T08:30:00.000Z',
  })
  @IsDateString()
  occurredAt!: string;

  @ApiPropertyOptional({ example: '午饭 + 咖啡' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  budgetIncluded?: boolean;
}
