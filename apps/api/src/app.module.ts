import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
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
  ],
})
export class AppModule {}
