export type ActorType = "customer" | "employee";

export type ProductType = "in_shop" | "takeaway" | "bottled";
export type ServingOption = "dine_in" | "takeaway";
export type ProductSize = "small" | "medium" | "large";
export type IceLevel = "no_ice" | "less_ice" | "normal_ice";
export type SugarLevel = "no_sugar" | "less_sugar" | "normal_sugar";
export type FulfillmentMethod = "pickup" | "delivery";
export type OrderStatus = "preparing" | "ready" | "completed" | "cancelled";
export type PaymentStatus = "unpaid" | "paid" | "cancelled";
export type OrderSource = "online" | "in_store" | "phone";
export type DiscountType = "percentage" | "fixed";
export type DeliveryStatus =
  | "pending_assignment"
  | "assigned"
  | "picked_up"
  | "delivering"
  | "delivered"
  | "failed"
  | "cancelled";

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
}

export interface Branch {
  id: number;
  code: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  opening_hours: string | null;
  map_url: string | null;
  image_url: string | null;
  amenities_text: string | null;
  is_active: boolean;
}

export interface PublicSystemSettings {
  site_title: string;
  brand_headline: string;
  brand_subheadline: string;
  support_phone: string | null;
  support_email: string | null;
  delivery_fee_vnd: number;
  public_notice: string | null;
}

export interface SystemSettings extends PublicSystemSettings {
  id: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  category_id: number;
  category_name: string;
  name: string;
  slug: string;
  description: string | null;
  product_type: ProductType;
  price_vnd: number;
  small_price_vnd: number | null;
  large_price_vnd: number | null;
  image_url: string | null;
  badge_text: string | null;
  flavor_note: string | null;
  is_featured: boolean;
  is_active: boolean;
  track_inventory: boolean;
  inventory_qty: number;
  is_online_available: boolean;
  is_in_store_available: boolean;
  created_at: string;
}

export interface MembershipSummary {
  customer_id: number;
  membership_rank: {
    id: number;
    code: string;
    name: string;
    min_points: number;
  };
  total_points: number;
}

export interface Discount {
  id: number;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  value: number;
  min_order_value_vnd: number | null;
  start_at: string | null;
  end_at: string | null;
  is_active: boolean;
  eligible_rank_ids: number[];
  eligible_rank_names: string[];
}

export interface DiscountValidation {
  code: string;
  discount_amount_vnd: number;
  final_subtotal_vnd: number;
  description: string | null;
}

export interface CustomerProfile {
  id: number;
  phone: string;
  full_name: string;
  email: string | null;
  membership_rank: string;
  total_points: number;
  default_address_line: string | null;
  default_ward: string | null;
  default_district: string | null;
  default_city: string | null;
  created_at: string;
}

export interface CustomerNotification {
  id: number;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name_snapshot: string;
  product_type_snapshot: ProductType;
  serving_option: ServingOption;
  size_option: ProductSize;
  ice_level: IceLevel;
  sugar_level: SugarLevel;
  unit_price_vnd: number;
  quantity: number;
  line_total_vnd: number;
  is_free_item: boolean;
  note: string | null;
}

export interface Order {
  id: number;
  order_no: string;
  source: OrderSource;
  branch_id: number;
  branch_name: string;
  customer_id?: number | null;
  customer_full_name?: string | null;
  customer_phone?: string | null;
  created_by_employee_id?: number | null;
  fulfillment_method: FulfillmentMethod;
  status: OrderStatus;
  payment_method: "offline";
  payment_status: PaymentStatus;
  subtotal_vnd: number;
  discount_code_snapshot?: string | null;
  discount_amount_vnd: number;
  delivery_fee_vnd: number;
  total_vnd: number;
  recipient_name: string;
  recipient_phone: string;
  address_line: string | null;
  ward: string | null;
  district: string | null;
  city: string | null;
  note: string | null;
  created_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
  items: OrderItem[];
}

export interface OrderTracking {
  order: Order;
  history: {
    id: number;
    from_status: string | null;
    to_status: string;
    changed_by_actor_type: string;
    changed_by_actor_id: number;
    note: string | null;
    changed_at: string;
  }[];
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  token_type: string;
  actor_type: ActorType;
  role: string | null;
}

export interface MeResponse {
  actor_type: ActorType;
  id: number;
  phone?: string | null;
  username?: string | null;
  full_name: string;
  role?: string | null;
  membership_rank?: string | null;
  total_points?: number | null;
  branch_id?: number | null;
  branch_name?: string | null;
}

export interface AdminDashboardSummary {
  total_orders: number;
  completed_orders: number;
  preparing_orders: number;
  ready_orders: number;
  cancelled_orders: number;
  revenue_vnd: number;
  total_products: number;
  total_categories: number;
  total_customers: number;
}

export interface RevenueReportPoint {
  report_date: string;
  completed_orders: number;
  revenue_vnd: number;
}

export interface DeliveryPerformancePoint {
  status: string;
  deliveries: number;
}

export interface EmployeePerformancePoint {
  employee_id: number;
  employee_name: string;
  role_code: string;
  branch_id: number;
  branch_name: string;
  monthly_order_target: number;
  monthly_revenue_target_vnd: number;
  monthly_delivery_target: number;
  actual_orders: number;
  actual_revenue_vnd: number;
  actual_deliveries: number;
  estimated_commission_vnd: number;
  met_target: boolean;
}

export interface BranchTargetProgressPoint {
  branch_id: number;
  branch_name: string;
  monthly_order_target: number;
  monthly_revenue_target_vnd: number;
  actual_orders: number;
  actual_revenue_vnd: number;
  estimated_bonus_vnd: number;
  met_target: boolean;
}

export interface RoleTargetPolicy {
  id: number;
  role_code: string;
  monthly_order_target: number;
  monthly_revenue_target_vnd: number;
  monthly_delivery_target: number;
  bonus_rate_percent: number;
  bonus_per_extra_order_vnd: number;
  bonus_per_extra_delivery_vnd: number;
  bonus_flat_vnd: number;
  is_active: boolean;
  updated_at: string;
}

export interface BranchTargetPolicy {
  id: number;
  branch_id: number;
  branch_name: string;
  monthly_order_target: number;
  monthly_revenue_target_vnd: number;
  bonus_rate_percent: number;
  bonus_flat_vnd: number;
  is_active: boolean;
  updated_at: string;
}

export interface EmployeeProfile {
  id: number;
  username: string;
  full_name: string;
  phone: string | null;
  role: string;
  branch_id: number;
  branch_name: string;
  is_active: boolean;
}

export interface StaffCustomerLookup {
  id: number;
  phone: string;
  full_name: string;
  membership_rank: string;
  total_points: number;
}

export interface DeliveryHistoryEntry {
  id: number;
  from_status: string | null;
  to_status: string;
  changed_by_employee_id: number;
  note: string | null;
  created_at: string;
}

export interface DeliveryAdmin {
  id: number;
  order_id: number;
  order_no: string;
  branch_id: number;
  branch_name: string;
  shipper_employee_id: number | null;
  shipper_name: string | null;
  status: DeliveryStatus;
  delivery_note: string | null;
  failure_reason: string | null;
  recipient_name: string;
  recipient_phone: string;
  address_line: string | null;
  ward: string | null;
  district: string | null;
  city: string | null;
  created_at: string;
  assigned_at: string | null;
  picked_up_at: string | null;
  delivering_at: string | null;
  delivered_at: string | null;
  failed_at: string | null;
  history?: DeliveryHistoryEntry[] | null;
}

export interface DeliveryShipper {
  id: number;
  order_id: number;
  order_no: string;
  status: DeliveryStatus;
  delivery_note: string | null;
  failure_reason: string | null;
  recipient_name: string;
  recipient_phone: string;
  address_line: string | null;
  ward: string | null;
  district: string | null;
  city: string | null;
  item_summary: string[];
  assigned_at: string | null;
  picked_up_at: string | null;
  delivering_at: string | null;
  delivered_at: string | null;
  failed_at: string | null;
  history?: DeliveryHistoryEntry[] | null;
}

export interface BottleExchangeRecord {
  id: number;
  branch_id: number;
  branch_name: string;
  customer_id: number | null;
  customer_phone_snapshot: string | null;
  customer_name: string | null;
  processed_by_employee_id: number;
  processed_by_employee_name: string;
  returned_bottle_qty: number;
  reward_product_id: number;
  reward_product_name_snapshot: string;
  reward_quantity: number;
  note: string | null;
  created_at: string;
}

export interface AuditLog {
  id: number;
  actor_type: string;
  actor_id: number;
  actor_name: string | null;
  branch_id: number | null;
  action: string;
  entity_type: string;
  entity_id: number;
  description: string | null;
  payload_json: string | null;
  created_at: string;
}
