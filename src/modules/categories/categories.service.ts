import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from '../../common/constants/default-categories';
import { ListCategoriesDto } from './dto/list-categories.dto';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureDefaultCategories(userId: string) {
    const categories = [
      ...DEFAULT_EXPENSE_CATEGORIES.map((item) => ({
        ...item,
        type: 'EXPENSE' as const,
      })),
      ...DEFAULT_INCOME_CATEGORIES.map((item) => ({
        ...item,
        type: 'INCOME' as const,
      })),
    ];

    for (const category of categories) {
      await this.prisma.category.upsert({
        where: {
          userId_name_type: {
            userId,
            name: category.name,
            type: category.type,
          },
        },
        create: {
          userId,
          name: category.name,
          type: category.type,
          icon: category.icon,
          color: category.color,
          sortOrder: category.sortOrder,
          isDefault: true,
          isEnabled: true,
        },
        update: {
          icon: category.icon,
          color: category.color,
          sortOrder: category.sortOrder,
          isDefault: true,
          isEnabled: true,
          deletedAt: null,
        },
      });
    }
  }

  async findAll(userId: string, query: ListCategoriesDto) {
    const categories = await this.prisma.category.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(query.type ? { type: query.type } : {}),
        ...(query.includeDisabled ? {} : { isEnabled: true }),
      },
      orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return {
      items: categories,
      total: categories.length,
    };
  }

  async create(userId: string, dto: CreateCategoryDto) {
    const duplicated = await this.prisma.category.findFirst({
      where: {
        userId,
        type: dto.type,
        name: dto.name,
        deletedAt: null,
      },
    });

    if (duplicated) {
      throw new ConflictException('Category already exists');
    }

    return this.prisma.category.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type,
        icon: dto.icon ?? 'custom',
        color: dto.color ?? '#64748B',
        sortOrder: dto.sortOrder ?? 0,
        isDefault: false,
        isEnabled: true,
      },
    });
  }
}
