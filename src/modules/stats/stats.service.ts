import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  getCurrentShanghaiDate,
  getCurrentShanghaiMonth,
} from '../../common/utils/date.util';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getHomeSummary(userId: string) {
    const today = getCurrentShanghaiDate();
    const month = getCurrentShanghaiMonth();

    const [todayItems, monthItems, recentItems, overallBudget] = await Promise.all([
      this.prisma.transaction.findMany({
        where: {
          userId,
          status: 'ACTIVE',
          deletedAt: null,
          occurredDate: today,
        },
      }),
      this.prisma.transaction.findMany({
        where: {
          userId,
          status: 'ACTIVE',
          deletedAt: null,
          occurredMonth: month,
        },
      }),
      this.prisma.transaction.findMany({
        where: {
          userId,
          status: 'ACTIVE',
          deletedAt: null,
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
        orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
        take: 10,
      }),
      this.prisma.budget.findFirst({
        where: {
          userId,
          month,
          scopeType: 'OVERALL',
          isEnabled: true,
        },
      }),
    ]);

    const todaySummary = this.summarizeTransactions(todayItems);
    const monthSummary = this.summarizeTransactions(monthItems);

    return {
      today,
      month,
      todaySummary,
      monthSummary,
      overallBudget: overallBudget
        ? {
            amountCent: overallBudget.amountCent,
            alertThreshold: overallBudget.alertThreshold,
            usedCent: monthSummary.expenseTotalCent,
            remainingCent: overallBudget.amountCent - monthSummary.expenseTotalCent,
            usageRatio:
              overallBudget.amountCent > 0
                ? monthSummary.expenseTotalCent / overallBudget.amountCent
                : 0,
          }
        : null,
      recentTransactions: recentItems,
    };
  }

  async getMonthlyStats(userId: string, month?: string) {
    const targetMonth = month ?? getCurrentShanghaiMonth();

    const [transactions, budgets] = await Promise.all([
      this.prisma.transaction.findMany({
        where: {
          userId,
          status: 'ACTIVE',
          deletedAt: null,
          occurredMonth: targetMonth,
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
        orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.budget.findMany({
        where: {
          userId,
          month: targetMonth,
          isEnabled: true,
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
      }),
    ]);

    const summary = this.summarizeTransactions(transactions);
    const expenseTransactions = transactions.filter(
      (item) => item.type === 'EXPENSE',
    );
    const incomeTransactions = transactions.filter((item) => item.type === 'INCOME');

    const categoryExpenseMap = new Map<
      string,
      {
        categoryId: string;
        categoryName: string;
        icon: string | null;
        color: string | null;
        amountCent: number;
        count: number;
      }
    >();

    for (const item of expenseTransactions) {
      const key = item.categoryId;
      const current = categoryExpenseMap.get(key) ?? {
        categoryId: item.categoryId,
        categoryName: item.categoryNameSnapshot,
        icon: item.category?.icon ?? null,
        color: item.category?.color ?? null,
        amountCent: 0,
        count: 0,
      };

      current.amountCent += item.amountCent;
      current.count += 1;
      categoryExpenseMap.set(key, current);
    }

    const expenseByCategory = [...categoryExpenseMap.values()]
      .map((item) => ({
        ...item,
        ratio:
          summary.expenseTotalCent > 0
            ? item.amountCent / summary.expenseTotalCent
            : 0,
      }))
      .sort((a, b) => b.amountCent - a.amountCent);

    const trendMap = new Map<
      string,
      { date: string; expenseTotalCent: number; incomeTotalCent: number }
    >();

    for (const item of transactions) {
      const current = trendMap.get(item.occurredDate) ?? {
        date: item.occurredDate,
        expenseTotalCent: 0,
        incomeTotalCent: 0,
      };

      if (item.type === 'EXPENSE') {
        current.expenseTotalCent += item.amountCent;
      } else {
        current.incomeTotalCent += item.amountCent;
      }

      trendMap.set(item.occurredDate, current);
    }

    const dailyTrend = [...trendMap.values()].sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    const overallBudget =
      budgets.find((item) => item.scopeType === 'OVERALL') ?? null;

    const categoryBudgets = budgets
      .filter((item) => item.scopeType === 'CATEGORY')
      .map((item) => {
        const actual = expenseByCategory.find(
          (expense) => expense.categoryId === item.categoryId,
        );

        return {
          id: item.id,
          category: item.category,
          amountCent: item.amountCent,
          alertThreshold: item.alertThreshold,
          usedCent: actual?.amountCent ?? 0,
          remainingCent: item.amountCent - (actual?.amountCent ?? 0),
          usageRatio:
            item.amountCent > 0 ? (actual?.amountCent ?? 0) / item.amountCent : 0,
        };
      });

    return {
      month: targetMonth,
      summary,
      expenseByCategory,
      dailyTrend,
      expenseCount: expenseTransactions.length,
      incomeCount: incomeTransactions.length,
      overallBudget: overallBudget
        ? {
            amountCent: overallBudget.amountCent,
            alertThreshold: overallBudget.alertThreshold,
            usedCent: summary.expenseTotalCent,
            remainingCent: overallBudget.amountCent - summary.expenseTotalCent,
            usageRatio:
              overallBudget.amountCent > 0
                ? summary.expenseTotalCent / overallBudget.amountCent
                : 0,
          }
        : null,
      categoryBudgets,
    };
  }

  private summarizeTransactions(
    transactions: Array<{ type: 'EXPENSE' | 'INCOME'; amountCent: number }>,
  ) {
    const summary = {
      expenseTotalCent: 0,
      incomeTotalCent: 0,
      balanceCent: 0,
    };

    for (const item of transactions) {
      if (item.type === 'EXPENSE') {
        summary.expenseTotalCent += item.amountCent;
      } else {
        summary.incomeTotalCent += item.amountCent;
      }
    }

    summary.balanceCent = summary.incomeTotalCent - summary.expenseTotalCent;

    return summary;
  }
}
