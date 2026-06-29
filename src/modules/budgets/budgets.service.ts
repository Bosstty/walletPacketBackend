import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryMonthDto } from './dto/query-month.dto';
import { UpsertCategoryBudgetDto } from './dto/upsert-category-budget.dto';
import { UpsertOverallBudgetDto } from './dto/upsert-overall-budget.dto';
import { getCurrentShanghaiMonth } from '../../common/utils/date.util';

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMonthlyBudgets(userId: string, query: QueryMonthDto) {
    const month = query.month ?? getCurrentShanghaiMonth();
    const budgets = await this.prisma.budget.findMany({
      where: {
        userId,
        month,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
            icon: true,
            color: true,
          },
        },
      },
      orderBy: [{ scopeType: 'asc' }, { createdAt: 'asc' }],
    });

    const overall = budgets.find((item) => item.scopeType === 'OVERALL') ?? null;
    const categories = budgets.filter((item) => item.scopeType === 'CATEGORY');

    return {
      month,
      overall,
      categories,
    };
  }

  async upsertOverallBudget(userId: string, dto: UpsertOverallBudgetDto) {
    const existing = await this.prisma.budget.findFirst({
      where: {
        userId,
        month: dto.month,
        scopeType: 'OVERALL',
      },
      select: { id: true },
    });

    if (existing) {
      return this.prisma.budget.update({
        where: { id: existing.id },
        data: {
          amountCent: dto.amountCent,
          alertThreshold: dto.alertThreshold,
          isEnabled: dto.isEnabled ?? true,
        },
      });
    }

    return this.prisma.budget.create({
      data: {
        userId,
        month: dto.month,
        scopeType: 'OVERALL',
        categoryId: null,
        amountCent: dto.amountCent,
        alertThreshold: dto.alertThreshold,
        isEnabled: dto.isEnabled ?? true,
      },
    });
  }

  async upsertCategoryBudget(userId: string, dto: UpsertCategoryBudgetDto) {
    const category = await this.prisma.category.findFirst({
      where: {
        id: dto.categoryId,
        userId,
        type: 'EXPENSE',
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!category) {
      throw new BadRequestException(
        'Category budget can only be set for an existing expense category',
      );
    }

    return this.prisma.budget.upsert({
      where: {
        userId_month_scopeType_categoryId: {
          userId,
          month: dto.month,
          scopeType: 'CATEGORY',
          categoryId: dto.categoryId,
        },
      },
      create: {
        userId,
        month: dto.month,
        scopeType: 'CATEGORY',
        categoryId: dto.categoryId,
        amountCent: dto.amountCent,
        alertThreshold: dto.alertThreshold,
        isEnabled: dto.isEnabled ?? true,
      },
      update: {
        amountCent: dto.amountCent,
        alertThreshold: dto.alertThreshold,
        isEnabled: dto.isEnabled ?? true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
            icon: true,
            color: true,
          },
        },
      },
    });
  }
}
