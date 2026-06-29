import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { StatsQueryDto } from './dto/stats-query.dto';
import { StatsService } from './stats.service';

@ApiTags('stats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('home')
  getHomeSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.statsService.getHomeSummary(user.userId);
  }

  @Get('monthly')
  getMonthlyStats(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: StatsQueryDto,
  ) {
    return this.statsService.getMonthlyStats(user.userId, query.month);
  }
}
