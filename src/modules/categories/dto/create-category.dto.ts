import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: '咖啡' })
  @IsString()
  @MaxLength(20)
  name!: string;

  @ApiProperty({ enum: ['EXPENSE', 'INCOME'], example: 'EXPENSE' })
  @IsString()
  @IsIn(['EXPENSE', 'INCOME'])
  type!: 'EXPENSE' | 'INCOME';

  @ApiPropertyOptional({ example: 'coffee' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @ApiPropertyOptional({ example: '#A16207' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;

  @ApiPropertyOptional({ example: 110, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
