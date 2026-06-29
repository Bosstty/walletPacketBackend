import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { CategoriesService } from '../categories/categories.service';
import { UsersService } from '../users/users.service';
import { DevLoginDto } from './dto/dev-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly categoriesService: CategoriesService,
  ) {}

  async devLogin(dto: DevLoginDto) {
    let user = await this.usersService.findActiveByOpenid(dto.openid);

    if (!user) {
      try {
        user = await this.usersService.createActiveUser({
          openid: dto.openid,
          nickname: dto.nickname,
          avatarUrl: dto.avatarUrl,
        });
      } catch (error) {
        const isUniqueConflict =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002';

        if (!isUniqueConflict) {
          throw error;
        }

        user = await this.usersService.findActiveByOpenid(dto.openid);
      }
    }

    if (!user) {
      throw new Error('Failed to initialize user');
    }

    await this.categoriesService.ensureDefaultCategories(user.id);

    const profile = await this.usersService.touchProfile(user.id, {
      nickname: dto.nickname,
      avatarUrl: dto.avatarUrl,
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
