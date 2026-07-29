// Shared TypeScript types for Findi — used by both the API and the web app
// so a split-payment or category-approval bug can't hide behind two
// slightly different definitions of the same concept.
// Mirrors FINDI_TECHNICAL_DESIGN_AND_IMPLEMENTATION_PLAN.md §3.

export type SupplierTier =
  | 'farmer'
  | 'local_business'
  | 'community_seller'
  | 'rescue_partner';

export type SupplierStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type CategoryApprovalStatus = 'pending' | 'approved';

export type ListingStatus = 'draft' | 'active' | 'paused';

export type OrderStatus =
  | 'placed'
  | 'ready_for_collection'
  | 'collected'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export type CollectionStatus =
  | 'pending'
  | 'ready'
  | 'collected'
  | 'no_show'
  | 'refunded';

export type PaymentSplitRecipientType =
  | 'supplier'
  | 'findi_commission'
  | 'feed_it_forward'
  | 'fundraising_org';

export type WalletTransactionType = 'sale' | 'payout' | 'adjustment';

export type FeedItForwardSourceType = 'customer_order' | 'supplier_donation';

export type FindiPointsTransactionType =
  | 'purchase'
  | 'referral'
  | 'review'
  | 'redeem'
  | 'donate';

export type FundraisingOrgType = 'school' | 'church' | 'club' | 'ngo';

export interface Category {
  id: string;
  name: string;
  parentId: string | null;
}

export interface SupplierProfile {
  id: string;
  userId: string;
  businessName: string;
  tier: SupplierTier;
  status: SupplierStatus;
}

export interface SupplierCategory {
  supplierId: string;
  categoryId: string;
  status: CategoryApprovalStatus;
  approvedAt: string | null;
}

export interface Listing {
  id: string;
  supplierId: string;
  categoryId: string;
  title: string;
  description: string;
  photos: string[];
  unit: string;
  originalPrice: number;
  discountedPrice: number;
  quantityAvailable: number;
  collectionWindowStart: string;
  collectionWindowEnd: string;
  pickupAddress: string;
  status: ListingStatus;
  recurrenceRule: string | null;
}

export interface OrderItem {
  id: string;
  orderId: string;
  listingId: string;
  supplierId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  collectionStatus: CollectionStatus;
}

export interface Order {
  id: string;
  customerId: string;
  fundraisingOrgId: string | null;
  status: OrderStatus;
  subtotal: number;
  feedItForwardAmount: number;
  total: number;
  placedAt: string;
  items: OrderItem[];
}

export interface PaymentSplit {
  id: string;
  orderId: string;
  recipientType: PaymentSplitRecipientType;
  recipientId: string | null;
  amount: number;
  status: 'pending' | 'settled';
}

export interface SupplierWallet {
  supplierId: string;
  availableBalance: number;
  pendingBalance: number;
}

export interface FundraisingOrganisation {
  id: string;
  name: string;
  type: FundraisingOrgType;
  code: string;
  status: SupplierStatus;
}

// Checkout DTO shape shared between web and API so both sides validate
// against the same contract for the highest-risk request in the app.
export interface CheckoutBasketItem {
  listingId: string;
  quantity: number;
}

export interface CheckoutRequest {
  items: CheckoutBasketItem[];
  fundraisingCode?: string;
  feedItForward?: {
    mode: 'round_up' | 'fixed';
    amount?: number; // required when mode === 'fixed' (e.g. 1, 5, 10)
  };
}

export interface CheckoutResult {
  order: Order;
  splits: PaymentSplit[];
}
