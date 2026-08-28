export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
  timestamp: string;
  path: string;
}

// Auth
export interface GetOtpRequest {
  phone: string;
}

export interface VerifyOtpRequest {
  phone: string;
  otp: string;
}

export interface AuthResponse {
  accessToken: string;
  isNew: boolean;
}

export interface AuthSession {
  phone: string;
  role: UserRole;
}

// User
export type UserRole = "user" | "admin";

export interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  phone: string;
  role: UserRole;
  createdAt: string;
}

// Category
export interface Category {
  id: string;
  name: string;
  slug: string;
  coverId?: string | null;
  coverUrl?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateCategoryRequest {
  name: string;
  slug: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  slug?: string;
}

// Slider
export interface Slider {
  id: string;
  title: string;
  linkUrl: string | null;
  desktopImageUrl: string | null;
  mobileImageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSliderRequest {
  title: string;
  linkUrl?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export type UpdateSliderRequest = Partial<CreateSliderRequest>;

// Story
export interface Story {
  id: string;
  title: string;
  linkUrl: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStoryRequest {
  title: string;
  linkUrl?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export type UpdateStoryRequest = Partial<CreateStoryRequest>;

// Attributes (new structure)
export interface AttributeValue {
  id: string;
  value: string;
  label?: string;
}

export interface Attribute {
  id: string;
  name: string;
  values: AttributeValue[];
}

// Orders
export type OrderStatus = "pending_payment" | "payment_uploaded" | "confirmed" | "cancelled";
export type PaymentStatus =
  | "pending"
  | "initiated"
  | "uploaded"
  | "confirmed"
  | "rejected"
  | "failed";

export interface OrderItem {
  id: string;
  variantId: string | null;
  productName: string;
  variantSku: string;
  variantAttributes: Record<string, string> | null;
  price: number;
  quantity: number;
  variantImageUrl: string | null;
  createdAt: string;
}

export interface OrderPayment {
  id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  receiptKey: string | null;
  adminNote: string | null;
  // Online gateway fields (present only when method = 'online_gateway')
  gatewayName: string | null;
  authority: string | null;
  refId: string | null;
  cardPan: string | null;
  gatewayCode: number | null;
  gatewayMessage: string | null;
  initiatedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderUser {
  id: string;
  phone: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
}

export interface Order {
  id: string;
  userId: string;
  /**
   * Public shopper-facing order number. This is the value shown in SMS
   * templates and on the order detail page — use this (not `id`) whenever
   * the shopper needs to see or quote a "شماره پیگیری".
   */
  orderNumber: string;
  status: OrderStatus;
  firstName: string;
  lastName: string;
  address: string;
  postalCode: string;
  note: string | null;
  deliveryType: DeliveryType;
  mobile?: string | null;
  nationalCode?: string | null;
  stateCode?: number | null;
  cityCode?: number | null;
  stateName?: string | null;
  cityName?: string | null;
  shippingCost?: string;
  shipmentSerial?: string | null;
  shipmentPostBarcode?: string | null;
  shipmentStatus?: ShipmentStatus | null;
  totalAmount: string;
  subtotalAmount?: string;
  discountAmount?: string;
  couponId?: string | null;
  couponSnapshot?: CouponSnapshot | null;
  items: OrderItem[];
  payment: OrderPayment;
  user: OrderUser | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderDetail extends Order {
  receiptUrl?: string;
}

// kept for variant hook compatibility
export interface AttributeOption {
  id: string;
  attribute: string;
  value: string;
}

// Product
export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  categoryId: string;
  category: Pick<Category, "id" | "name" | "slug">;
  coverUrl: string | null;
  minPrice: number | null;
  colors: string[];
  inStock: boolean;
  notified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDetail extends Product {
  variants: ProductVariant[];
}

export type DeliveryType = "in_person" | "iran_post";
export type PaymentMethod = "card_to_card" | "online_gateway";
export type ShipmentStatus = "pending" | "created" | "ready" | "barcoded" | "failed";

export interface ShippingState {
  postCode: number;
  nameFa: string;
  nameEn: string;
  shortNameEn: string;
}

export interface ShippingCity {
  id: string;
  code: number;
  stateCode: number;
  nameFa: string;
  shortNameEn: string;
  isCenter: boolean;
}

export interface ShippingQuote {
  shippingCost: number;
  goodsAmount: number;
  weightGrams: number;
}

export interface CreateOrderRequest {
  firstName: string;
  lastName: string;
  address: string;
  postalCode: string;
  deliveryType: DeliveryType;
  paymentMethod: PaymentMethod;
  /** Required when paymentMethod = 'online_gateway'. Slug of the provider. */
  gatewayName?: string;
  note?: string;
  couponCode?: string;
  /** Required when deliveryType='iran_post'. */
  mobile?: string;
  nationalCode?: string;
  stateCode?: number;
  cityCode?: number;
  stateName?: string;
  cityName?: string;
}

/**
 * POST /payments/checkout response. card_to_card returns just the order;
 * online_gateway returns everything you need to redirect the shopper to
 * the provider.
 */
export interface CheckoutResponse {
  order: Order;
  redirectUrl?: string;
  authority?: string;
  gatewayName?: string;
}

/**
 * POST /payments/verify response. Called by the storefront callback page
 * after the shopper returns from the gateway.
 */
export interface VerifyPaymentResponse {
  status: "success" | "failed";
  orderId: string;
  paymentId: string;
  refId: string | null;
  gatewayCode: number | null;
  gatewayMessage: string | null;
}

// Coupons
export type CouponScopeType = "product" | "category";

export interface Coupon {
  id: string;
  code: string;
  percentage: number;
  maxDiscountAmount: number;
  quantity: number;
  usedCount: number;
  scopeType: CouponScopeType;
  scopeId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CouponSnapshot {
  id: string;
  code: string;
  percentage: number;
  maxDiscountAmount: number;
  scope: { type: CouponScopeType; id: string };
  eligibleItemIds: string[];
  computedDiscountAmount: number;
}

export interface CreateCouponRequest {
  code: string;
  percentage: number;
  maxDiscountAmount: number;
  quantity: number;
  scopeType: CouponScopeType;
  scopeId: string;
  isActive?: boolean;
}

export interface UpdateCouponRequest {
  isActive?: boolean;
  quantity?: number;
  percentage?: number;
  maxDiscountAmount?: number;
}

export type CouponQuoteResponse =
  | {
      valid: true;
      code: string;
      percentage: number;
      maxDiscountAmount: number;
      subtotal: number;
      discountAmount: number;
      total: number;
      eligibleVariantIds: string[];
    }
  | { valid: false; reason: string };

export interface CreateProductRequest {
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateProductRequest {
  categoryId?: string;
  name?: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
}

// Variant
export interface VariantImage {
  id: string;
  order: number;
  url: string;
  media: {
    id: string;
    originalName: string;
    mimeType: string;
    size: number;
  };
}

export interface ProductVariant {
  id: string;
  sku: string;
  price: string;
  stock: number;
  attributes: Record<string, string>;
  imageIds: string[];
  imageUrls: string[];
  images: VariantImage[]; // legacy — may be absent
}

export interface CreateVariantRequest {
  sku?: string;
  price: number;
  stock: number;
  attributes: Record<string, string>;
}

export interface UpdateVariantRequest {
  price?: number;
  stock?: number;
  attributes?: Record<string, string>;
}

// Dashboard
export interface DashboardSummary {
  revenueThisMonth: number;
  pendingPaymentOrders: number;
  ordersToday: number;
  totalUsers: number;
  activeProducts: number;
  lowStockCount: number;
}
export interface RevenueChartItem { date: string; revenue: number; orders: number; }
export interface OrdersByStatus { status: OrderStatus; count: number; }
export interface TopProduct { productName: string; revenue: number; unitsSold: number; }
export interface NewUsersChartItem { date: string; count: number; }
export interface RecentOrder { id: string; customerName: string; totalAmount: number; status: OrderStatus; itemCount: number; createdAt: string; }
export interface LowStockVariant { sku: string; productName: string; stock: number; reserved: number; available: number; attributes: Record<string, string>; }
// Favorites
export interface FavoriteProduct {
  id: string;
  slug: string;
  name: string;
  coverUrl: string | null;
}

export interface FavoriteItem {
  favoriteId: string;
  productId: string;
  product: FavoriteProduct;
  createdAt: string;
}

export interface DashboardData {
  summary: DashboardSummary;
  revenueChart: RevenueChartItem[];
  ordersByStatus: OrdersByStatus[];
  topProducts: TopProduct[];
  newUsersChart: NewUsersChartItem[];
  recentOrders: RecentOrder[];
  lowStockVariants: LowStockVariant[];
}

// ── Articles / Blog ─────────────────────────────────────────────────────

export interface ArticleCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleMediaItem {
  key: string;
  url: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  alt?: string | null;
}

export interface Article {
  id: string;
  categoryId: string;
  category?: ArticleCategory;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverUrl: string | null;
  coverAlt: string | null;
  authorName: string;
  metaTitle: string | null;
  metaDescription: string | null;
  keywords: string[];
  media: ArticleMediaItem[];
  readTimeMinutes: number;
  viewCount: number;
  publishedAt: string | null;
  featuredProductId: string | null;
  featuredProduct: Product | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateArticleCategoryRequest {
  name: string;
  slug: string;
  description?: string;
  coverUrl?: string;
}
export type UpdateArticleCategoryRequest = Partial<CreateArticleCategoryRequest>;

export interface CreateArticleRequest {
  categoryId: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverUrl?: string;
  coverAlt?: string;
  authorName?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  publishedAt?: string | null;
  featuredProductId?: string | null;
}
export type UpdateArticleRequest = Partial<CreateArticleRequest>;
