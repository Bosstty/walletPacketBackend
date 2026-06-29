import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class DevLoginDto {
  @ApiProperty({
    description: 'Development-only openid used to simulate a WeChat user',
    example: 'dev_openid_001',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  openid!: string;

  @ApiPropertyOptional({
    description: 'Optional nickname to initialize the user profile',
    example: 'Lly',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string;

  @ApiPropertyOptional({
    description: 'Optional avatar URL to initialize the user profile',
    example: 'https://example.com/avatar.png',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;
}
