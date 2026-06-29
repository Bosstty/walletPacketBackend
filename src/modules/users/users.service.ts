import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveByOpenid(openid: string) {
    return this.prisma.user.findFirst({
      where: {
        wechatOpenid: openid,
        status: 'ACTIVE',
        deletedAt: null,
      },
    });
  }

  async createActiveUser(input: {
    openid: string;
    nickname?: string;
    avatarUrl?: string;
  }) {
    return this.prisma.user.create({
      data: {
        wechatOpenid: input.openid,
        nickname: input.nickname,
        avatarUrl: input.avatarUrl,
      },
    });
  }

  async touchProfile(
    userId: string,
    input: {
      nickname?: string;
      avatarUrl?: string;
    },
  ) {
    if (input.nickname === undefined && input.avatarUrl === undefined) {
      return this.getProfile(userId);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.nickname !== undefined ? { nickname: input.nickname } : {}),
        ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
      },
      select: {
        id: true,
        wechatOpenid: true,
        nickname: true,
        avatarUrl: true,
        currency: true,
        decimalPlaces: true,
        weekStart: true,
        showBalance: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: {
        id: true,
        wechatOpenid: true,
        nickname: true,
        avatarUrl: true,
        currency: true,
        decimalPlaces: true,
        weekStart: true,
        showBalance: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateSettings(userId: string, dto: UpdateUserSettingsDto) {
    await this.ensureUserExists(userId);

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.currency !== undefined ? { currency: dto.currency } : {}),
        ...(dto.decimalPlaces !== undefined
          ? { decimalPlaces: dto.decimalPlaces }
          : {}),
        ...(dto.weekStart !== undefined ? { weekStart: dto.weekStart } : {}),
        ...(dto.showBalance !== undefined
          ? { showBalance: dto.showBalance }
          : {}),
      },
      select: {
        id: true,
        currency: true,
        decimalPlaces: true,
        weekStart: true,
        showBalance: true,
        updatedAt: true,
      },
    });
  }

  private async ensureUserExists(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
  }
}
