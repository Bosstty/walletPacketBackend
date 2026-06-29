import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export class ListCategoriesDto {
  @ApiPropertyOptional({ enum: ['EXPENSE', 'INCOME'] })
  @IsOptional()
  @IsString()
  @IsIn(['EXPENSE', 'INCOME'])
  type?: 'EXPENSE' | 'INCOME';

  @ApiPropertyOptional({
    description: 'Whether disabled categories should also be returned',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeDisabled?: boolean;
}
