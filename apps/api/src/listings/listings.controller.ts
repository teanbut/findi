import { Body, Controller, ForbiddenException, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('listings')
export class ListingsController {
  constructor(private readonly listings: ListingsService) {}

  @Public()
  @Get()
  browse(@Query('categoryId') categoryId?: string, @Query('supplierId') supplierId?: string) {
    return this.listings.browse({ categoryId, supplierId });
  }

  // Declared before ':id' — otherwise the dynamic route would swallow
  // this literal path first.
  @Roles('supplier')
  @Get('mine')
  mine(@Req() req: any) {
    if (!req.user.supplierId) throw new ForbiddenException('No supplier profile on this account yet');
    return this.listings.mine(req.user.supplierId);
  }

  @Public()
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.listings.getById(id);
  }

  @Roles('supplier')
  @Post()
  create(@Req() req: any, @Body() dto: CreateListingDto) {
    if (!req.user.supplierId) throw new ForbiddenException('No supplier profile on this account yet');
    return this.listings.create(req.user.supplierId, dto);
  }

  @Roles('supplier')
  @Post(':id/pause')
  pause(@Param('id') id: string, @Req() req: any) {
    if (!req.user.supplierId) throw new ForbiddenException('No supplier profile on this account yet');
    return this.listings.pause(id, req.user.supplierId);
  }
}
