from sqlalchemy import select

from app.modules.admin.models import Branch, Employee
from app.modules.catalog.models import Product


def _customer_headers(client, phone: str, password: str = "secret123") -> dict[str, str]:
    response = client.post(
        "/api/v1/auth/customers/register",
        json={
            "phone": phone,
            "password": password,
            "full_name": "Khach Hang Test",
            "email": "test@example.com",
        },
    )
    assert response.status_code == 200, response.text
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _employee_headers(client, username: str, password: str) -> dict[str, str]:
    response = client.post(
        "/api/v1/auth/employees/login",
        json={"username": username, "password": password},
    )
    assert response.status_code == 200, response.text
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_customer_pickup_flow_with_discount(client, db_session) -> None:
    headers = _customer_headers(client, "0988000001")
    branch = db_session.scalar(select(Branch).where(Branch.code == "hoan-kiem"))
    latte = db_session.scalar(select(Product).where(Product.slug == "latte-takeaway"))

    subtotal = latte.large_price_vnd * 2
    validate_response = client.post(
        "/api/v1/discounts/validate",
        headers=headers,
        json={"code": "WELCOME10", "subtotal_vnd": subtotal},
    )
    assert validate_response.status_code == 200, validate_response.text
    assert validate_response.json()["discount_amount_vnd"] == subtotal // 10

    order_response = client.post(
        "/api/v1/orders",
        headers=headers,
        json={
            "branch_id": branch.id,
            "fulfillment_method": "pickup",
            "recipient_name": "Khach Hang Test",
            "recipient_phone": "0988000001",
            "discount_code": "WELCOME10",
            "items": [
                {
                    "product_id": latte.id,
                    "quantity": 2,
                    "size_option": "large",
                    "ice_level": "less_ice",
                    "sugar_level": "less_sugar",
                    "note": "Cho them coc phu",
                }
            ],
        },
    )
    assert order_response.status_code == 201, order_response.text
    order = order_response.json()
    assert order["subtotal_vnd"] == subtotal
    assert order["discount_amount_vnd"] == subtotal // 10
    assert order["delivery_fee_vnd"] == 0
    assert order["status"] == "preparing"
    assert order["items"][0]["size_option"] == "large"
    assert order["items"][0]["unit_price_vnd"] == latte.large_price_vnd

    cancel_response = client.post(f"/api/v1/orders/me/{order['id']}/cancel", headers=headers)
    assert cancel_response.status_code == 200, cancel_response.text
    cancelled = cancel_response.json()
    assert cancelled["status"] == "cancelled"
    assert cancelled["payment_status"] == "cancelled"


def test_delivery_assignment_and_completion_flow(client, db_session) -> None:
    customer_headers = _customer_headers(client, "0988000002")
    staff_headers = _employee_headers(client, "staff1", "staff123")
    manager_headers = _employee_headers(client, "manager1", "manager123")
    shipper_headers = _employee_headers(client, "shipper1", "ship123")

    branch = db_session.scalar(select(Branch).where(Branch.code == "hoan-kiem"))
    latte = db_session.scalar(select(Product).where(Product.slug == "latte-takeaway"))
    shipper = db_session.scalar(select(Employee).where(Employee.username == "shipper1"))

    order_response = client.post(
        "/api/v1/orders",
        headers=customer_headers,
        json={
            "branch_id": branch.id,
            "fulfillment_method": "delivery",
            "recipient_name": "Khach Delivery",
            "recipient_phone": "0988000002",
            "address_line": "12 Trang Tien",
            "ward": "Trang Tien",
            "district": "Hoan Kiem",
            "city": "Hà Nội",
            "items": [
                {
                    "product_id": latte.id,
                    "quantity": 1,
                    "size_option": "medium",
                    "ice_level": "normal_ice",
                    "sugar_level": "normal_sugar",
                }
            ],
        },
    )
    assert order_response.status_code == 201, order_response.text
    order = order_response.json()
    assert order["status"] == "preparing"
    assert order["payment_status"] == "unpaid"

    ready_response = client.patch(
        f"/api/v1/staff/orders/{order['id']}/status",
        headers=staff_headers,
        json={"status": "ready", "note": "Da san sang giao"},
    )
    assert ready_response.status_code == 200, ready_response.text
    assert ready_response.json()["status"] == "ready"

    assign_response = client.post(
        f"/api/v1/admin/deliveries/{order['id']}/assign",
        headers=manager_headers,
        json={"shipper_employee_id": shipper.id, "note": "Giao cho shipper ca sang"},
    )
    assert assign_response.status_code == 200, assign_response.text
    delivery = assign_response.json()
    assert delivery["status"] == "assigned"
    assert delivery["shipper_employee_id"] == shipper.id

    pickup_response = client.post(
        f"/api/v1/shipper/deliveries/{delivery['id']}/pickup",
        headers=shipper_headers,
    )
    assert pickup_response.status_code == 200, pickup_response.text
    assert pickup_response.json()["status"] == "picked_up"

    start_response = client.post(
        f"/api/v1/shipper/deliveries/{delivery['id']}/start",
        headers=shipper_headers,
    )
    assert start_response.status_code == 200, start_response.text
    assert start_response.json()["status"] == "delivering"

    complete_response = client.post(
        f"/api/v1/shipper/deliveries/{delivery['id']}/complete",
        headers=shipper_headers,
    )
    assert complete_response.status_code == 200, complete_response.text
    assert complete_response.json()["status"] == "delivered"

    admin_order_response = client.get(f"/api/v1/admin/orders/{order['id']}", headers=manager_headers)
    assert admin_order_response.status_code == 200, admin_order_response.text
    order_tracking = admin_order_response.json()["order"]
    assert order_tracking["status"] == "completed"
    assert order_tracking["payment_status"] == "paid"

    me_response = client.get("/api/v1/auth/me", headers=customer_headers)
    assert me_response.status_code == 200, me_response.text
    assert me_response.json()["total_points"] > 0
