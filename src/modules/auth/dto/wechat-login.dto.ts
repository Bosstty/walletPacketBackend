import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class WechatLoginDto {
  @ApiProperty({
    description: 'Code returned by wx.login',
    example: '021xYp000abcde1234567890',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  code!: string;

  @ApiPropertyOptional({
    description: 'Optional nickname to initialize or refresh the user profile',
    example: '账本用户',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string;

  @ApiPropertyOptional({
    description:
      'Optional avatar URL to initialize or refresh the user profile',
    example: 'https://example.com/avatar.png',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: 'Invite code required for first-time registration when enabled',
    example: 'WALLET2026',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  inviteCode?: string;
}
