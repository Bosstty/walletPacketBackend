import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Matches } from 'class-validator';

export class ListTransactionsDto {
  @ApiPropertyOptional({ example: '2026-06' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/)
  month?: string;

  @ApiPropertyOptional({ example: '2026-06-30' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;

  @ApiPropertyOptional({ enum: ['EXPENSE', 'INCOME'] })
  @IsOptional()
  @IsString()
  @IsIn(['EXPENSE', 'INCOME'])
  type?: 'EXPENSE' | 'INCOME';

  @ApiPropertyOptional({ example: 'cmqzftzo0000104v5xlb39m5d' })
  @IsOptional()
  @IsString()
  categoryId?: string;
}
