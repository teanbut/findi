import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';

@Controller('listings')
export class ListingsController {
  constructor(private readonly listings: ListingsService) {}

  @Get()
  browse(@Query('categoryId') categoryId?: string, @Query('supplierId') supplierId?: string) {
    return this.listings.browse({ categoryId, supplierId });
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateListingDto) {
    return this.listings.create(req.user.supplierId, dto);
  }

  @Post(':id/pause')
  pause(@Param('id') id: string, @Req() req: any) {
    return this.listings.pause(id, req.user.supplierId);
  }
}
