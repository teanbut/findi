import { IsArray, IsDateString, IsNumber, IsString, Min } from 'class-validator';

export class CreateListingDto {
  @IsString() categoryId!: string;
  @IsString() title!: string;
  @IsString() description!: string;
  @IsArray() photos!: string[];
  @IsString() unit!: string;
  @IsNumber() @Min(0) originalPrice!: number;
  @IsNumber() @Min(0) discountedPrice!: number;
  @IsNumber() @Min(0) quantityAvailable!: number;
  @IsDateString() collectionWindowStart!: string;
  @IsDateString() collectionWindowEnd!: string;
  @IsString() pickupAddress!: string;
}
