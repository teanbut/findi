import { IsArray, IsEnum, IsString } from 'class-validator';
import type { SupplierTier } from '@findi/shared';

export class ApplyDto {
  @IsString()
  businessName!: string;

  @IsEnum(['farmer', 'local_business', 'community_seller', 'rescue_partner'])
  tier!: SupplierTier;

  // Category IDs the applicant wants to sell in — each becomes its own
  // SupplierCategory row with status 'pending' (feature spec §5.2/§5.3).
  @IsArray()
  @IsString({ each: true })
  categoryIds!: string[];
}
