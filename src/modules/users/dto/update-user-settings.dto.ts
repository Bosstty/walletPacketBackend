import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

export class UpdateUserSettingsDto {
  @ApiPropertyOptional({ example: 'CNY' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional({ example: 2, minimum: 0, maximum: 2 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2)
  decimalPlaces?: number;

  @ApiPropertyOptional({ example: 1, minimum: 0, maximum: 6 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  weekStart?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  showBalance?: boolean;
}
