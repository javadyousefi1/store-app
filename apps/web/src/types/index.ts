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
  createdAt: string;
}

export interface CreateCategoryRequest {
  name: string;
}

export interface UpdateCategoryRequest {
  name: string;
}

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
export type PaymentStatus = "pending" | "uploaded" | "confirmed" | "rejected";

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
  method: string;
  status: PaymentStatus;
  receiptKey: string | null;
  adminNote: string | null;
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
  status: OrderStatus;
  firstName: string;
  lastName: string;
  address: string;
  postalCode: string;
  note: string | null;
  totalAmount: string;
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
  name: string;
  description: string | null;
  categoryId: string;
  category: Pick<Category, "id" | "name">;
  coverUrl: string | null;
  minPrice: number | null;
  colors: string[];
  notified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDetail extends Product {
  variants: ProductVariant[];
}

export type DeliveryType = "in_person";
export type PaymentMethod = "card_to_card";

export interface CreateOrderRequest {
  firstName: string;
  lastName: string;
  address: string;
  postalCode: string;
  deliveryType: DeliveryType;
  paymentMethod: PaymentMethod;
  note?: string;
}

export interface CreateProductRequest {
  categoryId: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateProductRequest {
  categoryId?: string;
  name?: string;
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
export interface DashboardData {
  summary: DashboardSummary;
  revenueChart: RevenueChartItem[];
  ordersByStatus: OrdersByStatus[];
  topProducts: TopProduct[];
  newUsersChart: NewUsersChartItem[];
  recentOrders: RecentOrder[];
  lowStockVariants: LowStockVariant[];
}
