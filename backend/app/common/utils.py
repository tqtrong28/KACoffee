from datetime import datetime


def generate_order_no(order_id: int) -> str:
    return f"KA{datetime.utcnow():%y%m%d}-{order_id:04d}"
