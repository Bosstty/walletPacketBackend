import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  formatShanghaiDate,
  formatShanghaiMonth,
} from '../../common/utils/date.util';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ListTransactionsDto } from './dto/list-transactions.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTransactionDto) {
    const category = await this.getValidCategory(userId, dto.categoryId, dto.type);
    const occurredAt = new Date(dto.occurredAt);

    return this.prisma.transaction.create({
      data: {
        userId,
        type: dto.type,
        amountCent: dto.amountCent,
        categoryId: category.id,
        categoryNameSnapshot: category.name,
        occurredAt,
        occurredDate: this.formatDate(occurredAt),
        occurredMonth: this.formatMonth(occurredAt),
        note: dto.note?.trim() || null,
        budgetIncluded: dto.budgetIncluded ?? dto.type === 'EXPENSE',
      },
    });
  }

  async findAll(userId: string, query: ListTransactionsDto) {
    const items = await this.prisma.transaction.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        deletedAt: null,
        ...(query.month ? { occurredMonth: query.month } : {}),
        ...(query.date ? { occurredDate: query.date } : {}),
        ...(query.type ? { type: query.type } : {}),
        ...(query.categoryId ? { categoryId: query.categoryId } : {}),
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
    });

    const summary = items.reduce(
      (acc, item) => {
        if (item.type === 'EXPENSE') {
          acc.expenseTotalCent += item.amountCent;
        } else {
          acc.incomeTotalCent += item.amountCent;
        }
        return acc;
      },
      { expenseTotalCent: 0, incomeTotalCent: 0 },
    );

    return {
      items,
      total: items.length,
      summary: {
        ...summary,
        balanceCent: summary.incomeTotalCent - summary.expenseTotalCent,
      },
    };
  }

  async findOne(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id,
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
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    const current = await this.findOne(userId, id);

    const nextType = dto.type ?? current.type;
    const nextCategoryId = dto.categoryId ?? current.categoryId;
    const nextOccurredAt = dto.occurredAt
      ? new Date(dto.occurredAt)
      : current.occurredAt;

    const category =
      nextCategoryId !== current.categoryId || nextType !== current.type
        ? await this.getValidCategory(userId, nextCategoryId, nextType)
        : current.category;

    return this.prisma.transaction.update({
      where: { id: current.id },
      data: {
        ...(dto.type ? { type: dto.type } : {}),
        ...(dto.amountCent !== undefined ? { amountCent: dto.amountCent } : {}),
        ...(dto.categoryId || dto.type
          ? {
              categoryId: category.id,
              categoryNameSnapshot: category.name,
            }
          : {}),
        ...(dto.occurredAt
          ? {
              occurredAt: nextOccurredAt,
              occurredDate: this.formatDate(nextOccurredAt),
              occurredMonth: this.formatMonth(nextOccurredAt),
            }
          : {}),
        ...(dto.note !== undefined ? { note: dto.note.trim() || null } : {}),
        ...(dto.budgetIncluded !== undefined
          ? { budgetIncluded: dto.budgetIncluded }
          : {}),
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

  async remove(userId: string, id: string) {
    const current = await this.findOne(userId, id);

    await this.prisma.transaction.update({
      where: { id: current.id },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
      },
    });

    return { ok: true, id: current.id };
  }

  private async getValidCategory(
    userId: string,
    categoryId: string,
    type: 'EXPENSE' | 'INCOME',
  ) {
    const category = await this.prisma.category.findFirst({
      where: {
        id: categoryId,
        userId,
        type,
        isEnabled: true,
        deletedAt: null,
      },
    });

    if (!category) {
      throw new BadRequestException('Category is invalid for this transaction');
    }

    return category;
  }

  private formatDate(date: Date) {
    return formatShanghaiDate(date);
  }

  private formatMonth(date: Date) {
    return formatShanghaiMonth(date);
  }
}
