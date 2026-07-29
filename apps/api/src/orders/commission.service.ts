import { Injectable } from '@nestjs/common';
import type { SupplierTier } from '@findi/shared';

/**
 * Suggested commission rates from FINDI_FEATURE_SPECIFICATION.md §7.4 —
 * midpoint of each suggested range, used as a working default.
 * STILL AN OPEN BUSINESS DECISION (feature spec §18, decision #5) — this
 * must be confirmed with the business owner before real money moves, and
 * should move to a DB-backed config table (or at least env vars) rather
 * than a hardcoded constant once that sign-off happens.
 */
const DEFAULT_COMMISSION_RATE: Record<SupplierTier, number> = {
  farmer: 0.09,
  local_business: 0.125,
  community_seller: 0.11,
  rescue_partner: 0.1, // "negotiated" per spec — placeholder until a deal exists
};

@Injectable()
export class CommissionService {
  rateFor(tier: SupplierTier): number {
    return DEFAULT_COMMISSION_RATE[tier];
  }
}
