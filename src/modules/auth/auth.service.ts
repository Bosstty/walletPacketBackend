import { BadGatewayException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { CategoriesService } from '../categories/categories.service';
import { UsersService } from '../users/users.service';
import { DevLoginDto } from './dto/dev-login.dto';
import { WechatLoginDto } from './dto/wechat-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly categoriesService: CategoriesService,
  ) {}

  async devLogin(dto: DevLoginDto) {
    return this.loginByOpenid({
      openid: dto.openid,
      nickname: dto.nickname,
      avatarUrl: dto.avatarUrl,
    });
  }

  async wechatLogin(dto: WechatLoginDto) {
    const appId = this.configService.get<string>('wechat.appId');
    const appSecret = this.configService.get<string>('wechat.appSecret');

    if (!appId || !appSecret) {
      throw new InternalServerErrorException('WeChat login is not configured');
    }

    const params = new URLSearchParams({
      appid: appId,
      secret: appSecret,
      js_code: dto.code,
      grant_type: 'authorization_code',
    });

    const response = await fetch(
      `https://api.weixin.qq.com/sns/jscode2session?${params.toString()}`,
    );

    if (!response.ok) {
      throw new BadGatewayException('WeChat login request failed');
    }

    const result = (await response.json()) as {
      openid?: string;
      errcode?: number;
      errmsg?: string;
    };

    if (!result.openid) {
      throw new BadGatewayException(result.errmsg || 'Failed to get WeChat openid');
    }

    return this.loginByOpenid({
      openid: result.openid,
      nickname: dto.nickname,
      avatarUrl: dto.avatarUrl,
    });
  }

  private async loginByOpenid(input: {
    openid: string;
    nickname?: string;
    avatarUrl?: string;
  }) {
    let user = await this.usersService.findActiveByOpenid(input.openid);

    if (!user) {
      try {
        user = await this.usersService.createActiveUser({
          openid: input.openid,
          nickname: input.nickname,
          avatarUrl: input.avatarUrl,
        });
      } catch (error) {
        const isUniqueConflict =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002';

        if (!isUniqueConflict) {
          throw error;
        }

        user = await this.usersService.findActiveByOpenid(input.openid);
      }
    }

    if (!user) {
      throw new Error('Failed to initialize user');
    }

    await this.categoriesService.ensureDefaultCategories(user.id);

    const profile = await this.usersService.touchProfile(user.id, {
      nickname: input.nickname,
      avatarUrl: input.avatarUrl,
    });

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      openid: user.wechatOpenid,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      user: profile,
    };
  }
}
