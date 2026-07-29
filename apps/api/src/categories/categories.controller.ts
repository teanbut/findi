import { Controller, Get, Param } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Public } from '../auth/decorators/public.decorator';

// Guest browsing is allowed (feature spec §10.1: "login gate at checkout",
// not at browse) — both routes are public.
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Public()
  @Get()
  list() {
    return this.categories.list();
  }

  @Public()
  @Get(':id/capacity')
  capacity(@Param('id') id: string) {
    return this.categories.capacity(id);
  }
}
