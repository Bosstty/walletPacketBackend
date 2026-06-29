import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class WechatPhoneLoginDto {
  @ApiProperty({
    description: 'Code returned by wx.login',
    example: '021xYp000abcde1234567890',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  loginCode!: string;

  @ApiProperty({
    description: 'Phone number code returned by bindgetphonenumber',
    example: 'e31968a7f94cc5ee25fafc2aef2773f0bb8c3937b22520eb8ee345274d00c144',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  phoneCode!: string;

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
}
