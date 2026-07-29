import { Controller, Get, Req } from '@nestjs/common';
import { FindiPointsService } from './findi-points.service';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('findi-points')
export class FindiPointsController {
  constructor(private readonly points: FindiPointsService) {}

  // A customer's own balance only — req.user.sub, not a URL param a
  // customer could swap out to read someone else's points.
  @Roles('customer')
  @Get('me')
  myBalance(@Req() req: any) {
    return this.points.balance(req.user.sub);
  }
}
