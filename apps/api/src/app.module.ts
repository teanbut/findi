import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { CategoriesModule } from './categories/categories.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { ListingsModule } from './listings/listings.module';
import { OrdersModule } from './orders/orders.module';
import { WalletModule } from './wallet/wallet.module';
import { FeedItForwardModule } from './feed-it-forward/feed-it-forward.module';
import { FundraisingModule } from './fundraising/fundraising.module';
import { FindiPointsModule } from './findi-points/findi-points.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AdminModule } from './admin/admin.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    CategoriesModule,
    SuppliersModule,
    ListingsModule,
    OrdersModule,
    WalletModule,
    FeedItForwardModule,
    FundraisingModule,
    FindiPointsModule,
    ReviewsModule,
    AdminModule,
    MailModule,
  ],
  providers: [
    // Order matters: JwtAuthGuard runs first and populates req.user,
    // RolesGuard reads it. Both apply to every route by default —
    // @Public() (auth/register, auth/login, browse endpoints) is the
    // explicit opt-out, not the other way around.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
