import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class UpsertCategoryBudgetDto {
  @ApiProperty({ example: '2026-06' })
  @IsString()
  @Matches(/^\d{4}-\d{2}$/)
  month!: string;

  @ApiProperty({ example: 'cmqzftzo0000104v5xlb39m5d' })
  @IsString()
  categoryId!: string;

  @ApiProperty({ example: 120000, description: 'Budget amount in cents' })
  @IsInt()
  @Min(0)
  amountCent!: number;

  @ApiProperty({ example: 0.8, default: 0.8 })
  @IsNumber()
  @Min(0)
  @Max(1)
  alertThreshold!: number;

  @ApiProperty({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}
