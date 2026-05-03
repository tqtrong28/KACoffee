import type {
  DeliveryStatus,
  FulfillmentMethod,
  IceLevel,
  OrderSource,
  OrderStatus,
  PaymentStatus,
  ProductSize,
  ProductType,
  ServingOption,
  SugarLevel,
} from "./../types/models";

const productTypeLabels: Record<ProductType, string> = {
  in_shop: "Signature",
  takeaway: "Pha ly",
  bottled: "Đóng chai",
};

const servingOptionLabels: Record<ServingOption, string> = {
  dine_in: "Tại chỗ",
  takeaway: "Mang về",
};

const productSizeLabels: Record<ProductSize, string> = {
  small: "Nhỏ",
  medium: "Vừa",
  large: "Lớn",
};

const iceLevelLabels: Record<IceLevel, string> = {
  no_ice: "Không đá",
  less_ice: "Ít đá",
  normal_ice: "Đá bình thường",
};

const sugarLevelLabels: Record<SugarLevel, string> = {
  no_sugar: "Không đường",
  less_sugar: "Ít đường",
  normal_sugar: "Đường bình thường",
};

const orderStatusLabels: Record<OrderStatus, string> = {
  preparing: "Đang chuẩn bị",
  ready: "Sẵn sàng",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
};

const paymentStatusLabels: Record<PaymentStatus, string> = {
  unpaid: "Chưa thanh toán",
  paid: "Đã thanh toán",
  cancelled: "Đã hủy",
};

const orderSourceLabels: Record<OrderSource, string> = {
  online: "Trực tuyến",
  in_store: "Tại quầy",
  phone: "Điện thoại",
};

const fulfillmentMethodLabels: Record<FulfillmentMethod, string> = {
  pickup: "Tự đến lấy",
  delivery: "Giao tận nơi",
};

const deliveryStatusLabels: Record<DeliveryStatus, string> = {
  pending_assignment: "Chờ phân công",
  assigned: "Đã phân công",
  picked_up: "Đã nhận hàng",
  delivering: "Đang giao",
  delivered: "Giao thành công",
  failed: "Giao thất bại",
  cancelled: "Đã hủy",
};

const roleLabels: Record<string, string> = {
  employee: "Nhân viên",
  manager: "Quản lý",
  admin: "Quản trị viên",
  shipper: "Nhân viên giao hàng",
};

const pointReasonLabels: Record<string, string> = {
  completed_order: "Hoàn tất đơn hàng",
};

export function getProductTypeLabel(value: string) {
  return productTypeLabels[value as ProductType] ?? value;
}

export function getServingOptionLabel(value: string) {
  return servingOptionLabels[value as ServingOption] ?? value;
}

export function getProductSizeLabel(value: string) {
  return productSizeLabels[value as ProductSize] ?? value;
}

export function getIceLevelLabel(value: string) {
  return iceLevelLabels[value as IceLevel] ?? value;
}

export function getSugarLevelLabel(value: string) {
  return sugarLevelLabels[value as SugarLevel] ?? value;
}

export function getOrderStatusLabel(value: string) {
  return orderStatusLabels[value as OrderStatus] ?? value;
}

export function getPaymentStatusLabel(value: string) {
  return paymentStatusLabels[value as PaymentStatus] ?? value;
}

export function getOrderSourceLabel(value: string) {
  return orderSourceLabels[value as OrderSource] ?? value;
}

export function getFulfillmentMethodLabel(value: string) {
  return fulfillmentMethodLabels[value as FulfillmentMethod] ?? value;
}

export function getDeliveryStatusLabel(value: string) {
  return deliveryStatusLabels[value as DeliveryStatus] ?? value;
}

export function getRoleLabel(value: string) {
  return roleLabels[value] ?? value;
}

export function getPointReasonLabel(value: string) {
  return pointReasonLabels[value] ?? value;
}
