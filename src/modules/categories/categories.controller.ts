import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ListCategoriesDto } from './dto/list-categories.dto';
import { CategoriesService } from './categories.service';

@ApiTags('categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  getCategories(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListCategoriesDto,
  ) {
    return this.categoriesService.findAll(user.userId, query);
  }

  @Post()
  createCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateCategoryDto,
  ) {
    return this.categoriesService.create(user.userId, body);
  }
}
