import type { CheckoutRequest, CheckoutResult } from '@findi/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('findi_token');
}

export function setToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem('findi_token', token);
  else window.localStorage.removeItem('findi_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    // Server components (home/listing pages) fetch without a browser
    // token, which is fine — those routes are @Public().
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.message ?? `Request failed (${res.status})`, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ---- Auth ----
export function register(input: { email: string; password: string; phone?: string; role: 'customer' | 'supplier' | 'fundraising_org' }) {
  return request<{ accessToken: string; refreshToken: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function login(email: string, password: string) {
  return request<{ accessToken: string; refreshToken: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// ---- Catalogue (public) ----
export interface ListingWithSupplier {
  id: string;
  title: string;
  description: string;
  photos: string[];
  unit: string;
  originalPrice: string;
  discountedPrice: string;
  quantityAvailable: number;
  collectionWindowStart: string;
  collectionWindowEnd: string;
  pickupAddress: string;
  supplier: { id: string; businessName: string; tier: string };
  category: { id: string; name: string };
}

export function browseListings(params: { categoryId?: string; supplierId?: string } = {}) {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]);
  const suffix = qs.toString() ? `?${qs}` : '';
  return request<ListingWithSupplier[]>(`/listings${suffix}`);
}

export function getListing(id: string) {
  return request<ListingWithSupplier>(`/listings/${id}`);
}

// ---- Checkout ----
export function checkout(payload: CheckoutRequest) {
  return request<CheckoutResult>('/checkout', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ---- Categories (public) ----
export interface Category {
  id: string;
  name: string;
  parentId: string | null;
}

export function listCategories() {
  return request<Category[]>('/categories');
}

// ---- Suppliers ----
export interface SupplierProfile {
  id: string;
  businessName: string;
  tier: string;
  status: string;
  categories: { categoryId: string; status: string; category?: Category }[];
}

export function applySupplier(input: { businessName: string; tier: string; categoryIds: string[] }) {
  return request<SupplierProfile>('/suppliers/apply', { method: 'POST', body: JSON.stringify(input) });
}

export function requestCategory(categoryId: string) {
  return request(`/suppliers/categories/${categoryId}/request`, { method: 'POST' });
}

export function myListings() {
  return request<ListingWithSupplier[]>('/listings/mine');
}

export interface CreateListingInput {
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
}

export function createListing(input: CreateListingInput) {
  return request('/listings', { method: 'POST', body: JSON.stringify(input) });
}

// ---- Wallet ----
export interface WalletBalance {
  supplierId: string;
  availableBalance: string;
  pendingBalance: string;
}

export function myWalletBalance() {
  return request<WalletBalance>('/wallet/me');
}

export function myWithdraw(amount: number) {
  return request('/wallet/me/withdraw', { method: 'POST', body: JSON.stringify({ amount }) });
}

// ---- Admin ----
export interface AdminOrder {
  id: string;
  status: string;
  subtotal: string;
  feedItForwardAmount: string;
  total: string;
  placedAt: string;
  items: { id: string; quantity: number; lineTotal: string; collectionStatus: string; listing: { title: string } }[];
  paymentSplits: { recipientType: string; recipientId: string | null; amount: string }[];
  fundraisingOrg: { name: string } | null;
}

export function adminOrders() {
  return request<AdminOrder[]>('/admin/orders');
}

export function adminCancelOrder(id: string, reason: string) {
  return request(`/admin/orders/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) });
}

export function adminFeedItForwardLedger() {
  return request<{ collected: number; disbursed: number; available: number }>('/feed-it-forward/ledger');
}

export function adminDisburseFeedItForward(recipient: string, amount: number, approvedBy: string, note?: string) {
  return request('/feed-it-forward/disbursements', {
    method: 'POST',
    body: JSON.stringify({ recipient, amount, approvedBy, note }),
  });
}

// ---- Fundraising ----
export interface FundraisingOrg {
  id: string;
  name: string;
  type: string;
  code: string;
  status: string;
}

export interface FundraisingDashboard {
  orgId: string;
  totalRaised: number;
  supporterCount: number;
  orderCount: number;
}

export function applyFundraisingOrg(name: string, type: string) {
  return request<FundraisingOrg>('/fundraising/apply', { method: 'POST', body: JSON.stringify({ name, type }) });
}

export function myFundraisingDashboard() {
  return request<FundraisingDashboard>('/fundraising/me/dashboard');
}

export function adminPendingFundraisingOrgs() {
  return request<FundraisingOrg[]>('/fundraising/pending');
}

export function adminApproveFundraisingOrg(orgId: string) {
  return request(`/fundraising/${orgId}/approve`, { method: 'POST' });
}
export function adminPendingSuppliers() {
  return request<SupplierProfile[]>('/admin/suppliers/pending');
}

export function adminPendingCategoryRequests() {
  return request<{ supplierId: string; categoryId: string; supplier: SupplierProfile; category: Category }[]>(
    '/admin/categories/pending-requests',
  );
}

export function adminApproveSupplier(id: string) {
  return request(`/suppliers/${id}/approve`, { method: 'POST' });
}

export function adminApproveCategory(supplierId: string, categoryId: string) {
  return request(`/suppliers/${supplierId}/categories/${categoryId}/approve`, { method: 'POST' });
}

export function adminRevenue(from: string, to: string) {
  return request<{ from: string; to: string; findiCommissionRevenue: number }>(
    `/admin/revenue?from=${from}&to=${to}`,
  );
}
