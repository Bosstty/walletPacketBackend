import { BadGatewayException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { CategoriesService } from '../categories/categories.service';
import { UsersService } from '../users/users.service';
import { DevLoginDto } from './dto/dev-login.dto';
import { WechatPhoneLoginDto } from './dto/wechat-phone-login.dto';
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
    const result = await this.fetchWechatSession(dto.code);

    return this.loginByOpenid({
      openid: result.openid,
      nickname: dto.nickname,
      avatarUrl: dto.avatarUrl,
    });
  }

  async wechatPhoneLogin(dto: WechatPhoneLoginDto) {
    const session = await this.fetchWechatSession(dto.loginCode);
    const phoneInfo = await this.fetchWechatPhoneNumber(dto.phoneCode);

    return this.loginByOpenid({
      openid: session.openid,
      nickname: dto.nickname,
      avatarUrl: dto.avatarUrl,
      phoneNumber: phoneInfo.phoneNumber,
      countryCode: phoneInfo.countryCode,
    });
  }

  private async loginByOpenid(input: {
    openid: string;
    nickname?: string;
    avatarUrl?: string;
    phoneNumber?: string;
    countryCode?: string;
  }) {
    let user = await this.usersService.findActiveByOpenid(input.openid);

    if (!user && input.phoneNumber) {
      user = await this.usersService.findActiveByPhoneNumber(input.phoneNumber);

      if (user && user.wechatOpenid !== input.openid) {
        user = await this.usersService.rebindWechatIdentity(user.id, {
          openid: input.openid,
          phoneNumber: input.phoneNumber,
          countryCode: input.countryCode,
        });
      }
    }

    if (!user) {
      try {
        user = await this.usersService.createActiveUser({
          openid: input.openid,
          phoneNumber: input.phoneNumber,
          countryCode: input.countryCode,
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

        if (!user && input.phoneNumber) {
          user = await this.usersService.findActiveByPhoneNumber(input.phoneNumber);
        }
      }
    }

    if (!user) {
      throw new Error('Failed to initialize user');
    }

    await this.categoriesService.ensureDefaultCategories(user.id);

    const profile = await this.usersService.touchProfile(user.id, {
      phoneNumber: input.phoneNumber,
      countryCode: input.countryCode,
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

  private async fetchWechatSession(code: string) {
    const appId = this.configService.get<string>('wechat.appId');
    const appSecret = this.configService.get<string>('wechat.appSecret');

    if (!appId || !appSecret) {
      throw new InternalServerErrorException('WeChat login is not configured');
    }

    const params = new URLSearchParams({
      appid: appId,
      secret: appSecret,
      js_code: code,
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

    return result as { openid: string };
  }

  private async fetchWechatPhoneNumber(code: string) {
    const accessToken = await this.fetchWechatAccessToken();
    const response = await fetch(
      `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      },
    );

    if (!response.ok) {
      throw new BadGatewayException('WeChat phone verify request failed');
    }

    const result = (await response.json()) as {
      errcode?: number;
      errmsg?: string;
      phone_info?: {
        phoneNumber?: string;
        countryCode?: string;
      };
    }

    if (result.errcode || !result.phone_info?.phoneNumber) {
      throw new BadGatewayException(result.errmsg || 'Failed to get phone number');
    }

    return {
      phoneNumber: result.phone_info.phoneNumber,
      countryCode: result.phone_info.countryCode,
    };
  }

  private async fetchWechatAccessToken() {
    const appId = this.configService.get<string>('wechat.appId');
    const appSecret = this.configService.get<string>('wechat.appSecret');

    if (!appId || !appSecret) {
      throw new InternalServerErrorException('WeChat access token is not configured');
    }

    const params = new URLSearchParams({
      grant_type: 'client_credential',
      appid: appId,
      secret: appSecret,
    });

    const response = await fetch(
      `https://api.weixin.qq.com/cgi-bin/token?${params.toString()}`,
    );

    if (!response.ok) {
      throw new BadGatewayException('WeChat access token request failed');
    }

    const result = (await response.json()) as {
      access_token?: string;
      errcode?: number;
      errmsg?: string;
    };

    if (!result.access_token) {
      throw new BadGatewayException(result.errmsg || 'Failed to get WeChat access token');
    }

    return result.access_token;
  }
}
