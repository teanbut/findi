import { Type } from 'class-transformer';
import { IsArray, IsIn, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

class CheckoutBasketItemDto {
  @IsString() listingId!: string;
  @IsNumber() @Min(1) quantity!: number;
}

class FeedItForwardDto {
  @IsIn(['round_up', 'fixed'])
  mode!: 'round_up' | 'fixed';

  @IsOptional()
  @IsNumber()
  amount?: number;
}

export class CheckoutDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutBasketItemDto)
  items!: CheckoutBasketItemDto[];

  @IsOptional()
  @IsString()
  fundraisingCode?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => FeedItForwardDto)
  feedItForward?: FeedItForwardDto;
}
