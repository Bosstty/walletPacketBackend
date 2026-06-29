import {
  Body,
  Controller,
  Get,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { BudgetsService } from './budgets.service';
import { QueryMonthDto } from './dto/query-month.dto';
import { UpsertCategoryBudgetDto } from './dto/upsert-category-budget.dto';
import { UpsertOverallBudgetDto } from './dto/upsert-overall-budget.dto';

@ApiTags('budgets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  getBudgets(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryMonthDto,
  ) {
    return this.budgetsService.getMonthlyBudgets(user.userId, query);
  }

  @Put('overall')
  upsertOverallBudget(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpsertOverallBudgetDto,
  ) {
    return this.budgetsService.upsertOverallBudget(user.userId, body);
  }

  @Put('category')
  upsertCategoryBudget(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpsertCategoryBudgetDto,
  ) {
    return this.budgetsService.upsertCategoryBudget(user.userId, body);
  }
}
