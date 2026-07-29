import { Controller, Get, Param } from '@nestjs/common';
import { FindiPointsService } from './findi-points.service';

@Controller('findi-points')
export class FindiPointsController {
  constructor(private readonly points: FindiPointsService) {}

  @Get(':customerId')
  balance(@Param('customerId') customerId: string) {
    return this.points.balance(customerId);
  }
}
