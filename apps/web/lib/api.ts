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
