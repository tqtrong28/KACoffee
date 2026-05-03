from enum import StrEnum


class ActorType(StrEnum):
    CUSTOMER = "customer"
    EMPLOYEE = "employee"


class MembershipRankCode(StrEnum):
    NEW = "new"
    SILVER = "silver"
    GOLD = "gold"
    DIAMOND = "diamond"


class RoleCode(StrEnum):
    EMPLOYEE = "employee"
    MANAGER = "manager"
    ADMIN = "admin"
    SHIPPER = "shipper"


class ProductType(StrEnum):
    IN_SHOP = "in_shop"
    TAKEAWAY = "takeaway"
    BOTTLED = "bottled"


class ServingOption(StrEnum):
    DINE_IN = "dine_in"
    TAKEAWAY = "takeaway"


class ProductSize(StrEnum):
    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"


class IceLevel(StrEnum):
    NO_ICE = "no_ice"
    LESS_ICE = "less_ice"
    NORMAL_ICE = "normal_ice"


class SugarLevel(StrEnum):
    NO_SUGAR = "no_sugar"
    LESS_SUGAR = "less_sugar"
    NORMAL_SUGAR = "normal_sugar"


class OrderSource(StrEnum):
    ONLINE = "online"
    IN_STORE = "in_store"
    PHONE = "phone"


class FulfillmentMethod(StrEnum):
    PICKUP = "pickup"
    DELIVERY = "delivery"


class OrderStatus(StrEnum):
    PREPARING = "preparing"
    READY = "ready"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class PaymentMethod(StrEnum):
    OFFLINE = "offline"


class PaymentStatus(StrEnum):
    UNPAID = "unpaid"
    PAID = "paid"
    CANCELLED = "cancelled"


class DiscountType(StrEnum):
    PERCENTAGE = "percentage"
    FIXED = "fixed"


class DeliveryStatus(StrEnum):
    PENDING_ASSIGNMENT = "pending_assignment"
    ASSIGNED = "assigned"
    PICKED_UP = "picked_up"
    DELIVERING = "delivering"
    DELIVERED = "delivered"
    FAILED = "failed"
    CANCELLED = "cancelled"
